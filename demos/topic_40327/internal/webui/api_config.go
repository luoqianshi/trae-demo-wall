package webui

import (
	"fmt"
	"net/http"
	"os"
	"runtime"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/metrics"
	"YaraFlow/internal/plugin"
	"YaraFlow/internal/pool"
	"YaraFlow/internal/storage"

	"gopkg.in/yaml.v3"
)

// isValidModel 判断模型条目是否有效（name 和 model_identifier 均非空）。
// 模板配置中的占位模型（如 model_1~model_5）name 和 model_identifier 都为 null，
// 不应计入模型数量也不应返回给前端。
func isValidModel(entry interface{}) bool {
	m, ok := entry.(map[string]interface{})
	if !ok {
		return false
	}
	name, _ := m["name"].(string)
	identifier, _ := m["model_identifier"].(string)
	return name != "" && identifier != ""
}

// handleStatus 返回系统状态
func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	uptime := time.Since(s.startTime).Seconds()

	jsonResponse(w, map[string]interface{}{
		"running":    s.running,
		"uptime":     int64(uptime),
		"start_time": s.startTime.Format(time.RFC3339),
		"version":    "1.0.0",
		"go_version": runtime.Version(),
		"goroutines": runtime.NumGoroutine(),
		"memory_mb":  float64(mem.Alloc) / 1024 / 1024,
		"num_cpu":    runtime.NumCPU(),
	})
}

// handleDashboard 返回仪表盘聚合数据
func (s *Server) handleDashboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	// 插件统计
	pluginCount := 0
	pluginList := []map[string]interface{}{}
	if plugin.DefaultPluginManager != nil {
		ids := plugin.DefaultPluginManager.GetPluginIDs()
		pluginCount = len(ids)
		for _, id := range ids {
			status := plugin.DefaultPluginManager.GetPluginStatus(id)
			pluginList = append(pluginList, map[string]interface{}{
				"id":     id,
				"status": status,
			})
		}
	}

	// 最近消息
	recentMsgs := []map[string]interface{}{}
	groupedMsgs := map[string][]map[string]interface{}{}
	if storage.GetDB() != nil {
		records, err := storage.GetRecentMessages("", "", 30)
		if err == nil {
			for _, r := range records {
				msg := map[string]interface{}{
					"id":        r.MessageID,
					"content":   r.Content,
					"sender":    r.SenderName,
					"direction": r.Direction,
					"group_id":  r.GroupID,
					"timestamp": r.Timestamp,
				}
				recentMsgs = append(recentMsgs, msg)

				// 按群聊分组
				groupKey := r.GroupID
				if groupKey == "" {
					groupKey = "私聊"
				}
				if len(groupedMsgs[groupKey]) < 4 {
					groupedMsgs[groupKey] = append(groupedMsgs[groupKey], msg)
				}
			}
		}
	}

	// LLM 提供商数量
	providerCount := len(llm.GlobalLLMConfig.YaraFlow.APIProviders)
	modelCount := 0
	for _, entry := range llm.GlobalLLMConfig.YaraFlow.Models {
		if isValidModel(entry) {
			modelCount++
		}
	}

	jsonResponse(w, map[string]interface{}{
		"status": map[string]interface{}{
			"running":   s.running,
			"uptime":    int64(time.Since(s.startTime).Seconds()),
			"memory_mb": float64(mem.Alloc) / 1024 / 1024,
		},
		"plugins": map[string]interface{}{
			"count": pluginCount,
			"list":  pluginList,
		},
		"llm": map[string]interface{}{
			"providers": providerCount,
			"models":    modelCount,
		},
		"messages": map[string]interface{}{
			"recent":   recentMsgs,
			"by_group": groupedMsgs,
		},
		"config": map[string]interface{}{
			"nickname":   config.AppConfig.Bot.Nickname,
			"auto_reply": config.AppConfig.Trigger.AutoReply,
		},
		"timestamp": time.Now().UnixMilli(),
	})
}

// handleBotConfig 读写 bot 配置（config.yaml）
func (s *Server) handleBotConfig(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"config":  config.AppConfig,
		})
	case "PUT":
		// 只读展示，暂不支持 Web 端修改 config.yaml
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"message": "config.yaml 修改请直接编辑文件，保存后将自动热加载",
		})
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

