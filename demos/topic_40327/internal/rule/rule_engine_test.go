package rule

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"YaraFlow/internal/platform"

	"go.uber.org/zap"

	"YaraFlow/internal/logger"
)

func init() {
	logger.Logger = zap.NewNop()
}

func TestNewRuleEngine(t *testing.T) {
	engine := NewRuleEngine()
	if engine == nil {
		t.Fatal("NewRuleEngine should not return nil")
	}
	rules := engine.GetRules()
	if len(rules) != 6 {
		t.Fatalf("expected 6 builtin rules, got %d", len(rules))
	}
}

func TestBuiltinRules(t *testing.T) {
	rules := builtinRules()
	if len(rules) != 6 {
		t.Fatalf("expected 6 builtin rules, got %d", len(rules))
	}
	if rules[0].Name != "深夜安静模式" {
		t.Errorf("first rule name = %s, want 深夜安静模式", rules[0].Name)
	}
	if rules[0].Action.SetReplyStyle != "语气平缓温柔，回复简短自然，不催促对方休息" {
		t.Errorf("late night reply style = %s", rules[0].Action.SetReplyStyle)
	}
	if rules[1].Name != "清晨问候模式" {
		t.Errorf("second rule name = %s, want 清晨问候模式", rules[1].Name)
	}
}

func TestAddRule(t *testing.T) {
	engine := NewRuleEngine()
	engine.AddRule(Rule{
		Name:     "test",
		Enabled:  true,
		Priority: 5,
	})
	rules := engine.GetRules()
	if len(rules) != 7 {
		t.Fatalf("expected 7 rules (6 builtin + 1 custom), got %d", len(rules))
	}
}

func TestAddRules(t *testing.T) {
	engine := NewRuleEngine()
	engine.AddRules([]Rule{
		{Name: "a", Enabled: true, Priority: 1},
		{Name: "b", Enabled: true, Priority: 2},
	})
	rules := engine.GetRules()
	if len(rules) != 8 {
		t.Fatalf("expected 8 rules, got %d", len(rules))
	}
}

func TestEvaluateKeywords(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "keyword_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			Keywords: []string{"蛋糕", "甜点"},
		},
		Action: Action{
			SetMood: "开心",
		},
	})

	msg := &platform.Message{Content: "今天吃了个草莓蛋糕"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}
	if actions[0].SetMood != "开心" {
		t.Errorf("SetMood = %s, want 开心", actions[0].SetMood)
	}
}

func TestEvaluateKeywordsNoMatch(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "keyword_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			Keywords: []string{"蛋糕"},
		},
		Action: Action{
			SetMood: "开心",
		},
	})

	msg := &platform.Message{Content: "今天天气真好"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 0 {
		t.Fatalf("expected 0 actions, got %d", len(actions))
	}
}

func TestEvaluateSenderID(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "sender_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			SenderIDs: []string{"user123"},
		},
		Action: Action{
			SetReplyStyle: "特别温柔",
		},
	})

	msg := &platform.Message{Content: "hello", SenderID: "user123"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}
	if actions[0].SetReplyStyle != "特别温柔" {
		t.Errorf("SetReplyStyle = %s, want 特别温柔", actions[0].SetReplyStyle)
	}
}

func TestEvaluateSenderIDNoMatch(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "sender_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			SenderIDs: []string{"user123"},
		},
		Action: Action{SetMood: "开心"},
	})

	msg := &platform.Message{Content: "hello", SenderID: "other_user"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 0 {
		t.Fatalf("expected 0 actions, got %d", len(actions))
	}
}

func TestEvaluateIsAtMe(t *testing.T) {
	atTrue := true
	atFalse := false

	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "at_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			IsAtMe: &atTrue,
		},
		Action: Action{SetMood: "被点名"},
	})

	msg := &platform.Message{Content: "hi", IsAtMe: true}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}
	if actions[0].SetMood != "被点名" {
		t.Errorf("SetMood = %s, want 被点名", actions[0].SetMood)
	}

	msg.IsAtMe = false
	engine.AddRule(Rule{
		Name:     "not_at_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			IsAtMe: &atFalse,
		},
		Action: Action{SetMood: "没被点"},
	})
	actions = engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}
	if actions[0].SetMood != "没被点" {
		t.Errorf("SetMood = %s, want 没被点", actions[0].SetMood)
	}
}

func TestEvaluateHasImage(t *testing.T) {
	hasTrue := true
	hasFalse := false

	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "image_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			HasImage: &hasTrue,
		},
		Action: Action{SetMood: "看到图"},
	})

	msg := &platform.Message{Content: "看图", HasImage: true}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}

	msg.HasImage = false
	engine.AddRule(Rule{
		Name:     "no_image_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			HasImage: &hasFalse,
		},
		Action: Action{SetMood: "纯文字"},
	})
	actions = engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action for no image, got %d", len(actions))
	}
}

