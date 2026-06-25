package processor

import (
	"math"
	"math/rand"
	"sync"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
)

// GateStrategy 门控决策策略类型
type GateStrategy string

const (
	GateRespondNow GateStrategy = "respond_now" // 立即回应：消息明确需要回复
	GateSkip       GateStrategy = "skip"        // 跳过：消息不需要回复
	GateObserve    GateStrategy = "observe"     // 观望：暂不回应，积累更多消息后再评估
)

// TimingGateResult 门控评估结果
type TimingGateResult struct {
	ShouldRespond bool         `json:"should_respond"`
	Strategy      GateStrategy `json:"strategy"` // 决策策略
	Reason        string       `json:"reason"`
	Intent        string       `json:"intent"`
	NeedTools     bool         `json:"need_tools"`
	NeedMemory    bool         `json:"need_memory"`
	NeedKnowledge bool         `json:"need_knowledge"` // 是否需要查询知识库/备忘录
	Urgency       float64      `json:"urgency"`        // 紧急度 0-1，越高越需要立即回应
	ObserveCount  int          `json:"observe_count"`  // 观望时需要再观察几条消息
}

// groupGateState 群级门控状态，追踪每个群的历史门控决策
// 用于防止过度活跃或过度沉默
type groupGateState struct {
	lastRespondTime  time.Time // 上次回应时间
	recentResponds   int       // 近期回应次数（滑动窗口内）
	consecutiveSkips int       // 连续跳过次数
}

type TimingGate struct {
	config      *config.Config
	llmProvider llm.LLMProvider
	mu          sync.Mutex
	groupStates map[string]*groupGateState // groupID -> 群级门控状态
}

func NewTimingGate(cfg *config.Config, llm llm.LLMProvider) *TimingGate {
	return &TimingGate{
		config:      cfg,
		llmProvider: llm,
		groupStates: make(map[string]*groupGateState),
	}
}

func (tg *TimingGate) Evaluate(processedMsg *platform.ProcessedMessage, context string) (*TimingGateResult, error) {
	isMentioned := processedMsg.IsAtMe || processedMsg.IsMentioned
	cfg := tg.config.TimingGate

	// 获取群级门控状态
	groupID := processedMsg.OriginalMessage.GroupID
	if groupID == "" {
		groupID = "private_" + processedMsg.OriginalMessage.SenderID
	}
	state := tg.getOrCreateGroupState(groupID)

	if processedMsg.IsPureEmoji && len(processedMsg.Images) == 0 {
		if isMentioned {
			tg.recordRespond(state)
			return &TimingGateResult{
				ShouldRespond: true,
				Strategy:      GateRespondNow,
				Reason:        "被提及的纯表情消息",
				Intent:        "emoji",
				Urgency:       0.8,
			}, nil
		}
		rng := rand.New(rand.NewSource(time.Now().UnixNano()))
		if rng.Float64() < 0.3 {
			tg.recordRespond(state)
			return &TimingGateResult{
				ShouldRespond: true,
				Strategy:      GateRespondNow,
				Reason:        "偶尔也用表情互动一下",
				Intent:        "emoji",
				Urgency:       0.3,
			}, nil
		}
		tg.recordSkip(state)
		return &TimingGateResult{
			ShouldRespond: false,
			Strategy:      GateSkip,
			Reason:        "纯表情消息，不回应",
			Intent:        "emoji",
		}, nil
	}

	if !tg.config.Trigger.AutoReply && !isMentioned {
		return &TimingGateResult{
			ShouldRespond: false,
			Strategy:      GateSkip,
			Reason:        "自动回复已禁用",
		}, nil
	}

	var result *TimingGateResult
	var err error

	if tg.llmProvider == nil {
		result, err = tg.fallbackEvaluate(processedMsg)
	} else {
		result, err = tg.evaluateWithLLM(processedMsg, context)
	}

	if err != nil {
		return result, err
	}

	// 强制触发（被@或提及）：无论如何都回应
	if isMentioned {
		result.ShouldRespond = true
		result.Strategy = GateRespondNow
		result.Urgency = math.Max(result.Urgency, 0.9)
		if result.Intent == "" {
			result.Intent = "mentioned"
		}
		if result.Reason == "" {
			result.Reason = "被@或提及，必须回应"
		}
		tg.recordRespond(state)
		return result, nil
	}

	// 后处理：根据群级状态和策略调整决策
	result = tg.applyGroupState(result, state, cfg)

	return result, nil
}

