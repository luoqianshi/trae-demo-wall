package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/metrics"
	"YaraFlow/internal/tracing"
)

type OpenAIProvider struct {
	config ProviderConfig
	client *http.Client
	cb     *CircuitBreaker // per-provider 熔断器
	ctx    context.Context // 可选的请求上下文，用于取消传播
	ctxMu  sync.Mutex      // 保护 ctx 的并发访问
}

type OpenAIRequest struct {
	Model       string           `json:"model"`
	Messages    []ChatMessage    `json:"messages"`
	Temperature float32          `json:"temperature"`
	Stream      bool             `json:"stream,omitempty"`
	Tools       []ToolDefinition `json:"tools,omitempty"`
	ToolChoice  string           `json:"tool_choice,omitempty"` // "auto", "none", "required"
}

type OpenAIResponse struct {
	Choices []Choice  `json:"choices"`
	Usage   *Usage    `json:"usage,omitempty"`
	Error   *APIError `json:"error,omitempty"`
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type Choice struct {
	Message      MessageData `json:"message"`
	Delta        MessageData `json:"delta,omitempty"`
	FinishReason string      `json:"finish_reason,omitempty"`
}

type MessageData struct {
	Role      string     `json:"role"`
	Content   string     `json:"content"`
	ToolCalls []ToolCall `json:"tool_calls,omitempty"`
}

type APIError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Code    string `json:"code"`
}

func NewOpenAIProvider(config ProviderConfig) *OpenAIProvider {
	cbName := config.ProviderName + ":" + config.Model
	cb := NewNamedCircuitBreaker(cbName, DefaultCircuitBreakerConfig())
	RegisterCircuitBreaker(cbName, cb)
	return &OpenAIProvider{
		config: config,
		client: NewPooledClient(time.Duration(config.Timeout) * time.Second),
		cb:     cb,
	}
}

func (p *OpenAIProvider) Chat(messages []ChatMessage) (string, error) {
	resp, err := p.ChatEx(messages)
	if err != nil {
		return "", err
	}
	return resp.Content, nil
}

// ChatEx 返回包含 Token 用量和速度指标的完整响应
func (p *OpenAIProvider) ChatEx(messages []ChatMessage) (*ChatResponse, error) {
	// 分布式追踪：LLM 调用 Span
	_, span := tracing.StartSpan(context.Background(), "llm.chat", tracing.SpanKindClient)
	span.SetAttr("model", p.config.Model)
	span.SetAttr("provider", p.config.ProviderName)
	span.SetAttr("message_count", fmt.Sprintf("%d", len(messages)))
	defer span.End()

	if err := p.cb.Allow(); err != nil {
		span.RecordError(err)
		logger.Sugar.Warnw("[LLM] 熔断器拒绝请求", "model", p.config.Model, "error", err)
		return nil, err
	}

	var lastErr error

	backoff := time.Duration(p.config.RetryInterval) * time.Second
	if backoff <= 0 {
		backoff = time.Second
	}

	for i := 0; i <= p.config.MaxRetries; i++ {
		response, err := p.doChatEx(messages)
		if err == nil {
			p.cb.RecordSuccess()
			return response, nil
		}

		lastErr = err
		logger.Sugar.Infow("[LLM] 尝试失败", "attempt", i+1, "max_retries", p.config.MaxRetries+1, "model", p.config.Model, "error", err)

		if i < p.config.MaxRetries {
			time.Sleep(backoff)
		}
	}

	// 所有重试都失败，记录熔断器失败
	if IsRetryableError(lastErr) {
		p.cb.RecordFailureRetryable()
	} else {
		p.cb.RecordFailure()
	}
	return nil, fmt.Errorf("failed after %d attempts: %w", p.config.MaxRetries+1, lastErr)
}

