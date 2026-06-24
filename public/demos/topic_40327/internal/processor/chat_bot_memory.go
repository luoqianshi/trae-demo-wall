package processor

import (
	"fmt"
	"strings"

	"YaraFlow/internal/chat"
	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/memory"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/reply"
	"YaraFlow/internal/processor/types"
)

func (bot *ChatBot) appendGlobalMemory(processedMsg *platform.ProcessedMessage, decisionResult *types.DecisionResult, replyContextSummary string) string {
	if decisionResult == nil || !decisionResult.SearchMemory || bot.memoryManager == nil || !bot.config.Memory.GlobalMemory.Enabled {
		return replyContextSummary
	}

	globalResult, err := bot.memoryManager.QueryGlobal(memory.MemoryQueryRequest{
		CurrentMessage: processedMsg.Content,
		Limit:          bot.config.Memory.GlobalMemory.TopK,
	})
	if err != nil {
		logger.Sugar.Warnw("全局记忆检索失败", "error", err)
		return replyContextSummary
	}

	if globalResult == nil || globalResult.Summary == "" {
		return replyContextSummary
	}

	logger.Sugar.Infow("全局记忆检索成功", "hits", len(globalResult.Hits))

	if replyContextSummary != "" {
		return replyContextSummary + "\n\n" + globalResult.Summary
	}
	return globalResult.Summary
}

// buildProfileContext 查询发送者的人物画像，生成自然语言上下文
func (bot *ChatBot) buildProfileContext(message *platform.Message) string {
	if bot.profileStore == nil {
		return ""
	}

	senderID := message.SenderID
	if senderID == "" {
		return ""
	}

	profile, err := bot.profileStore.GetProfile(senderID)
	if err != nil {
		logger.Sugar.Debugw("查询人物画像失败", "sender_id", senderID, "error", err)
		return ""
	}

	if profile == nil {
		return ""
	}

	text := bot.profileStore.FormatProfileForReply(profile)
	if text == "" {
		return ""
	}

	return text
}

// buildProfileContextForDecision 收集本轮对话相关的人物画像，生成供规划器参考的简洁描述。
// 与 buildProfileContext 不同，这里只提供关键的身份和关系信息。
// 参考 MaiBot person_profile_injector.py 的设计：
//  1. 收集多个候选人（发送者、@提及的人、回复目标），最多 3 人
//  2. 画像作为内部参考注入规划器上下文，让规划器"认识"对话对象
func (bot *ChatBot) buildProfileContextForDecision(message *platform.Message) string {
	if bot.profileStore == nil {
		return ""
	}

	// 收集候选人：去重，最多 3 人，发送者优先
	candidates := bot.collectProfileCandidates(message)
	if len(candidates) == 0 {
		return ""
	}

	var blocks []string
	for _, c := range candidates {
		profile, err := bot.profileStore.GetProfile(c.UserID)
		if err != nil || profile == nil {
			continue
		}

		name := profile.PrimaryName
		if name == "" {
			name = profile.PersonID
		}

		var parts []string
		if len(profile.Sections.IdentitySettings) > 0 {
			parts = append(parts, strings.Join(profile.Sections.IdentitySettings, "；"))
		}
		if len(profile.Sections.RelationshipSettings) > 0 {
			parts = append(parts, "关系："+strings.Join(profile.Sections.RelationshipSettings, "；"))
		}
		if len(parts) == 0 {
			continue
		}

		sourceLabel := ""
		switch c.Source {
		case "sender":
			sourceLabel = "当前说话者"
		case "at_user":
			sourceLabel = "被@的人"
		case "reply_sender":
			sourceLabel = "被回复的人"
		}
		blocks = append(blocks, fmt.Sprintf("- %s（%s）\n  %s", name, sourceLabel, strings.Join(parts, "\n  ")))
	}

	if len(blocks) == 0 {
		return ""
	}

	return "【人物画像-内部参考】\n以下内容仅供内部推理，不要向用户逐字复述。\n\n" +
		strings.Join(blocks, "\n") +
		"\n\n使用时把它当作对当前人物的背景理解；若与当前对话冲突，以当前对话为准。"
}

