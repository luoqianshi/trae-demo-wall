// Package monitor 提供 YaraFlow 运行时可观测性：
//   - 原始 Prompt / 回复的 HTML 预览落盘
//   - 阶段状态 SSE 广播（规划器 / 回复器）
//   - 完整 Prompt 结构保存（JSON），支持调试与回放
package monitor

import (
	"sync"
	"time"
)

// ── 阶段状态 SSE ──

// StageEvent 阶段状态事件
type StageEvent struct {
	SessionID   string `json:"session_id"`
	SessionName string `json:"session_name"`
	Stage       string `json:"stage"`
	Detail      string `json:"detail,omitempty"`
	RoundText   string `json:"round_text,omitempty"`
	AgentState  string `json:"agent_state,omitempty"`
	Timestamp   int64  `json:"timestamp"`
	MsgID       string `json:"msg_id,omitempty"`

	// 预览通知专用字段（当 Stage == "preview_saved" 时有效）
	PreviewURI      string `json:"preview_uri,omitempty"`
	PreviewCategory string `json:"preview_category,omitempty"`
	PreviewTime     string `json:"preview_time,omitempty"`

	// Prompt 摘要字段（规划器/回复器完成时填充）
	ResponseSummary string `json:"response_summary,omitempty"`
	PreviewHTMLURI  string `json:"preview_html_uri,omitempty"`
	PreviewTXTURI   string `json:"preview_txt_uri,omitempty"`
	PreviewJSONURI  string `json:"preview_json_uri,omitempty"`

	// Token 估算（仅 SaveDetailedPreview 填充）
	TokenEstimate *TokenEstimate `json:"token_estimate,omitempty"`

	// 回复效果自评（仅 Replyer 预览填充）
	EvalRelevance  int     `json:"eval_relevance,omitempty"`
	EvalCoherence  int     `json:"eval_coherence,omitempty"`
	EvalEngagement int     `json:"eval_engagement,omitempty"`
	EvalSafety     int     `json:"eval_safety,omitempty"`
	EvalPersona    int     `json:"eval_persona,omitempty"`
	EvalOverall    float64 `json:"eval_overall,omitempty"`
	EvalComment    string  `json:"eval_comment,omitempty"`

	// 推理过程（仅 Planner 预览填充）
	PlannerThought string `json:"planner_thought,omitempty"`
}

var (
	stageSubscribers   []chan StageEvent
	stageSubscribersMu sync.Mutex
	// stageEntries: sessionID → stageName → StageEvent
	stageEntries   = map[string]map[string]StageEvent{}
	stageEntriesMu sync.Mutex
)

// SubscribeStageEvents 订阅阶段状态事件
func SubscribeStageEvents() chan StageEvent {
	ch := make(chan StageEvent, 64)
	stageSubscribersMu.Lock()
	stageSubscribers = append(stageSubscribers, ch)
	stageSubscribersMu.Unlock()
	return ch
}

// UnsubscribeStageEvents 取消订阅
func UnsubscribeStageEvents(ch chan StageEvent) {
	stageSubscribersMu.Lock()
	defer stageSubscribersMu.Unlock()
	for i, sub := range stageSubscribers {
		if sub == ch {
			stageSubscribers = append(stageSubscribers[:i], stageSubscribers[i+1:]...)
			close(ch)
			return
		}
	}
}

// UpdateStage 更新一个会话的阶段状态并广播
func UpdateStage(sessionID, sessionName, stage, detail, roundText, agentState string) {
	ev := StageEvent{
		SessionID:   sessionID,
		SessionName: sessionName,
		Stage:       stage,
		Detail:      detail,
		RoundText:   roundText,
		AgentState:  agentState,
		Timestamp:   time.Now().UnixMilli(),
	}

	stageEntriesMu.Lock()
	if stageEntries[sessionID] == nil {
		stageEntries[sessionID] = make(map[string]StageEvent)
	}
	stageEntries[sessionID][stage] = ev
	stageEntriesMu.Unlock()

	stageSubscribersMu.Lock()
	defer stageSubscribersMu.Unlock()
	for _, ch := range stageSubscribers {
		select {
		case ch <- ev:
		default:
		}
	}
}

// RemoveStage 移除一个会话的所有阶段状态
func RemoveStage(sessionID string) {
	stageEntriesMu.Lock()
	delete(stageEntries, sessionID)
	stageEntriesMu.Unlock()

	stageSubscribersMu.Lock()
	defer stageSubscribersMu.Unlock()
	for _, ch := range stageSubscribers {
		select {
		case ch <- StageEvent{
			SessionID: sessionID,
			Stage:     "removed",
			Timestamp: time.Now().UnixMilli(),
		}:
		default:
		}
	}
}

// StageSnapshot 返回当前所有会话的阶段状态快照
func StageSnapshot() []StageEvent {
	stageEntriesMu.Lock()
	defer stageEntriesMu.Unlock()
	result := make([]StageEvent, 0, len(stageEntries)*2)
	for _, stages := range stageEntries {
		for _, ev := range stages {
			result = append(result, ev)
		}
	}
	return result
}
