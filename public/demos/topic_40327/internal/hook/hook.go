package hook

import (
	"reflect"
	"sync"
	"time"

	"YaraFlow/internal/platform"
)

// Config Hook 配置
type Config struct {
	Mode      string
	List      []string
	RateLimit RateLimitConfig
}

// RateLimitConfig 频率限制配置
type RateLimitConfig struct {
	Enabled    bool
	MaxPerMin  int
	MaxPerHour int
}

// Logger Hook 所需日志接口
type Logger interface {
	Info(args ...any)
	Infow(msg string, keysAndValues ...any)
	Warn(args ...any)
	Warnw(msg string, keysAndValues ...any)
	Debugw(msg string, keysAndValues ...any)
}

// noopLogger 空日志实现，用于未初始化时的默认值
type noopLogger struct{}

func (noopLogger) Info(args ...any)                        {}
func (noopLogger) Infow(msg string, keysAndValues ...any)  {}
func (noopLogger) Warn(args ...any)                        {}
func (noopLogger) Warnw(msg string, keysAndValues ...any)  {}
func (noopLogger) Debugw(msg string, keysAndValues ...any) {}

var (
	hookCfg Config
	hookLog Logger = noopLogger{}
)

// Init 初始化 Hook 模块
func Init(c Config, l Logger) {
	hookCfg = c
	hookLog = l
}

type HookType string

const (
	HookChatReceiveBeforeProcess HookType = "chat.receive.before_process"
	HookChatReceiveAfterProcess  HookType = "chat.receive.after_process"
	HookChatCommandBeforeExecute HookType = "chat.command.before_execute"
	HookChatCommandAfterExecute  HookType = "chat.command.after_execute"
	HookSendServiceAfterBuildMsg HookType = "send_service.after_build_message"
	HookSendServiceBeforeSend    HookType = "send_service.before_send"
	HookSendServiceAfterSend     HookType = "send_service.after_send"
)

type HookResult struct {
	AllowContinue bool
	ModifiedData  interface{}
	Error         error
}

type HookHandler interface {
	Handle(event HookEvent) HookResult
}

type HookHandlerFunc func(event HookEvent) HookResult

func (h HookHandlerFunc) Handle(event HookEvent) HookResult {
	return h(event)
}

type HookEvent struct {
	Type    HookType
	Message *platform.Message
	Context map[string]interface{}
	Timeout time.Duration
}

type HookEntry struct {
	Handler    HookHandler
	Timeout    time.Duration
	AllowAbort bool
}

type HookManager struct {
	hooks map[HookType][]*HookEntry
	mu    sync.RWMutex

	list        map[string]bool
	listMu      sync.RWMutex
	mode        string
	rateLimiter *rateLimitState
}

type rateLimitState struct {
	enabled     bool
	maxPerMin   int
	maxPerHour  int
	minCounter  map[string][]time.Time
	hourCounter map[string][]time.Time
	mu          sync.Mutex
}

var DefaultHookManager = &HookManager{
	hooks:       make(map[HookType][]*HookEntry),
	list:        make(map[string]bool),
	mode:        "blacklist",
	rateLimiter: &rateLimitState{},
}

func (hm *HookManager) LoadConfig(cfg *Config) {
	hm.listMu.Lock()
	hm.list = make(map[string]bool)
	for _, id := range cfg.List {
		if id != "" {
			hm.list[id] = true
		}
	}
	hm.listMu.Unlock()

	hm.mode = cfg.Mode
	if hm.mode == "" {
		hm.mode = "blacklist"
	}

	hm.rateLimiter.mu.Lock()
	hm.rateLimiter.enabled = cfg.RateLimit.Enabled
	hm.rateLimiter.maxPerMin = cfg.RateLimit.MaxPerMin
	hm.rateLimiter.maxPerHour = cfg.RateLimit.MaxPerHour
	hm.rateLimiter.minCounter = make(map[string][]time.Time)
	hm.rateLimiter.hourCounter = make(map[string][]time.Time)
	hm.rateLimiter.mu.Unlock()

	hookLog.Infow("Hook配置已加载", "mode", hm.mode, "listCount", len(hm.list), "rateLimitEnabled", cfg.RateLimit.Enabled, "maxPerMin", cfg.RateLimit.MaxPerMin, "maxPerHour", cfg.RateLimit.MaxPerHour)
}

func (hm *HookManager) shouldBlock(userID string) bool {
	hm.listMu.RLock()
	defer hm.listMu.RUnlock()

	if hm.mode == "whitelist" {
		return !hm.list[userID]
	}
	return hm.list[userID]
}

