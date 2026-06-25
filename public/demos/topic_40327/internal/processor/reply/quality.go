package reply

import (
	"strings"
	"sync"

	"YaraFlow/internal/logger"
)

// ReplyQualityTracker 追踪回复质量并进行闭环反馈
// 不消耗额外 LLM 调用，基于轻量启发式规则评估回复自然度
// 当质量持续偏低时，向后续回复注入自然度提醒，形成自评-改进闭环
type ReplyQualityTracker struct {
	mu           sync.Mutex
	window       []float64 // 最近 N 次质量评分
	pos          int       // 环形写入位置
	count        int       // 已记录的评分总数
	maxWindow    int       // 环形窗口大小
	lowThreshold float64   // 低质量判定阈值
	lowStreak    int       // 连续低质量次数
	hintActive   bool      // 当前是否已注入提示
}

// NewReplyQualityTracker 创建质量跟踪器
func NewReplyQualityTracker(maxWindow int, lowThreshold float64) *ReplyQualityTracker {
	if maxWindow <= 0 {
		maxWindow = 10
	}
	if lowThreshold <= 0 {
		lowThreshold = 0.6
	}
	return &ReplyQualityTracker{
		window:       make([]float64, maxWindow),
		pos:          0,
		count:        0,
		maxWindow:    maxWindow,
		lowThreshold: lowThreshold,
		lowStreak:    0,
		hintActive:   false,
	}
}

// Record 记录一次回复质量评分
func (t *ReplyQualityTracker) Record(score float64) {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.window[t.pos] = score
	t.pos = (t.pos + 1) % t.maxWindow
	if t.count < t.maxWindow {
		t.count++
	}

	// 统计低质量连续次数
	if t.avg() < t.lowThreshold {
		t.lowStreak++
	} else {
		t.lowStreak = 0
		if t.hintActive {
			t.hintActive = false
			logger.Sugar.Infow("[质量跟踪] 回复质量回升，关闭自然度提醒", "avg", t.avg())
		}
	}

	// 连续低质量达到阈值时激活提示
	if t.lowStreak >= 3 && !t.hintActive {
		t.hintActive = true
		logger.Sugar.Warnw("[质量跟踪] 响应质量持续偏低，注入自然度提醒",
			"avg", t.avg(), "streak", t.lowStreak)
	}
}

// GetHint 获取当前是否应注入自然度提醒
// 返回空字符串表示质量正常，不需要额外干预
func (t *ReplyQualityTracker) GetHint() string {
	t.mu.Lock()
	defer t.mu.Unlock()

	if !t.hintActive {
		return ""
	}

	// 提醒应简短自然，避免像新的规则指令
	return "刚刚几轮回得有点僵硬，放松点"
}

// avg 内部计算滑动窗口平均分（调用方需持有锁）
func (t *ReplyQualityTracker) avg() float64 {
	if t.count == 0 {
		return 1.0
	}
	sum := 0.0
	for i := 0; i < t.count; i++ {
		sum += t.window[i]
	}
	return sum / float64(t.count)
}

// Reset 重置跟踪器状态（例如重要配置更新后）
func (t *ReplyQualityTracker) Reset() {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.pos = 0
	t.count = 0
	t.lowStreak = 0
	t.hintActive = false
	for i := range t.window {
		t.window[i] = 0
	}
	logger.Sugar.Infow("[质量跟踪] 状态已重置")
}

// ---------------------------------------------------------------
// 轻量启发式质量评估（不调用 LLM）
// ---------------------------------------------------------------

// EvalReplyQuality 评估回复的自然度，返回 0.0~1.0 的评分
// 1.0 表示非常自然，越低越像 AI
func EvalReplyQuality(reply string) float64 {
	reply = strings.TrimSpace(reply)
	if reply == "" {
		return 0.3
	}

	score := 1.0
	runeLen := len([]rune(reply))

	// 1. 检测过于正式的 AI 式表述
	formalWords := []string{
		"综上所述", "基于以上分析", "建议您", "请注意以下几点",
		"根据我的分析", "希望这能帮助到您", "如果您有任何问题",
		"请随时告诉我", "我将为您提供", "非常高兴为您服务",
		"我很荣幸能够", "根据您的问题", "经过仔细分析",
		"首先", "其次", "最后", "总而言之",
	}
	for _, w := range formalWords {
		if strings.Contains(reply, w) {
			score -= 0.06
			if score < 0 {
				score = 0
			}
		}
	}

	// 2. 检测过度措辞（道歉/客气过多）
	overlyPolite := []string{
		"不好意思", "抱歉打扰了", "很抱歉", "十分抱歉",
		"请谅解", "敬请谅解", "还望海涵",
	}
	politeCount := 0
	for _, w := range overlyPolite {
		if strings.Contains(reply, w) {
			politeCount++
		}
	}
	if politeCount >= 3 {
		score -= 0.1
	} else if politeCount >= 1 {
		score -= 0.04
	}
	if score < 0 {
		score = 0
	}

	// 3. 长度适宜性
	if runeLen > 250 {
		score -= 0.1 + float64(runeLen-250)*0.002
	} else if runeLen < 2 {
		score -= 0.08
	}
	if score < 0 {
		score = 0
	}

	// 4. 检测同一回复内句式重复（如重复以"你可以"开头）
	lines := strings.Split(reply, "\n")
	startPatterns := make(map[string]int)
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if len([]rune(line)) < 2 {
			continue
		}
		// 取前 4 个字符作为句式指纹
		runes := []rune(line)
		fingerprint := string(runes[:min(len(runes), 4)])
		startPatterns[fingerprint]++
	}
	for _, cnt := range startPatterns {
		if cnt >= 4 {
			score -= 0.12
		} else if cnt >= 3 {
			score -= 0.06
		}
		break
	}
	if score < 0 {
		score = 0
	}

	// 确保分数在有效范围
	if score > 1.0 {
		score = 1.0
	}
	if score < 0 {
		score = 0
	}

	return score
}