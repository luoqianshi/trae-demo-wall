package webui

import (
	"fmt"
	"net/http"
	"runtime"
	"time"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/storage"
)

// ── 健康检查端点 ──

// HealthResponse 健康检查响应结构
type HealthResponse struct {
	Status     string                 `json:"status"`     // "ok" | "degraded" | "unhealthy"
	Version    string                 `json:"version"`    // 应用版本
	Uptime     string                 `json:"uptime"`     // 运行时间
	Components map[string]HealthCheck `json:"components"` // 各组件状态
	Timestamp  int64                  `json:"timestamp"`  // 检查时间戳
}

// HealthCheck 单个组件健康检查结果
type HealthCheck struct {
	Status  string `json:"status"`            // "ok" | "error" | "unknown"
	Message string `json:"message,omitempty"` // 详细信息
	Latency string `json:"latency,omitempty"` // 检查耗时
}

// handleHealth 健康检查处理器
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	components := make(map[string]HealthCheck)
	overallStatus := "ok"

	// 1. 检查 SQLite 数据库
	components["database"] = checkDatabase()

	// 2. 检查 LLM 可用性（快速测试）
	components["llm"] = checkLLM()

	// 3. 检查运行时状态
	components["runtime"] = HealthCheck{
		Status:  "ok",
		Message: fmt.Sprintf("goroutines=%d, heap=%dMB", runtime.NumGoroutine(), getHeapMB()),
	}

	// 4. 检查熔断器（聚合所有 per-provider 熔断器状态）
	cbStatus := llm.GetAggregateCircuitBreakerStatus()
	aggregateState, _ := cbStatus["aggregate_state"].(string)
	breakerCount, _ := cbStatus["breaker_count"].(int)
	components["circuit_breaker"] = HealthCheck{
		Status:  "ok",
		Message: fmt.Sprintf("aggregate=%s, breakers=%d", aggregateState, breakerCount),
	}

	// 判断整体状态
	for _, c := range components {
		if c.Status == "error" {
			overallStatus = "degraded"
			break
		}
	}

	jsonResponse(w, HealthResponse{
		Status:     overallStatus,
		Version:    "1.0.0",
		Uptime:     time.Since(s.startTime).String(),
		Components: components,
		Timestamp:  time.Now().UnixMilli(),
	})
}

// checkDatabase 检查数据库连接
func checkDatabase() HealthCheck {
	start := time.Now()
	db := storage.GetDB()
	if db == nil {
		return HealthCheck{
			Status:  "error",
			Message: "数据库未初始化",
			Latency: time.Since(start).String(),
		}
	}
	// 尝试执行简单查询
	if err := db.Ping(); err != nil {
		return HealthCheck{
			Status:  "error",
			Message: fmt.Sprintf("数据库连接失败: %v", err),
			Latency: time.Since(start).String(),
		}
	}
	return HealthCheck{
		Status:  "ok",
		Message: "SQLite 连接正常",
		Latency: time.Since(start).String(),
	}
}

// llmProbeCache 缓存 LLM 连通性探测结果，避免每次健康检查都发起真实 API 调用
var (
	llmProbeCache     HealthCheck
	llmProbeCacheTime time.Time
)

const llmProbeCacheTTL = 60 * time.Second

// checkLLM 检查 LLM 服务可用性
// 优先显示最后一次实际调用的模型；若无调用记录则发起轻量探测（带 60 秒缓存）
func checkLLM() HealthCheck {
	start := time.Now()

	// 先检查是否有配置
	if len(llm.GlobalLLMConfig.YaraFlow.APIProviders) == 0 {
		return HealthCheck{
			Status:  "error",
			Message: "未配置 LLM 提供商",
			Latency: time.Since(start).String(),
		}
	}

	// 显示最后一次实际调用的模型，而非触发新的模型选择
	selections := llm.GetLastModelSelections()
	if chatSel, ok := selections["chat"]; ok {
		return HealthCheck{
			Status:  "ok",
			Message: fmt.Sprintf("已配置模型: %s @ %s", chatSel.Identifier, chatSel.Provider),
			Latency: time.Since(start).String(),
		}
	}

	// 还没有过实际调用，使用缓存的探测结果或发起轻量探测
	if time.Since(llmProbeCacheTime) < llmProbeCacheTTL && llmProbeCache.Status != "" {
		return llmProbeCache
	}

	// 回退到检查配置是否可用
	modelCfg, _, err := llm.GetModelConfig("chat")
	if err != nil {
		result := HealthCheck{
			Status:  "error",
			Message: fmt.Sprintf("LLM 配置不可用: %v", err),
			Latency: time.Since(start).String(),
		}
		llmProbeCache = result
		llmProbeCacheTime = time.Now()
		return result
	}
	result := HealthCheck{
		Status:  "ok",
		Message: fmt.Sprintf("已配置模型: %s（尚未实际调用）", modelCfg.ModelIdentifier),
		Latency: time.Since(start).String(),
	}
	llmProbeCache = result
	llmProbeCacheTime = time.Now()
	return result
}

// getHeapMB 获取当前堆内存用量（MB）
func getHeapMB() int64 {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	return int64(m.Alloc / 1024 / 1024)
}

// registerHealthCheck 注册健康检查与就绪检查端点（在 server.go Start 中调用）
func (s *Server) registerHealthCheck(mux *http.ServeMux) {
	mux.HandleFunc("/health", corsMiddleware(recoverMiddleware(s.handleHealth)))
	mux.HandleFunc("/ready", corsMiddleware(recoverMiddleware(s.handleReady)))
}

// handleReady 就绪检查处理器
// 与 /health 区别：/health 检查组件健康度（可降级），/ready 检查是否可接收流量（必须全部就绪）
func (s *Server) handleReady(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	// 就绪检查：数据库必须可用
	dbCheck := checkDatabase()
	if dbCheck.Status != "ok" {
		w.WriteHeader(http.StatusServiceUnavailable)
		jsonResponse(w, map[string]interface{}{
			"ready":  false,
			"reason": "database not ready",
			"detail": dbCheck.Message,
			"uptime": time.Since(s.startTime).String(),
		})
		return
	}

	// 就绪检查：运行时间大于 0（服务已启动）
	if s.startTime.IsZero() {
		w.WriteHeader(http.StatusServiceUnavailable)
		jsonResponse(w, map[string]interface{}{
			"ready":  false,
			"reason": "server not started",
		})
		return
	}

	jsonResponse(w, map[string]interface{}{
		"ready":  true,
		"uptime": time.Since(s.startTime).String(),
	})
}