// handleYAMLConfig 读写 config.yaml 原始内容
func (s *Server) handleYAMLConfig(w http.ResponseWriter, r *http.Request) {
	configPath := findConfigYAMLPath()
	switch r.Method {
	case "GET":
		if configPath == "" {
			jsonError(w, 404, "config.yaml 未找到")
			return
		}
		data, err := os.ReadFile(configPath)
		if err != nil {
			jsonError(w, 500, "读取 config.yaml 失败")
			return
		}
		// 与模板合并，补齐缺失的默认字段
		merged := mergeWithTemplate(string(data))
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"raw":     merged,
			"path":    configPath,
		})
	case "PUT":
		var req struct {
			Raw string `json:"raw"`
		}
		if err := readJSON(r, &req); err != nil {
			jsonError(w, 400, "JSON 解析失败")
			return
		}
		if configPath == "" {
			jsonError(w, 404, "config.yaml 未找到")
			return
		}
		if err := os.WriteFile(configPath, []byte(req.Raw), 0644); err != nil {
			jsonError(w, 500, "保存 config.yaml 失败")
			return
		}
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"message": "config.yaml 已保存，变更将自动热加载",
		})
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

// handleStats 返回仪表盘统计数据（24h调用趋势、Token消耗、花费趋势）
func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success":         true,
		"call_trend":      llm.GlobalStats.GetCallTrend(),
		"token_usage":     llm.GlobalStats.GetTokenUsage(),
		"cost_trend":      llm.GlobalStats.GetCostTrend(),
		"total_calls":     llm.GlobalStats.GetTotalCalls(),
		"total_cost":      llm.GlobalStats.GetTotalCost(),
		"circuit_breaker": llm.GetAggregateCircuitBreakerStatus(),
	})
}

// handleMetrics 返回运行时指标快照
func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	metrics.UpdatePipelinePercentiles()
	metrics.UpdateGoroutineCount()
	metrics.UpdateLLMLatencyPercentiles()

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"llm": map[string]interface{}{
			"calls_total":   metrics.LLMCallsTotal.Value(),
			"calls_success": metrics.LLMCallsSuccess.Value(),
			"calls_error":   metrics.LLMCallsError.Value(),
			"tokens_in":     metrics.LLMTokensIn.Value(),
			"tokens_out":    metrics.LLMTokensOut.Value(),
			"latency_p50":   metrics.LLMLatencyP50.Value(),
			"latency_p95":   metrics.LLMLatencyP95.Value(),
			"latency_p99":   metrics.LLMLatencyP99.Value(),
		},
		"messages": map[string]interface{}{
			"received":    metrics.MessagesReceived.Value(),
			"processed":   metrics.MessagesProcessed.Value(),
			"deduped":     metrics.MessagesDeduped.Value(),
			"replied":     metrics.MessagesReplied.Value(),
			"queue_depth": metrics.QueueDepth.Value(),
		},
		"pipeline": map[string]interface{}{
			"latency_p50": metrics.PipelineLatencyP50.Value(),
			"latency_p95": metrics.PipelineLatencyP95.Value(),
			"latency_p99": metrics.PipelineLatencyP99.Value(),
		},
		"memory": map[string]interface{}{
			"queries": metrics.MemoryQueries.Value(),
			"deduped": metrics.MemoryQueryDeduped.Value(),
			"hits":    metrics.MemoryHitsTotal.Value(),
		},
		"plugins": map[string]interface{}{
			"loaded":   metrics.PluginsLoaded.Value(),
			"total":    metrics.PluginsTotal.Value(),
			"commands": metrics.PluginCommands.Value(),
		},
		"circuit_breaker": metrics.CircuitBreakerState.Value(),
	})
}

// mergeWithTemplate 以模板为基础，将用户配置的值覆盖上去，缺失字段自动补齐
func mergeWithTemplate(userYAML string) string {
	tmplPath := findTemplatePath()
	if tmplPath == "" {
		return userYAML // 模板不存在，直接返回原配置
	}
	tmplData, err := os.ReadFile(tmplPath)
	if err != nil {
		return userYAML
	}

	var userMap map[string]interface{}
	var tmplMap map[string]interface{}
	if err := yaml.Unmarshal([]byte(userYAML), &userMap); err != nil {
		return userYAML
	}
	if err := yaml.Unmarshal(tmplData, &tmplMap); err != nil {
		return userYAML
	}

	mergeMap(tmplMap, userMap)
	out, err := yaml.Marshal(tmplMap)
	if err != nil {
		return userYAML
	}
	return string(out)
}

