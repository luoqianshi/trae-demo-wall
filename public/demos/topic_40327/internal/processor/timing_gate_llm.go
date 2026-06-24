package processor

import (
	"encoding/json"
	"fmt"
	"strings"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
)

// ── LLM 评估 ──

func (tg *TimingGate) evaluateWithLLM(processedMsg *platform.ProcessedMessage, context string) (*TimingGateResult, error) {
	const maxAttempts = 3
	var lastResponse string
	var lastErr error

	for attempt := 0; attempt < maxAttempts; attempt++ {
		prompt := tg.buildTimingGatePrompt(processedMsg, context)
		if attempt > 0 {
			prompt += fmt.Sprintf("\n\n【重试提示】上次返回的 JSON 格式不正确（%v），请确保只返回纯 JSON，不要包含任何额外文字、markdown 代码块标记或解释。", lastErr)
		}

		messages := []llm.ChatMessage{
			{Role: "system", Content: tg.buildTimingGateSystemPrompt()},
			{Role: "user", Content: prompt},
		}

		if attempt == 0 {
			logger.Sugar.Debugw("[Timing Gate 提示词]", "prompt", messages[0].Content)
		} else {
			logger.Sugar.Infow("Timing Gate 重试", "attempt", attempt+1, "maxAttempts", maxAttempts)
		}

		response, err := tg.llmProvider.Chat(messages)
		if err != nil {
			lastErr = err
			lastResponse = response
			continue
		}

		result, parseErr := tg.parseTimingGateResponse(response, processedMsg)
		if parseErr == nil {
			return result, nil
		}

		lastErr = parseErr
		lastResponse = response
	}

	logger.Sugar.Warnw("Timing Gate LLM 调用多次失败，回退到规则判断",
		"attempts", maxAttempts,
		"lastError", lastErr,
		"lastResponse", lastResponse[:min(len(lastResponse), 200)])
	return tg.fallbackEvaluate(processedMsg)
}

// ── Prompt 构建 ──

func (tg *TimingGate) buildTimingGateSystemPrompt() string {
	return `你是 Timing Gate，一个轻量级的消息门控，负责快速判断是否应该回应这条消息。

你的任务是分析用户发送的消息，输出一个 JSON 决定：

{
  "should_respond": true 或 false,
  "strategy": "respond_now" 或 "skip" 或 "observe",
  "reason": "简短的原因说明（15字以内）",
  "intent": "消息意图类型",
  "need_tools": true 或 false,
  "need_memory": true 或 false,
  "need_knowledge": true 或 false,
  "urgency": 0.0 到 1.0 之间的数值
}

策略说明：
- "respond_now": 消息明确需要回复，应该立即回应
- "skip": 消息不需要回复（纯水群、自言自语、别人聊天不关你事）
- "observe": 不太确定，可以先观望等待更多上下文再决定

紧急度（urgency）说明：
- 0.9-1.0: 非常紧急（提问、求助、明确叫你）
- 0.6-0.8: 有回复价值（闲聊、分享日常）
- 0.3-0.5: 可回可不回（普通陈述、互动边缘）
- 0.0-0.2: 不需要回复（刷屏、无关内容）

意图类型（intent）可选值：
- "question": 用户在提问、求助、询问
- "casual_chat": 闲聊、分享日常、表达情绪
- "command": 明确的指令或命令
- "greeting": 打招呼、问候
- "emoji_reaction": 发表情包表达情绪
- "statement": 陈述事实或观点（不一定需要回复）
- "other": 其他

判断规则：
1. 提问、求助、明确叫到你 → should_respond=true, strategy=respond_now, urgency>=0.9
2. 闲聊、日常分享 → should_respond=true, strategy=respond_now, urgency=0.6-0.8
3. 需要查资料、搜索、调用工具的问题 → need_tools=true
4. 提到"之前说过""上次聊过"之类 → need_memory=true
5. 问到具体知识、事实、百科、备忘录相关 → need_knowledge=true
6. 纯水群、无意义刷屏、自言自语 → should_respond=false, strategy=skip
7. 陈述事实但不像是需要回应的 → strategy=observe, urgency=0.3-0.5
8. 别人在和其他人聊天，不关你事 → should_respond=false, strategy=skip
9. 消息很短、含义模糊、不确定意图 → strategy=observe, urgency=0.3-0.4

只返回 JSON，不要包含其他内容。`
}

