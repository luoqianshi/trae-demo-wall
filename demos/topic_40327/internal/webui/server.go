// Package webui 提供 YaraFlow Web 仪表盘
// 嵌入前端 SPA 并通过 REST API + SSE 提供实时数据
package webui

import (
	"context"
	"encoding/json"
	"expvar"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"net/http/pprof"
	"net/url"
	"strings"
	"time"

	frontend "YaraFlow/webui"

	"YaraFlow/internal/browser"
	"YaraFlow/internal/jargon"
	"YaraFlow/internal/logger"
)

// Server WebUI HTTP 服务器
type Server struct {
	host       string
	port       int
	httpServer *http.Server
	startTime  time.Time
	running    bool

	jargonManager     JargonProvider
	localChatProvider LocalChatProvider
	rateLimiter       *RateLimiter
}

// JargonProvider 黑话管理器接口（避免循环依赖）
type JargonProvider interface {
	List(limit int) ([]*jargon.JargonEntry, error)
	GetStats() map[string]interface{}
	Delete(id int) error
}

// LocalChatHistoryItem 本地聊天历史条目
type LocalChatHistoryItem struct {
	Role    string `json:"role"` // "user" 或 "assistant"
	Content string `json:"content"`
}

// LocalChatProvider 本地聊天提供者接口
type LocalChatProvider interface {
	LocalChat(ctx context.Context, content string, history []LocalChatHistoryItem) (string, error)
}

