package processor

import (
	"math/rand"
	"strings"
	"sync"

	"YaraFlow/internal/config"
	"YaraFlow/internal/platform"
)

type TriggerController struct {
	config *config.Config
	mu     sync.Mutex
}

func NewTriggerController(cfg *config.Config) *TriggerController {
	return &TriggerController{
		config: cfg,
	}
}

type TriggerResult struct {
	ShouldReply bool
	Reason      string
	ForceReply  bool
}

func (tc *TriggerController) CheckTrigger(processedMsg *platform.ProcessedMessage) *TriggerResult {
	tc.mu.Lock()
	defer tc.mu.Unlock()

	result := &TriggerResult{
		ShouldReply: false,
		ForceReply:  false,
	}

	if !tc.config.Trigger.AutoReply {
		result.Reason = "自动回复已禁用"
		return result
	}

	// 系统内部事件（如异步下载失败通知）始终触发回复
	if processedMsg.OriginalMessage.IsSystemEvent {
		result.ShouldReply = true
		result.ForceReply = true
		result.Reason = "系统事件必触发"
		return result
	}

	if processedMsg.IsAtMe && tc.config.Trigger.AtReply {
		result.ShouldReply = true
		result.ForceReply = true
		result.Reason = "@必回复已开启"
		return result
	}

	if tc.config.Trigger.MentionReply && (processedMsg.IsMentioned || tc.containsMention(processedMsg.Content)) {
		result.ShouldReply = true
		result.ForceReply = true
		result.Reason = "提及必回复已开启，检测到昵称或别名"
		return result
	}

	if tc.config.Trigger.RequireMention && !processedMsg.IsAtMe && !processedMsg.IsMentioned {
		result.Reason = "需要@或提及才能触发"
		return result
	}

	if processedMsg.IsAtMe || processedMsg.IsMentioned {
		result.ShouldReply = true
		result.ForceReply = true
		if processedMsg.IsAtMe {
			result.Reason = "被@提及"
		} else {
			result.Reason = "被昵称/别名提及"
		}
		return result
	}

	if tc.shouldReplyByFrequency(processedMsg) {
		result.ShouldReply = true
		result.ForceReply = false
		result.Reason = "基础触发率命中"
		return result
	}

	result.Reason = "未触发回复"
	return result
}

func (tc *TriggerController) containsMention(content string) bool {
	if content == "" {
		return false
	}

	lowerContent := strings.ToLower(content)

	nickname := tc.config.Bot.Nickname
	if nickname != "" && strings.Contains(lowerContent, strings.ToLower(nickname)) {
		return true
	}

	for _, alias := range tc.config.Bot.Aliases {
		if alias != "" && strings.Contains(lowerContent, strings.ToLower(alias)) {
			return true
		}
	}

	return false
}

func (tc *TriggerController) shouldReplyByFrequency(processedMsg *platform.ProcessedMessage) bool {
	baseProb := tc.config.Trigger.BaseFrequency
	content := processedMsg.Content

	// 根据消息内容调整触发概率：有实质性内容的更容易触发
	contentRunes := []rune(content)
	contentLen := len(contentRunes)

	var contentBonus float64
	// 消息较长（>10字）说明有实质内容，增加触发概率
	if contentLen > 10 {
		contentBonus = 0.15
	} else if contentLen > 5 {
		contentBonus = 0.08
	}

	// 包含问号表示可能是提问，增加触发概率
	if strings.Contains(content, "?") || strings.Contains(content, "？") {
		contentBonus += 0.1
	}

	// 根据用户情绪调整触发概率：情绪强烈的消息更值得回应
	var toneBonus float64
	switch processedMsg.UserTone {
	case "愤怒":
		toneBonus = 0.2 // 用户生气了，需要被回应/安抚
	case "伤心":
		toneBonus = 0.2 // 用户难过时更需要陪伴
	case "焦虑":
		toneBonus = 0.12 // 适度增加，给点回应但不过度干预
	case "好奇":
		toneBonus = 0.15 // 用户有问题想问，增加触发
	case "开心":
		toneBonus = 0.1 // 开心时稍微更愿意聊天
	case "冷淡":
		toneBonus = -0.1 // 用户不太想说话，减少骚扰
	default:
		toneBonus = 0
	}

	adjustedProb := baseProb + contentBonus + toneBonus
	if adjustedProb > 0.85 {
		adjustedProb = 0.85
	}
	if adjustedProb < 0.01 {
		adjustedProb = 0.01
	}

	return rand.Float64() < adjustedProb
}

func (tc *TriggerController) ReloadConfig() {
	tc.config = &config.AppConfig
}
