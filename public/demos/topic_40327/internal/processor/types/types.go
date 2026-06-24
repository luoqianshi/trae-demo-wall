package types

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// FlexInt 可以接受 JSON 中的字符串或数字，兼容 LLM 输出"0"和0两种格式
type FlexInt int

func (fi *FlexInt) UnmarshalJSON(data []byte) error {
	var num int
	if err := json.Unmarshal(data, &num); err == nil {
		*fi = FlexInt(num)
		return nil
	}
	var str string
	if err := json.Unmarshal(data, &str); err == nil {
		str = strings.TrimSpace(str)
		n, err := strconv.Atoi(str)
		if err != nil {
			return fmt.Errorf("FlexInt: 无法将 %q 转为数字", str)
		}
		*fi = FlexInt(n)
		return nil
	}
	return fmt.Errorf("FlexInt: 期望数字或字符串，收到 %s", string(data))
}

func (fi FlexInt) MarshalJSON() ([]byte, error) {
	return json.Marshal(int(fi))
}

// ============================================================================
// 决策类型
// ============================================================================

// DecisionResult 规划器决策结果
type DecisionResult struct {
	Thought           string
	ActionObjects     []ActionObject
	Actions           []string
	ThinkLevel        int
	TargetMessageID   string
	UnknownWords      []string
	Question          string
	Quote             bool
	SearchMemory      bool
	Confidence        float64
	ReasoningStep     int
	ReasoningTrace    []string
	ToolSummaries     string
	RuleStyleOverride string
	ReplyNeeded       bool
	ToolCallNeeded    bool
	PauseExecution    bool
}

// ActionObject 单个动作的JSON块
type ActionObject struct {
	Action          string                 `json:"action"`
	ThinkLevel      FlexInt                `json:"think_level,omitempty"`
	TargetMessageID string                 `json:"target_message_id,omitempty"`
	UnknownWords    []string               `json:"unknown_words,omitempty"`
	Question        string                 `json:"question,omitempty"`
	Quote           bool                   `json:"quote,omitempty"`
	Name            string                 `json:"name,omitempty"`
	Emotion         string                 `json:"emotion,omitempty"`
	ContextHint     string                 `json:"context,omitempty"`
	ToolName        string                 `json:"tool_name,omitempty"`
	ToolArgs        map[string]interface{} `json:"tool_args,omitempty"`
	Reason          string                 `json:"reason,omitempty"`
}

// RoundRecord 单轮推理记录
type RoundRecord struct {
	Round      int
	Phase      string
	Action     string
	ToolName   string
	ToolResult string
	Thought    string
}

// LoopResult 多轮推理循环的最终结果
type LoopResult struct {
	Decision           *DecisionResult
	AccumulatedContext string
	ToolResultsOnly    string
	Signal             LoopSignal
	PausedAt           time.Time // 暂停时间，用于TTL判断
	Trace              []RoundRecord
}

// LoopSignal 循环控制信号
type LoopSignal int

const (
	SignalReply LoopSignal = iota
	SignalWait
	SignalHalt
)

// ============================================================================
// 工具结果类型
// ============================================================================

// ToolResult 工具执行结果
type ToolResult struct {
	Success        bool
	ToolName       string
	Result         string
	Error          string
	PauseExecution bool
}

// BuildSummary 构建工具结果摘要
func (tr ToolResult) BuildSummary() string {
	content := tr.Result
	if content == "" {
		content = tr.Error
	}
	if content == "" {
		if tr.Success {
			content = "执行成功"
		} else {
			content = "执行失败"
		}
	}
	content = TruncateToolContent(content, 800)

	status := "[成功]"
	if !tr.Success {
		status = "[失败]"
	}
	return fmt.Sprintf("- %s %s: %s", tr.ToolName, status, content)
}

// TruncateToolContent 截断工具结果展示文本
func TruncateToolContent(text string, maxLen int) string {
	text = strings.ReplaceAll(text, "\ufffd", "")
	text = strings.ReplaceAll(text, "\u200b", "")
	text = strings.ReplaceAll(text, "\u2002", " ")
	text = strings.ReplaceAll(text, "\u2003", " ")
	text = strings.ReplaceAll(text, "\u00a0", " ")
	runes := []rune(strings.TrimSpace(text))
	if len(runes) <= maxLen {
		return string(runes)
	}
	return string(runes[:maxLen-1]) + "…"
}

// BuildToolResultsSummary 将多个工具结果格式化为参考信息块
func BuildToolResultsSummary(results []ToolResult, reasoning string) string {
	var successResults []ToolResult
	for _, r := range results {
		if r.Success && r.Result != "" {
			successResults = append(successResults, r)
		}
	}
	if len(successResults) == 0 {
		return ""
	}
	var builder strings.Builder
	builder.WriteString("【参考信息】\n")
	if reasoning != "" {
		builder.WriteString(fmt.Sprintf("【最新推理】\n%s\n\n", TruncateToolContent(reasoning, 500)))
	}
	for _, r := range successResults {
		builder.WriteString(r.BuildSummary())
		builder.WriteString("\n")
	}
	return builder.String()
}

// FormatToolResult 格式化工具结果为字符串
func FormatToolResult(result interface{}) string {
	switch v := result.(type) {
	case string:
		return v
	case map[string]interface{}:
		var parts []string
		for key, val := range v {
			parts = append(parts, fmt.Sprintf("%s: %v", key, val))
		}
		return strings.Join(parts, ", ")
	default:
		return fmt.Sprintf("%v", result)
	}
}

// ============================================================================
// 工具函数
// ============================================================================

// Truncate 截断文本到指定长度
func Truncate(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen]) + "..."
}