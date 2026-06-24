package llm

import (
	"strings"
)

// ── 核心接口 ──

type LLMProvider interface {
	Chat(messages []ChatMessage) (string, error)
	ChatEx(messages []ChatMessage) (*ChatResponse, error)
}

// ChatResponse LLM 调用完整响应，包含内容和性能指标
type ChatResponse struct {
	Content          string  `json:"content"`
	PromptTokens     int     `json:"prompt_tokens"`
	CompletionTokens int     `json:"completion_tokens"`
	LatencyMs        int64   `json:"latency_ms"`
	TokensPerSecond  float64 `json:"tokens_per_second"`
}

// ── Function Calling 类型 ──

// ToolDefinition 原生 Function Calling 工具定义（OpenAI 兼容格式）
type ToolDefinition struct {
	Type     string             `json:"type"` // "function"
	Function ToolFunctionSchema `json:"function"`
}

type ToolFunctionSchema struct {
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Parameters  ToolParameters `json:"parameters"`
}

type ToolParameters struct {
	Type       string                   `json:"type"` // "object"
	Properties map[string]ToolParamProp `json:"properties"`
	Required   []string                 `json:"required,omitempty"`
}

type ToolParamProp struct {
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Enum        []string `json:"enum,omitempty"`
}

// ToolCall LLM 返回的工具调用
type ToolCall struct {
	ID       string           `json:"id"`
	Type     string           `json:"type"` // "function"
	Function ToolCallFunction `json:"function"`
}

type ToolCallFunction struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"` // JSON 字符串
}

// ToolCallingProvider 支持原生 Function Calling 的 LLM Provider
type ToolCallingProvider interface {
	LLMProvider
	ChatWithTools(messages []ChatMessage, tools []ToolDefinition) (*ToolCallResponse, error)
}

// ToolCallResponse 原生 Function Calling 返回结果
type ToolCallResponse struct {
	Content   string
	ToolCalls []ToolCall
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ── 工具函数 ──

func ValidateRole(role string) bool {
	role = strings.ToLower(role)
	return role == "user" || role == "assistant" || role == "system"
}
