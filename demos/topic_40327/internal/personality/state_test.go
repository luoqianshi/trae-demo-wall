package personality

import (
	"testing"
)

func TestNewEmotionalState(t *testing.T) {
	s := NewEmotionalState()
	if s == nil {
		t.Fatal("NewEmotionalState should not return nil")
	}
	if s.Happiness != 0.6 {
		t.Errorf("Happiness = %f, want 0.6", s.Happiness)
	}
	if s.Energy != 0.7 {
		t.Errorf("Energy = %f, want 0.7", s.Energy)
	}
	if s.Calmness != 0.7 {
		t.Errorf("Calmness = %f, want 0.7", s.Calmness)
	}
	if s.Excitement != 0.5 {
		t.Errorf("Excitement = %f, want 0.5", s.Excitement)
	}
}

func TestEmotionalStateUpdatePraised(t *testing.T) {
	s := NewEmotionalState()
	beforeH := s.Happiness
	beforeE := s.Excitement

	s.Update(TriggerPraised)

	if s.Happiness <= beforeH {
		t.Errorf("Happiness should increase after praise: %f <= %f", s.Happiness, beforeH)
	}
	if s.Excitement <= beforeE {
		t.Errorf("Excitement should increase after praise: %f <= %f", s.Excitement, beforeE)
	}
}

func TestEmotionalStateUpdateCriticized(t *testing.T) {
	s := NewEmotionalState()
	beforeH := s.Happiness

	s.Update(TriggerCriticized)

	if s.Happiness >= beforeH {
		t.Errorf("Happiness should decrease after criticism: %f >= %f", s.Happiness, beforeH)
	}
}

func TestEmotionalStateUpdateThanked(t *testing.T) {
	s := NewEmotionalState()
	beforeH := s.Happiness

	s.Update(TriggerThanked)

	if s.Happiness <= beforeH {
		t.Errorf("Happiness should increase after thanks: %f <= %f", s.Happiness, beforeH)
	}
}

func TestEmotionalStateUpdateCodeDiscussion(t *testing.T) {
	s := NewEmotionalState()
	beforeE := s.Excitement

	s.Update(TriggerCodeDiscussion)

	if s.Excitement <= beforeE {
		t.Errorf("Excitement should increase for code discussion: %f <= %f", s.Excitement, beforeE)
	}
}

func TestEmotionalStateUpdateFunnyMessage(t *testing.T) {
	s := NewEmotionalState()
	beforeH := s.Happiness
	beforeE := s.Excitement

	s.Update(TriggerFunnyMessage)

	if s.Happiness <= beforeH {
		t.Errorf("Happiness should increase for funny message: %f <= %f", s.Happiness, beforeH)
	}
	if s.Excitement <= beforeE {
		t.Errorf("Excitement should increase for funny message: %f <= %f", s.Excitement, beforeE)
	}
}

func TestEmotionalStateMoodLabel(t *testing.T) {
	s := NewEmotionalState()
	label := s.MoodLabel()
	if label == "" {
		t.Error("MoodLabel should not be empty")
	}
	if label != "平静自然" {
		t.Errorf("default MoodLabel should be 平静自然, got %s", label)
	}
}

func TestEmotionalStateMoodLabelExcited(t *testing.T) {
	s := NewEmotionalState()
	s.Happiness = 0.9
	s.Energy = 0.8
	label := s.MoodLabel()
	if label != "开心兴奋" {
		t.Errorf("MoodLabel = %s, want 开心兴奋", label)
	}
}

func TestEmotionalStateMoodLabelLow(t *testing.T) {
	s := NewEmotionalState()
	s.Happiness = 0.1
	label := s.MoodLabel()
	if label != "有点低落" {
		t.Errorf("MoodLabel = %s, want 有点低落", label)
	}
}

func TestEmotionalStateMoodLabelTired(t *testing.T) {
	s := NewEmotionalState()
	s.Energy = 0.2
	label := s.MoodLabel()
	if label != "有些疲惫" {
		t.Errorf("MoodLabel = %s, want 有些疲惫", label)
	}
}

func TestEmotionalStateStyleHint(t *testing.T) {
	s := NewEmotionalState()
	hint := s.StyleHint()
	if hint == "" {
		t.Log("default style hint is acceptable (empty)")
	}
}

func TestEmotionalStateStyleHintExcited(t *testing.T) {
	s := NewEmotionalState()
	s.Excitement = 0.8
	s.Happiness = 0.8
	hint := s.StyleHint()
	if hint != "语气活泼元气，可以带感叹号或拟声词" {
		t.Errorf("StyleHint = %s, want 语气活泼元气，可以带感叹号或拟声词", hint)
	}
}

func TestEmotionalStateStyleHintTired(t *testing.T) {
	s := NewEmotionalState()
	s.Energy = 0.1
	hint := s.StyleHint()
	if hint != "语气略微敷衍慵懒，回复简短" {
		t.Errorf("StyleHint = %s, want 语气略微敷衍慵懒，回复简短", hint)
	}
}

func TestEmotionalStateAngleHint(t *testing.T) {
	s := NewEmotionalState()
	hint := s.AngleHint()
	if hint == "" {
		t.Log("default angle hint is acceptable (empty)")
	}
}

func TestEmotionalStateAngleHintExcited(t *testing.T) {
	s := NewEmotionalState()
	s.Excitement = 0.8
	hint := s.AngleHint()
	if hint != "是刷B站的冲浪达人，爱用网络梗聊天" {
		t.Errorf("AngleHint = %s, want 刷B站冲浪达人", hint)
	}
}

