package llm

import (
	"testing"
	"time"

	"go.uber.org/zap"

	"YaraFlow/internal/logger"
)

func init() {
	// 初始化 no-op logger 避免测试中 nil pointer
	logger.Logger = zap.NewNop()
	logger.Sugar = logger.Logger.Sugar()
}

// ── CircuitBreaker 测试 ──

func TestNewCircuitBreaker_DefaultConfig(t *testing.T) {
	cb := NewCircuitBreaker(CircuitBreakerConfig{})
	if cb == nil {
		t.Fatal("NewCircuitBreaker 不应返回 nil")
	}
	if cb.State() != CircuitClosed {
		t.Errorf("初始状态应为 CircuitClosed, 实际 %s", cb.State())
	}
}

func TestNewCircuitBreaker_CustomConfig(t *testing.T) {
	cfg := CircuitBreakerConfig{
		FailureThreshold: 3,
		SuccessThreshold: 3,
		WindowDuration:   30 * time.Second,
		OpenDuration:     10 * time.Second,
		HalfOpenMaxReqs:  2,
	}
	cb := NewCircuitBreaker(cfg)
	if cb == nil {
		t.Fatal("NewCircuitBreaker 不应返回 nil")
	}
	if cb.config.FailureThreshold != 3 {
		t.Errorf("FailureThreshold 应为 3, 实际 %d", cb.config.FailureThreshold)
	}
	if cb.config.SuccessThreshold != 3 {
		t.Errorf("SuccessThreshold 应为 3, 实际 %d", cb.config.SuccessThreshold)
	}
	if cb.config.HalfOpenMaxReqs != 2 {
		t.Errorf("HalfOpenMaxReqs 应为 2, 实际 %d", cb.config.HalfOpenMaxReqs)
	}
}

func TestNewCircuitBreaker_ZeroValues(t *testing.T) {
	cb := NewCircuitBreaker(CircuitBreakerConfig{
		FailureThreshold: 0,
		SuccessThreshold: 0,
		WindowDuration:   0,
		OpenDuration:     0,
		HalfOpenMaxReqs:  0,
	})
	if cb.config.FailureThreshold != 5 {
		t.Errorf("零值 FailureThreshold 应默认 5, 实际 %d", cb.config.FailureThreshold)
	}
	if cb.config.SuccessThreshold != 2 {
		t.Errorf("零值 SuccessThreshold 应默认 2, 实际 %d", cb.config.SuccessThreshold)
	}
	if cb.config.HalfOpenMaxReqs != 1 {
		t.Errorf("零值 HalfOpenMaxReqs 应默认 1, 实际 %d", cb.config.HalfOpenMaxReqs)
	}
}

func TestCircuitBreaker_Allow_Closed(t *testing.T) {
	cb := NewCircuitBreaker(DefaultCircuitBreakerConfig())
	// 在关闭状态下，请求应该被允许
	for i := 0; i < 4; i++ {
		if err := cb.Allow(); err != nil {
			t.Errorf("关闭状态下第 %d 次 Allow 应成功: %v", i+1, err)
		}
	}
}

func TestCircuitBreaker_Allow_OpenByFailures(t *testing.T) {
	cfg := DefaultCircuitBreakerConfig()
	cfg.FailureThreshold = 3
	cfg.WindowDuration = 10 * time.Second
	cb := NewCircuitBreaker(cfg)

	// 记录 3 次失败，触发熔断
	for i := 0; i < 3; i++ {
		cb.RecordFailure()
	}

	// 现在应该拒绝
	if err := cb.Allow(); err == nil {
		t.Error("3 次失败后 Allow 应返回错误")
	}
	if cb.State() != CircuitOpen {
		t.Errorf("3 次失败后状态应为 CircuitOpen, 实际 %s", cb.State())
	}
}

func TestCircuitBreaker_OpenToHalfOpen(t *testing.T) {
	cfg := DefaultCircuitBreakerConfig()
	cfg.FailureThreshold = 3
	cfg.OpenDuration = 10 * time.Millisecond
	cfg.WindowDuration = 10 * time.Second
	cb := NewCircuitBreaker(cfg)

	// 触发熔断
	for i := 0; i < 3; i++ {
		cb.RecordFailure()
	}
	if cb.State() != CircuitOpen {
		t.Fatal("应为 CircuitOpen 状态")
	}

	// 等待 OpenDuration 后，应变为 half-open 并允许试探
	time.Sleep(20 * time.Millisecond)
	if err := cb.Allow(); err != nil {
		t.Errorf("OpenDuration 后应允许试探请求: %v", err)
	}
}

