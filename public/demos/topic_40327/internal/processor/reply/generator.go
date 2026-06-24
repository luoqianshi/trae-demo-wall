package reply

import (
	"fmt"
	"strings"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/monitor"
	"YaraFlow/internal/personality"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
	"YaraFlow/internal/tongshadow"
)

type ReplyGenerator struct {
	config      *config.Config
	llmProvider llm.LLMProvider
}

func NewReplyGenerator(cfg *config.Config, llm llm.LLMProvider) *ReplyGenerator {
	return &ReplyGenerator{
		config:      cfg,
		llmProvider: llm,
	}
}

type ReplyResult struct {
	Success bool
	Content string
	Error   error
}

func (rg *ReplyGenerator) GenerateReply(
	processedMsg *platform.ProcessedMessage,
	chatHistory string,
	chatMessages []llm.ChatMessage,
	decision *types.DecisionResult,
	contextSummary string,
	emotionalState *personality.EmotionalState,
	toolContext string,
	isFirstChat bool,
) *ReplyResult {
	logger.Info("开始生成回复")

	if rg.llmProvider == nil {
		return &ReplyResult{
			Success: false,
			Content: "",
			Error:   fmt.Errorf("LLM provider 未初始化"),
		}
	}

	senderName := processedMsg.OriginalMessage.SenderName
	if senderName == "" {
		senderName = processedMsg.OriginalMessage.SenderID
	}
	isGroup := processedMsg.OriginalMessage.GroupID != ""

	// 场景描述（原在 system prompt，现移到 user 消息顶部）
	sceneDesc := config.BuildSceneDescription(isGroup, senderName, rg.config.Bot.Nickname)

	// 时间放在 user 消息最前面
	now := time.Now()
	timePrefix := fmt.Sprintf("当前时间：%s (%s)",
		now.Format("2006-01-02 15:04:05"),
		now.Weekday().String())

	// 工具/记忆/知识库的参考信息：合并为备忘录
	// 优先使用 decision.ToolSummaries，只有当它为空时才从 toolContext 提取
	// 避免两者包含相同内容导致提示词中工具结果重复出现两次
	var referenceParts []string
	if decision != nil && decision.ToolSummaries != "" {
		referenceParts = append(referenceParts, decision.ToolSummaries)
	} else if toolContext != "" {
		cleanedToolCtx := rg.extractToolResultsOnly(toolContext)
		if cleanedToolCtx != "" {
			referenceParts = append(referenceParts, cleanedToolCtx)
		}
	}
	referenceInfo := strings.Join(referenceParts, "\n\n")

	// 备忘录：contextSummary（记忆摘要/知识库/备忘录），不含工具结果
	// 工具结果单独作为 ToolResults 传给提示词模板，放在聊天记录之后
	var memoLines []string
	if contextSummary != "" {
		memoLines = append(memoLines, contextSummary)
	}
	memoContext := strings.Join(memoLines, "\n")

	// 工具结果单独提取，不从 memoContext 走
	toolResults := referenceInfo

	// 风格和人物视角（根据当前情绪状态选择）
	style := config.SelectReplyStyleMood(emotionalState)
	personaAngle := config.SelectPersonaAngleMood(emotionalState)

	// 回复节奏：随机选择长度模式，情绪做偏向调整
	rhythm := config.SelectReplyRhythm(emotionalState)
	if rhythm.LengthHint != "" {
		if style != "" {
			style = style + "。" + rhythm.LengthHint
		} else {
			style = rhythm.LengthHint
		}
	}

	// 构建 user 消息内容（时间 + 模板渲染的其余部分）
	userContent := rg.buildUserContent(processedMsg, chatHistory, decision, emotionalState, sceneDesc, memoContext, toolResults, isFirstChat, style, personaAngle)
	userContent = timePrefix + "\n" + userContent

	messages := []llm.ChatMessage{
		{
			Role:    "user",
			Content: userContent,
		},
	}

	logger.Sugar.Debugw("[主回复模型用户消息]", "content", userContent)

	// 非流式调用，一次 LLM 请求完成回复生成
	chatResp, err := rg.llmProvider.ChatEx(messages)
	if err != nil {
		logger.Sugar.Errorw("LLM调用失败", "error", err)
		return &ReplyResult{
			Success: false,
			Content: "",
			Error:   err,
		}
	}

	response := chatResp.Content
	if chatResp.TokensPerSecond > 0 {
		logger.Sugar.Infow("[回复器] 词元生成速度",
			"tokens_per_second", fmt.Sprintf("%.1f token/s", chatResp.TokensPerSecond),
			"completion_tokens", chatResp.CompletionTokens,
			"latency_ms", chatResp.LatencyMs)
	}

	reply := rg.trimReply(response)
	logger.Sugar.Infow("LLM回复成功", "reply_length", len(reply))
	logger.Sugar.Debugw("[LLM回复内容]", "content", logger.TruncateContent(reply, 200))

	previewMeta := map[string]string{
		"model":  "replyer",
		"msg_id": processedMsg.OriginalMessage.ID,
	}

	// 保存回复器 Prompt 预览 + 更新阶段状态
	sessID := ""
	if processedMsg.OriginalMessage.GroupID != "" {
		sessID = processedMsg.OriginalMessage.GroupID
	} else {
		sessID = processedMsg.OriginalMessage.SenderID
	}
	sessName := processedMsg.OriginalMessage.SenderName
	if sessID != processedMsg.OriginalMessage.SenderID {
		sessName = sessID
	}
	monitor.UpdateStage(sessID, sessName, "replyer", "回复器生成回复文本", "", "reply")

	promptMsgs := make([]monitor.PromptMessage, len(messages))
	for i, m := range messages {
		promptMsgs[i] = monitor.PromptMessage{Role: m.Role, Content: m.Content}
	}
	monitor.SaveDetailedPreview(sessID, monitor.CategoryReplyer, promptMsgs, response, previewMeta)

	// 持久化处理追踪，记录阶段时间线
	monitor.SaveProcessingTrace(monitor.ProcessingTrace{
		MsgID:      processedMsg.OriginalMessage.ID,
		Category:   "replyer",
		Time:       time.Now().Format("2006-01-02 15:04:05"),
		SessID:     sessID,
		StageState: "done",
		Stages: []monitor.StageEntry{
			{Stage: "replyer", Detail: "回复器完成回复生成", AgentState: "reply", Timestamp: time.Now().UnixMilli()},
		},
	})

	return &ReplyResult{
		Success: true,
		Content: reply,
		Error:   nil,
	}
}

