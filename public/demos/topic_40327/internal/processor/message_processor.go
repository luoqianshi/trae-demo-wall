package processor

import (
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/storage"
)

type MessageProcessor struct {
	config         *config.Config
	visionProvider llm.VisionProvider
}

func NewMessageProcessor(cfg *config.Config, vision llm.VisionProvider) *MessageProcessor {
	return &MessageProcessor{
		config:         cfg,
		visionProvider: vision,
	}
}

func (p *MessageProcessor) Process(message platform.Message) (*platform.ProcessedMessage, error) {
	// 兜底清理：去掉 senderName 前缀（如 "月白清风⁧～喵⁧ : "）
	// 防止 lunar_server.go 中的 senderPrefix 剥离因 Unicode 问题未生效
	content := message.Content
	if message.SenderName != "" {
		senderPrefix := message.SenderName + " : "
		content, _ = strings.CutPrefix(content, senderPrefix)
	}

	result := &platform.ProcessedMessage{
		OriginalMessage: message,
		Content:         content,
		Timestamp:       time.Now().UnixMilli(),
		ReplyMessageID:  message.ReplyMessageID,
		ReplySenderID:   message.ReplySenderID,
	}

	if message.SenderID != "" && message.SenderID != "0" && message.SenderName != "" {
		changed, prevName, err := storage.CheckAndUpdateUserName(message.Platform, message.SenderID, message.SenderName)
		if err != nil {
			logger.Sugar.Debugw("检查用户名变更失败", "error", err)
		} else if changed {
			logger.Sugar.Infow("用户名称变更", "sender_id", message.SenderID, "prev_name", prevName, "new_name", message.SenderName)
		}
	}

	p.detectAtMentions(message, result)
	p.detectMedia(message, result)
	p.detectEmoji(message, result)
	p.detectUserTone(message, result)

	return result, nil
}

func (p *MessageProcessor) detectAtMentions(message platform.Message, result *platform.ProcessedMessage) {
	botQQ := p.config.Bot.QQ
	botNickname := p.config.Bot.Nickname
	botAliases := p.config.Bot.Aliases

	if message.IsAtMe {
		result.IsAtMe = true
		return
	}

	if len(message.AtUsers) > 0 {
		for _, userID := range message.AtUsers {
			result.MentionedUsers = append(result.MentionedUsers, userID)
			if userID == botQQ {
				result.IsAtMe = true
				return
			}
		}
	}

	atPattern := regexp.MustCompile(`@(\d+)`)
	matches := atPattern.FindAllStringSubmatch(message.Content, -1)

	for _, match := range matches {
		if len(match) == 2 {
			userId := match[1]
			result.MentionedUsers = append(result.MentionedUsers, userId)
			if userId == botQQ {
				result.IsAtMe = true
				return
			}
		}
	}

	specialMentions := []string{"@我", "@bot", "@机器人", "@Bot", "@BOT", "@Robot", "@ROBOT"}
	for _, mention := range specialMentions {
		if strings.Contains(message.Content, mention) {
			result.IsAtMe = true
			return
		}
	}

	contentLower := strings.ToLower(message.Content)
	botNicknameLower := strings.ToLower(botNickname)

	if strings.Contains(contentLower, botNicknameLower) {
		result.IsMentioned = true
		return
	}

	for _, alias := range botAliases {
		if strings.Contains(contentLower, strings.ToLower(alias)) {
			result.IsMentioned = true
			return
		}
	}

	// 批处理中前面的消息包含触发词时，标记为被提及
	if message.BatchMentioned {
		result.IsMentioned = true
	}
}

func (p *MessageProcessor) isStickerURL(url string) bool {
	stickerPatterns := []string{
		"gxh.vip.qq.com/club/item",
		"sticker",
		"emoji",
	}

	for _, pattern := range stickerPatterns {
		if strings.Contains(strings.ToLower(url), pattern) {
			return true
		}
	}

	emojiExtensions := []string{".gif", ".webp"}
	for _, ext := range emojiExtensions {
		if strings.HasSuffix(strings.ToLower(url), ext) {
			return true
		}
	}

	return false
}

func (p *MessageProcessor) detectMedia(message platform.Message, result *platform.ProcessedMessage) {
	if len(message.Images) > 0 {
		result.HasImage = true
		result.HasSticker = false

		for _, img := range message.Images {
			isSticker := img.IsSticker || img.Type == platform.ImageTypeEmoji || img.Type == platform.ImageTypeSticker

			if !isSticker && !img.IsSticker {
				isSticker = p.isStickerURL(img.URL)
			}

			if isSticker {
				result.HasSticker = true
				if img.Type == platform.ImageTypeNormal {
					img.Type = platform.ImageTypeSticker
				}
			}
			result.Images = append(result.Images, img.URL)
		}
	}

	if message.HasVoice {
		result.HasVoice = true
		result.VoiceURL = message.VoiceURL
	}
}