func TestCircuitBreaker_HalfOpenSuccess(t *testing.T) {
	cfg := DefaultCircuitBreakerConfig()
	cfg.FailureThreshold = 3
	cfg.SuccessThreshold = 2
	cfg.OpenDuration = 10 * time.Millisecond
	cfg.WindowDuration = 10 * time.Second
	cb := NewCircuitBreaker(cfg)

	// 触发熔断
	for i := 0; i < 3; i++ {
		cb.RecordFailure()
	}
	time.Sleep(20 * time.Millisecond)

	// 半开状态下允许一个请求
	if err := cb.Allow(); err != nil {
		t.Fatalf("半开状态应允许试探: %v", err)
	}

	// 记录 2 次成功，应恢复
	cb.RecordSuccess()
	cb.RecordSuccess()
	if cb.State() != CircuitClosed {
		t.Errorf("连续成功 %d 次后应恢复为 CircuitClosed, 实际 %s", cfg.SuccessThreshold, cb.State())
	}
}

func TestCircuitBreaker_HalfOpenFailure(t *testing.T) {
	cfg := DefaultCircuitBreakerConfig()
	cfg.FailureThreshold = 3
	cfg.SuccessThreshold = 2
	cfg.OpenDuration = 10 * time.Millisecond
	cfg.WindowDuration = 10 * time.Second
	cb := NewCircuitBreaker(cfg)

	// 触发熔断
	for i := 0; i < 3; i++ {
		cb.RecordFailure()
	}
	time.Sleep(20 * time.Millisecond)

	// 半开试探
	if err := cb.Allow(); err != nil {
		t.Fatalf("半开状态应允许试探: %v", err)
	}

	// 半开状态下失败，应重新打开
	cb.RecordFailure()
	if cb.State() != CircuitOpen {
		t.Errorf("半开探测失败后应重新打开, 实际 %s", cb.State())
	}
}

func TestCircuitBreaker_RecordSuccess_Closed(t *testing.T) {
	cb := NewCircuitBreaker(DefaultCircuitBreakerConfig())
	cb.RecordFailure()
	cb.RecordFailure()
	// 成功应清空失败记录
	cb.RecordSuccess()
	if cb.FailureCount() != 0 {
		t.Errorf("成功应清空失败记录, 实际 %d 条", cb.FailureCount())
	}
}

func TestCircuitBreaker_Reset(t *testing.T) {
	cfg := DefaultCircuitBreakerConfig()
	cfg.FailureThreshold = 3
	cb := NewCircuitBreaker(cfg)

	for i := 0; i < 3; i++ {
		cb.RecordFailure()
	}
	if cb.State() != CircuitOpen {
		t.Fatal("应为 CircuitOpen 状态")
	}

	cb.Reset()
	if cb.State() != CircuitClosed {
		t.Errorf("Reset 后应为 CircuitClosed, 实际 %s", cb.State())
	}
	if cb.FailureCount() != 0 {
		t.Errorf("Reset 后失败计数应为 0, 实际 %d", cb.FailureCount())
	}
}

func TestCircuitBreaker_Status(t *testing.T) {
	cb := NewCircuitBreaker(DefaultCircuitBreakerConfig())
	status := cb.Status()
	if status["state"] != "closed" {
		t.Errorf("status state 应为 closed, 实际 %v", status["state"])
	}
	if status["failure_count"] != 0 {
		t.Errorf("初始 failure_count 应为 0, 实际 %v", status["failure_count"])
	}
}

func TestCircuitBreaker_FailureCount(t *testing.T) {
	cfg := DefaultCircuitBreakerConfig()
	cfg.FailureThreshold = 10
	cfg.WindowDuration = 10 * time.Second
	cb := NewCircuitBreaker(cfg)

	for i := 0; i < 3; i++ {
		cb.RecordFailure()
	}
	if cb.FailureCount() != 3 {
		t.Errorf("FailureCount 应为 3, 实际 %d", cb.FailureCount())
	}
}

func TestCircuitState_String(t *testing.T) {
	tests := []struct {
		state    CircuitState
		expected string
	}{
		{CircuitClosed, "closed"},
		{CircuitOpen, "open"},
		{CircuitHalfOpen, "half-open"},
		{CircuitState(99), "unknown"},
	}

	for _, tt := range tests {
		if tt.state.String() != tt.expected {
			t.Errorf("CircuitState(%d).String() = %q, 期望 %q", tt.state, tt.state.String(), tt.expected)
		}
	}
}

