package personality

import (
	"math"
	"strings"
	"sync"
	"time"
)

type EmotionalState struct {
	Happiness  float64
	Energy     float64
	Calmness   float64
	Excitement float64
	Curiosity  float64
	Boredom    float64

	lastUpdate time.Time
	mu         sync.Mutex
}

func NewEmotionalState() *EmotionalState {
	return &EmotionalState{
		Happiness:  0.6,
		Energy:     0.7,
		Calmness:   0.7,
		Excitement: 0.5,
		Curiosity:  0.5,
		Boredom:    0.2,
		lastUpdate: time.Now(),
	}
}

func (s *EmotionalState) decay() {
	now := time.Now()
	elapsed := now.Sub(s.lastUpdate).Seconds()
	s.lastUpdate = now

	if elapsed <= 0 {
		return
	}

	rate := elapsed / 3600.0
	if rate > 1.0 {
		rate = 1.0
	}

	neutral := []struct {
		val      *float64
		target   float64
		strength float64
	}{
		{&s.Happiness, 0.6, 0.15},
		{&s.Energy, 0.7, 0.2},
		{&s.Calmness, 0.7, 0.1},
		{&s.Excitement, 0.5, 0.25},
		{&s.Curiosity, 0.5, 0.15},
		{&s.Boredom, 0.2, 0.2},
	}

	for _, n := range neutral {
		*n.val += (n.target - *n.val) * rate * n.strength
		*n.val = clamp(*n.val, 0, 1)
	}
}

func (s *EmotionalState) Update(trigger EmotionTrigger) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.decay()

	// 非线性变化：强触发大变化，弱触发小变化
	switch trigger {
	case TriggerPraised:
		s.Happiness = clamp(s.Happiness+0.12, 0, 1)
		s.Excitement = clamp(s.Excitement+0.08, 0, 1)
		s.Boredom = clamp(s.Boredom-0.1, 0, 1)
	case TriggerCriticized:
		s.Happiness = clamp(s.Happiness-0.15, 0, 1)
		s.Calmness = clamp(s.Calmness-0.1, 0, 1)
		s.Excitement = clamp(s.Excitement-0.08, 0, 1)
		s.Boredom = clamp(s.Boredom-0.05, 0, 1)
	case TriggerThanked:
		s.Happiness = clamp(s.Happiness+0.08, 0, 1)
		s.Boredom = clamp(s.Boredom-0.05, 0, 1)
	case TriggerCodeDiscussion:
		s.Excitement = clamp(s.Excitement+0.1, 0, 1)
		s.Energy = clamp(s.Energy+0.05, 0, 1)
		s.Curiosity = clamp(s.Curiosity+0.1, 0, 1)
		s.Boredom = clamp(s.Boredom-0.15, 0, 1)
	case TriggerCasualChat:
		s.Happiness = clamp(s.Happiness+0.03, 0, 1)
		s.Calmness = clamp(s.Calmness+0.02, 0, 1)
		s.Boredom = clamp(s.Boredom-0.03, 0, 1)
	case TriggerLongSilence:
		s.Energy = clamp(s.Energy-0.05, 0, 1)
		s.Calmness = clamp(s.Calmness+0.05, 0, 1)
		s.Boredom = clamp(s.Boredom+0.1, 0, 1)
	case TriggerFrequentChat:
		s.Energy = clamp(s.Energy-0.03, 0, 1)
		s.Excitement = clamp(s.Excitement+0.03, 0, 1)
		s.Boredom = clamp(s.Boredom-0.05, 0, 1)
	case TriggerFunnyMessage:
		s.Happiness = clamp(s.Happiness+0.1, 0, 1)
		s.Excitement = clamp(s.Excitement+0.07, 0, 1)
		s.Boredom = clamp(s.Boredom-0.12, 0, 1)
	case TriggerCurious:
		s.Curiosity = clamp(s.Curiosity+0.15, 0, 1)
		s.Excitement = clamp(s.Excitement+0.05, 0, 1)
		s.Boredom = clamp(s.Boredom-0.1, 0, 1)
	}

	s.lastUpdate = time.Now()
}