func TestEvaluateRegex(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "regex_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			Regex: `\d{3}-\d{4}`,
		},
		Action: Action{SetMood: "电话"},
	})

	msg := &platform.Message{Content: "打我电话 123-4567"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}

	msg.Content = "没有电话"
	actions = engine.Evaluate(msg, nil)
	if len(actions) != 0 {
		t.Fatalf("expected 0 actions, got %d", len(actions))
	}
}

func TestEvaluateWithProcessedMsg(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "keyword_rule",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			Keywords: []string{"processed"},
		},
		Action: Action{SetMood: "processed"},
	})

	msg := &platform.Message{Content: "original"}
	processedMsg := &platform.ProcessedMessage{Content: "processed content here"}
	actions := engine.Evaluate(msg, processedMsg)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action using processed content, got %d", len(actions))
	}
}

func TestEvaluateDisabledRule(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "disabled",
		Enabled:  false,
		Priority: 10,
		Condition: Condition{
			Keywords: []string{"trigger"},
		},
		Action: Action{SetMood: "nope"},
	})

	msg := &platform.Message{Content: "trigger"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 0 {
		t.Fatalf("expected 0 actions for disabled rule, got %d", len(actions))
	}
}

func TestEvaluateMultipleConditionsAllMatch(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "multi",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			Keywords:  []string{"hello"},
			SenderIDs: []string{"user1"},
		},
		Action: Action{SetMood: "multi"},
	})

	msg := &platform.Message{Content: "hello world", SenderID: "user1"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}

	msg.SenderID = "user2"
	actions = engine.Evaluate(msg, nil)
	if len(actions) != 0 {
		t.Fatalf("expected 0 actions (sender mismatch), got %d", len(actions))
	}
}

func TestEvaluateEmptyConditions(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:      "empty_cond",
		Enabled:   true,
		Priority:  10,
		Condition: Condition{},
		Action:    Action{SetMood: "always"},
	})

	msg := &platform.Message{Content: "anything"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action for empty condition, got %d", len(actions))
	}
}

func TestMatchTimeRangeNormal(t *testing.T) {
	engine := NewRuleEngine()

	// 10:00 should be in 09:00-12:00
	now := time.Date(2026, 6, 3, 10, 0, 0, 0, time.UTC)
	if !engine.matchTimeRange("09:00-12:00", now) {
		t.Error("10:00 should be in 09:00-12:00")
	}

	// 08:00 should not be in 09:00-12:00
	now = time.Date(2026, 6, 3, 8, 0, 0, 0, time.UTC)
	if engine.matchTimeRange("09:00-12:00", now) {
		t.Error("08:00 should not be in 09:00-12:00")
	}

	// 13:00 should not be in 09:00-12:00
	now = time.Date(2026, 6, 3, 13, 0, 0, 0, time.UTC)
	if engine.matchTimeRange("09:00-12:00", now) {
		t.Error("13:00 should not be in 09:00-12:00")
	}
}

func TestMatchTimeRangeCrossDay(t *testing.T) {
	engine := NewRuleEngine()

	// 23:30 should be in 23:00-06:00 (cross-day)
	now := time.Date(2026, 6, 3, 23, 30, 0, 0, time.UTC)
	if !engine.matchTimeRange("23:00-06:00", now) {
		t.Error("23:30 should be in 23:00-06:00")
	}

	// 02:00 should be in 23:00-06:00 (cross-day)
	now = time.Date(2026, 6, 3, 2, 0, 0, 0, time.UTC)
	if !engine.matchTimeRange("23:00-06:00", now) {
		t.Error("02:00 should be in 23:00-06:00")
	}

	// 12:00 should not be in 23:00-06:00
	now = time.Date(2026, 6, 3, 12, 0, 0, 0, time.UTC)
	if engine.matchTimeRange("23:00-06:00", now) {
		t.Error("12:00 should not be in 23:00-06:00")
	}
}

func TestMatchTimeRangeBoundary(t *testing.T) {
	engine := NewRuleEngine()

	// 09:00 should be in 09:00-12:00 (boundary inclusive)
	now := time.Date(2026, 6, 3, 9, 0, 0, 0, time.UTC)
	if !engine.matchTimeRange("09:00-12:00", now) {
		t.Error("09:00 should be in 09:00-12:00 (boundary)")
	}

	// 12:00 should be in 09:00-12:00 (boundary inclusive)
	now = time.Date(2026, 6, 3, 12, 0, 0, 0, time.UTC)
	if !engine.matchTimeRange("09:00-12:00", now) {
		t.Error("12:00 should be in 09:00-12:00 (boundary)")
	}
}

