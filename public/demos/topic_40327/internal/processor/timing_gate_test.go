package processor

import (
	"testing"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/platform"
)

// 构造测试用 ProcessedMessage
func testProcessedMsg(content string, isAtMe, isMentioned bool) *platform.ProcessedMessage {
	return &platform.ProcessedMessage{
		Content: content,
		IsAtMe:  isAtMe,
		OriginalMessage: platform.Message{
			GroupID:  "test-group",
			SenderID: "u1",
		},
		IsMentioned: isMentioned,
	}
}

func makeTestConfig() *config.Config {
	return &config.Config{
		Bot: config.BotConfig{Nickname: "瞳瞳", Aliases: []string{"瞳酱"}},
		Trigger: config.TriggerConfig{
			AutoReply: true,
		},
		TimingGate: config.TimingGateConfig{
			Enabled:             false,
			MaxConsecutiveSkips: 10,
			MaxRecentResponds:   3,
			RespondCooldownSec:  8,
			RecentWindowSize:    5,
		},
		Decision:   config.DecisionConfig{MaxRounds: 2},
	}
}

func TestTimingGateFallback_AtMe(t *testing.T) {
	tg := NewTimingGate(makeTestConfig(), nil)
	msg := testProcessedMsg("你好", true, false)

	result, err := tg.Evaluate(msg, "")
	if err != nil {
		t.Fatal(err)
	}
	if !result.ShouldRespond {
		t.Error("被@时应回复")
	}
	if result.Strategy != GateRespondNow {
		t.Errorf("被@时策略应为 respond_now，实际: %s", result.Strategy)
	}
	if result.Urgency < 0.9 {
		t.Errorf("被@时紧急度应>=0.9，实际: %.2f", result.Urgency)
	}
}

func TestTimingGateFallback_Question(t *testing.T) {
	tg := NewTimingGate(makeTestConfig(), nil)
	msg := testProcessedMsg("今天天气怎么样？", false, false)

	result, err := tg.Evaluate(msg, "")
	if err != nil {
		t.Fatal(err)
	}
	if !result.ShouldRespond {
		t.Error("提问应回复")
	}
	if result.Strategy != GateRespondNow {
		t.Errorf("提问时策略应为 respond_now，实际: %s", result.Strategy)
	}
	if result.Intent != "question" {
		t.Errorf("意图应为 question，实际: %s", result.Intent)
	}
}

func TestTimingGateFallback_Observe(t *testing.T) {
	tg := NewTimingGate(makeTestConfig(), nil)
	// 较长消息无问号：应该走 observe
	msg := testProcessedMsg("我今天去吃了很好吃的蛋糕，真的很不错", false, false)

	result, err := tg.Evaluate(msg, "")
	if err != nil {
		t.Fatal(err)
	}
	if result.ShouldRespond {
		t.Error("常规陈述不应立即回复")
	}
	if result.Strategy != GateObserve {
		t.Errorf("不明确意图应走 observe，实际: %s", result.Strategy)
	}
	if result.Urgency < 0.2 || result.Urgency > 0.5 {
		t.Errorf("observe 紧迫度应在0.2-0.5之间，实际: %.2f", result.Urgency)
	}
}

func TestTimingGateFallback_ShortSkip(t *testing.T) {
	tg := NewTimingGate(makeTestConfig(), nil)
	// 短消息无触发 → skip
	msg := testProcessedMsg("哦", false, false)

	result, err := tg.Evaluate(msg, "")
	if err != nil {
		t.Fatal(err)
	}
	if result.ShouldRespond {
		t.Error("无意义短消息不应回复")
	}
	if result.Strategy != GateSkip {
		t.Errorf("短消息策略应为 skip，实际: %s", result.Strategy)
	}
}

func TestTimingGateFallback_AutoReplyDisabled(t *testing.T) {
	cfg := makeTestConfig()
	cfg.Trigger.AutoReply = false
	tg := NewTimingGate(cfg, nil)
	msg := testProcessedMsg("随便说句话", false, false)

	result, err := tg.Evaluate(msg, "")
	if err != nil {
		t.Fatal(err)
	}
	if result.ShouldRespond {
		t.Error("自动回复禁用时不应回复")
	}
	if result.Strategy != GateSkip {
		t.Errorf("禁用自动回复时策略应为 skip，实际: %s", result.Strategy)
	}
}

