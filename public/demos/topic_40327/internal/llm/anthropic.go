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

// ── Anthropic API 类型 ──

// AnthropicRequest 对应 Anthropic Messages API 请求体
type AnthropicRequest struct {
	Model     string             `json:"model"`
	Messages  []AnthropicMessage `json:"messages"`
	System    string             `json:"system,omitempty"`
	MaxTokens int                `json:"max_tokens"`
	Tools     []AnthropicTool    `json:"tools,omitempty"`
}

// AnthropicMessage 单条消息
type AnthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// AnthropicTool 对应 Anthropic 工具定义格式
type AnthropicTool struct {
	Name        string              `json:"name"`
	Description string              `json:"description,omitempty"`
	InputSchema AnthropicToolSchema `json:"input_schema"`
}

// AnthropicToolSchema 工具参数 schema
type AnthropicToolSchema struct {
	Type       string                            `json:"type"`
	Properties map[string]AnthropicToolParamProp `json:"properties,omitempty"`
	Required   []string                          `json:"required,omitempty"`
}

// AnthropicToolParamProp 工具参数属性
type AnthropicToolParamProp struct {
	Type        string   `json:"type"`
	Description string   `json:"description,omitempty"`
	Enum        []string `json:"enum,omitempty"`
}

// AnthropicResponse 对应 Anthropic Messages API 响应
type AnthropicResponse struct {
	ID         string                  `json:"id"`
	Type       string                  `json:"type"`
	Role       string                  `json:"role"`
	Model      string                  `json:"model"`
	Content    []AnthropicContentBlock `json:"content"`
	StopReason string                  `json:"stop_reason"`
	Usage      AnthropicUsage          `json:"usage"`
	Error      *AnthropicError         `json:"error,omitempty"`
}

// AnthropicContentBlock 响应内容块（text 或 tool_use）
type AnthropicContentBlock struct {
	Type  string          `json:"type"`
	Text  string          `json:"text,omitempty"`
	ID    string          `json:"id,omitempty"`
	Name  string          `json:"name,omitempty"`
	Input json.RawMessage `json:"input,omitempty"`
}

// AnthropicUsage token 用量
type AnthropicUsage struct {
	InputTokens  int `json:"input_tokens"`
	OutputTokens int `json:"output_tokens"`
}

// AnthropicError API 错误
type AnthropicError struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

// ── AnthropicProvider ──

type AnthropicProvider struct {
	config ProviderConfig
	client *http.Client
	cb     *CircuitBreaker // per-provider 熔断器
	ctx    context.Context
	ctxMu  sync.Mutex
}

func NewAnthropicProvider(config ProviderConfig) *AnthropicProvider {
	cbName := config.ProviderName + ":" + config.Model
	cb := NewNamedCircuitBreaker(cbName, DefaultCircuitBreakerConfig())
	RegisterCircuitBreaker(cbName, cb)
	return &AnthropicProvider{
		config: config,
		client: NewPooledClient(time.Duration(config.Timeout) * time.Second),
		cb:     cb,
	}
}

func (p *AnthropicProvider) Chat(messages []ChatMessage) (string, error) {
	resp, err := p.ChatEx(messages)
	if err != nil {
		return "", err
	}
	return resp.Content, nil
}

func (p *AnthropicProvider) ChatEx(messages []ChatMessage) (*ChatResponse, error) {
	_, span := tracing.StartSpan(context.Background(), "llm.chat", tracing.SpanKindClient)
	span.SetAttr("model", p.config.Model)
	span.SetAttr("provider", "anthropic")
	span.SetAttr("message_count", fmt.Sprintf("%d", len(messages)))
	defer span.End()

	if err := p.cb.Allow(); err != nil {
		span.RecordError(err)
		logger.Sugar.Warnw("[LLM] 熔断器拒绝请求", "model", p.config.Model, "provider", "anthropic", "error", err)
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
		logger.Sugar.Infow("[LLM] 尝试失败", "attempt", i+1, "max_retries", p.config.MaxRetries+1, "model", p.config.Model, "provider", "anthropic", "error", err)
		if i < p.config.MaxRetries {
			time.Sleep(backoff)
		}
	}

	if IsRetryableError(lastErr) {
		p.cb.RecordFailureRetryable()
	} else {
		p.cb.RecordFailure()
	}
	return nil, fmt.Errorf("failed after %d attempts: %w", p.config.MaxRetries+1, lastErr)
}

