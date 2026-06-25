package processor

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"YaraFlow/internal/emoji"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
	"YaraFlow/internal/tongshadow"
)

func (bot *ChatBot) handleMessageImages(message *platform.Message) []string {
	if !message.HasImage || len(message.Images) == 0 {
		return nil
	}

	imageTags := make([]string, len(message.Images))
	logger.Sugar.Infow("开始处理图片/表情包", "count", len(message.Images))

	for i, img := range message.Images {
		isEmoji := img.IsSticker || img.Type == platform.ImageTypeSticker || img.Type == platform.ImageTypeEmoji

		logger.Sugar.Infow("处理图片",
			"index", i+1, "total", len(message.Images),
			"is_sticker", img.IsSticker, "type", img.Type, "is_emoji", isEmoji, "url", img.URL,
		)

		data, err := bot.downloadImage(img.URL)
		if err != nil {
			logger.Sugar.Warnw("下载图片失败", "error", err)
			continue
		}
		logger.Sugar.Debugw("图片已下载", "bytes", len(data))

		if !isEmoji {
			continue
		}

		hash := emoji.CalculateHash(data)

		if bot.config.Emoji.StealEmoji && emoji.DefaultEmojiManager != nil {
			if err := emoji.DefaultEmojiManager.SaveReceivedEmoji(data); err != nil {
				logger.Sugar.Warnw("收入表情包失败", "error", err)
			}
		}

		if tag, ok := emoji.DefaultEmojiManager.QueryEmojiByHash(hash); ok {
			imageTags[i] = tag
			logger.Sugar.Infow("表情包已注册", "tag", tag, "hash", hash[:8])
		} else if emoji.DefaultEmojiManager.EmojiExists(hash) {
			logger.Sugar.Infow("表情包已收入收件箱等待偷取", "hash", hash[:8])
		}
	}

	return imageTags
}

