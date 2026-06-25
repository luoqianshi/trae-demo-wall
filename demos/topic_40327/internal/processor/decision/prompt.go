package decision

import (
	"fmt"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
)

// makeDecisionForLoop 多轮模式的决策调用。
// 与 makeDecisionWithLLM 的区别是 user prompt 中会注入多轮推理指令。
func (dm *DecisionMaker) makeDecisionForLoop(
	processedMsg *platform.ProcessedMessage,
	chatMessages []llm.ChatMessage,
	contextSummary string,
	accumulatedToolCtx string,
	roundNum, maxRounds int,
) (*types.DecisionResult, string, error) {
	systemContent := dm.buildDecisionSystem(processedMsg, contextSummary)
	userContent := dm.buildDecisionUserForLoop(roundNum, maxRounds)

	messages := []llm.ChatMessage{
		{Role: "system", Content: systemContent},
	}
	messages = append(messages, chatMessages...)

	// 如果有累积的工具上下文，追加到最后的 user 消息
	if accumulatedToolCtx != "" {
		userContent = fmt.Sprintf("%s\n\n【前几轮获取的信息】\n%s", userContent, accumulatedToolCtx)
	}
	messages = append(messages, llm.ChatMessage{
		Role: "user", Content: userContent,
	})

	chatResp, err := dm.llmProvider.ChatEx(messages)
	if err != nil {
		logger.Sugar.Warnw("[PlanLoop] LLM 调用失败，降级", "round", roundNum, "error", err)
		return dm.buildFallbackDecision(err), "", nil
	}

	response := chatResp.Content
	if chatResp.TokensPerSecond > 0 {
		logger.Sugar.Infow("[PlanLoop] 词元生成速度",
			"round", roundNum,
			"tokens_per_second", fmt.Sprintf("%.1f token/s", chatResp.TokensPerSecond),
			"completion_tokens", chatResp.CompletionTokens,
			"latency_ms", chatResp.LatencyMs)
	}

	parsed, err := dm.parseDecisionResponse(response, processedMsg)
	return parsed, response, err
}

// buildDecisionUserForLoop 构建多轮推理的用户提示词
func (dm *DecisionMaker) buildDecisionUserForLoop(roundNum, maxRounds int) string {
	builtinActionNames := map[string]bool{
		"reply": true, "no_action": true, "send_emoji": true, "tool_use": true,
	}
	var extraActions []config.ActionDefData
	for _, a := range dm.getActionDefinitions() {
		if !builtinActionNames[a.Name] {
			extraActions = append(extraActions, a)
		}
	}

	var pluginActions string
	if len(extraActions) > 0 {
		pluginActions = config.FormatActionsForPrompt(extraActions)
	}

	builtinActions := config.FormatActionsForPrompt(config.RegisterBuiltinActions())

	// 注入直接可见工具（初始只有 tool_search）+ 延迟工具名称提示
	visibleToolsStr := config.FormatToolsForPrompt(dm.getToolDefinitions())

	var deferredHint string
	if dm.builtinTools != nil {
		deferredNames := dm.builtinTools.GetDeferredToolNames()
		if len(deferredNames) > 0 {
			allDefs := dm.builtinTools.GetToolDefinitions()
			deferredHint = config.FormatDeferredToolNames(deferredNames, allDefs)
		}
	}

	return config.RenderDecisionUser(config.DecisionUserData{
		BuiltinActions:    builtinActions,
		AvailableActions:  pluginActions,
		AvailableTools:    visibleToolsStr,
		DeferredToolsHint: deferredHint,
		BehaviorRules:     config.AppConfig.BehaviorRules,
		MultiRoundContext: &config.MultiRoundContext{
			RoundNum:  roundNum,
			MaxRounds: maxRounds,
		},
	})
}