// applyGroupState 根据群级门控状态调整决策
func (tg *TimingGate) applyGroupState(result *TimingGateResult, state *groupGateState, cfg config.TimingGateConfig) *TimingGateResult {
	now := time.Now()

	// 规则1：冷却期检查
	respondCooldown := time.Duration(cfg.RespondCooldownSec) * time.Second
	if !state.lastRespondTime.IsZero() && now.Sub(state.lastRespondTime) < respondCooldown {
		if result.Urgency < 0.85 {
			result.ShouldRespond = false
			result.Strategy = GateObserve
			result.Reason = "冷却期内，暂缓回应"
			result.ObserveCount = 1
			return result
		}
		result.Reason = result.Reason + "（打破冷却期）"
	}

	// 规则2：近期回应频率检查
	if state.recentResponds >= cfg.MaxRecentResponds && result.Strategy == GateRespondNow && result.Urgency < 0.7 {
		result.Strategy = GateObserve
		result.ShouldRespond = false
		result.ObserveCount = 1
		result.Reason = "近期回应较多，先观望一下"
		return result
	}

	// 规则3：连续跳过过多，降低门槛
	if state.consecutiveSkips >= cfg.MaxConsecutiveSkips && result.Strategy == GateSkip {
		result.Strategy = GateObserve
		result.Reason = "沉默有点久了，再看看情况"
		result.ObserveCount = 2
		return result
	}
	if state.consecutiveSkips >= cfg.MaxConsecutiveSkips && result.Strategy == GateObserve {
		result.Strategy = GateRespondNow
		result.ShouldRespond = true
		result.Reason = "沉默太久，主动参与"
		result.Urgency = math.Max(result.Urgency, 0.5)
	}

	// 记录状态
	if result.ShouldRespond && result.Strategy == GateRespondNow {
		tg.recordRespond(state)
	} else {
		tg.recordSkip(state)
	}

	return result
}

// getOrCreateGroupState 获取或创建群级门控状态
func (tg *TimingGate) getOrCreateGroupState(groupID string) *groupGateState {
	tg.mu.Lock()
	defer tg.mu.Unlock()

	if s, ok := tg.groupStates[groupID]; ok {
		return s
	}
	s := &groupGateState{}
	tg.groupStates[groupID] = s
	return s
}

// recordRespond 记录一次回应
func (tg *TimingGate) recordRespond(state *groupGateState) {
	tg.mu.Lock()
	defer tg.mu.Unlock()

	state.lastRespondTime = time.Now()
	state.consecutiveSkips = 0
	state.recentResponds++
	ws := tg.config.TimingGate.RecentWindowSize
	if state.recentResponds > ws*2 {
		state.recentResponds = ws
	}
}

// recordSkip 记录一次跳过
func (tg *TimingGate) recordSkip(state *groupGateState) {
	tg.mu.Lock()
	defer tg.mu.Unlock()
	state.consecutiveSkips++
}

// ResetGroupState 重置指定群的门控状态（例如手动触发回复后）
func (tg *TimingGate) ResetGroupState(groupID string) {
	tg.mu.Lock()
	defer tg.mu.Unlock()
	delete(tg.groupStates, groupID)
}

// CleanupStaleStates 清理长时间未使用的群状态，防止内存泄漏
func (tg *TimingGate) CleanupStaleStates(maxAge time.Duration) {
	tg.mu.Lock()
	defer tg.mu.Unlock()

	now := time.Now()
	for id, state := range tg.groupStates {
		if now.Sub(state.lastRespondTime) > maxAge && state.consecutiveSkips > 50 {
			delete(tg.groupStates, id)
		}
	}
}

// StartPeriodicCleanup 启动定时清理过期群状态，建议每10分钟执行一次
func (tg *TimingGate) StartPeriodicCleanup(interval, maxAge time.Duration) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				logger.Sugar.Errorw("[PANIC] TimingGate 定期清理崩溃，已恢复", "panic", r)
			}
		}()
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for range ticker.C {
			tg.CleanupStaleStates(maxAge)
		}
	}()
}