func (hm *HookManager) addToList(userID string) {
	hm.listMu.Lock()
	hm.list[userID] = true
	hm.listMu.Unlock()
}

func (hm *HookManager) removeFromList(userID string) {
	hm.listMu.Lock()
	delete(hm.list, userID)
	hm.listMu.Unlock()
}

func (hm *HookManager) checkRateLimit(userID string) bool {
	hm.rateLimiter.mu.Lock()
	defer hm.rateLimiter.mu.Unlock()

	if !hm.rateLimiter.enabled {
		return true
	}

	now := time.Now()

	// 检查每分钟限制
	if hm.rateLimiter.maxPerMin > 0 {
		times := hm.rateLimiter.minCounter[userID]
		cutoff := now.Add(-time.Minute)
		var valid []time.Time
		for _, t := range times {
			if t.After(cutoff) {
				valid = append(valid, t)
			}
		}
		if len(valid) >= hm.rateLimiter.maxPerMin {
			hm.rateLimiter.minCounter[userID] = valid
			return false
		}
		hm.rateLimiter.minCounter[userID] = append(valid, now)
	}

	// 检查每小时限制
	if hm.rateLimiter.maxPerHour > 0 {
		times := hm.rateLimiter.hourCounter[userID]
		cutoff := now.Add(-time.Hour)
		var valid []time.Time
		for _, t := range times {
			if t.After(cutoff) {
				valid = append(valid, t)
			}
		}
		if len(valid) >= hm.rateLimiter.maxPerHour {
			hm.rateLimiter.hourCounter[userID] = valid
			return false
		}
		hm.rateLimiter.hourCounter[userID] = append(valid, now)
	}

	return true
}

func (hm *HookManager) Register(hookType HookType, handler HookHandler, timeout time.Duration, allowAbort bool) {
	hm.mu.Lock()
	defer hm.mu.Unlock()

	if _, ok := hm.hooks[hookType]; !ok {
		hm.hooks[hookType] = make([]*HookEntry, 0)
	}

	hm.hooks[hookType] = append(hm.hooks[hookType], &HookEntry{
		Handler:    handler,
		Timeout:    timeout,
		AllowAbort: allowAbort,
	})
}

func (hm *HookManager) Unregister(hookType HookType, handler HookHandler) {
	hm.mu.Lock()
	defer hm.mu.Unlock()

	entries, ok := hm.hooks[hookType]
	if !ok {
		return
	}

	handlerPtr := reflect.ValueOf(handler).Pointer()
	for i, entry := range entries {
		if reflect.ValueOf(entry.Handler).Pointer() == handlerPtr {
			hm.hooks[hookType] = append(entries[:i], entries[i+1:]...)
			return
		}
	}
}

func (hm *HookManager) Trigger(hookType HookType, message *platform.Message, context map[string]interface{}) (*HookResult, error) {
	hm.mu.RLock()
	entries, ok := hm.hooks[hookType]
	hm.mu.RUnlock()

	if !ok || len(entries) == 0 {
		return &HookResult{AllowContinue: true}, nil
	}

	event := HookEvent{
		Type:    hookType,
		Message: message,
		Context: context,
	}

	for _, entry := range entries {
		result := entry.Handler.Handle(event)

		if !result.AllowContinue {
			if entry.AllowAbort {
				return &result, nil
			}
		}

		if result.ModifiedData != nil {
			if msg, ok := result.ModifiedData.(*platform.Message); ok {
				event.Message = msg
			}
		}
	}

	return &HookResult{AllowContinue: true}, nil
}

func (hm *HookManager) RegisterBuiltinHooks() {
	hm.Register(HookChatReceiveBeforeProcess, HookHandlerFunc(hm.beforeProcessHandler), 8*time.Second, true)
	hm.Register(HookChatReceiveAfterProcess, HookHandlerFunc(hm.afterProcessHandler), 8*time.Second, true)
	hm.Register(HookChatCommandBeforeExecute, HookHandlerFunc(hm.commandBeforeExecuteHandler), 5*time.Second, true)
	hm.Register(HookChatCommandAfterExecute, HookHandlerFunc(hm.commandAfterExecuteHandler), 5*time.Second, false)
	hm.Register(HookSendServiceAfterBuildMsg, HookHandlerFunc(hm.afterBuildMessageHandler), 5*time.Second, true)
	hm.Register(HookSendServiceBeforeSend, HookHandlerFunc(hm.beforeSendHandler), 5*time.Second, true)
	hm.Register(HookSendServiceAfterSend, HookHandlerFunc(hm.afterSendHandler), 5*time.Second, false)
}