// mergeMap 递归合并：base 优先，overlay 覆盖
func mergeMap(base, overlay map[string]interface{}) {
	for k, ov := range overlay {
		bv, exists := base[k]
		if !exists {
			base[k] = ov
			continue
		}
		bMap, bIsMap := bv.(map[string]interface{})
		oMap, oIsMap := ov.(map[string]interface{})
		if bIsMap && oIsMap {
			mergeMap(bMap, oMap)
		} else {
			base[k] = ov
		}
	}
}

func findTemplatePath() string {
	paths := []string{
		"./configs/config_template.yaml",
		"../configs/config_template.yaml",
	}
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

func findConfigYAMLPath() string {
	paths := []string{
		"./configs/config.yaml",
		"../configs/config.yaml",
	}
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// handleLLMConfig 读写 LLM 配置（lunar_config.json）
func (s *Server) handleLLMConfig(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		yaraConfig := llm.GlobalLLMConfig.YaraFlow

		// 将 models map 转为数组格式给前端，过滤掉占位模型
		modelList := make([]map[string]interface{}, 0, len(yaraConfig.Models))
		for name, entry := range yaraConfig.Models {
			if !isValidModel(entry) {
				continue
			}
			if m, ok := entry.(map[string]interface{}); ok {
				// 确保 name 字段存在
				if _, hasName := m["name"]; !hasName || m["name"] == "" || m["name"] == nil {
					m["name"] = name
				}
				modelList = append(modelList, m)
			}
		}

		jsonResponse(w, map[string]interface{}{
			"success": true,
			"config": map[string]interface{}{
				"api_providers":        yaraConfig.APIProviders,
				"models":               modelList,
				"model_task_config":    yaraConfig.ModelTaskConfig,
				"last_model_selection": llm.GetLastModelSelections(),
			},
		})
	case "PUT":
		s.handleLLMConfigUpdate(w, r)
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

func (s *Server) handleLLMConfigUpdate(w http.ResponseWriter, r *http.Request) {
	var update map[string]interface{}
	if err := readJSON(r, &update); err != nil {
		jsonError(w, 400, fmt.Sprintf("JSON 解析失败: %v", err))
		return
	}

	// 将前端传来的 models 数组转回 map 格式（后端存储格式为 map[string]interface{}）
	if modelsRaw, ok := update["models"]; ok {
		if modelsArr, ok := modelsRaw.([]interface{}); ok {
			modelsMap := make(map[string]interface{})
			for _, item := range modelsArr {
				if m, ok := item.(map[string]interface{}); ok {
					name, _ := m["name"].(string)
					if name == "" {
						continue
					}
					modelsMap[name] = m
				}
			}
			update["models"] = modelsMap
		}
	}

	// 使用现有的 llm 包保存逻辑
	if err := llm.SaveYaraFlowConfig(update); err != nil {
		jsonError(w, 500, fmt.Sprintf("保存配置失败: %v", err))
		return
	}

	// 重新加载（不触发模板合并，避免用户刚删的模型被补回来）
	if err := llm.ReloadConfig(); err != nil {
		jsonError(w, 500, fmt.Sprintf("重新加载配置失败: %v", err))
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": "LLM 配置已保存，正在生效中",
	})
}

// handleLLMAction 处理 LLM 子操作（测试连接、获取模型列表）
func (s *Server) handleLLMAction(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/api/config/llm/test-connection" {
		s.handleTestConnection(w, r)
		return
	}
	if path == "/api/config/llm/models" {
		s.handleFetchModels(w, r)
		return
	}
	jsonError(w, 404, "Not found")
}

func (s *Server) handleTestConnection(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	var req struct {
		Name    string `json:"name"`
		BaseURL string `json:"base_url"`
		APIKey  string `json:"api_key"`
	}
	if err := readJSON(r, &req); err != nil {
		jsonError(w, 400, "JSON 解析失败")
		return
	}

	result, err := llm.TestProviderConnection(req.Name, req.BaseURL, req.APIKey)
	resp := map[string]interface{}{
		"success": err == nil,
	}
	if err != nil {
		resp["error"] = err.Error()
	} else {
		resp["result"] = result
	}
	jsonResponse(w, resp)
}

func (s *Server) handleFetchModels(w http.ResponseWriter, r *http.Request) {
	providerName := r.URL.Query().Get("provider")
	if providerName == "" {
		jsonError(w, 400, "缺少 provider 参数")
		return
	}

	// 查找提供商配置
	var provider *llm.APIProvider
	for i := range llm.GlobalLLMConfig.YaraFlow.APIProviders {
		if llm.GlobalLLMConfig.YaraFlow.APIProviders[i].Name == providerName {
			provider = &llm.GlobalLLMConfig.YaraFlow.APIProviders[i]
			break
		}
	}
	if provider == nil {
		jsonError(w, 404, fmt.Sprintf("未找到提供商: %s", providerName))
		return
	}

	models, err := llm.FetchProviderModels(provider)
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("获取模型列表失败: %v", err))
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success":  true,
		"provider": providerName,
		"models":   models,
		"count":    len(models),
	})
}

