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

// PlanLoop 多轮推理循环。
// 与 Plan 的区别：Plan 是单次 LLM 调用出决策，PlanLoop 支持 LLM ↔ 工具执行的
// 多轮反馈循环。每轮工具结果会注入下一轮推理上下文，让 LLM 在获得新信息后重新思考。
func (dm *DecisionMaker) PlanLoop(
	processedMsg *platform.ProcessedMessage,
	baseContext string,
	chatMessages []llm.ChatMessage,
	contextSummary string,
	toolExecutor ToolExecutor,
) (*types.LoopResult, error) {

	const (
		loopMaxRounds       = 3
		loopMaxToolCalls    = 6
		maxAccumulatedChars = 4000
	)

	accumulatedCtx := baseContext
	toolCallCount := 0
	var trace []types.RoundRecord
	var toolResultsSummary strings.Builder

	// 工具去重：记录已调用的工具名和参数，避免重复调用相同搜索
	calledTools := make(map[string]int) // "toolName:queryHash" → 调用轮次

	// saveLoopPreview 保存本轮规划器 LLM 响应的预览（前端"详细处理按键"依赖此预览）
	saveLoopPreview := func(response string, round int) {
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
		monitor.UpdateStage(sessID, sessName, "planner", fmt.Sprintf("规划器第%d轮推理", round), "", "decision")

		thought, _ := dm.extractThoughtAndJSONBlocks(response)
		previewMeta := map[string]string{
			"model":           "planner",
			"planner_thought": thought,
			"msg_id":          processedMsg.OriginalMessage.ID,
		}

		systemContent := dm.buildDecisionSystem(processedMsg, contextSummary)
		userContent := dm.buildDecisionUserForLoop(round, loopMaxRounds)

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

		monitor.SaveProcessingTrace(monitor.ProcessingTrace{
			MsgID:      processedMsg.OriginalMessage.ID,
			Category:   "planner",
			Time:       time.Now().Format("2006-01-02 15:04:05"),
			SessID:     sessID,
			StageState: "done",
			Stages: []monitor.StageEntry{
				{Stage: "planner", Detail: fmt.Sprintf("规划器第%d轮推理完成", round), AgentState: "decision", Timestamp: time.Now().UnixMilli()},
			},
		})
	}

	for round := 1; round <= loopMaxRounds; round++ {

		// 上下文截断保护
		if len([]rune(accumulatedCtx)) > maxAccumulatedChars {
			accumulatedCtx = dm.truncateForLoop(baseContext, accumulatedCtx, maxAccumulatedChars)
		}

		decision, rawResp, err := dm.makeDecisionForLoop(processedMsg, chatMessages, contextSummary, accumulatedCtx, round, loopMaxRounds)
		if rawResp != "" {
			saveLoopPreview(rawResp, round)
		}
		if err != nil {
			trace = append(trace, types.RoundRecord{
				Round: round, Phase: "thinking",
				Thought: fmt.Sprintf("LLM调用失败: %v", err),
			})
			return &types.LoopResult{
				Decision: &types.DecisionResult{
					Thought:     fmt.Sprintf("（推理循环LLM失败，降级回复: %v）", err),
					Actions:     []string{"reply"},
					ThinkLevel:  0,
					ReplyNeeded: true,
					Confidence:  0.3,
				},
				AccumulatedContext: accumulatedCtx,
				Signal:             types.SignalReply,
				Trace:              trace,
			}, nil
		}

		trace = append(trace, types.RoundRecord{
			Round:   round,
			Phase:   "thinking",
			Action:  strings.Join(decision.Actions, ","),
			Thought: types.Truncate(decision.Thought, 80),
		})

		logger.Sugar.Infow("PlanLoop推理",
			"round", round,
			"actions", decision.Actions,
			"reply_needed", decision.ReplyNeeded,
			"tool_call_needed", decision.ToolCallNeeded,
		)

		if decisionsContain(decision.Actions, []string{"wait"}) {
			return &types.LoopResult{
				Decision:           decision,
				AccumulatedContext: accumulatedCtx,
				ToolResultsOnly:    toolResultsSummary.String(),
				Signal:             types.SignalWait,
				Trace:              trace,
			}, nil
		}
		if decisionsContain(decision.Actions, []string{"finish"}) {
			return &types.LoopResult{
				Decision:           decision,
				AccumulatedContext: accumulatedCtx,
				Signal:             types.SignalHalt,
				Trace:              trace,
			}, nil
		}

		if decision.ReplyNeeded {
			if decision.ToolCallNeeded && toolExecutor != nil && toolCallCount < loopMaxToolCalls {
				results, tErr := dm.autoCallTools(toolExecutor, processedMsg, accumulatedCtx)
				if tErr == nil && len(results) > 0 {
					summary := types.BuildToolResultsSummary(results, decision.Thought)
					decision.ToolSummaries = summary
					toolResultsSummary.WriteString(summary)
					toolResultsSummary.WriteString("\n")
					accumulatedCtx = dm.accumulateToolResults(accumulatedCtx, results, round)
					toolCallCount++
					trace = append(trace, types.RoundRecord{
						Round: round, Phase: "tool_exec",
						ToolName: "auto", ToolResult: summary,
					})
				}
			}
			return &types.LoopResult{
				Decision:           decision,
				AccumulatedContext: accumulatedCtx,
				ToolResultsOnly:    toolResultsSummary.String(),
				Signal:             types.SignalReply,
				Trace:              trace,
			}, nil
		}

		if decisionsContain(decision.Actions, []string{"tool_use"}) && toolExecutor != nil {
			if toolCallCount >= loopMaxToolCalls {
				// 达上限，继续下一轮让 LLM 基于现有信息决策
				logger.Sugar.Warnw("PlanLoop 工具调用达上限，跳过本轮工具", "round", round, "tool_call_count", toolCallCount)
				continue
			}
			toolName, toolArgs := dm.extractToolCallParams(decision.ActionObjects)
			if toolName == "" {
				accumulatedCtx += fmt.Sprintf("\n—— 错误：tool_use 未指定 tool_name（第%d轮） ——\n", round)
				trace = append(trace, types.RoundRecord{
					Round: round, Phase: "tool_exec",
					ToolName: "", ToolResult: "错误: 未指定tool_name",
				})
				continue
			}

			toolArgs = ensureToolQueryArg(toolName, toolArgs, processedMsg)

			// 工具去重：检查是否已用相同参数调用过
			dedupKey := buildToolDedupKey(toolName, toolArgs)
			if prevRound, dup := calledTools[dedupKey]; dup {
				skipMsg := fmt.Sprintf("[去重] %s 已在第%d轮调用过相同查询，跳过重复调用", toolName, prevRound)
				logger.Sugar.Infow("PlanLoop 工具去重", "tool", toolName, "prev_round", prevRound, "current_round", round)
				accumulatedCtx += fmt.Sprintf("\n—— 第%d轮 %s 跳过（第%d轮已调用相同参数） ——\n", round, toolName, prevRound)
				trace = append(trace, types.RoundRecord{
					Round: round, Phase: "tool_exec",
					ToolName: toolName, ToolResult: skipMsg,
				})
				continue
			}
			calledTools[dedupKey] = round

			results, tErr := toolExecutor.ExecuteToolsWithName(decision, processedMsg, toolName, toolArgs)
			toolCallCount++
			if tErr == nil && len(results) > 0 {
				summary := types.BuildToolResultsSummary(results, "")
				toolResultsSummary.WriteString(summary)
				toolResultsSummary.WriteString("\n")
				accumulatedCtx = dm.accumulateToolResults(accumulatedCtx, results, round)
				trace = append(trace, types.RoundRecord{
					Round: round, Phase: "tool_exec",
					ToolName: toolName, ToolResult: summary,
				})
			} else {
				errMsg := "工具执行失败"
				if tErr != nil {
					errMsg = tErr.Error()
				}
				accumulatedCtx += fmt.Sprintf("\n—— 第%d轮 %s 执行结果 ——\n失败: %s\n", round, toolName, errMsg)
				trace = append(trace, types.RoundRecord{
					Round: round, Phase: "tool_exec",
					ToolName: toolName, ToolResult: "失败: " + errMsg,
				})
			}
			continue
		}

		return &types.LoopResult{
			Decision:           decision,
			AccumulatedContext: accumulatedCtx,
			Signal:             types.SignalHalt,
			Trace:              trace,
		}, nil
	}

	// 达到最大轮次：强制最终决策
	logger.Sugar.Warnw("PlanLoop 达到最大轮次，强制最终决策", "max_rounds", loopMaxRounds)
	finalDecision, finalRawResp, err := dm.makeDecisionWithLLM(processedMsg, chatMessages, contextSummary, accumulatedCtx)
	if finalRawResp != "" {
		saveLoopPreview(finalRawResp, loopMaxRounds)
	}
	if err != nil {
		return &types.LoopResult{
			Decision: &types.DecisionResult{
				Thought:     "（达到最大推理轮次后LLM失败，强制降级回复）",
				Actions:     []string{"reply"},
				ThinkLevel:  0,
				ReplyNeeded: true,
				Confidence:  0.2,
			},
			AccumulatedContext: accumulatedCtx,
			Signal:             types.SignalReply,
			Trace:              trace,
		}, nil
	}

	if !finalDecision.ReplyNeeded {
		logger.Sugar.Warnw("PlanLoop 最终决策无回复，强制降级为回复", "actions", finalDecision.Actions)
		finalDecision.Actions = append(finalDecision.Actions, "reply")
		finalDecision.ReplyNeeded = true
		finalDecision.Thought = finalDecision.Thought + "\n（已达最大推理轮次，强制回复）"
	}

	return &types.LoopResult{
		Decision:           finalDecision,
		AccumulatedContext: accumulatedCtx,
		ToolResultsOnly:    toolResultsSummary.String(),
		Signal:             types.SignalReply,
		Trace:              trace,
	}, nil
}

// buildToolDedupKey 构建工具去重键，基于工具名和查询参数
// 对搜索类工具，提取 query 参数做归一化比较；对其他工具使用全参数摘要
func buildToolDedupKey(toolName string, toolArgs map[string]interface{}) string {
	switch toolName {
	case "web_search", "search_messages", "query_memory":
		if query, ok := toolArgs["query"].(string); ok {
			// 归一化：去空格、转小写，防止"原神 尘世七执政"和"原神尘世七执政"被当成不同查询
			normalized := strings.ToLower(strings.Join(strings.Fields(query), ""))
			return toolName + ":" + normalized
		}
	}
	// 非搜索工具：用参数 JSON 摘要
	return toolName + ":" + fmt.Sprintf("%v", toolArgs)
}