func (hm *HookManager) beforeProcessHandler(event HookEvent) HookResult {
	msg := event.Message
	if msg == nil {
		return HookResult{AllowContinue: true}
	}

	if hm.shouldBlock(msg.SenderID) {
		action := "黑名单拦截"
		if hm.mode == "whitelist" {
			action = "不在白名单中"
		}
		hookLog.Infow("用户", "senderID", msg.SenderID, "senderName", msg.SenderName, "action", action)
		return HookResult{AllowContinue: false}
	}

	if !hm.checkRateLimit(msg.SenderID) {
		hookLog.Warnw("用户超过频率限制，拦截消息", "senderID", msg.SenderID, "senderName", msg.SenderName)
		return HookResult{AllowContinue: false}
	}

	return HookResult{AllowContinue: true}
}

func (hm *HookManager) afterProcessHandler(event HookEvent) HookResult {
	msg := event.Message
	if msg == nil {
		return HookResult{AllowContinue: true}
	}

	hookLog.Debugw("消息预处理后", "senderID", msg.SenderID, "content", msg.Content, "isAtMe", msg.IsAtMe, "hasImage", msg.HasImage)

	return HookResult{AllowContinue: true}
}

func (hm *HookManager) commandBeforeExecuteHandler(event HookEvent) HookResult {
	msg := event.Message
	if msg == nil {
		return HookResult{AllowContinue: true}
	}

	if hm.shouldBlock(msg.SenderID) {
		action := "黑名单"
		if hm.mode == "whitelist" {
			action = "不在白名单中"
		}
		hookLog.Infow("用户尝试执行命令，已拦截", "action", action, "senderID", msg.SenderID)
		return HookResult{AllowContinue: false}
	}

	cmdName := ""
	if event.Context != nil {
		if name, ok := event.Context["command_name"].(string); ok {
			cmdName = name
		}
	}

	hookLog.Infow("用户执行命令", "senderID", msg.SenderID, "command", cmdName)

	return HookResult{AllowContinue: true}
}

func (hm *HookManager) commandAfterExecuteHandler(event HookEvent) HookResult {
	if event.Context == nil {
		return HookResult{AllowContinue: true}
	}

	cmdName := ""
	success := true
	if name, ok := event.Context["command_name"].(string); ok {
		cmdName = name
	}
	if s, ok := event.Context["success"].(bool); ok {
		success = s
	}

	status := "成功"
	if !success {
		status = "失败"
	}
	hookLog.Infow("命令执行", "command", cmdName, "status", status)

	return HookResult{AllowContinue: true}
}

func (hm *HookManager) afterBuildMessageHandler(event HookEvent) HookResult {
	msg := event.Message
	if msg == nil || msg.Content == "" {
		return HookResult{AllowContinue: true}
	}

	const maxReplyLength = 800
	if len(msg.Content) > maxReplyLength {
		runes := []rune(msg.Content)
		if len(runes) > maxReplyLength {
			msg.Content = string(runes[:maxReplyLength]) + "..."
			hookLog.Infow("回复过长，已截断", "original", len(runes), "max", maxReplyLength)
			return HookResult{AllowContinue: true, ModifiedData: msg}
		}
	}

	return HookResult{AllowContinue: true}
}

func (hm *HookManager) beforeSendHandler(event HookEvent) HookResult {
	msg := event.Message
	if msg == nil {
		return HookResult{AllowContinue: true}
	}

	if msg.Content == "" {
		hookLog.Warn("发送内容为空，拦截发送")
		return HookResult{AllowContinue: false}
	}

	return HookResult{AllowContinue: true}
}

func (hm *HookManager) afterSendHandler(event HookEvent) HookResult {
	msg := event.Message
	if msg == nil {
		return HookResult{AllowContinue: true}
	}

	hookLog.Debugw("消息已发送", "target", msg.GroupID, "contentLength", len(msg.Content))

	return HookResult{AllowContinue: true}
}

func (hm *HookManager) AddToList(userID string) {
	hm.addToList(userID)
	hookLog.Infow("已将用户加入名单", "userID", userID)
}

func (hm *HookManager) RemoveFromList(userID string) {
	hm.removeFromList(userID)
	hookLog.Infow("已将用户从名单移除", "userID", userID)
}

func (hm *HookManager) IsUserBlocked(userID string) bool {
	return hm.shouldBlock(userID)
}