// ── DefaultCircuitBreakerConfig 测试 ──

func TestDefaultCircuitBreakerConfig(t *testing.T) {
	cfg := DefaultCircuitBreakerConfig()
	if cfg.FailureThreshold != 5 {
		t.Errorf("FailureThreshold 应为 5, 实际 %d", cfg.FailureThreshold)
	}
	if cfg.SuccessThreshold != 2 {
		t.Errorf("SuccessThreshold 应为 2, 实际 %d", cfg.SuccessThreshold)
	}
	if cfg.HalfOpenMaxReqs != 1 {
		t.Errorf("HalfOpenMaxReqs 应为 1, 实际 %d", cfg.HalfOpenMaxReqs)
	}
}

// ── toFloat64 测试 ──

func TestToFloat64(t *testing.T) {
	tests := []struct {
		input    interface{}
		expected float64
		ok       bool
	}{
		{float64(3.14), 3.14, true},
		{int(42), 42.0, true},
		{int64(99), 99.0, true},
		{"not a number", 0, false},
		{nil, 0, false},
	}

	for _, tt := range tests {
		val, ok := toFloat64(tt.input)
		if ok != tt.ok {
			t.Errorf("toFloat64(%v) ok = %v, 期望 %v", tt.input, ok, tt.ok)
		}
		if ok && val != tt.expected {
			t.Errorf("toFloat64(%v) = %f, 期望 %f", tt.input, val, tt.expected)
		}
	}
}

// ── ValidateRole 测试 ──

func TestValidateRole(t *testing.T) {
	tests := []struct {
		role     string
		expected bool
	}{
		{"user", true},
		{"USER", true},
		{"assistant", true},
		{"Assistant", true},
		{"system", true},
		{"SYSTEM", true},
		{"admin", false},
		{"", false},
		{"tool", false},
	}

	for _, tt := range tests {
		if ValidateRole(tt.role) != tt.expected {
			t.Errorf("ValidateRole(%q) = %v, 期望 %v", tt.role, !tt.expected, tt.expected)
		}
	}
}

// ── findProviderByName 测试 ──

func TestFindProviderByName(t *testing.T) {
	providers := []APIProvider{
		{Name: "DeepSeek", BaseURL: "https://api.deepseek.com"},
		{Name: "BaiLian", BaseURL: "https://api.bailian.com"},
		{Name: "Google", BaseURL: "https://api.google.com"},
	}

	tests := []struct {
		name     string
		expected string
		nilOK    bool
	}{
		{"DeepSeek", "https://api.deepseek.com", false},
		{"BaiLian", "https://api.bailian.com", false},
		{"Google", "https://api.google.com", false},
		{"NonExistent", "", true},
		{"", "", true},
	}

	for _, tt := range tests {
		result := findProviderByName(providers, tt.name)
		if tt.nilOK {
			if result != nil {
				t.Errorf("findProviderByName(%q) 应返回 nil", tt.name)
			}
		} else {
			if result == nil {
				t.Errorf("findProviderByName(%q) 不应返回 nil", tt.name)
			} else if result.BaseURL != tt.expected {
				t.Errorf("findProviderByName(%q).BaseURL = %q, 期望 %q", tt.name, result.BaseURL, tt.expected)
			}
		}
	}
}

// ── parseModelConfig 测试 ──

func TestParseModelConfig(t *testing.T) {
	entry := map[string]interface{}{
		"model_identifier":  "gpt-4",
		"name":              "GPT-4",
		"api_provider":      "OpenAI",
		"price_in":          float64(0.03),
		"price_out":         float64(0.06),
		"force_stream_mode": true,
		"temperature":       float64(0.8),
		"max_tokens":        float64(4096),
	}

	taskCfg := &TaskConfig{
		Temperature: 0.7,
		MaxTokens:   2048,
	}

	cfg := parseModelConfig(entry, taskCfg)
	if cfg.ModelIdentifier != "gpt-4" {
		t.Errorf("ModelIdentifier = %q, 期望 gpt-4", cfg.ModelIdentifier)
	}
	if cfg.Name != "GPT-4" {
		t.Errorf("Name = %q, 期望 GPT-4", cfg.Name)
	}
	if cfg.APIProvider != "OpenAI" {
		t.Errorf("APIProvider = %q, 期望 OpenAI", cfg.APIProvider)
	}
	if cfg.PriceIn != 0.03 {
		t.Errorf("PriceIn = %f, 期望 0.03", cfg.PriceIn)
	}
	if cfg.PriceOut != 0.06 {
		t.Errorf("PriceOut = %f, 期望 0.06", cfg.PriceOut)
	}
	if *cfg.Temperature != 0.8 {
		t.Errorf("Temperature = %f, 期望 0.8", *cfg.Temperature)
	}
	if *cfg.MaxTokens != 4096 {
		t.Errorf("MaxTokens = %d, 期望 4096", *cfg.MaxTokens)
	}
}

