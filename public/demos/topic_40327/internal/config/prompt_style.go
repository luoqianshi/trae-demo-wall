package config

import (
	"YaraFlow/internal/personality"
	"math/rand"
	"strings"
	"sync"
	"time"
)

var (
	rng   = rand.New(rand.NewSource(time.Now().UnixNano()))
	rngMu sync.Mutex
)

// RngFloat 返回 [0.0, 1.0) 的随机浮点数，供外部模块使用。
func RngFloat() float64 {
	rngMu.Lock()
	defer rngMu.Unlock()
	return rng.Float64()
}

func SelectReplyStyle() string {
	p := AppConfig.Personality
	if len(p.ExtraStyles) == 0 {
		return p.DefaultStyle
	}
	rngMu.Lock()
	roll := rng.Float64()
	idx := rng.Intn(len(p.ExtraStyles))
	rngMu.Unlock()
	if roll > p.StyleProb {
		return p.DefaultStyle
	}
	return p.ExtraStyles[idx]
}

func SelectPersonaAngle() string {
	p := AppConfig.Personality
	if len(p.PersonaAngles) == 0 {
		return ""
	}
	rngMu.Lock()
	roll := rng.Float64()
	idx := rng.Intn(len(p.PersonaAngles))
	rngMu.Unlock()
	if roll > p.AngleProb {
		return ""
	}
	return p.PersonaAngles[idx]
}

func SelectReplyStyleMood(state *personality.EmotionalState) string {
	if state == nil {
		return SelectReplyStyle()
	}

	// 优先使用情绪状态的明确风格提示
	moodStyle := state.StyleHint()
	if moodStyle != "" {
		return moodStyle
	}

	// 情绪状态没有明确提示时，根据情绪维度偏向选择风格
	p := AppConfig.Personality
	happiness, energy, excitement, calmness, boredom, curiosity := state.GetDimensions()

	// 无聊时倾向慵懒风格
	if boredom > 0.5 {
		return "语气有点漫不经心，回复简短"
	}
	// 好奇时倾向探索风格
	if curiosity > 0.6 {
		return "对话题很感兴趣，想多聊聊"
	}
	// 高兴+高能量时倾向活泼风格
	if happiness > 0.65 && energy > 0.6 {
		if len(p.ExtraStyles) > 0 {
			// 偏向选择活泼的风格
			for _, s := range p.ExtraStyles {
				if strings.Contains(s, "活泼") || strings.Contains(s, "元气") || strings.Contains(s, "俏皮") {
					return s
				}
			}
		}
		return p.DefaultStyle
	}
	// 低能量时倾向简短风格
	if energy < 0.4 {
		return "语气平淡一点，回复简短"
	}
	// 平静时倾向温和风格
	if calmness > 0.6 && excitement < 0.4 {
		if len(p.ExtraStyles) > 0 {
			for _, s := range p.ExtraStyles {
				if strings.Contains(s, "温和") || strings.Contains(s, "平静") || strings.Contains(s, "自然") {
					return s
				}
			}
		}
	}

	return SelectReplyStyle()
}

func SelectPersonaAngleMood(state *personality.EmotionalState) string {
	if state == nil {
		return SelectPersonaAngle()
	}

	moodAngle := state.AngleHint()
	if moodAngle != "" {
		return moodAngle
	}

	return SelectPersonaAngle()
}

func BuildEmotionalContext(state *personality.EmotionalState) string {
	if state == nil {
		return ""
	}
	return state.EmotionalContextForPrompt()
}

func DetectAndUpdateMood(state *personality.EmotionalState, content string) {
	if state == nil || content == "" {
		return
	}
	trigger := personality.DetectEmotionTrigger(content)
	state.Update(trigger)
}

// ReplyRhythm 回复节奏控制，返回长度提示字符串。
// 回复不是固定长度的——偶尔一句话，偶尔两三句，才像真人。
type ReplyRhythm struct {
	LengthHint string // 长度提示，如"回复简短一点，一两句话就行"
	MaxLen     int    // 建议的最大长度（字符数）
}

// SelectReplyRhythm 根据情绪状态选择回复节奏。
// 基础是随机选择（D 策略），情绪只做偏向调整，不强制。
func SelectReplyRhythm(state *personality.EmotionalState) ReplyRhythm {
	rhythms := []struct {
		name      string
		hint      string
		maxLen    int
		baseProb  float64
		shortBias bool
		longBias  bool
	}{
		{"short", "简短一点，一两句话就行，像在聊天框里随手打的", 80, 0.3, true, false},
		{"medium", "回复正常长度，不用刻意控制字数", 150, 0.4, false, false},
		{"long", "可以多说几句，聊得尽兴一点", 250, 0.3, false, true},
	}

	// 情绪偏向调整（使用 if-else if 链，按优先级排列，避免条件互相覆盖）
	if state != nil {
		happiness, energy, excitement, calmness, boredom, curiosity := state.GetDimensions()

		// 优先级1：无聊/疲惫 → 大幅增加短回复概率
		if boredom > 0.6 || energy < 0.3 {
			rhythms[0].baseProb = 0.6
			rhythms[1].baseProb = 0.3
			rhythms[2].baseProb = 0.1
		} else if curiosity > 0.7 || excitement > 0.7 {
			// 优先级2：好奇/兴奋 → 大幅增加长回复概率
			rhythms[0].baseProb = 0.15
			rhythms[1].baseProb = 0.35
			rhythms[2].baseProb = 0.5
		} else if calmness > 0.7 && happiness > 0.5 {
			// 优先级3：平静且高兴 → 温和中等长度
			rhythms[0].baseProb = 0.2
			rhythms[1].baseProb = 0.55
			rhythms[2].baseProb = 0.25
		} else if energy < 0.4 && boredom <= 0.6 {
			// 优先级4：低能量但不过度 → 偏短
			rhythms[0].baseProb = 0.45
			rhythms[1].baseProb = 0.4
			rhythms[2].baseProb = 0.15
		}
	}

	// 加权随机选择
	rngMu.Lock()
	roll := rng.Float64()
	rngMu.Unlock()
	cumulative := 0.0
	for _, r := range rhythms {
		cumulative += r.baseProb
		if roll < cumulative {
			return ReplyRhythm{LengthHint: r.hint, MaxLen: r.maxLen}
		}
	}
	return ReplyRhythm{LengthHint: rhythms[1].hint, MaxLen: rhythms[1].maxLen}
}