func (rg *ReplyGenerator) buildUserContent(processedMsg *platform.ProcessedMessage, chatHistory string, decision *types.DecisionResult, emotionalState *personality.EmotionalState, sceneDesc string, memoContext string, toolResults string, isFirstChat bool, style string, personaAngle string) string {
	senderName := processedMsg.OriginalMessage.SenderName
	if senderName == "" {
		senderName = processedMsg.OriginalMessage.SenderID
	}

	decisionThought := ""
	// 始终将规划器的 action 选择理由传入【回复信息参考】
	if decision != nil && decision.Thought != "" {
		decisionThought = translateThoughtToInnerMonologue(decision.Thought)
	}
	// 规划器 thought 为空时（如 mini 模型只输出 {"action":"reply"}），
	// 从决策结果中提取可用信息生成回退参考，避免回复器完全无上下文
	if decisionThought == "" && decision != nil {
		decisionThought = buildFallbackDecisionThought(decision, processedMsg)
	}

	// 构建别名提示
	aliasHint := ""
	if len(rg.config.Bot.Aliases) > 0 {
		aliasHint = "，别人也管你叫" + strings.Join(rg.config.Bot.Aliases, "、")
	}

	// 瞳影：自我认知注入（仅在用户询问外貌/形象相关问题时注入）
	identity := config.RenderBaseIdentity()
	if tongshadow.DefaultManager != nil && rg.config.TongShadow.InjectSelfDescription {
		if selfDesc := tongshadow.DefaultManager.GetSelfDescription(); selfDesc != "" {
			if shouldInjectAppearance(processedMsg.Content) {
				identity = identity + "\n" + selfDesc
			}
		}
	}

	// 情绪上下文注入到回复风格中，让 LLM 感知当前心情
	if emotionalState != nil {
		emoCtx := config.BuildEmotionalContext(emotionalState)
		if emoCtx != "" {
			if style != "" {
				style = style + "。" + emoCtx
			} else {
				style = emoCtx
			}
		}
	}

	return config.RenderReplyUser(config.ReplyUserData{
		Nickname:         rg.config.Bot.Nickname,
		Identity:         identity,
		ChatHistory:      chatHistory,
		SenderName:       senderName,
		Content:          processedMsg.Content,
		DecisionThought:  decisionThought,
		SceneDescription: sceneDesc,
		MemoContext:      memoContext,
		ToolResults:      toolResults,
		IsFirstChat:      isFirstChat,
		Style:            style,
		PersonaAngle:     personaAngle,
		AliasHint:        aliasHint,
	})
}