// handleConfigValidate 逐项校验配置并返回所有错误
func (s *Server) handleConfigValidate(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	errors := []string{}
	cfg := config.AppConfig

	// 逐项校验
	if cfg.Bot.Nickname == "" {
		errors = append(errors, "bot.nickname 不能为空，请设置机器人昵称")
	}
	if cfg.Bot.MaxReplyLen <= 0 {
		errors = append(errors, fmt.Sprintf("bot.max_reply_len 必须大于 0，当前值: %d", cfg.Bot.MaxReplyLen))
	}
	if cfg.Bot.MaxConcurrentMessages <= 0 {
		errors = append(errors, fmt.Sprintf("bot.max_concurrent_messages 必须大于 0，当前值: %d", cfg.Bot.MaxConcurrentMessages))
	}
	if cfg.Trigger.BaseFrequency < 0 || cfg.Trigger.BaseFrequency > 1 {
		errors = append(errors, fmt.Sprintf("trigger.base_frequency 必须在 0-1 之间，当前值: %f", cfg.Trigger.BaseFrequency))
	}
	if cfg.Decision.MaxRounds <= 0 {
		errors = append(errors, fmt.Sprintf("decision.max_rounds 必须大于 0，当前值: %d", cfg.Decision.MaxRounds))
	}
	if cfg.Bus.BufferSize <= 0 {
		errors = append(errors, fmt.Sprintf("bus.buffer_size 必须大于 0，当前值: %d", cfg.Bus.BufferSize))
	}
	if cfg.Memory.Enabled {
		if cfg.Memory.TopK <= 0 {
			errors = append(errors, fmt.Sprintf("memory.top_k 必须大于 0，当前值: %d", cfg.Memory.TopK))
		}
		if cfg.Memory.EmbeddingDim <= 0 {
			errors = append(errors, fmt.Sprintf("memory.embedding_dim 必须大于 0，当前值: %d", cfg.Memory.EmbeddingDim))
		}
		if cfg.Memory.MaxFragments <= 0 {
			errors = append(errors, fmt.Sprintf("memory.max_fragments 必须大于 0，当前值: %d", cfg.Memory.MaxFragments))
		}
	}
	if cfg.Personality.BaseIdentity == "" {
		errors = append(errors, "personality.base_identity 不能为空，请设置机器人核心身份")
	}
	if cfg.Personality.DefaultStyle == "" {
		errors = append(errors, "personality.default_style 不能为空，请设置默认回复风格")
	}
	if cfg.Dedupe.Enabled {
		if cfg.Dedupe.WindowMs <= 0 {
			errors = append(errors, fmt.Sprintf("dedupe.window_ms 必须大于 0，当前值: %d", cfg.Dedupe.WindowMs))
		}
		if cfg.Dedupe.MaxSize <= 0 {
			errors = append(errors, fmt.Sprintf("dedupe.max_size 必须大于 0，当前值: %d", cfg.Dedupe.MaxSize))
		}
	}

	if len(errors) == 0 {
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"errors":  []string{},
			"message": "所有配置项校验通过",
		})
	} else {
		jsonResponse(w, map[string]interface{}{
			"success": false,
			"errors":  errors,
			"message": fmt.Sprintf("发现 %d 个配置问题", len(errors)),
		})
	}
}

// handleCircuitBreaker 处理熔断器状态查询和重置
func (s *Server) handleCircuitBreaker(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"status":  llm.GetAggregateCircuitBreakerStatus(),
		})
	case "POST":
		llm.ResetAllCircuitBreakers()
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"message": "熔断器已重置",
		})
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

// handlePoolStats 返回对象池统计信息
func (s *Server) handlePoolStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}
	stats := pool.GetStats()
	jsonResponse(w, map[string]interface{}{
		"success":      true,
		"buffer_gets":  stats.BufferGets,
		"buffer_puts":  stats.BufferPuts,
		"builder_gets": stats.BuilderGets,
		"builder_puts": stats.BuilderPuts,
	})
}