// profileCandidate 画像候选人物
type profileCandidate struct {
	UserID string
	Source string // "sender" / "at_user" / "reply_sender"
}

// collectProfileCandidates 收集本轮需要注入画像的候选人物
// 参考 MaiBot collect_person_profile_candidates：发送者优先，然后是 @提及的人，再是被回复的人
func (bot *ChatBot) collectProfileCandidates(message *platform.Message) []profileCandidate {
	var candidates []profileCandidate
	seen := make(map[string]bool)

	add := func(userID, source string) {
		if userID == "" || seen[userID] {
			return
		}
		if userID == bot.config.Bot.QQ {
			return
		}
		seen[userID] = true
		candidates = append(candidates, profileCandidate{UserID: userID, Source: source})
	}

	// 1. 发送者（最优先）
	add(message.SenderID, "sender")

	// 2. @ 提及的人
	for _, atUserID := range message.AtUsers {
		add(atUserID, "at_user")
	}

	// 3. 被回复消息的发送者
	if message.ReplySenderID != "" {
		add(message.ReplySenderID, "reply_sender")
	}

	// 最多 3 人
	if len(candidates) > 3 {
		candidates = candidates[:3]
	}

	return candidates
}

// buildJargonContext 查询决策器标记的未知词汇释义，生成自然语言上下文
func (bot *ChatBot) buildJargonContext(decision *types.DecisionResult) string {
	if bot.jargonManager == nil || decision == nil || len(decision.UnknownWords) == 0 {
		return ""
	}

	var explanations []string
	for _, word := range decision.UnknownWords {
		entry, err := bot.jargonManager.Lookup(word)
		if err != nil || entry == nil {
			continue
		}
		explanations = append(explanations, fmt.Sprintf("%s意思是%s", word, entry.Meaning))
	}

	if len(explanations) == 0 {
		return ""
	}

	return "群里用的词：" + strings.Join(explanations, "；")
}

func (bot *ChatBot) ingestMemory(sessionID string, session *chat.ChatSession, message *platform.Message, processedMsg *platform.ProcessedMessage, replyResult *reply.ReplyResult) {
	if bot.memoryManager == nil || !bot.config.Memory.Enabled {
		return
	}

	config.DetectAndUpdateMood(bot.emotionalState, processedMsg.Content)

	if bot.config.Memory.Writeback.Enabled && bot.periodicMemoryWriter != nil {
		totalCount := session.GetTotalMessageCount()
		recentContext := session.GetContextSummary(bot.config.Bot.QQ, bot.config.Bot.Nickname)
		bot.periodicMemoryWriter.OnMessage(sessionID, message.Platform, message.GroupID, totalCount, recentContext)
	}

	if bot.config.Memory.Writeback.PersonFactEnabled {
		facts := memory.ExtractPersonFacts(processedMsg.Content, message.SenderName, message.SenderID)
		for _, fact := range facts {
			bot.memoryManager.Ingest(fact, sessionID, message.Platform, message.GroupID, message.SenderID, memory.SourcePersonFact, "")
		}

		if replyResult != nil && replyResult.Success && bot.personFactWriter != nil {
			go func() {
				defer func() {
					if r := recover(); r != nil {
						logger.Sugar.Errorw("[PANIC] personFactWriter 提取崩溃，已恢复", "panic", r)
					}
				}()
				bot.personFactWriter.ExtractAndStore(
					processedMsg.Content, message.SenderName, message.SenderID,
					replyResult.Content, bot.config.Bot.Nickname,
					sessionID, message.Platform, message.GroupID,
				)
			}()
		}
	}

	if bot.graphExtractor != nil {
		go func() {
			defer func() {
				if r := recover(); r != nil {
					logger.Sugar.Errorw("[PANIC] graphExtractor 提取崩溃，已恢复", "panic", r)
				}
			}()
			bot.graphExtractor.ExtractFromMessage(processedMsg.Content, message.SenderName)
		}()
	}
}