func (p *AnthropicProvider) doChatEx(messages []ChatMessage) (*ChatResponse, error) {
	systemPrompt, anthropicMessages := convertToAnthropicMessages(messages)

	reqBody := AnthropicRequest{
		Model:     p.config.Model,
		Messages:  anthropicMessages,
		System:    systemPrompt,
		MaxTokens: 4096, // 默认值，后续可扩展为从 config 读取
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	ctx := p.getCtx()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.config.BaseURL+"/messages", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", p.config.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	startTime := time.Now()
	resp, err := p.client.Do(req)
	latency := time.Since(startTime).Milliseconds()
	if err != nil {
		recordAnthropicStats(p.config, 0, 0, latency, 0, false)
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		recordAnthropicStats(p.config, 0, 0, latency, 0, false)
		return nil, err
	}

	var response AnthropicResponse
	if err := json.Unmarshal(body, &response); err != nil {
		recordAnthropicStats(p.config, 0, 0, latency, 0, false)
		return nil, fmt.Errorf("failed to parse response: %w, response: %s", err, string(body))
	}

	if response.Error != nil {
		recordAnthropicStats(p.config, 0, 0, latency, 0, false)
		return nil, fmt.Errorf("API error: %s (type: %s)", response.Error.Message, response.Error.Type)
	}

	// 提取文本内容
	content := extractTextContent(response.Content)
	content = strings.ReplaceAll(content, "\ufffd", "")

	promptTokens := response.Usage.InputTokens
	compTokens := response.Usage.OutputTokens

	tokensPerSecond := 0.0
	if latency > 0 && compTokens > 0 {
		tokensPerSecond = float64(compTokens) / (float64(latency) / 1000.0)
	}

	recordAnthropicStats(p.config, promptTokens, compTokens, latency, tokensPerSecond, true)

	return &ChatResponse{
		Content:          content,
		PromptTokens:     promptTokens,
		CompletionTokens: compTokens,
		LatencyMs:        latency,
		TokensPerSecond:  tokensPerSecond,
	}, nil
}

// WithContext 设置请求上下文
func (p *AnthropicProvider) WithContext(ctx context.Context) {
	p.ctxMu.Lock()
	p.ctx = ctx
	p.ctxMu.Unlock()
}

func (p *AnthropicProvider) getCtx() context.Context {
	p.ctxMu.Lock()
	ctx := p.ctx
	p.ctxMu.Unlock()
	if ctx == nil {
		return context.Background()
	}
	return ctx
}

// ChatWithTools 实现 ToolCallingProvider 接口
func (p *AnthropicProvider) ChatWithTools(messages []ChatMessage, tools []ToolDefinition) (*ToolCallResponse, error) {
	_, span := tracing.StartSpan(context.Background(), "llm.chat_with_tools", tracing.SpanKindClient)
	span.SetAttr("model", p.config.Model)
	span.SetAttr("provider", "anthropic")
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
		logger.Sugar.Infow("[LLM] ChatWithTools 尝试失败", "attempt", i+1, "model", p.config.Model, "provider", "anthropic", "error", err)
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

func (p *AnthropicProvider) doChatWithTools(messages []ChatMessage, tools []ToolDefinition) (*ToolCallResponse, error) {
	systemPrompt, anthropicMessages := convertToAnthropicMessages(messages)
	anthropicTools := convertToolsToAnthropic(tools)

	reqBody := AnthropicRequest{
		Model:     p.config.Model,
		Messages:  anthropicMessages,
		System:    systemPrompt,
		MaxTokens: 4096,
		Tools:     anthropicTools,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	ctx := p.getCtx()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.config.BaseURL+"/messages", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", p.config.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	startTime := time.Now()
	resp, err := p.client.Do(req)
	latency := time.Since(startTime).Milliseconds()
	if err != nil {
		recordAnthropicStats(p.config, 0, 0, latency, 0, false)
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		recordAnthropicStats(p.config, 0, 0, latency, 0, false)
		return nil, err
	}

	var response AnthropicResponse
	if err := json.Unmarshal(body, &response); err != nil {
		recordAnthropicStats(p.config, 0, 0, latency, 0, false)
		return nil, fmt.Errorf("failed to parse response: %w, response: %s", err, string(body))
	}

	if response.Error != nil {
		recordAnthropicStats(p.config, 0, 0, latency, 0, false)
		return nil, fmt.Errorf("API error: %s (type: %s)", response.Error.Message, response.Error.Type)
	}

	promptTokens := response.Usage.InputTokens
	compTokens := response.Usage.OutputTokens
	tps := 0.0
	if latency > 0 && compTokens > 0 {
		tps = float64(compTokens) / (float64(latency) / 1000.0)
	}
	recordAnthropicStats(p.config, promptTokens, compTokens, latency, tps, true)

	// 转换 Anthropic 响应为通用格式
	textContent := extractTextContent(response.Content)
	toolCalls := extractToolCalls(response.Content)

	return &ToolCallResponse{
		Content:   textContent,
		ToolCalls: toolCalls,
	}, nil
}

// ── 格式转换 ──

// convertToAnthropicMessages 将 ChatMessage 切片转为 Anthropic 格式
// 同时提取 system 角色的消息作为顶层 system prompt
func convertToAnthropicMessages(messages []ChatMessage) (systemPrompt string, result []AnthropicMessage) {
	var systemParts []string
	result = make([]AnthropicMessage, 0, len(messages))

	for _, msg := range messages {
		if strings.EqualFold(msg.Role, "system") {
			systemParts = append(systemParts, msg.Content)
			continue
		}
		result = append(result, AnthropicMessage(msg))
	}

	if len(systemParts) > 0 {
		systemPrompt = strings.Join(systemParts, "\n\n")
	}
	return
}

// convertToolsToAnthropic 将 OpenAI 格式的工具定义转为 Anthropic 格式
func convertToolsToAnthropic(tools []ToolDefinition) []AnthropicTool {
	result := make([]AnthropicTool, 0, len(tools))
	for _, t := range tools {
		at := AnthropicTool{
			Name:        t.Function.Name,
			Description: t.Function.Description,
			InputSchema: AnthropicToolSchema{
				Type:       t.Function.Parameters.Type,
				Properties: convertToolProperties(t.Function.Parameters.Properties),
				Required:   t.Function.Parameters.Required,
			},
		}
		result = append(result, at)
	}
	return result
}

func convertToolProperties(props map[string]ToolParamProp) map[string]AnthropicToolParamProp {
	if len(props) == 0 {
		return nil
	}
	result := make(map[string]AnthropicToolParamProp, len(props))
	for k, v := range props {
		result[k] = AnthropicToolParamProp(v)
	}
	return result
}

// extractTextContent 从 Anthropic 内容块中提取文本
func extractTextContent(blocks []AnthropicContentBlock) string {
	var parts []string
	for _, block := range blocks {
		if block.Type == "text" && block.Text != "" {
			parts = append(parts, block.Text)
		}
	}
	return strings.Join(parts, "\n")
}

// extractToolCalls 从 Anthropic 内容块中提取工具调用，转为通用格式
func extractToolCalls(blocks []AnthropicContentBlock) []ToolCall {
	var result []ToolCall
	for _, block := range blocks {
		if block.Type == "tool_use" {
			args := string(block.Input)
			if args == "" {
				args = "{}"
			}
			result = append(result, ToolCall{
				ID:   block.ID,
				Type: "function",
				Function: ToolCallFunction{
					Name:      block.Name,
					Arguments: args,
				},
			})
		}
	}
	return result
}

// ── 统计记录 ──

func recordAnthropicStats(cfg ProviderConfig, promptTokens, compTokens int, latency int64, tokensPerSecond float64, success bool) {
	if cfg.ModelName != "" {
		GlobalStats.Record(cfg.ModelName, cfg.ProviderName, cfg.TaskType, promptTokens, compTokens, latency, tokensPerSecond, success)
	}
	metrics.RecordLLMCall(success, int64(promptTokens), int64(compTokens), float64(latency))
}