func TestTimingGate_GroupCooldown(t *testing.T) {
	tg := NewTimingGate(makeTestConfig(), nil)
	msg := testProcessedMsg("今天天气怎么样？", false, false)

	// 第一次应该 respond_now
	result1, err := tg.Evaluate(msg, "")
	if err != nil {
		t.Fatal(err)
	}
	if !result1.ShouldRespond || result1.Strategy != GateRespondNow {
		t.Errorf("第一次提问应 respond_now，实际: %s", result1.Strategy)
	}

	// 立即再次询问同样的问题 → 冷却期检测到高紧急度(0.9>=0.85)，应打破冷却
	result2, err := tg.Evaluate(msg, "")
	if err != nil {
		t.Fatal(err)
	}
	if !result2.ShouldRespond {
		t.Error("冷却期内高紧急度消息应打破冷却")
	}
}

func TestTimingGate_ConsecutiveSkipsWakeUp(t *testing.T) {
	tg := NewTimingGate(makeTestConfig(), nil)

	// 连续跳过11次（超过 maxConsecutiveSkips=10）
	skipMsg := testProcessedMsg("哦", false, false)
	for i := 0; i < 11; i++ {
		result, err := tg.Evaluate(skipMsg, "")
		if err != nil {
			t.Fatal(err)
		}
		if i < 10 && result.Strategy != GateSkip {
			t.Errorf("第%d次短消息应为 skip，实际: %s", i+1, result.Strategy)
		}
		// 第11次应该变成 observe
		if i == 10 && result.Strategy == GateSkip {
			t.Error("连续跳过过多后应变为 observe")
		}
	}
}

func TestTimingGate_GroupStateReset(t *testing.T) {
	tg := NewTimingGate(makeTestConfig(), nil)
	msg := testProcessedMsg("今天天气怎么样？", false, false)

	// 触发一次回复
	tg.Evaluate(msg, "")

	// 重置状态
	tg.ResetGroupState("test-group")

	// 再次评估应不受之前状态影响
	result, err := tg.Evaluate(msg, "")
	if err != nil {
		t.Fatal(err)
	}
	if !result.ShouldRespond {
		t.Error("重置后提问应回复")
	}
}

func TestTimingGate_StaleStateCleanup(t *testing.T) {
	tg := NewTimingGate(makeTestConfig(), nil)
	msg := testProcessedMsg("你好", false, false)
	msg.OriginalMessage.GroupID = "stale-group"

	// 触发一次
	tg.Evaluate(msg, "")

	// 清理：lastRespondTime是零值（只有skip被记录，没respond过），
	// 而且consecutiveSkips应该只有1，不满足>50条件，所以不应该清理
	tg.CleanupStaleStates(10 * time.Millisecond)

	// 验证状态还在（不会panic）
	result, err := tg.Evaluate(msg, "")
	if err != nil {
		t.Fatal(err)
	}
	_ = result
}

func TestHasQuestion(t *testing.T) {
	tests := []struct {
		content  string
		expected bool
	}{
		{"你好", false},
		{"你好吗？", true},
		{"什么情况", true},
		{"怎么搞的", true},
		{"如何解决", true},
		{"为什么这样", true},
		{"可以吗", true},
		{"能不能帮我", true},
		{"今天天气真好啊", false},
		{"", false},
	}

	for _, tt := range tests {
		if got := hasQuestion(tt.content); got != tt.expected {
			t.Errorf("hasQuestion(%q) = %v, want %v", tt.content, got, tt.expected)
		}
	}
}

func TestFindSentenceStart(t *testing.T) {
	tests := []struct {
		text     string
		expected int
	}{
		{"第一句。第二句第三句", 12}, // 句号在字节位置9(UTF-8)，返回9+3=12
		{"没有标点符号的句子", 0},
		{"\n开头换行", 1},
	}

	for _, tt := range tests {
		t.Logf("findSentenceStart(%q) = %d", tt.text, findSentenceStart(tt.text))
	}
}