// extractToolResultsOnly 从 PlanLoop 累积上下文中只提取工具执行结果。
// 过滤掉：(1) 失败的工具结果 (2) 基础上下文（聊天记录+人设）
// 只保留成功的工具结果行，避免聊天记录重复和无用信息污染回复器提示词。
func (rg *ReplyGenerator) extractToolResultsOnly(accumulatedCtx string) string {
	if accumulatedCtx == "" {
		return ""
	}

	// 按 "—— 第" 分割，提取工具结果段
	// PlanLoop 累积上下文格式：基础上下文 + "\n—— 第N轮工具执行结果 ——\n结果内容"
	lines := strings.Split(accumulatedCtx, "\n")
	var resultLines []string
	inToolSection := false
	currentToolResult := strings.Builder{}

	for _, line := range lines {
		// 检测工具结果段开始
		if strings.Contains(line, "—— 第") && strings.Contains(line, "轮") && strings.Contains(line, "工具执行结果") {
			// 保存上一个工具段（如果有效）
			if currentToolResult.Len() > 0 {
				resultLines = append(resultLines, currentToolResult.String())
				currentToolResult.Reset()
			}
			inToolSection = true
			currentToolResult.WriteString(line)
			currentToolResult.WriteString("\n")
			continue
		}
		// 跳过非工具段内容（基础上下文）
		if !inToolSection {
			continue
		}
		// 收集工具段内容
		currentToolResult.WriteString(line)
		currentToolResult.WriteString("\n")
	}

	// 保存最后一个工具段
	if currentToolResult.Len() > 0 {
		resultLines = append(resultLines, currentToolResult.String())
	}

	// 过滤掉失败的工具结果
	var validResults []string
	for _, section := range resultLines {
		// 跳过包含失败标记的工具结果（如 "[失败]"、"[失败]:" 等格式）
		// 注意：实际格式是 "- tool_name [失败]: error"，不是 "失败:"，所以用 "[失败]" 匹配
		if strings.Contains(section, "[失败]") || strings.Contains(section, "错误:") {
			continue
		}
		validResults = append(validResults, strings.TrimSpace(section))
	}

	if len(validResults) == 0 {
		return ""
	}

	return "【工具查询结果】\n" + strings.Join(validResults, "\n\n")
}

// buildFallbackDecisionThought 当规划器 thought 为空时，生成回退参考文本。
func buildFallbackDecisionThought(decision *types.DecisionResult, _ *platform.ProcessedMessage) string {
	if len(decision.Actions) == 0 {
		return ""
	}
	return "回复用户消息"
}