func (tg *TimingGate) buildTimingGatePrompt(processedMsg *platform.ProcessedMessage, context string) string {
	senderName := processedMsg.OriginalMessage.SenderName
	if senderName == "" {
		senderName = processedMsg.OriginalMessage.SenderID
	}

	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("发送者: %s\n", senderName))
	builder.WriteString(fmt.Sprintf("消息内容: %s\n", processedMsg.Content))

	if processedMsg.HasImage {
		if processedMsg.HasSticker {
			builder.WriteString("包含: 表情包\n")
		} else {
			builder.WriteString("包含: 图片\n")
		}
	}

	if context != "" {
		shortCtx := context
		if len(shortCtx) > 800 {
			shortCtx = shortCtx[len(shortCtx)-800:]
			if idx := findSentenceStart(shortCtx); idx > 0 {
				shortCtx = shortCtx[idx:]
			}
		}
		builder.WriteString(fmt.Sprintf("\n最近聊天上下文:\n%s\n", shortCtx))
	}

	builder.WriteString(fmt.Sprintf("\n%s 应该回应这条消息吗？请输出 JSON。", tg.config.Bot.Nickname))

	return builder.String()
}

// ── 响应解析 ──

func (tg *TimingGate) parseTimingGateResponse(response string, processedMsg *platform.ProcessedMessage) (*TimingGateResult, error) {
	response = strings.TrimSpace(response)

	jsonBlock := response
	start := strings.Index(response, "```json")
	if start != -1 {
		end := strings.Index(response[start+7:], "```")
		if end != -1 {
			jsonBlock = strings.TrimSpace(response[start+7 : start+7+end])
		}
	} else {
		start := strings.Index(response, "{")
		end := strings.LastIndex(response, "}")
		if start != -1 && end > start {
			jsonBlock = response[start : end+1]
		}
	}

	var raw struct {
		ShouldRespond bool    `json:"should_respond"`
		Strategy      string  `json:"strategy"`
		Reason        string  `json:"reason"`
		Intent        string  `json:"intent"`
		NeedTools     bool    `json:"need_tools"`
		NeedMemory    bool    `json:"need_memory"`
		NeedKnowledge bool    `json:"need_knowledge"`
		Urgency       float64 `json:"urgency"`
	}

	if err := json.Unmarshal([]byte(jsonBlock), &raw); err != nil {
		logger.Sugar.Warnw("Timing Gate JSON 解析失败", "error", err, "raw_response", response[:min(len(response), 200)])
		return tg.fallbackEvaluate(processedMsg)
	}

	strategy := GateRespondNow
	switch raw.Strategy {
	case "skip":
		strategy = GateSkip
	case "observe":
		strategy = GateObserve
	case "respond_now", "":
		strategy = GateRespondNow
	}

	if raw.ShouldRespond && strategy == GateSkip {
		raw.ShouldRespond = false
	}
	if !raw.ShouldRespond && strategy == GateRespondNow {
		raw.ShouldRespond = true
	}

	if raw.Urgency < 0 {
		raw.Urgency = 0
	}
	if raw.Urgency > 1 {
		raw.Urgency = 1
	}

	if strategy == GateObserve && raw.Urgency == 0 {
		raw.Urgency = 0.35
	}

	result := &TimingGateResult{
		ShouldRespond: raw.ShouldRespond,
		Strategy:      strategy,
		Reason:        raw.Reason,
		Intent:        raw.Intent,
		NeedTools:     raw.NeedTools,
		NeedMemory:    raw.NeedMemory,
		NeedKnowledge: raw.NeedKnowledge,
		Urgency:       raw.Urgency,
	}

	if strategy == GateObserve {
		result.ObserveCount = 2
	}

	logger.Sugar.Infow("Timing Gate 结果",
		"respond", result.ShouldRespond,
		"strategy", result.Strategy,
		"reason", result.Reason,
		"intent", result.Intent,
		"tools", result.NeedTools,
		"memory", result.NeedMemory,
		"knowledge", result.NeedKnowledge,
		"urgency", fmt.Sprintf("%.2f", result.Urgency),
	)

	return result, nil
}