func (dm *DecisionMaker) makeDecisionWithLLM(
	processedMsg *platform.ProcessedMessage,
	chatMessages []llm.ChatMessage,
	contextSummary string,
	accumulatedToolCtx string,
) (*types.DecisionResult, string, error) {
	systemContent := dm.buildDecisionSystem(processedMsg, contextSummary)
	userContent := dm.buildDecisionUser()

	messages := []llm.ChatMessage{
		{Role: "system", Content: systemContent},
	}
	messages = append(messages, chatMessages...)

	// 如果有累积的工具上下文，追加到最后的 user 消息
	if accumulatedToolCtx != "" {
		userContent = fmt.Sprintf("%s\n\n【前几轮获取的信息】\n%s", userContent, accumulatedToolCtx)
	}
	messages = append(messages, llm.ChatMessage{
		Role: "user", Content: userContent,
	})

	logger.Sugar.Debugw("[决策模型提示词]", "content", systemContent)

	chatResp, err := dm.llmProvider.ChatEx(messages)
	if err != nil {
		logger.Sugar.Warnw("[决策] LLM 调用失败，降级为默认回复", "error", err)
		return dm.buildFallbackDecision(err), "", nil
	}

	response := chatResp.Content
	if chatResp.TokensPerSecond > 0 {
		logger.Sugar.Infow("[决策] 词元生成速度",
			"tokens_per_second", fmt.Sprintf("%.1f token/s", chatResp.TokensPerSecond),
			"completion_tokens", chatResp.CompletionTokens,
			"latency_ms", chatResp.LatencyMs)
	}

	parsed, err := dm.parseDecisionResponse(response, processedMsg)
	return parsed, response, err
}

func (dm *DecisionMaker) buildDecisionSystem(processedMsg *platform.ProcessedMessage, contextSummary string) string {
	senderName := processedMsg.OriginalMessage.SenderName
	if senderName == "" {
		senderName = processedMsg.OriginalMessage.SenderID
	}

	systemData := config.BuildDecisionSystemBase(
		processedMsg.OriginalMessage.GroupID != "",
		senderName,
	)

	systemContent := config.RenderDecisionSystem(systemData)

	now := time.Now()
	timeContext := fmt.Sprintf("当前日期时间：%s (%s)\n%s",
		now.Format("2006-01-02 15:04:05"),
		chineseWeekday(now.Weekday()),
		timeOfDayContext(now))

	// 对话历史摘要注入 system prompt（长期记忆）
	if contextSummary != "" {
		return fmt.Sprintf("%s\n\n[对话历史摘要]\n%s\n\n%s", timeContext, contextSummary, systemContent)
	}
	return fmt.Sprintf("%s\n\n%s", timeContext, systemContent)
}

func (dm *DecisionMaker) buildDecisionUser() string {
	// 内置 action 和插件 action 统一通过 FormatActionsForPrompt 注入
	builtinActionNames := map[string]bool{
		"reply": true, "no_action": true, "send_emoji": true, "tool_use": true,
	}
	var extraActions []config.ActionDefData
	for _, a := range dm.getActionDefinitions() {
		if !builtinActionNames[a.Name] {
			extraActions = append(extraActions, a)
		}
	}

	var pluginActions string
	if len(extraActions) > 0 {
		pluginActions = config.FormatActionsForPrompt(extraActions)
	}

	builtinActionsStr := config.FormatActionsForPrompt(config.RegisterBuiltinActions())

	// 注入直接可见工具（初始只有 tool_search）+ 延迟工具名称提示
	visibleTools := dm.getToolDefinitions() // 这些是决策器中保存的工具定义，由 setupDecisionTools 传入
	visibleToolsStr := config.FormatToolsForPrompt(visibleTools)

	var deferredHint string
	if dm.builtinTools != nil {
		deferredNames := dm.builtinTools.GetDeferredToolNames()
		if len(deferredNames) > 0 {
			allDefs := dm.builtinTools.GetToolDefinitions()
			deferredHint = config.FormatDeferredToolNames(deferredNames, allDefs)
		}
	}

	return config.RenderDecisionUser(config.DecisionUserData{
		BuiltinActions:    builtinActionsStr,
		AvailableActions:  pluginActions,
		AvailableTools:    visibleToolsStr,
		DeferredToolsHint: deferredHint,
		BehaviorRules:     config.AppConfig.BehaviorRules,
	})
}

func chineseWeekday(d time.Weekday) string {
	switch d {
	case time.Sunday:
		return "星期日"
	case time.Monday:
		return "星期一"
	case time.Tuesday:
		return "星期二"
	case time.Wednesday:
		return "星期三"
	case time.Thursday:
		return "星期四"
	case time.Friday:
		return "星期五"
	case time.Saturday:
		return "星期六"
	default:
		return d.String()
	}
}

func (dm *DecisionMaker) buildFallbackDecision(err error) *types.DecisionResult {
	return &types.DecisionResult{
		Thought:     fmt.Sprintf("（LLM调用失败降级: %v）", err),
		Actions:     []string{"reply"},
		ThinkLevel:  0,
		ReplyNeeded: true,
	}
}