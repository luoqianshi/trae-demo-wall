package processor

import (
	"YaraFlow/internal/logger"
	"YaraFlow/internal/memory"
	"YaraFlow/internal/platform"
)

// MemoryContext 统一记忆上下文，供 Planner 和 Replyer 共用。
// 在决策阶段一次构建，避免 Planner 和 Replyer 各自独立检索导致不一致。
type MemoryContext struct {
	// ProfileContext 人物画像描述，注入 Planner 上下文和 Replyer 上下文中
	ProfileContext string
	// LightMemory 轻量记忆检索结果（top 2-3 条），始终主动检索，不依赖 Planner 决策
	// 格式为自然语言回忆提示，而非工具结果
	LightMemory string
}

// buildMemoryContext 构建统一的记忆上下文。
// 在每次消息处理的决策阶段调用，Proactively 检索人物画像和轻量记忆。
// 无论 Planner 是否调用 query_memory 工具，Replyer 都能获得基础记忆信息。
func (bot *ChatBot) buildMemoryContext(message *platform.Message, processedMsg *platform.ProcessedMessage) *MemoryContext {
	mc := &MemoryContext{}

	// 1. 人物画像：Proactively 检索（复用已有逻辑）
	if bot.profileStore != nil {
		profileCtx := bot.buildProfileContextForDecision(message)
		if profileCtx != "" {
			mc.ProfileContext = profileCtx
		}
	}

	// 2. 轻量记忆检索：始终执行，top 2-3 条
	if bot.memoryManager != nil && bot.config.Memory.Enabled {
		// 情感上下文：当前对话的情绪氛围（匹配 positive/negative/neutral）
		var emotionalCtx string
		if bot.emotionalState != nil {
			emotionalCtx = bot.emotionalState.MoodDirection()
		}
		lightMem := bot.lightMemorySearch(processedMsg.Content, message.GroupID, emotionalCtx)
		if lightMem != "" {
			mc.LightMemory = lightMem
		}
	}

	return mc
}

// lightMemorySearch 执行轻量记忆检索，始终主动执行，不依赖 Planner。
// 检索 top 2-3 条最相关的记忆片段，使用 FormatMemorySummary 统一格式化。
// light_memory_search 关闭时降级为纯关键词匹配，不调用 embedding，适合本地部署。
func (bot *ChatBot) lightMemorySearch(query string, groupID string, emotionalCtx string) string {
	if bot.memoryManager == nil || query == "" {
		return ""
	}

	searchMode := "hybrid"
	if !bot.config.Memory.LightMemorySearch {
		// 关闭时降级为纯关键词匹配：不调用 embedding，省去向量检索开销
		searchMode = "keyword"
	}

	req := memory.MemoryQueryRequest{
		CurrentMessage:   query,
		GroupID:          groupID,
		Limit:            3,
		SearchMode:       searchMode,
		EmotionalContext: emotionalCtx,
		// 只搜索 chat_summary：LLM 压缩的对话摘要，有实际内容。
		// chat_message 是原始聊天消息，与聊天记录重复，无信息增量。
		// person_fact 由 Planner 通过 query_memory 工具按需调用。
		SourceKinds: []memory.SourceKind{memory.SourceChatSummary},
	}

	result, err := bot.memoryManager.Query(req)
	if err != nil {
		logger.Sugar.Infow("[轻量记忆] 检索失败", "error", err, "query", query, "mode", searchMode, "emotional", emotionalCtx)
		return ""
	}

	if result == nil || len(result.Hits) == 0 {
		logger.Sugar.Infow("[轻量记忆] 未找到匹配记忆", "query", query, "mode", searchMode, "emotional", emotionalCtx)
		return ""
	}

	// 使用统一的 FormatMemorySummary 格式化，自动包含时间提示和分类前缀
	memoryText := memory.FormatMemorySummary(result.Hits)
	if memoryText == "" {
		logger.Sugar.Infow("[轻量记忆] 格式化后内容为空", "query", query, "hit_count", len(result.Hits))
		return ""
	}

	// 截断过长记忆，200 字足够 LLM 理解上下文
	runes := []rune(memoryText)
	if len(runes) > 200 {
		memoryText = string(runes[:200]) + "..."
	}

	logger.Sugar.Infow("[轻量记忆] 检索成功", "query", query, "mode", searchMode, "emotional", emotionalCtx, "hit_count", len(result.Hits), "memory_text_len", len([]rune(memoryText)))
	return memoryText
}