func (s *EmotionalState) MoodLabel() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.moodLabel()
}

// GetDimensions 返回当前情绪各维度的值，供外部根据情绪选择风格
func (s *EmotionalState) GetDimensions() (happiness, energy, excitement, calmness, boredom, curiosity float64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.Happiness, s.Energy, s.Excitement, s.Calmness, s.Boredom, s.Curiosity
}

func (s *EmotionalState) moodLabel() string {
	h := s.Happiness
	e := s.Energy
	c := s.Calmness
	cu := s.Curiosity
	b := s.Boredom

	if h > 0.8 && e > 0.7 {
		return "开心兴奋"
	}
	if h > 0.7 {
		return "愉快轻松"
	}
	if cu > 0.75 {
		return "好奇感兴趣"
	}
	if b > 0.7 {
		return "无聊发呆"
	}
	if h < 0.3 {
		return "有点低落"
	}
	if e < 0.3 {
		return "有些疲惫"
	}
	if c < 0.4 {
		return "不太淡定"
	}
	if h > 0.5 && cu > 0.6 {
		return "有点得意"
	}
	return "平静自然"
}

func (s *EmotionalState) StyleHint() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.styleHint()
}

func (s *EmotionalState) styleHint() string {

	h := s.Happiness
	e := s.Energy
	ex := s.Excitement
	c := s.Calmness
	cu := s.Curiosity
	b := s.Boredom

	if b > 0.7 {
		return "有点无聊，说话可能漫不经心"
	}
	if e < 0.25 {
		return "语气略微敷衍慵懒，回复简短"
	}
	if ex > 0.75 && h > 0.7 {
		return "语气活泼元气，可以带感叹号或拟声词"
	}
	if cu > 0.7 {
		return "对正在聊的话题很感兴趣，想多了解"
	}
	if h < 0.3 {
		return "语气冷淡一点，不要太热情"
	}
	if c > 0.8 {
		return "语气温和平静，回复自然不做作"
	}
	if ex > 0.6 {
		return "语气稍微兴奋，带点俏皮感"
	}

	return ""
}

func (s *EmotionalState) AngleHint() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.angleHint()
}

func (s *EmotionalState) angleHint() string {

	if s.Excitement > 0.7 {
		return "是刷B站的冲浪达人，爱用网络梗聊天"
	}
	if s.Calmness > 0.8 && s.Happiness > 0.5 {
		return "是技术宅少女，聊代码时自信满满"
	}

	return ""
}

func (s *EmotionalState) EmotionalContextForPrompt() string {
	s.mu.Lock()
	defer s.mu.Unlock()

	label := s.moodLabel()
	return "当前心情：" + label
}

// MoodDirection 返回当前情绪的三值分类：positive / negative / neutral
// 用于记忆检索中的情绪加成匹配
func (s *EmotionalState) MoodDirection() string {
	s.mu.Lock()
	defer s.mu.Unlock()

	h := s.Happiness
	e := s.Energy
	if h > 0.65 && e > 0.4 {
		return "positive"
	}
	if h < 0.35 {
		return "negative"
	}
	return "neutral"
}