func TestParseModelConfig_NonMapEntry(t *testing.T) {
	taskCfg := &TaskConfig{Temperature: 0.7}
	cfg := parseModelConfig("not a map", taskCfg)
	if cfg.ModelIdentifier != "" {
		t.Errorf("非 map 入口应返回空 ModelConfig")
	}
}

func TestParseModelConfig_FallbackDefaults(t *testing.T) {
	entry := map[string]interface{}{
		"model_identifier": "gpt-3.5",
	}
	taskCfg := &TaskConfig{
		Temperature: 0.5,
		MaxTokens:   1024,
	}

	cfg := parseModelConfig(entry, taskCfg)
	if *cfg.Temperature != 0.5 {
		t.Errorf("未设置 temperature 时应用 task 默认值: 期望 0.5, 实际 %f", *cfg.Temperature)
	}
	if *cfg.MaxTokens != 1024 {
		t.Errorf("未设置 max_tokens 时应用 task 默认值: 期望 1024, 实际 %d", *cfg.MaxTokens)
	}
}

// ── selectModel 测试 ──

func TestSelectModel_SingleModel(t *testing.T) {
	modelList := []string{"gpt-4"}
	result := selectModel(modelList, "random")
	if result != "gpt-4" {
		t.Errorf("单个模型应直接返回, 实际 %q", result)
	}
}

func TestSelectModel_EmptyList(t *testing.T) {
	result := selectModel([]string{}, "random")
	if result != "" {
		t.Errorf("空列表应返回空字符串, 实际 %q", result)
	}
}

func TestSelectModel_DefaultStrategy(t *testing.T) {
	modelList := []string{"model-a", "model-b", "model-c"}
	result := selectModel(modelList, "unknown_strategy")
	// 默认策略选第一个
	if result != "model-a" {
		t.Errorf("默认策略应返回第一个模型, 实际 %q", result)
	}
}

