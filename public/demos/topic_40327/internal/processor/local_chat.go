package processor

import (
	"context"
	"fmt"
	"strings"
	"time"

	"YaraFlow/internal/bus"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/reply"
	"YaraFlow/internal/processor/types"
	"YaraFlow/internal/webui"

	"go.uber.org/zap"
)

// LocalChat 本地聊天：必定回复，绕过 TimingGate/去重/过滤/触发检查
// 支持多轮对话上下文和工具调用
func (bot *ChatBot) LocalChat(ctx context.Context, content string, history []webui.LocalChatHistoryItem) (string, error) {
	msgID := platform.GenerateMessageID()
	timestamp := platform.NowMilliseconds()

	message := platform.Message{
		ID:         msgID,
		SenderID:   "local_user",
		SenderName: "本地用户",
		Platform:   "local",
		GroupID:    "local_chat",
		Content:    content,
		Timestamp:  timestamp,
	}

	processedMsg := &platform.ProcessedMessage{
		OriginalMessage: message,
		Content:         content,
		Timestamp:       timestamp,
		UserTone:        "中性",
	}

	// 构建对话上下文
	chatHistory := buildLocalChatHistory(history, bot.config.Bot.Nickname)
	chatMessages := buildLocalChatMessages(history, bot.config.Bot.Nickname)

	// 把当前用户消息也加入 context
	chatHistory = chatHistory + fmt.Sprintf("\n%s, %s: %s",
		time.Now().Format("15:04:05"), "本地用户", content)
	chatMessages = append(chatMessages, llm.ChatMessage{
		Role:    "user",
		Content: content,
	})

	// 设置决策工具
	bot.setupDecisionTools(&message)

	// 决策阶段
	var decisionResult *types.DecisionResult
	var toolAccumulatedContext string

	complexity := bot.estimateComplexity(processedMsg)
	if complexity >= 2 {
		loopResult, err := bot.decisionMaker.PlanLoop(processedMsg, chatHistory, chatMessages, "", bot.toolExecutor)
		if err != nil {
			logger.Warn("本地聊天多轮推理失败，降级单轮", zap.Error(err))
			var planErr error
			decisionResult, toolAccumulatedContext, planErr = bot.decisionMaker.Plan(processedMsg, chatHistory, chatMessages, "", bot.toolExecutor)
			if planErr != nil {
				logger.Warn("本地聊天单轮决策也失败，使用默认回复", zap.Error(planErr))
			}
		} else {
			decisionResult = loopResult.Decision
			toolAccumulatedContext = loopResult.AccumulatedContext
		}
	} else {
		var planErr error
		decisionResult, toolAccumulatedContext, planErr = bot.decisionMaker.Plan(processedMsg, chatHistory, chatMessages, "", bot.toolExecutor)
		if planErr != nil {
			logger.Warn("本地聊天决策失败，使用默认回复", zap.Error(planErr))
		}
	}

	if decisionResult == nil {
		decisionResult = &types.DecisionResult{
			ReplyNeeded: true,
			Confidence:  0.8,
		}
	}

	// 回复阶段
	replyResult := bot.replyGenerator.GenerateReply(
		processedMsg,
		chatHistory,
		chatMessages,
		decisionResult,
		"",
		bot.emotionalState,
		toolAccumulatedContext,
		len(history) == 0,
	)

	if !replyResult.Success {
		return "", replyResult.Error
	}

	// 质量自评
	replyScore := reply.EvalReplyQuality(replyResult.Content)
	bot.qualityTracker.Record(replyScore)

	// 发布回复事件
	bus.DefaultBus.Publish("reply.generated", replyResult)

	// 如果回复内容为空，给个默认回复
	if strings.TrimSpace(replyResult.Content) == "" {
		replyResult.Content = "嗯嗯，我在听哦～"
	}

	return replyResult.Content, nil
}

// buildLocalChatHistory 构建对话历史文本（用于 reply generator 的 chatHistory 参数）
func buildLocalChatHistory(history []webui.LocalChatHistoryItem, botName string) string {
	if len(history) == 0 {
		return ""
	}

	var parts []string
	for _, item := range history {
		switch item.Role {
		case "user":
			parts = append(parts, fmt.Sprintf("本地用户: %s", item.Content))
		case "assistant":
			name := botName
			if name == "" {
				name = "瞳瞳"
			}
			parts = append(parts, fmt.Sprintf("%s: %s", name, item.Content))
		}
	}
	return strings.Join(parts, "\n")
}

// buildLocalChatMessages 构建结构化消息列表（用于 reply generator 的 chatMessages 参数）
func buildLocalChatMessages(history []webui.LocalChatHistoryItem, _ string) []llm.ChatMessage {
	msgs := make([]llm.ChatMessage, 0, len(history))
	for _, item := range history {
		role := item.Role
		if role == "user" {
			role = "user"
		} else {
			role = "assistant"
		}
		msgs = append(msgs, llm.ChatMessage{
			Role:    role,
			Content: item.Content,
		})
	}
	return msgs
}