func TestMatchTimeRangeInvalid(t *testing.T) {
	engine := NewRuleEngine()
	now := time.Now()

	if engine.matchTimeRange("", now) {
		t.Error("empty time range should not match")
	}
	if engine.matchTimeRange("invalid", now) {
		t.Error("invalid time range should not match")
	}
	if engine.matchTimeRange("abc-def", now) {
		t.Error("non-numeric time range should not match")
	}
}

func TestGetRulesReturnsCopy(t *testing.T) {
	engine := NewRuleEngine()
	rules := engine.GetRules()
	originalLen := len(rules)

	// Modify the returned slice should not affect engine
	_ = append(rules, Rule{Name: "hack"})
	rules2 := engine.GetRules()
	if len(rules2) != originalLen {
		t.Errorf("GetRules should return a copy, engine rules changed from %d to %d", originalLen, len(rules2))
	}
}

func TestSaveAndLoadRulesFromFile(t *testing.T) {
	engine := NewRuleEngine()
	engine.AddRule(Rule{
		Name:     "user_rule",
		Enabled:  true,
		Priority: 5,
		Condition: Condition{
			Keywords: []string{"test"},
		},
		Action: Action{SetMood: "test"},
	})

	tmpDir := t.TempDir()
	rulesFile := filepath.Join(tmpDir, "rules.json")

	// Save
	if err := engine.SaveRulesToFile(rulesFile); err != nil {
		t.Fatalf("SaveRulesToFile failed: %v", err)
	}

	// Verify file exists
	if _, err := os.Stat(rulesFile); os.IsNotExist(err) {
		t.Fatal("rules file was not created")
	}

	// Load into new engine
	engine2 := NewRuleEngine()
	if err := engine2.LoadRulesFromFile(rulesFile); err != nil {
		t.Fatalf("LoadRulesFromFile failed: %v", err)
	}

	// Should have 6 builtin + 1 user rule
	rules := engine2.GetRules()
	if len(rules) != 7 {
		t.Fatalf("expected 7 rules, got %d", len(rules))
	}

	// Verify user rule is present
	found := false
	for _, r := range rules {
		if r.Name == "user_rule" {
			found = true
			break
		}
	}
	if !found {
		t.Error("user rule not found after load")
	}
}

func TestLoadRulesFromFileNonexistent(t *testing.T) {
	engine := NewRuleEngine()
	err := engine.LoadRulesFromFile("/nonexistent/path/rules.json")
	if err == nil {
		t.Error("expected error for nonexistent file")
	}
}

func TestLoadRulesFromFileInvalidJSON(t *testing.T) {
	engine := NewRuleEngine()
	tmpDir := t.TempDir()
	rulesFile := filepath.Join(tmpDir, "rules.json")
	os.WriteFile(rulesFile, []byte("not json"), 0644)

	err := engine.LoadRulesFromFile(rulesFile)
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestEvaluatePriorityOrder(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRules([]Rule{
		{
			Name:     "high",
			Enabled:  true,
			Priority: 100,
			Condition: Condition{
				Keywords: []string{"trigger"},
			},
			Action: Action{SetMood: "high"},
		},
		{
			Name:     "low",
			Enabled:  true,
			Priority: 1,
			Condition: Condition{
				Keywords: []string{"trigger"},
			},
			Action: Action{SetMood: "low"},
		},
	})

	msg := &platform.Message{Content: "trigger"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 2 {
		t.Fatalf("expected 2 actions, got %d", len(actions))
	}

	// Both should trigger, but GetRules returns them sorted by priority
	rules := engine.GetRules()
	if rules[0].Priority < rules[1].Priority {
		t.Error("rules should be sorted by priority descending")
	}
}

func TestEvaluateMultipleActions(t *testing.T) {
	engine := NewRuleEngineForTest()
	engine.AddRule(Rule{
		Name:     "full_action",
		Enabled:  true,
		Priority: 10,
		Condition: Condition{
			Keywords: []string{"规则"},
		},
		Action: Action{
			SetMood:       "开心",
			SetReplyStyle: "卖萌",
			SetPersona:    "萌妹",
			TriggerPlugin: "test.plugin",
			SendReply:     "你好呀",
		},
	})

	msg := &platform.Message{Content: "测试规则"}
	actions := engine.Evaluate(msg, nil)
	if len(actions) != 1 {
		t.Fatalf("expected 1 action, got %d", len(actions))
	}
	a := actions[0]
	if a.SetMood != "开心" {
		t.Errorf("SetMood = %s", a.SetMood)
	}
	if a.SetReplyStyle != "卖萌" {
		t.Errorf("SetReplyStyle = %s", a.SetReplyStyle)
	}
	if a.SetPersona != "萌妹" {
		t.Errorf("SetPersona = %s", a.SetPersona)
	}
	if a.TriggerPlugin != "test.plugin" {
		t.Errorf("TriggerPlugin = %s", a.TriggerPlugin)
	}
	if a.SendReply != "你好呀" {
		t.Errorf("SendReply = %s", a.SendReply)
	}
}
