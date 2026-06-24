package decision

import (
	"fmt"
	"strings"
	"time"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/monitor"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
)

func (dm *DecisionMaker) Plan(
	processedMsg *platform.ProcessedMessage,
	context string,
	chatMessages []llm.ChatMessage,
	contextSummary string,
	toolExecutor ToolExecutor,
) (*types.DecisionResult, string, error) {
	accumulatedContext := context

	// 自适应推理深度：根据消息复杂度动态调整最大轮次
	adaptiveMax := dm.calcAdaptiveMaxRounds(processedMsg)
	logger.Sugar.Infow("决策推理开始", "adaptive_max_rounds", adaptiveMax)

	savePreview := func(response string) {
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
		monitor.UpdateStage(sessID, sessName, "planner", "规划器进行决策推理", "", "decision")

		thought, _ := dm.extractThoughtAndJSONBlocks(response)
		previewMeta := map[string]string{
			"model":           "planner",
			"planner_thought": thought,
			"msg_id":          processedMsg.OriginalMessage.ID,
		}

		systemContent := dm.buildDecisionSystem(processedMsg, contextSummary)
		userContent := dm.buildDecisionUser()

		// 含累积工具上下文时，注入到 user prompt（与 makeDecisionWithLLM 保持一致）
		if accumulatedContext != context {
			accumulatedToolCtx := strings.TrimSpace(strings.TrimPrefix(accumulatedContext, context))
			if accumulatedToolCtx != "" {
				userContent = fmt.Sprintf("%s\n\n【前几轮获取的信息】\n%s", userContent, accumulatedToolCtx)
			}
		}

		messages := []llm.ChatMessage{
			{Role: "system", Content: systemContent},
		}
		messages = append(messages, chatMessages...)
		messages = append(messages, llm.ChatMessage{
			Role: "user", Content: userContent,
		})
		promptMsgs := make([]monitor.PromptMessage, len(messages))
		for i, m := range messages {
			promptMsgs[i] = monitor.PromptMessage{Role: m.Role, Content: m.Content}
		}
		monitor.SaveDetailedPreview(sessID, monitor.CategoryPlanner, promptMsgs, response, previewMeta)

		// 持久化处理追踪，记录阶段时间线
		monitor.SaveProcessingTrace(monitor.ProcessingTrace{
			MsgID:      processedMsg.OriginalMessage.ID,
			Category:   "planner",
			Time:       time.Now().Format("2006-01-02 15:04:05"),
			SessID:     sessID,
			StageState: "done",
			Stages: []monitor.StageEntry{
				{Stage: "planner", Detail: "规划器完成决策推理", AgentState: "decision", Timestamp: time.Now().UnixMilli()},
			},
		})
	}

	var lastResponse string
	var trace []string
	var lastToolName string
	var lastToolArgsKey string

	for round := 0; round < adaptiveMax; round++ {
		logger.Sugar.Infow("多轮推理 开始",
			"round", round+1, "adaptive_max", adaptiveMax)

		decision, rawResp, err := dm.makeDecisionWithLLM(processedMsg, chatMessages, contextSummary, accumulatedContext)
		lastResponse = rawResp
		if err != nil {
			logger.Sugar.Errorw("多轮推理 决策失败", "round", round+1, "error", err)
			if lastResponse != "" {
				savePreview(lastResponse)
			}
			return nil, accumulatedContext, err
		}

		decision.ReasoningStep = round + 1
		trace = append(trace, fmt.Sprintf("[第%d轮] actions=%v confidence=%.2f thought=%s",
			round+1, decision.Actions, decision.Confidence, types.Truncate(decision.Thought, 60)))

		logger.Sugar.Infow("多轮推理 决策结果",
			"round", round+1, "actions", decision.Actions,
			"confidence", fmt.Sprintf("%.2f", decision.Confidence),
			"tool_call_needed", decision.ToolCallNeeded, "reply_needed", decision.ReplyNeeded)

		// 暂停类action：wait / finish → 直接跳出
		if decisionsContain(decision.Actions, []string{"wait", "finish"}) {
			logger.Sugar.Infow("多轮推理 规划器选择暂停", "round", round+1, "actions", decision.Actions)
			decision.ReasoningTrace = trace
			savePreview(lastResponse)
			return decision, accumulatedContext, nil
		}

		// 有回复类action → 直接跳出，不需要多轮推理
		if decision.ReplyNeeded {
			// think_level=1 → 系统自动调用工具模型，不经过规划器多轮
			if decision.ToolCallNeeded && toolExecutor != nil {
				logger.Sugar.Infow("多轮推理 深思模式，自动调用工具模型", "round", round+1)
				toolResults, toolErr := dm.autoCallTools(toolExecutor, processedMsg, accumulatedContext)
				if toolErr == nil && len(toolResults) > 0 {
					// 工具结果注入 reply 参考信息（仅 ToolSummaries，不写 accumulatedContext 避免重复）
					decision.ToolSummaries = types.BuildToolResultsSummary(toolResults, decision.Thought)
					logger.Sugar.Debugw("多轮推理 工具结果已注入", "round", round+1)
				}
			}
			// 前几轮执行过 tool_use 但本轮是 reply：从累积上下文中提取工具结果总结
			// 保证回复器能拿到工具查询的总结信息
			if decision.ToolSummaries == "" && accumulatedContext != context {
				toolResultsText := strings.TrimSpace(strings.TrimPrefix(accumulatedContext, context))
				if toolResultsText != "" {
					decision.ToolSummaries = "【工具查询结果】\n" + toolResultsText
					logger.Sugar.Debugw("多轮推理 从累积上下文提取工具结果", "round", round+1)
				}
			}
			logger.Sugar.Infow("多轮推理 直接动作，跳出循环",
				"round", round+1, "actions", decision.Actions)
			decision.ReasoningTrace = trace
			savePreview(lastResponse)
			return decision, accumulatedContext, nil
		}

		if decisionsContain(decision.Actions, []string{"tool_use"}) && toolExecutor != nil {
			savePreview(lastResponse) // 保存本轮规划器决策预览
			toolName, toolArgs := dm.extractToolCallParams(decision.ActionObjects)
			if toolName == "" {
				accumulatedContext += fmt.Sprintf("\n—— 错误：tool_use 未指定 tool_name（第%d轮） ——\n", round+1)
				trace = append(trace, "[工具执行] 错误: 未指定tool_name")
				continue
			}
			toolArgs = ensureToolQueryArg(toolName, toolArgs, processedMsg)

			// 防重复：同一工具+相同参数连续调用，注入警告并跳过执行
			argsKey := fmt.Sprintf("%s:%v", toolName, toolArgs)
			if toolName == lastToolName && argsKey == lastToolArgsKey {
				accumulatedContext += fmt.Sprintf(
					"\n—— 警告：第%d轮重复调用 %s 且参数相同，已跳过。请基于已有结果做最终决策，不要再重复查询。 ——\n",
					round+1, toolName)
				trace = append(trace, fmt.Sprintf("[工具执行] 跳过重复: %s", toolName))
				logger.Sugar.Warnw("多轮推理 跳过重复工具调用",
					"round", round+1, "tool", toolName)
				continue
			}

			results, tErr := toolExecutor.ExecuteToolsWithName(decision, processedMsg, toolName, toolArgs)
			lastToolName = toolName
			lastToolArgsKey = argsKey
			if tErr == nil && len(results) > 0 {
				accumulatedContext = dm.accumulateToolResults(accumulatedContext, results, round+1)
				trace = append(trace, fmt.Sprintf("[工具执行] %s → %s", toolName, types.Truncate(results[0].Result, 40)))
				logger.Sugar.Infow("多轮推理 工具执行完成，继续推理",
					"round", round+1, "tool", toolName)
			} else {
				errMsg := "工具执行失败"
				if tErr != nil {
					errMsg = tErr.Error()
				}
				accumulatedContext += fmt.Sprintf("\n—— 第%d轮 %s 执行结果 ——\n失败: %s\n", round+1, toolName, errMsg)
				trace = append(trace, fmt.Sprintf("[工具执行] %s 失败: %s", toolName, errMsg))
			}
			continue
		}

		// 无回复 → 跳出
		logger.Sugar.Infow("多轮推理 无回复动作，跳出循环", "round", round+1)
		decision.ReasoningTrace = trace
		savePreview(lastResponse)
		return decision, accumulatedContext, nil
	}

	logger.Sugar.Infow("多轮推理 达到最大轮次，进行最终决策",
		"adaptive_max", adaptiveMax)
	decision, rawResp, err := dm.makeDecisionWithLLM(processedMsg, chatMessages, contextSummary, accumulatedContext)
	lastResponse = rawResp
	if lastResponse != "" {
		savePreview(lastResponse)
	}
	if err != nil {
		logger.Sugar.Warnw("[决策] 最终决策失败，降级为默认回复", "error", err)
		return &types.DecisionResult{
			Thought:     fmt.Sprintf("（最终决策失败降级: %v）", err),
			Actions:     []string{"reply"},
			ThinkLevel:  0,
			Confidence:  0.3,
			ReplyNeeded: true,
		}, accumulatedContext, nil
	}

	if !decision.ReplyNeeded {
		logger.Sugar.Warnw("Plan 最终决策无回复，强制降级为回复", "actions", decision.Actions)
		decision.Actions = append(decision.Actions, "reply")
		decision.ReplyNeeded = true
		decision.Thought = decision.Thought + "\n（已达最大推理轮次，强制回复）"
	}

	// 从累积上下文中提取工具结果总结
	if decision.ReplyNeeded && decision.ToolSummaries == "" && accumulatedContext != context {
		toolResultsText := strings.TrimSpace(strings.TrimPrefix(accumulatedContext, context))
		if toolResultsText != "" {
			decision.ToolSummaries = "【工具查询结果】\n" + toolResultsText
			logger.Sugar.Debugw("多轮推理 最终决策，从累积上下文提取工具结果")
		}
	}

	decision.ReasoningStep = adaptiveMax
	decision.ReasoningTrace = trace
	return decision, accumulatedContext, nil
}