// doChatEx 执行单次 LLM 请求，返回包含性能指标的完整响应
func (p *OpenAIProvider) doChatEx(messages []ChatMessage) (*ChatResponse, error) {
	reqBody := OpenAIRequest{
		Model:       p.config.Model,
		Messages:    messages,
		Temperature: p.config.Temperature,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	ctx := p.getCtx()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.config.BaseURL+"/chat/completions", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	apiKey := p.config.APIKey
	if apiKey != "" && !hasBearerPrefix(apiKey) {
		apiKey = "Bearer " + apiKey
	}
	req.Header.Set("Authorization", apiKey)

	startTime := time.Now()
	resp, err := p.client.Do(req)
	latency := time.Since(startTime).Milliseconds()
	if err != nil {
		if p.config.ModelName != "" {
			GlobalStats.Record(p.config.ModelName, p.config.ProviderName, p.config.TaskType, 0, 0, latency, 0, false)
		}
		metrics.RecordLLMCall(false, 0, 0, float64(latency))
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		if p.config.ModelName != "" {
			GlobalStats.Record(p.config.ModelName, p.config.ProviderName, p.config.TaskType, 0, 0, latency, 0, false)
		}
		metrics.RecordLLMCall(false, 0, 0, float64(latency))
		return nil, err
	}

	var response OpenAIResponse
	if err := json.Unmarshal(body, &response); err != nil {
		if p.config.ModelName != "" {
			GlobalStats.Record(p.config.ModelName, p.config.ProviderName, p.config.TaskType, 0, 0, latency, 0, false)
		}
		metrics.RecordLLMCall(false, 0, 0, float64(latency))
		return nil, fmt.Errorf("failed to parse response: %w, response: %s", err, string(body))
	}

	if response.Error != nil {
		if p.config.ModelName != "" {
			GlobalStats.Record(p.config.ModelName, p.config.ProviderName, p.config.TaskType, 0, 0, latency, 0, false)
		}
		metrics.RecordLLMCall(false, 0, 0, float64(latency))
		return nil, fmt.Errorf("API error: %s (type: %s, code: %s)", response.Error.Message, response.Error.Type, response.Error.Code)
	}

	if len(response.Choices) == 0 {
		if p.config.ModelName != "" {
			GlobalStats.Record(p.config.ModelName, p.config.ProviderName, p.config.TaskType, 0, 0, latency, 0, false)
		}
		metrics.RecordLLMCall(false, 0, 0, float64(latency))
		return nil, fmt.Errorf("no choices in response")
	}

	// 记录成功的调用统计
	promptTokens := 0
	compTokens := 0
	if response.Usage != nil {
		promptTokens = response.Usage.PromptTokens
		compTokens = response.Usage.CompletionTokens
	}

	// 计算词元生成速度（token/秒）
	tokensPerSecond := 0.0
	if latency > 0 && compTokens > 0 {
		tokensPerSecond = float64(compTokens) / (float64(latency) / 1000.0)
	}

	if p.config.ModelName != "" {
		GlobalStats.Record(p.config.ModelName, p.config.ProviderName, p.config.TaskType, promptTokens, compTokens, latency, tokensPerSecond, true)
	}

	// 记录到 expvar 指标系统
	metrics.RecordLLMCall(true, int64(promptTokens), int64(compTokens), float64(latency))

	content := response.Choices[0].Message.Content
	// 清洗 LLM 响应中可能含有的 Unicode 替换字符（U+FFFD）
	// 当 API 返回无效 UTF-8 字节时，Go JSON 解码会将其替换为 \ufffd
	// 在这里做源头清理，防止乱码向下游扩散（工具结果/回复/适配器）
	content = strings.ReplaceAll(content, "\ufffd", "")

	return &ChatResponse{
		Content:          content,
		PromptTokens:     promptTokens,
		CompletionTokens: compTokens,
		LatencyMs:        latency,
		TokensPerSecond:  tokensPerSecond,
	}, nil
}

// WithContext 设置请求上下文，用于取消传播和超时控制
func (p *OpenAIProvider) WithContext(ctx context.Context) {
	p.ctxMu.Lock()
	p.ctx = ctx
	p.ctxMu.Unlock()
}

// getCtx 线程安全地获取请求上下文
func (p *OpenAIProvider) getCtx() context.Context {
	p.ctxMu.Lock()
	ctx := p.ctx
	p.ctxMu.Unlock()
	if ctx == nil {
		return context.Background()
	}
	return ctx
}

// ChatWithTools 实现 ToolCallingProvider 接口，走原生 Function Calling
func (p *OpenAIProvider) ChatWithTools(messages []ChatMessage, tools []ToolDefinition) (*ToolCallResponse, error) {
	_, span := tracing.StartSpan(context.Background(), "llm.chat_with_tools", tracing.SpanKindClient)
	span.SetAttr("model", p.config.Model)
	span.SetAttr("provider", p.config.ProviderName)
	span.SetAttr("tool_count", fmt.Sprintf("%d", len(tools)))
	defer span.End()

	if err := p.cb.Allow(); err != nil {
		span.RecordError(err)
		return nil, err
	}

	var lastErr error
	backoff := time.Duration(p.config.RetryInterval) * time.Second
	if backoff <= 0 {
		backoff = time.Second
	}

	for i := 0; i <= p.config.MaxRetries; i++ {
		response, err := p.doChatWithTools(messages, tools)
		if err == nil {
			p.cb.RecordSuccess()
			return response, nil
		}
		lastErr = err
		logger.Sugar.Infow("[LLM] ChatWithTools 尝试失败", "attempt", i+1, "model", p.config.Model, "error", err)
		if i < p.config.MaxRetries {
			time.Sleep(backoff)
		}
	}

	if IsRetryableError(lastErr) {
		p.cb.RecordFailureRetryable()
	} else {
		p.cb.RecordFailure()
	}
	return nil, fmt.Errorf("ChatWithTools failed after %d attempts: %w", p.config.MaxRetries+1, lastErr)
}

func (p *OpenAIProvider) doChatWithTools(messages []ChatMessage, tools []ToolDefinition) (*ToolCallResponse, error) {
	reqBody := OpenAIRequest{
		Model:       p.config.Model,
		Messages:    messages,
		Temperature: p.config.Temperature,
		Tools:       tools,
		ToolChoice:  "auto",
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	ctx := p.getCtx()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.config.BaseURL+"/chat/completions", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	apiKey := p.config.APIKey
	if apiKey != "" && !hasBearerPrefix(apiKey) {
		apiKey = "Bearer " + apiKey
	}
	req.Header.Set("Authorization", apiKey)

	startTime := time.Now()
	resp, err := p.client.Do(req)
	latency := time.Since(startTime).Milliseconds()
	if err != nil {
		recordStats(p.config, 0, 0, latency, 0, false)
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		recordStats(p.config, 0, 0, latency, 0, false)
		return nil, err
	}

	var response OpenAIResponse
	if err := json.Unmarshal(body, &response); err != nil {
		recordStats(p.config, 0, 0, latency, 0, false)
		return nil, fmt.Errorf("failed to parse response: %w, response: %s", err, string(body))
	}

	if response.Error != nil {
		recordStats(p.config, 0, 0, latency, 0, false)
		return nil, fmt.Errorf("API error: %s (type: %s, code: %s)", response.Error.Message, response.Error.Type, response.Error.Code)
	}

	if len(response.Choices) == 0 {
		recordStats(p.config, 0, 0, latency, 0, false)
		return nil, fmt.Errorf("no choices in response")
	}

	promptTokens := 0
	compTokens := 0
	if response.Usage != nil {
		promptTokens = response.Usage.PromptTokens
		compTokens = response.Usage.CompletionTokens
	}
	tps := 0.0
	if latency > 0 && compTokens > 0 {
		tps = float64(compTokens) / (float64(latency) / 1000.0)
	}
	recordStats(p.config, promptTokens, compTokens, latency, tps, true)

	choice := response.Choices[0]
	result := &ToolCallResponse{
		Content:   choice.Message.Content,
		ToolCalls: choice.Message.ToolCalls,
	}

	return result, nil
}

func recordStats(cfg ProviderConfig, promptTokens, compTokens int, latency int64, tokensPerSecond float64, success bool) {
	if cfg.ModelName != "" {
		GlobalStats.Record(cfg.ModelName, cfg.ProviderName, cfg.TaskType, promptTokens, compTokens, latency, tokensPerSecond, success)
	}
	metrics.RecordLLMCall(success, int64(promptTokens), int64(compTokens), float64(latency))
}

func hasBearerPrefix(apiKey string) bool {
	return len(apiKey) > 7 && apiKey[:7] == "Bearer "
}