// SetMoodLabel 根据规则引擎的心情标签直接设置情绪值
func (s *EmotionalState) SetMoodLabel(mood string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	switch {
	case strings.Contains(mood, "开心"), strings.Contains(mood, "兴奋"), strings.Contains(mood, "活力"):
		s.Happiness = clamp(s.Happiness+0.15, 0, 1)
		s.Energy = clamp(s.Energy+0.15, 0, 1)
		s.Excitement = clamp(s.Excitement+0.2, 0, 1)
	case strings.Contains(mood, "困倦"), strings.Contains(mood, "疲惫"):
		s.Energy = clamp(s.Energy-0.25, 0, 1)
		s.Calmness = clamp(s.Calmness+0.1, 0, 1)
		s.Excitement = clamp(s.Excitement-0.15, 0, 1)
	case strings.Contains(mood, "低落"), strings.Contains(mood, "难过"):
		s.Happiness = clamp(s.Happiness-0.2, 0, 1)
		s.Energy = clamp(s.Energy-0.15, 0, 1)
	case strings.Contains(mood, "温柔"), strings.Contains(mood, "平静"):
		s.Calmness = clamp(s.Calmness+0.2, 0, 1)
		s.Excitement = clamp(s.Excitement-0.1, 0, 1)
	case strings.Contains(mood, "清新"):
		s.Energy = clamp(s.Energy+0.15, 0, 1)
		s.Happiness = clamp(s.Happiness+0.1, 0, 1)
	}
	s.lastUpdate = time.Now()
}

type EmotionTrigger int

const (
	TriggerPraised EmotionTrigger = iota
	TriggerCriticized
	TriggerThanked
	TriggerCodeDiscussion
	TriggerCasualChat
	TriggerLongSilence
	TriggerFrequentChat
	TriggerFunnyMessage
	TriggerCurious
)

func DetectEmotionTrigger(content string) EmotionTrigger {
	content = toLower(content)

	// 负面词优先检测：批评词先于夸奖词，避免"你真厉害，笨蛋"被判为被夸
	criticizeKeywords := []string{"傻", "笨", "滚", "闭嘴", "别说了", "烦", "讨厌", "智障", "废物", "垃圾", "恶心", "菜", "弱"}
	for _, kw := range criticizeKeywords {
		if containsWord(content, kw) {
			return TriggerCriticized
		}
	}

	praiseKeywords := []string{"厉害", "牛", "棒", "聪明", "赞", "偶像", "666", "好强", "太强了", "大佬", "真厉害", "牛逼"}
	for _, kw := range praiseKeywords {
		if containsWord(content, kw) {
			return TriggerPraised
		}
	}

	funnyKeywords := []string{"哈哈", "笑死", "卧槽", "离谱", "草", "哈哈哈哈", "笑死我了", "绝了", "难绷"}
	for _, kw := range funnyKeywords {
		if containsWord(content, kw) {
			return TriggerFunnyMessage
		}
	}

	// 好奇触发：提问和探索性表达
	curiousKeywords := []string{"为什么", "怎么回事", "怎么做到", "好奇", "真的吗", "？", "吗", "呢", "什么意思", "教我", "怎么用"}
	for _, kw := range curiousKeywords {
		if containsWord(content, kw) {
			return TriggerCurious
		}
	}

	codeKeywords := []string{"代码", "编程", "bug", "python", "go", "rust", "js", "接口", "api", "算法", "框架", "数据库", "前端", "后端"}
	for _, kw := range codeKeywords {
		if containsWord(content, kw) {
			return TriggerCodeDiscussion
		}
	}

	thanksKeywords := []string{"谢谢", "感谢", "多谢", "辛苦了", "感恩"}
	for _, kw := range thanksKeywords {
		if containsWord(content, kw) {
			return TriggerThanked
		}
	}

	return TriggerCasualChat
}

func toLower(s string) string {
	result := make([]rune, 0, len([]rune(s)))
	for _, r := range s {
		if r >= 'A' && r <= 'Z' {
			result = append(result, r+32)
		} else {
			result = append(result, r)
		}
	}
	return string(result)
}

func containsWord(text, word string) bool {
	runes := []rune(text)
	wordRunes := []rune(word)
	for i := 0; i <= len(runes)-len(wordRunes); i++ {
		match := true
		for j := 0; j < len(wordRunes); j++ {
			if runes[i+j] != wordRunes[j] {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func clamp(v, lo, hi float64) float64 {
	return math.Max(lo, math.Min(hi, v))
}