func TestEmotionalStateEmotionalContextForPrompt(t *testing.T) {
	s := NewEmotionalState()
	ctx := s.EmotionalContextForPrompt()
	if ctx == "" {
		t.Error("EmotionalContextForPrompt should not be empty")
	}
}

func TestEmotionalStateClamped(t *testing.T) {
	s := NewEmotionalState()
	for i := 0; i < 100; i++ {
		s.Update(TriggerPraised)
	}
	if s.Happiness > 1.0 || s.Happiness < 0 {
		t.Errorf("Happiness should be clamped [0,1]: %f", s.Happiness)
	}
	if s.Excitement > 1.0 || s.Excitement < 0 {
		t.Errorf("Excitement should be clamped [0,1]: %f", s.Excitement)
	}

	for i := 0; i < 100; i++ {
		s.Update(TriggerCriticized)
	}
	if s.Happiness > 1.0 || s.Happiness < 0 {
		t.Errorf("Happiness should be clamped [0,1] after criticism: %f", s.Happiness)
	}
}

func TestDetectEmotionTriggerPraised(t *testing.T) {
	testCases := []string{"你好厉害啊", "大佬太牛了", "666", "偶像好棒"}
	for _, tc := range testCases {
		trigger := DetectEmotionTrigger(tc)
		if trigger != TriggerPraised {
			t.Errorf("DetectEmotionTrigger(%q) = %d, want TriggerPraised", tc, trigger)
		}
	}
}

func TestDetectEmotionTriggerCriticized(t *testing.T) {
	testCases := []string{"你好傻", "闭嘴别说了", "真烦人", "智障"}
	for _, tc := range testCases {
		trigger := DetectEmotionTrigger(tc)
		if trigger != TriggerCriticized {
			t.Errorf("DetectEmotionTrigger(%q) = %d, want TriggerCriticized", tc, trigger)
		}
	}
}

func TestDetectEmotionTriggerThanked(t *testing.T) {
	testCases := []string{"谢谢你", "非常感谢", "辛苦了", "多谢帮助"}
	for _, tc := range testCases {
		trigger := DetectEmotionTrigger(tc)
		if trigger != TriggerThanked {
			t.Errorf("DetectEmotionTrigger(%q) = %d, want TriggerThanked", tc, trigger)
		}
	}
}

func TestDetectEmotionTriggerCode(t *testing.T) {
	testCases := []string{"这个bug怎么改", "Python代码", "Go接口有问题", "前端框架"}
	for _, tc := range testCases {
		trigger := DetectEmotionTrigger(tc)
		if trigger != TriggerCodeDiscussion {
			t.Errorf("DetectEmotionTrigger(%q) = %d, want TriggerCodeDiscussion", tc, trigger)
		}
	}
}

func TestDetectEmotionTriggerFunny(t *testing.T) {
	testCases := []string{"哈哈笑死我了", "卧槽离谱", "哈哈哈哈绝了", "难绷"}
	for _, tc := range testCases {
		trigger := DetectEmotionTrigger(tc)
		if trigger != TriggerFunnyMessage {
			t.Errorf("DetectEmotionTrigger(%q) = %d, want TriggerFunnyMessage", tc, trigger)
		}
	}
}

func TestDetectEmotionTriggerCasual(t *testing.T) {
	trigger := DetectEmotionTrigger("今天天气真好")
	if trigger != TriggerCasualChat {
		t.Errorf("DetectEmotionTrigger = %d, want TriggerCasualChat", trigger)
	}
}

func TestDetectEmotionTriggerPriority(t *testing.T) {
	trigger := DetectEmotionTrigger("你好厉害谢谢")
	if trigger != TriggerPraised {
		t.Errorf("praise should take priority, got %d", trigger)
	}
}

func TestClamp(t *testing.T) {
	tests := []struct {
		v, lo, hi, expected float64
	}{
		{0.5, 0, 1, 0.5},
		{1.5, 0, 1, 1.0},
		{-0.5, 0, 1, 0.0},
		{0.0, 0, 1, 0.0},
		{1.0, 0, 1, 1.0},
	}
	for _, tc := range tests {
		result := clamp(tc.v, tc.lo, tc.hi)
		if result != tc.expected {
			t.Errorf("clamp(%f, %f, %f) = %f, want %f", tc.v, tc.lo, tc.hi, result, tc.expected)
		}
	}
}

func TestToLower(t *testing.T) {
	tests := []struct {
		input, expected string
	}{
		{"Hello", "hello"},
		{"WORLD", "world"},
		{"你好ABC", "你好abc"},
		{"", ""},
	}
	for _, tc := range tests {
		result := toLower(tc.input)
		if result != tc.expected {
			t.Errorf("toLower(%q) = %q, want %q", tc.input, result, tc.expected)
		}
	}
}

func TestContainsWord(t *testing.T) {
	tests := []struct {
		text, word string
		expected   bool
	}{
		{"hello world", "hello", true},
		{"hello world", "world", true},
		{"hello world", "xyz", false},
		{"", "hello", false},
		{"你好世界", "世界", true},
		{"你好", "你好世界", false},
	}
	for _, tc := range tests {
		result := containsWord(tc.text, tc.word)
		if result != tc.expected {
			t.Errorf("containsWord(%q, %q) = %v, want %v", tc.text, tc.word, result, tc.expected)
		}
	}
}