func (bot *ChatBot) downloadImage(url string) ([]byte, error) {
	url = strings.TrimSpace(url)
	if url == "" {
		return nil, fmt.Errorf("图片URL为空")
	}

	resp, err := llm.NewPooledClient(30 * time.Second).Get(url)
	if err != nil {
		return nil, fmt.Errorf("下载图片失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("下载图片失败，HTTP状态码: %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取图片数据失败: %w", err)
	}

	if len(data) == 0 {
		return nil, fmt.Errorf("图片数据为空")
	}

	logger.Sugar.Infow("图片下载成功", "bytes", len(data))

	if platform.IsWebP(data) {
		converted, convErr := platform.ConvertWebPToPNG(data)
		if convErr != nil {
			return nil, fmt.Errorf("webp转PNG失败: %w", convErr)
		}
		logger.Sugar.Infow("webp图片已转换为PNG", "before", len(data), "after", len(converted))
		return converted, nil
	}

	return data, nil
}

func (bot *ChatBot) buildContentWithEmojiTags(processedMsg *platform.ProcessedMessage, imageTags []string) string {
	content := processedMsg.Content

	hasStickerTag := false
	for i, tag := range imageTags {
		if i >= len(processedMsg.OriginalMessage.Images) {
			break
		}
		if tag != "" {
			hasStickerTag = true
			content = replaceNthPlaceholder(content, i, fmt.Sprintf("[表情:%s]", tag))
		} else if processedMsg.OriginalMessage.Images[i].Type == platform.ImageTypeEmoji || processedMsg.OriginalMessage.Images[i].Type == platform.ImageTypeSticker || processedMsg.OriginalMessage.Images[i].IsSticker {
			content = replaceNthPlaceholder(content, i, "[表情]")
		}
	}

	if !hasStickerTag && processedMsg.HasSticker {
		content = replaceFirstPlaceholder(content, "[表情]")
	}

	return content
}

func replaceNthPlaceholder(content string, index int, replacement string) string {
	placeholders := []string{"[图片]", "[表情包]"}
	for _, ph := range placeholders {
		result := replaceNthSpecific(content, index, ph, replacement)
		if result != content {
			return result
		}
	}
	return content
}

func replaceNthSpecific(content string, index int, placeholder string, replacement string) string {
	count := 0
	for i := 0; i < len(content); {
		idx := strings.Index(content[i:], placeholder)
		if idx == -1 {
			break
		}
		actualIdx := i + idx
		if count == index {
			return content[:actualIdx] + replacement + content[actualIdx+len(placeholder):]
		}
		count++
		i = actualIdx + len(placeholder)
	}
	return content
}

func replaceFirstPlaceholder(content string, replacement string) string {
	placeholders := []string{"[图片]", "[表情包]"}
	for _, ph := range placeholders {
		if idx := strings.Index(content, ph); idx != -1 {
			return content[:idx] + replacement + content[idx+len(ph):]
		}
	}
	return content
}

func (bot *ChatBot) replaceImagePlaceholders(content string, visionResults []types.ToolResult) (string, []string) {
	var descriptions []string
	for i, result := range visionResults {
		if !result.Success || result.ToolName != "vision" {
			continue
		}
		label := fmt.Sprintf("[图片%d]", i+1)
		descriptions = append(descriptions, fmt.Sprintf("图片%d: %s", i+1, result.Result))

		idx := strings.Index(content, "[图片]")
		if idx == -1 {
			break
		}
		content = content[:idx] + label + content[idx+len("[图片]"):]
	}
	return content, descriptions
}

// processVoiceMessage 处理语音消息：下载音频并调用ASR转文字
// 返回格式化后的内容，格式为 "[语音：识别的文字]"
// 语音消息不会给对方任何反馈，所以只在处理前模拟自然延时
func (bot *ChatBot) processVoiceMessage(processedMsg *platform.ProcessedMessage) string {
	if bot.voiceService == nil {
		return "[语音]"
	}

	voiceURL := processedMsg.VoiceURL
	if voiceURL == "" {
		voiceURL = processedMsg.OriginalMessage.VoiceURL
	}
	if voiceURL == "" {
		return "[语音]"
	}

	// 模拟真人听语音的延时：语音消息通常需要一点时间听完
	time.Sleep(platform.SplitDelay(1000, 3000))

	audioData, format, err := downloadAudio(voiceURL)
	if err != nil {
		logger.Sugar.Warnw("[语音] 下载音频失败", "error", err)
		return "[语音]"
	}

	result, err := bot.voiceService.SpeechToText(audioData, format)
	if err != nil {
		logger.Sugar.Warnw("[语音] ASR识别失败", "error", err)
		return "[语音]"
	}

	if result.Text == "" {
		return "[语音]"
	}

	return fmt.Sprintf("[语音：%s]", result.Text)
}

// downloadAudio 下载音频文件，返回数据和格式
func downloadAudio(url string) ([]byte, string, error) {
	// 如果是本地文件路径，直接读取
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		data, err := os.ReadFile(url)
		if err != nil {
			return nil, "", fmt.Errorf("读取本地音频文件失败: %w", err)
		}
		format := detectAudioFormat(url)
		return data, format, nil
	}

	resp, err := llm.NewPooledClient(60 * time.Second).Get(url)
	if err != nil {
		return nil, "", fmt.Errorf("下载音频失败: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", fmt.Errorf("读取音频数据失败: %w", err)
	}

	format := "amr" // NapCat 默认语音格式
	contentType := resp.Header.Get("Content-Type")
	if strings.Contains(contentType, "wav") || strings.Contains(contentType, "wave") {
		format = "wav"
	} else if strings.Contains(contentType, "mp3") || strings.Contains(contentType, "mpeg") {
		format = "mp3"
	} else if strings.Contains(contentType, "ogg") {
		format = "ogg"
	}

	return data, format, nil
}

func detectAudioFormat(filePath string) string {
	lower := strings.ToLower(filePath)
	switch {
	case strings.HasSuffix(lower, ".wav") || strings.HasSuffix(lower, ".wave"):
		return "wav"
	case strings.HasSuffix(lower, ".mp3"):
		return "mp3"
	case strings.HasSuffix(lower, ".ogg"):
		return "ogg"
	case strings.HasSuffix(lower, ".amr"):
		return "amr"
	case strings.HasSuffix(lower, ".silk"):
		return "silk"
	default:
		return "amr"
	}
}

func (bot *ChatBot) executeSendEmoji(ao types.ActionObject, message *platform.Message) {
	if emoji.DefaultEmojiManager == nil {
		logger.Sugar.Warn("[内置action] send_emoji 表情包管理器未初始化")
		return
	}
	if platform.DefaultPlatformDriver == nil {
		logger.Sugar.Warn("[内置action] send_emoji 平台驱动器未初始化")
		return
	}

	var targetEmoji *emoji.EmojiInfo
	if ao.Emotion != "" || ao.ContextHint != "" {
		if ao.ContextHint != "" {
			targetEmoji = emoji.DefaultEmojiManager.GetEmojiByEmotionAndContext(
				strings.TrimSpace(ao.Emotion), strings.TrimSpace(ao.ContextHint))
		} else {
			targetEmoji = emoji.DefaultEmojiManager.GetEmojiByEmotion(strings.TrimSpace(ao.Emotion))
		}
	}

	if targetEmoji == nil {
		targetEmoji = emoji.DefaultEmojiManager.GetRandomEmoji()
	}
	if targetEmoji == nil {
		logger.Sugar.Warn("[内置action] send_emoji 表情包库中无可用表情")
		return
	}

	data, err := os.ReadFile(targetEmoji.FullPath)
	if err != nil {
		logger.Sugar.Warnw("[内置action] send_emoji 读取文件失败", "error", err)
		return
	}

	base64Data := base64.StdEncoding.EncodeToString(data)
	if err := platform.DefaultPlatformDriver.SendImageMessage([]string{base64Data}, message.GroupID, 1); err != nil {
		logger.Sugar.Warnw("[内置action] send_emoji 发送失败", "error", err)
		return
	}

	desc := targetEmoji.Description
	if desc == "" {
		desc = "未标记"
	}
	logger.Sugar.Infow("[内置action] send_emoji 发送成功",
		"emotion", ao.Emotion, "context", ao.ContextHint,
		"hash", targetEmoji.Hash[:8], "desc", desc)
}

// runTongShadowRecognition 瞳影自画像识别
// 复用已有的 Vision 分析结果，避免重复 VLM 调用
// 返回识别结果文本，用于注入消息内容
func (bot *ChatBot) runTongShadowRecognition(visionResults []types.ToolResult) string {
	if tongshadow.DefaultManager == nil || !bot.config.TongShadow.Enabled {
		return ""
	}

	for _, result := range visionResults {
		if !result.Success || result.ToolName != "vision" {
			continue
		}

		recogResult := tongshadow.DefaultManager.RecognizeByDescription(result.Result)
		if recogResult == nil {
			continue
		}

		if recogResult.Matched {
			note := fmt.Sprintf(" [瞳影识别：这张图和我自画像相似度%.0f%%，这就是我！]", recogResult.Score*100)
			logger.Sugar.Infow("[瞳影] 识别为瞳瞳自己",
				"score", recogResult.Score,
				"description", recogResult.MatchedDescription,
			)
			return note
		}

		note := fmt.Sprintf(" [瞳影识别：自画像相似度%.0f%%，不是我]", recogResult.Score*100)
		logger.Sugar.Infow("[瞳影] 不匹配",
			"score", recogResult.Score,
		)
		return note
	}
	return ""
}