func (rg *ReplyGenerator) trimReply(reply string) string {
	reply = strings.TrimSpace(reply)

	// 移除 Unicode 替换字符（U+FFFD），防止 LLM 生成的乱码字符进入上下文
	// 这些字符通常来自工具搜索结果中截断的多字节字符，被 LLM 原样拷贝到回复中
	reply = strings.ReplaceAll(reply, "\ufffd", "")

	maxLen := rg.config.Bot.MaxReplyLen
	if maxLen <= 0 {
		maxLen = 500
	}
	runes := []rune(reply)
	if len(runes) > maxLen {
		reply = string(runes[:maxLen])
		lastPeriod := strings.LastIndex(reply, "。")
		lastComma := strings.LastIndex(reply, "，")
		lastBreak := max(lastPeriod, lastComma)
		if lastBreak > maxLen-20 {
			reply = reply[:lastBreak+1]
		}
		// 截断后再次清理可能产生的替换字符
		reply = strings.ReplaceAll(reply, "\ufffd", "")
	}

	return reply
}

// translateThoughtToInnerMonologue 将决策器的分析性语言转为口语化内心独白
// 避免分析性语言直接泄漏到回复中，让回复更自然
func translateThoughtToInnerMonologue(thought string) string {
	replacements := []struct {
		pattern string
		replace string
	}{
		// 分析性判断 → 口语化感受
		{"用户在询问", "他在问"},
		{"用户在", "他"},
		{"用户想", "他想"},
		{"用户需要", "他需要"},
		{"用户似乎", "他好像"},
		{"用户可能", "他可能"},
		{"用户正在", "他在"},
		{"用户表达", "他在说"},
		// 决策性语言 → 自然反应
		{"应该回复", "回他一下"},
		{"应该专业回复", "这个得认真答"},
		{"应该轻松回复", "随便聊聊"},
		{"应该简短回复", "简单说两句"},
		{"应该幽默回复", "逗一下"},
		{"应该安慰", "安慰安慰"},
		{"应该鼓励", "给他打打气"},
		{"应该解释", "解释一下"},
		{"应该拒绝", "不想理这个"},
		{"应该", "得"},
		// 工具/系统语言 → 口语化
		{"工具执行成功，以下是检索到的信息", "嗯我查到了一些东西"},
		{"工具执行完成，根据结果进行回复", "查了一下"},
		{"检索到的信息", "查到的东西"},
		{"以下是", "有这些"},
		{"需要调用", "得查一下"},
		{"需要搜索", "搜搜看"},
		{"需要查询", "查查看"},
		// 降级信息
		{"（最终决策失败降级:", "（刚才走神了，"},
		{"（LLM调用失败降级:", "（刚才走神了，"},
		{"（JSON解析失败，使用默认回复）", "（没太想清楚）"},
	}

	result := thought
	for _, r := range replacements {
		result = strings.ReplaceAll(result, r.pattern, r.replace)
	}
	return result
}

// shouldInjectAppearance 判断用户消息是否需要注入外貌描述
// 仅在用户明确询问外貌/形象/长相/穿搭时才返回 true
func shouldInjectAppearance(content string) bool {
	content = strings.ToLower(content)
	keywords := []string{
		"外貌", "长相", "长什么", "什么样", "长啥样",
		"打扮", "穿搭", "穿什么", "穿着", "穿衣",
		"头发", "发色", "瞳色", "眼睛", "裙子", "裙裙",
		"洛丽塔", "lo裙", "服装", "配饰", "光环",
		"照片", "自拍", "爆照", "照片片", "图片",
		"形象", "造型", "颜值", "颜值高", "好看吗",
		"你是什么", "你是谁", "你是男是女", "你是妹子",
		"身材", "体型", "高矮", "多高", "多重",
		"你的样子", "你的图片", "你的照片",
		"画的", "插画", "立绘", "图图",
		"这是你吗", "是你吗", "是不是你",
	}
	for _, kw := range keywords {
		if strings.Contains(content, kw) {
			return true
		}
	}
	return false
}