// ── 规则回退 ──

func (tg *TimingGate) fallbackEvaluate(processedMsg *platform.ProcessedMessage) (*TimingGateResult, error) {
	if processedMsg.IsAtMe || processedMsg.IsMentioned {
		return &TimingGateResult{
			ShouldRespond: true,
			Strategy:      GateRespondNow,
			Reason:        "被@或提及",
			Intent:        "mentioned",
			Urgency:       0.95,
			NeedKnowledge: tg.detectKnowledgeNeed(processedMsg.Content),
		}, nil
	}

	if hasQuestion(processedMsg.Content) {
		return &TimingGateResult{
			ShouldRespond: true,
			Strategy:      GateRespondNow,
			Reason:        "检测到提问",
			Intent:        "question",
			NeedTools:     tg.detectToolNeed(processedMsg),
			NeedKnowledge: tg.detectKnowledgeNeed(processedMsg.Content),
			Urgency:       0.9,
		}, nil
	}

	if processedMsg.HasImage && !processedMsg.HasSticker {
		return &TimingGateResult{
			ShouldRespond: true,
			Strategy:      GateRespondNow,
			Reason:        "包含图片",
			Intent:        "question",
			NeedTools:     true,
			Urgency:       0.75,
		}, nil
	}

	if processedMsg.HasSticker {
		return &TimingGateResult{
			ShouldRespond: true,
			Strategy:      GateRespondNow,
			Reason:        "表情包互动",
			Intent:        "emoji_reaction",
			Urgency:       0.5,
		}, nil
	}

	contentLen := len([]rune(processedMsg.Content))
	if contentLen >= 8 {
		return &TimingGateResult{
			ShouldRespond: false,
			Strategy:      GateObserve,
			Reason:        "有内容但不确定意图，观望一下",
			Intent:        "statement",
			Urgency:       0.35,
			ObserveCount:  2,
		}, nil
	}

	return &TimingGateResult{
		ShouldRespond: false,
		Strategy:      GateSkip,
		Reason:        "未匹配触发条件",
		Intent:        "statement",
	}, nil
}

// ── 检测函数 ──

func (tg *TimingGate) detectToolNeed(processedMsg *platform.ProcessedMessage) bool {
	if processedMsg.HasImage && !processedMsg.HasSticker {
		return true
	}
	toolKeywords := []string{"天气", "搜索", "查一下", "帮我查", "帮我搜", "百度", "新闻", "翻译"}
	for _, kw := range toolKeywords {
		if strings.Contains(processedMsg.Content, kw) {
			return true
		}
	}
	return false
}

func (tg *TimingGate) detectKnowledgeNeed(content string) bool {
	knowledgePatterns := []string{
		"是什么", "什么是", "是谁", "谁是",
		"怎么", "如何", "怎样",
		"为什么", "为啥",
		"哪里", "在哪", "什么时候",
		"多少", "哪些", "哪个",
		"教程", "方法", "步骤", "怎么做",
		"定义", "解释", "介绍一下",
		"知道", "了解", "听说过",
		"百科", "维基", "wiki",
	}
	for _, kw := range knowledgePatterns {
		if strings.Contains(content, kw) {
			return true
		}
	}
	if (strings.Contains(content, "?") || strings.Contains(content, "？")) && len([]rune(content)) > 15 {
		return true
	}
	return false
}

func hasQuestion(content string) bool {
	questionKeywords := []string{"?", "？", "什么", "怎么", "如何", "为什么", "吗", "能否", "可以吗", "能不能"}
	for _, keyword := range questionKeywords {
		if strings.Contains(content, keyword) {
			return true
		}
	}
	return false
}

// findSentenceStart 在文本中找到最近的完整句子起始位置
func findSentenceStart(text string) int {
	sentenceDelimiters := []string{"\n", "。", "！", "？", "；"}
	for _, delim := range sentenceDelimiters {
		idx := strings.Index(text, delim)
		if idx >= 0 && idx < 100 {
			return idx + len(delim)
		}
	}
	return 0
}