// JargonEntry 黑话条目（避免循环依赖）
type JargonEntry struct {
	ID        int       `json:"id"`
	Word      string    `json:"word"`
	Meaning   string    `json:"meaning"`
	Frequency int       `json:"frequency"`
	Source    string    `json:"source"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SetJargonManager 设置黑话管理器
func (s *Server) SetJargonManager(jm JargonProvider) {
	s.jargonManager = jm
}

// SetLocalChatProvider 设置本地聊天提供者
func (s *Server) SetLocalChatProvider(p LocalChatProvider) {
	s.localChatProvider = p
}

// NewServer 创建 WebUI 服务器
func NewServer(port int) *Server {
	return &Server{
		host:        "0.0.0.0",
		port:        port,
		startTime:   time.Now(),
		rateLimiter: NewRateLimiter(60, 1000),
	}
}

// recoverMiddleware panic 恢复中间件，防止 handler panic 导致进程崩溃
func recoverMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				logger.Sugar.Errorw("[WebUI] handler panic 已恢复",
					"path", r.URL.Path, "method", r.Method, "panic", rec)
				// 如果响应尚未写入 header，返回 500
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error":   true,
					"message": "服务器内部错误",
				})
			}
		}()
		next(w, r)
	}
}

// apiHandler 包装 API 处理器：CORS → 认证 → 限流 → recover → 实际处理
// CORS 必须放在最外层，确保 OPTIONS 预检请求在认证之前被处理
func (s *Server) apiHandler(handler http.HandlerFunc) http.HandlerFunc {
	return corsMiddleware(authMiddleware(rateLimitMiddleware(s.rateLimiter, recoverMiddleware(handler))))
}

// sseHandler 包装 SSE 长连接处理器：CORS → 认证 → recover → 实际处理
// SSE 长连接不走限流，避免长连接占用限流配额
func (s *Server) sseHandler(handler http.HandlerFunc) http.HandlerFunc {
	return corsMiddleware(authMiddleware(recoverMiddleware(handler)))
}

// Start 启动 HTTP 服务器
func (s *Server) Start() error {
	mux := http.NewServeMux()

	// 将日志输出连接到前端 SSE 日志流
	logger.SetLogHook(func(level, msg string) {
		PushLog(fmt.Sprintf("[%s] %s", strings.ToUpper(level), msg))
	})

	mux.HandleFunc("/api/status", s.apiHandler(s.handleStatus))
	mux.HandleFunc("/api/dashboard", s.apiHandler(s.handleDashboard))
	mux.HandleFunc("/api/plugins", s.apiHandler(s.handlePlugins))
	mux.HandleFunc("/api/plugins/", s.apiHandler(s.handlePluginAction))
	mux.HandleFunc("/api/config/bot", s.apiHandler(s.handleBotConfig))
	mux.HandleFunc("/api/config/llm", s.apiHandler(s.handleLLMConfig))
	mux.HandleFunc("/api/config/llm/", s.apiHandler(s.handleLLMAction))
	mux.HandleFunc("/api/knowledge", s.apiHandler(s.handleKnowledge))
	mux.HandleFunc("/api/knowledge/", s.apiHandler(s.handleKnowledgeAction))
	mux.HandleFunc("/api/tong-shadow", s.apiHandler(s.handleTongShadow))
	mux.HandleFunc("/api/tong-shadow/", s.apiHandler(s.handleTongShadowAction))
	mux.HandleFunc("/api/rules", s.apiHandler(s.handleRules))
	mux.HandleFunc("/api/rules/", s.apiHandler(s.handleRulesUpdate))
	mux.HandleFunc("/api/chat/recent", s.apiHandler(s.handleChatRecent))
	mux.HandleFunc("/api/logs/stream", s.sseHandler(s.handleLogStream))
	mux.HandleFunc("/api/messages/stream", s.sseHandler(s.handleMessageStream))
	mux.HandleFunc("/api/system/restart", s.apiHandler(s.handleRestart))
	mux.HandleFunc("/api/config/yaml", s.apiHandler(s.handleYAMLConfig))
	mux.HandleFunc("/api/stats", s.apiHandler(s.handleStats))
	mux.HandleFunc("/api/memory/debug", s.apiHandler(s.handleMemoryDebug))
	mux.HandleFunc("/api/memory/stats", s.apiHandler(s.handleMemoryStats))
	mux.HandleFunc("/api/memory/ingest", s.apiHandler(s.handleMemoryIngest))
	mux.HandleFunc("/api/memory/delete", s.apiHandler(s.handleMemoryDelete))
	mux.HandleFunc("/api/memory/list", s.apiHandler(s.handleMemoryList))
	mux.HandleFunc("/api/metrics", s.apiHandler(s.handleMetrics))
	mux.HandleFunc("/api/config/adapter", s.apiHandler(s.handleAdapterConfig))
	mux.HandleFunc("/api/config/validate", s.apiHandler(s.handleConfigValidate))
	mux.HandleFunc("/api/circuit-breaker", s.apiHandler(s.handleCircuitBreaker))
	mux.HandleFunc("/api/pool/stats", s.apiHandler(s.handlePoolStats))

	// 监控端点：Prompt 预览 + 阶段状态
	mux.HandleFunc("/api/monitor/previews", s.apiHandler(s.handleMonitorPreviews))
	mux.HandleFunc("/api/monitor/preview", s.apiHandler(s.handleMonitorPreview))
	mux.HandleFunc("/api/monitor/stages", s.apiHandler(s.handleMonitorStages))
	mux.HandleFunc("/api/monitor/stages/stream", s.sseHandler(s.handleMonitorStagesStream))
	mux.HandleFunc("/api/downloads/progress/stream", s.sseHandler(s.handleDownloadProgressStream))
	mux.HandleFunc("/api/downloads/thunder/check", s.apiHandler(s.handleThunderCheck))

	mux.HandleFunc("/api/jargon/list", s.apiHandler(s.handleJargonList))
	mux.HandleFunc("/api/jargon/stats", s.apiHandler(s.handleJargonStats))
	mux.HandleFunc("/api/jargon/delete", s.apiHandler(s.handleJargonDelete))

	// 背景管理
	mux.HandleFunc("/api/backgrounds", s.apiHandler(s.handleBackgrounds))
	mux.HandleFunc("/api/backgrounds/select", s.apiHandler(s.handleBackgroundSelect))
	mux.HandleFunc("/api/backgrounds/file/", s.apiHandler(s.handleBackgroundFile))
	mux.HandleFunc("/api/backgrounds/", s.apiHandler(s.handleBackgrounds))

	// 表情包管理
	mux.HandleFunc("/api/emoji/list", s.apiHandler(s.handleEmojiList))
	mux.HandleFunc("/api/emoji/delete", s.apiHandler(s.handleEmojiDelete))
	mux.HandleFunc("/api/emoji/cleanup", s.apiHandler(s.handleEmojiCleanup))
	mux.HandleFunc("/api/emoji/file", s.apiHandler(s.handleEmojiFile))

	// 本地聊天
	mux.HandleFunc("/api/local-chat", s.apiHandler(s.handleLocalChat))

	// 插件图标（LTPX 默认图标库）
	mux.HandleFunc("/api/icon/ltpx/", s.apiHandler(s.handleIconLTPX))

	// 备份恢复
	mux.HandleFunc("/api/backup", s.apiHandler(s.handleBackup))
	mux.HandleFunc("/api/backup/", s.apiHandler(s.handleBackupAction))

	// 认证端点（无需 token，但有限流 + recover）
	mux.HandleFunc("/api/auth/login", rateLimitMiddleware(s.rateLimiter, corsMiddleware(recoverMiddleware(s.handleLogin))))
	mux.HandleFunc("/api/auth/status", rateLimitMiddleware(s.rateLimiter, corsMiddleware(recoverMiddleware(s.handleAuthStatus))))

	s.registerHealthCheck(mux)

	// Prometheus 指标端点（无需鉴权，供监控系统抓取）
	mux.HandleFunc("/metrics", corsMiddleware(recoverMiddleware(s.handlePrometheusMetrics)))

	mux.HandleFunc("/debug/vars", authMiddleware(recoverMiddleware(func(w http.ResponseWriter, r *http.Request) {
		expvar.Handler().ServeHTTP(w, r)
	})))

	mux.HandleFunc("/debug/pprof/trace", authMiddleware(recoverMiddleware(pprof.Trace)))

	mux.HandleFunc("/", recoverMiddleware(s.handleSPA))

	listenAddr := fmt.Sprintf("%s:%d", s.host, s.port)
	listener, err := net.Listen("tcp", listenAddr)
	if err != nil {
		return fmt.Errorf("WebUI 端口监听失败 %s: %w", listenAddr, err)
	}

	s.httpServer = &http.Server{
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	s.running = true
	logger.Sugar.Debugw("[WebUI] 仪表盘已启动", "port", s.port)

	// 定期清理过期限流记录
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			s.rateLimiter.Cleanup()
		}
	}()

	// 自动打开浏览器（优先 WebView 嵌入式窗口，回退系统浏览器）
	go func() {
		url := browser.GetLocalURL(s.port)
		logger.Sugar.Debugw("[WebUI] 正在打开浏览器", "url", url)
		browser.OpenBrowser(url)
	}()

	go func() {
		if err := s.httpServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			logger.Sugar.Errorw("[WebUI] 服务异常", "error", err)
		}
	}()

	return nil
}

// Stop 优雅关闭
func (s *Server) Stop() error {
	s.running = false
	if s.httpServer != nil {
		s.httpServer.Close()
	}
	return nil
}

// IsRunning 检查是否运行中
func (s *Server) IsRunning() bool {
	return s.running
}

func (s *Server) handleSPA(w http.ResponseWriter, r *http.Request) {
	filePath := strings.TrimPrefix(r.URL.Path, "/")
	if filePath == "" {
		filePath = "index.html"
	}

	// 对于 SPA 路由（无后缀的路径），返回 index.html
	if !strings.Contains(filePath, ".") {
		filePath = "index.html"
	}

	// 尝试读取嵌入的文件
	data, err := fs.ReadFile(frontend.Dist, "dist/"+filePath)
	if err != nil {
		// 如果找不到，返回 index.html（SPA fallback）
		data, err = fs.ReadFile(frontend.Dist, "dist/index.html")
		if err != nil {
			http.NotFound(w, r)
			return
		}
	}

	// 设置 Content-Type
	contentType := "text/html; charset=utf-8"
	switch {
	case strings.HasSuffix(filePath, ".js"):
		contentType = "application/javascript; charset=utf-8"
	case strings.HasSuffix(filePath, ".css"):
		contentType = "text/css; charset=utf-8"
	case strings.HasSuffix(filePath, ".svg"):
		contentType = "image/svg+xml"
	case strings.HasSuffix(filePath, ".png"):
		contentType = "image/png"
	case strings.HasSuffix(filePath, ".json"):
		contentType = "application/json"
	}
	w.Header().Set("Content-Type", contentType)
	// SPA 安全响应头
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
	if contentType == "text/html; charset=utf-8" {
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' ws: wss:; font-src 'self'")
	}
	w.Write(data)
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" {
			// 解析 Origin 中的 host，与请求的 Host 对比
			// 只允许同源请求，防止其他网站通过跨域请求窃取仪表盘数据
			u, err := url.Parse(origin)
			if err != nil || u.Host != r.Host {
				w.Header().Set("Content-Type", "application/json; charset=utf-8")
				w.WriteHeader(http.StatusForbidden)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error":   true,
					"message": "跨域请求被拒绝，Origin 与 Host 不匹配",
				})
				return
			}
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		// 安全响应头
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// jsonResponse 统一 JSON 响应
func jsonResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(data)
}

func jsonError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error":   true,
		"message": msg,
	})
}