func TestSelectModel_RandomStrategy(t *testing.T) {
	modelList := []string{"model-a", "model-b", "model-c"}
	// 运行多次，确保不会 panic
	for i := 0; i < 10; i++ {
		result := selectModel(modelList, "random")
		found := false
		for _, m := range modelList {
			if m == result {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("随机策略返回了不在列表中的模型: %q", result)
		}
	}
}

func TestSelectModel_BalanceStrategy(t *testing.T) {
	modelList := []string{"model-a", "model-b"}
	// 重置使用计数
	modelUsageMu.Lock()
	modelUsageCounts = make(map[string]int64)
	modelUsageMu.Unlock()

	result := selectModel(modelList, "balance")
	if result != "model-a" && result != "model-b" {
		t.Errorf("balance 策略应返回列表中的模型, 实际 %q", result)
	}
}

// ── NewPooledClient 测试 ──

func TestNewPooledClient(t *testing.T) {
	client := NewPooledClient(30 * time.Second)
	if client == nil {
		t.Fatal("NewPooledClient 不应返回 nil")
	}
	if client.Timeout != 30*time.Second {
		t.Errorf("Timeout 应为 30s, 实际 %v", client.Timeout)
	}
	if client.Transport != DefaultTransport {
		t.Error("应使用全局 DefaultTransport")
	}
}

// ── StatsCollector 测试 ──

func TestStatsCollector_Record(t *testing.T) {
	s := &StatsCollector{
		records: make([]CallRecord, 0, 100),
		maxSize: 100,
	}

	s.Record("gpt-4", "OpenAI", "chat", 100, 50, 500, 0.0, true)
	s.Record("gpt-3.5", "OpenAI", "chat", 200, 100, 300, 0.0, false)

	if len(s.records) != 2 {
		t.Errorf("Record 后应有 2 条记录, 实际 %d", len(s.records))
	}
	if s.records[0].Model != "gpt-4" {
		t.Errorf("第一条记录 Model = %q, 期望 gpt-4", s.records[0].Model)
	}
	if s.records[0].PromptTokens != 100 {
		t.Errorf("第一条记录 PromptTokens = %d, 期望 100", s.records[0].PromptTokens)
	}
	if s.records[1].Success {
		t.Error("第二条记录 Success 应为 false")
	}
}

func TestStatsCollector_MaxSize(t *testing.T) {
	s := &StatsCollector{
		records: make([]CallRecord, 0, 10),
		maxSize: 5,
	}

	for i := 0; i < 10; i++ {
		s.Record("gpt-4", "OpenAI", "chat", 1, 1, 1, 0.0, true)
	}

	if len(s.records) > 5 {
		t.Errorf("记录数不应超过 maxSize=5, 实际 %d", len(s.records))
	}
}

func TestStatsCollector_GetRecentRecords(t *testing.T) {
	s := &StatsCollector{
		records: make([]CallRecord, 0, 100),
		maxSize: 100,
	}

	s.Record("model-a", "p1", "chat", 1, 1, 1, 0.0, true)
	s.Record("model-b", "p2", "chat", 2, 2, 2, 0.0, true)
	s.Record("model-c", "p3", "chat", 3, 3, 3, 0.0, true)

	records := s.GetRecentRecords(2)
	if len(records) != 2 {
		t.Errorf("GetRecentRecords(2) 应返回 2 条, 实际 %d", len(records))
	}
	// 最近的在后面
	if records[1].Model != "model-c" {
		t.Errorf("最新记录应为 model-c, 实际 %q", records[1].Model)
	}
	if records[0].Model != "model-b" {
		t.Errorf("次新记录应为 model-b, 实际 %q", records[0].Model)
	}
}

func TestStatsCollector_GetRecentRecords_MoreThanAvailable(t *testing.T) {
	s := &StatsCollector{
		records: make([]CallRecord, 0, 100),
		maxSize: 100,
	}

	s.Record("model-a", "p1", "chat", 1, 1, 1, 0.0, true)

	records := s.GetRecentRecords(5)
	if len(records) != 1 {
		t.Errorf("请求 5 条但只有 1 条, 应返回 1, 实际 %d", len(records))
	}
}

func TestStatsCollector_GetTotalCalls(t *testing.T) {
	s := &StatsCollector{
		records: make([]CallRecord, 0, 100),
		maxSize: 100,
	}

	s.Record("model-a", "p1", "chat", 1, 1, 1, 0.0, true)
	s.Record("model-b", "p2", "chat", 2, 2, 2, 0.0, true)

	count := s.GetTotalCalls()
	if count != 2 {
		t.Errorf("GetTotalCalls 应为 2, 实际 %d", count)
	}
}

func TestStatsCollector_GetCallTrend(t *testing.T) {
	s := &StatsCollector{
		records: make([]CallRecord, 0, 100),
		maxSize: 100,
	}

	s.Record("model-a", "p1", "chat", 1, 1, 1, 0.0, true)

	trend := s.GetCallTrend()
	if len(trend) != 24 {
		t.Errorf("GetCallTrend 应返回 24 个数据点, 实际 %d", len(trend))
	}
}

func TestStatsCollector_GetTokenUsage(t *testing.T) {
	s := &StatsCollector{
		records: make([]CallRecord, 0, 100),
		maxSize: 100,
	}

	s.Record("gpt-4", "OpenAI", "chat", 100, 50, 500, 0.0, true)
	s.Record("gpt-4", "OpenAI", "chat", 100, 50, 300, 0.0, true)

	usage := s.GetTokenUsage()
	// 按天聚合，最近7天，每天一条记录
	if len(usage) != 7 {
		t.Errorf("应有 7 天的使用统计, 实际 %d", len(usage))
	}
	// 今天的数据应包含两条记录的总和
	today := usage[6]
	totalTokens := today["total_tokens"].(int)
	if totalTokens != 300 {
		t.Errorf("今天总 Token 应为 300, 实际 %d", totalTokens)
	}
}

// ── ErrCircuitOpen 测试 ──

func TestErrCircuitOpen(t *testing.T) {
	if ErrCircuitOpen.Error() == "" {
		t.Error("ErrCircuitOpen 应有错误消息")
	}
}