func (p *MessageProcessor) detectEmoji(message platform.Message, result *platform.ProcessedMessage) {
	content := message.Content

	cleanContent := regexp.MustCompile(`\[.*?\]`).ReplaceAllString(content, "")
	cleanContent = strings.TrimSpace(cleanContent)

	hasNormalImage := false
	hasOnlyEmojiImages := true

	for _, img := range message.Images {
		if img.Type == platform.ImageTypeNormal && !p.isStickerURL(img.URL) {
			hasNormalImage = true
			hasOnlyEmojiImages = false
			break
		}
	}

	if len(message.Images) == 0 {
		result.IsPureEmoji = message.HasEmoji && cleanContent == ""
	} else if hasNormalImage {
		result.IsPureEmoji = false
	} else {
		result.IsPureEmoji = cleanContent == "" && hasOnlyEmojiImages
	}
}

// detectUserTone 基于关键词检测用户消息的情绪/语气，优先匹配负面情绪
func (p *MessageProcessor) detectUserTone(message platform.Message, result *platform.ProcessedMessage) {
	content := message.Content
	if content == "" {
		result.UserTone = "中性"
		return
	}

	// 优先级：负面情绪优先（避免被正面词误判），然后是其他情绪
	checks := []struct {
		tone     string
		keywords []string
	}{
		{"愤怒", []string{"操", "妈的", "傻逼", "脑残", "滚", "cnm", "tmd", "有病", "恶心", "白痴",
			"无语了", "服了", "逆天", "离谱他妈", "真服了", "受不了"}},
		{"伤心", []string{"难过", "想哭", "心痛", "难受", "委屈", "哭", "呜呜", "好想哭",
			"心碎", "emo了", "破防", "崩了", "撑不住了"}},
		{"焦虑", []string{"焦虑", "压力", "内耗", "怎么办", "好烦", "纠结", "崩溃",
			"失眠", "睡不着", "害怕", "担心", "紧张", "心态炸了"}},
		{"开心", []string{"哈哈", "笑", "开心", "快乐", "太好了", "哈哈哈", "嘿嘿", "太棒了",
			"喜", "乐", "爽", "卧槽", "牛", "绝了", "yyds", "666", "强"}},
		{"好奇", []string{"为什么", "怎么", "啥", "什么", "这是啥", "好奇", "问问",
			"谁知道", "有没有", "能不能", "可以吗", "是真的吗"}},
		{"冷淡", []string{"嗯", "哦", "行", "好", "知道了", "随便", "算了", "没", "不了"}},
	}

	for _, check := range checks {
		for _, kw := range check.keywords {
			if strings.Contains(content, kw) {
				result.UserTone = check.tone
				logger.Sugar.Debugw("[语气检测]", "tone", check.tone, "keyword", kw)
				return
			}
		}
	}

	result.UserTone = "中性"
}

func (p *MessageProcessor) AnalyzeImages(images []string) ([]string, error) {
	if len(images) == 0 {
		return nil, nil
	}
	if len(images) == 1 {
		description, err := p.visionProvider.AnalyzeImage(images[0], p.config.VisionRules)
		if err != nil {
			logger.Sugar.Errorw("图片分析失败", "error", err)
			return []string{"[图片分析失败]"}, nil
		}
		return []string{description}, nil
	}

	// 多图并行分析，避免延迟线性叠加
	descriptions := make([]string, len(images))
	var wg sync.WaitGroup
	var mu sync.Mutex
	var firstErr error

	for i, imageURL := range images {
		wg.Add(1)
		go func(idx int, url string) {
			defer wg.Done()
			defer func() {
				if r := recover(); r != nil {
					logger.Sugar.Errorw("[PANIC] 消息图片分析崩溃，已恢复",
						"index", idx+1, "panic", r)
					mu.Lock()
					descriptions[idx] = fmt.Sprintf("[图片 %d 分析崩溃]", idx+1)
					mu.Unlock()
				}
			}()

			logger.Sugar.Infow("分析图片", "index", idx+1, "url", url)

			description, err := p.visionProvider.AnalyzeImage(url, p.config.VisionRules)
			if err != nil {
				logger.Sugar.Errorw("图片分析失败", "index", idx+1, "error", err)
				description = "[图片分析失败]"
			}

			mu.Lock()
			descriptions[idx] = description
			if err != nil && firstErr == nil {
				firstErr = err
			}
			mu.Unlock()
		}(i, imageURL)
	}

	wg.Wait()
	return descriptions, nil
}

func (p *MessageProcessor) BuildContentWithImages(processedMsg *platform.ProcessedMessage, imageDescriptions []string) string {
	if len(imageDescriptions) == 0 {
		return processedMsg.Content
	}

	var builder strings.Builder
	builder.WriteString("图片内容描述：\n")
	for i, desc := range imageDescriptions {
		if i > 0 {
			builder.WriteString("\n---\n")
		}
		builder.WriteString(desc)
	}
	builder.WriteString("\n\n用户消息：")
	builder.WriteString(processedMsg.Content)

	return builder.String()
}
