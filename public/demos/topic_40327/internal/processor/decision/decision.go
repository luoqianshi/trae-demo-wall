package decision

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
)

// ToolExecutor decision包需要的工具执行器接口
type ToolExecutor interface {
	ExecuteToolsWithName(decision *types.DecisionResult, msg *platform.ProcessedMessage, toolName string, toolArgs map[string]interface{}) ([]types.ToolResult, error)
	SelectTool(toolDefs []config.ToolDefData, msg *platform.ProcessedMessage, context string) (string, map[string]interface{}, error)
	SetToolCtxReasoning(reasoning string)
}

// BuiltinToolProvider 决策包需要的内置工具信息接口
type BuiltinToolProvider interface {
	GetDeferredToolNames() []string
	GetToolDefinitions() []config.ToolDefData
}

type DecisionMaker struct {
	config            *config.Config
	llmProvider       llm.LLMProvider
	maxRounds         int
	toolDefsMu        sync.RWMutex
	toolDefinitions   []config.ToolDefData // 全部工具定义（供 autoCallTools/SelectTool 使用）
	allToolDefs       []config.ToolDefData // 同上，向后兼容
	actionDefinitions []config.ActionDefData
	builtinTools      BuiltinToolProvider // 用于获取 deferred 工具信息
}

func NewDecisionMaker(cfg *config.Config, llm llm.LLMProvider) *DecisionMaker {
	maxRounds := cfg.Decision.MaxRounds
	if maxRounds <= 0 {
		maxRounds = 2
	}
	return &DecisionMaker{
		config:      cfg,
		llmProvider: llm,
		maxRounds:   maxRounds,
	}
}

func (dm *DecisionMaker) SetToolDefinitions(tools []config.ToolDefData) {
	dm.toolDefsMu.Lock()
	defer dm.toolDefsMu.Unlock()
	dm.toolDefinitions = tools
}

// SetAllToolDefinitions 设置全部工具定义（含 deferred），供 autoCallTools/SelectTool 使用
func (dm *DecisionMaker) SetAllToolDefinitions(tools []config.ToolDefData) {
	dm.toolDefsMu.Lock()
	defer dm.toolDefsMu.Unlock()
	dm.allToolDefs = tools
}

func (dm *DecisionMaker) SetBuiltinTools(bt BuiltinToolProvider) {
	dm.builtinTools = bt
}

func (dm *DecisionMaker) SetActionDefinitions(actions []config.ActionDefData) {
	dm.toolDefsMu.Lock()
	defer dm.toolDefsMu.Unlock()
	dm.actionDefinitions = actions
}

// getToolDefinitions 线程安全地读取工具定义（仅可见工具，供规划器 prompt 使用）
func (dm *DecisionMaker) getToolDefinitions() []config.ToolDefData {
	dm.toolDefsMu.RLock()
	defer dm.toolDefsMu.RUnlock()
	return dm.toolDefinitions
}

// getAllToolDefinitions 返回全部工具定义（含 deferred），供 autoCallTools/SelectTool 使用
func (dm *DecisionMaker) getAllToolDefinitions() []config.ToolDefData {
	dm.toolDefsMu.RLock()
	defer dm.toolDefsMu.RUnlock()
	return dm.allToolDefs
}

// getActionDefinitions 线程安全地读取动作定义
func (dm *DecisionMaker) getActionDefinitions() []config.ActionDefData {
	dm.toolDefsMu.RLock()
	defer dm.toolDefsMu.RUnlock()
	return dm.actionDefinitions
}

func (dm *DecisionMaker) accumulateToolResults(context string, toolResults []types.ToolResult, round int) string {
	var builder strings.Builder
	if context != "" {
		builder.WriteString(context)
		builder.WriteString("\n")
	}
	builder.WriteString(fmt.Sprintf("—— 第%d轮工具执行结果 ——\n", round))
	for _, result := range toolResults {
		builder.WriteString(result.BuildSummary())
		builder.WriteString("\n")
	}
	return builder.String()
}

// autoCallTools 当 think_level=1 时自动调用工具模型。
// 不经过规划器多轮推理，工具模型自主选择需要的工具并执行，
// 结果直接注入回复器的【参考信息】。
func (dm *DecisionMaker) autoCallTools(toolExecutor ToolExecutor, processedMsg *platform.ProcessedMessage, context string) ([]types.ToolResult, error) {
	toolExecutor.SetToolCtxReasoning("深思模式自动工具调用")

	// 由工具模型来选择合适的工具
	toolName, toolArgs, selectErr := toolExecutor.SelectTool(
		dm.getAllToolDefinitions(), processedMsg, context)
	if selectErr != nil {
		return nil, selectErr
	}

	logger.Sugar.Infow("深思模式 工具模型选择", "tool", toolName, "args", toolArgs)

	toolArgs = ensureToolQueryArg(toolName, toolArgs, processedMsg)

	fakeDecision := &types.DecisionResult{
		Thought:        "深思模式自动工具调用",
		ToolCallNeeded: true,
	}

	return toolExecutor.ExecuteToolsWithName(fakeDecision, processedMsg, toolName, toolArgs)
}

// decisionsContain 检查 actions 列表中是否包含给定的任一 action
func decisionsContain(actions []string, targets []string) bool {
	for _, a := range actions {
		for _, t := range targets {
			if a == t {
				return true
			}
		}
	}
	return false
}

// extractToolCallParams 从 ActionObjects 中提取 tool_use 的工具名和参数
func (dm *DecisionMaker) extractToolCallParams(objects []types.ActionObject) (string, map[string]interface{}) {
	for _, ao := range objects {
		if ao.Action == "tool_use" && ao.ToolName != "" {
			if ao.ToolArgs == nil {
				ao.ToolArgs = make(map[string]interface{})
			}
			return ao.ToolName, ao.ToolArgs
		}
	}
	return "", nil
}

// ensureToolQueryArg 兜底：如果搜索类工具缺少 query 参数，自动从用户消息中提取
// 同时做简单清洗：去掉常见称呼前缀和语气词，避免搜索词被污染
// 例如："瞳瞳，那崩坏星穹铁道的资讯呢" → "崩坏星穹铁道的资讯"
func ensureToolQueryArg(toolName string, toolArgs map[string]interface{}, processedMsg *platform.ProcessedMessage) map[string]interface{} {
	searchTools := map[string]bool{"query_memory": true, "web_search": true, "search_messages": true}
	if !searchTools[toolName] {
		return toolArgs
	}
	if toolArgs == nil {
		toolArgs = make(map[string]interface{})
	}
	if q, _ := toolArgs["query"].(string); q != "" {
		return toolArgs
	}
	// 从用户消息中提取查询词
	query := processedMsg.Content
	if query == "" {
		query = processedMsg.OriginalMessage.Content
	}
	// 简单清洗：去掉开头的称呼前缀和结尾的语气词
	query = cleanSearchFallbackQuery(query)
	if query != "" {
		toolArgs["query"] = query
		logger.Sugar.Infow("[工具兜底] 自动填充 query 参数",
			"tool", toolName, "query", types.Truncate(query, 60))
	}
	return toolArgs
}

// cleanSearchFallbackQuery 对兜底搜索词做简单清洗，去掉常见对话前缀/后缀
// 作为 LLM 查询重写之前的兜底保护
func cleanSearchFallbackQuery(raw string) string {
	// 去掉常见称呼前缀：瞳瞳，/ 瞳瞳 / 哥哥，/ 哥，等
	prefixes := []string{"瞳瞳，", "瞳瞳 ", "瞳瞳", "哥哥，", "哥哥 ", "哥，", "哥 "}
	for _, p := range prefixes {
		if strings.HasPrefix(raw, p) {
			raw = strings.TrimPrefix(raw, p)
			raw = strings.TrimLeft(raw, "，, ")
			break
		}
	}

	// 去掉常见前缀句式
	phrasePrefixes := []string{
		"帮我查一下", "帮我查查", "帮我查", "帮我搜一下", "帮我搜",
		"查一下", "查查", "搜索一下", "搜一下",
		"那", "那个", "那请问",
	}
	for _, p := range phrasePrefixes {
		if strings.HasPrefix(raw, p) {
			raw = strings.TrimPrefix(raw, p)
			break
		}
	}

	// 去掉结尾语气词
	suffixes := []string{"呢", "吧", "哈", "呀", "哦", "啊", "嘛", "呗", "吗", "？", "?"}
	for _, s := range suffixes {
		if strings.HasSuffix(raw, s) {
			raw = strings.TrimSuffix(raw, s)
			raw = strings.TrimRight(raw, "，, ？?")
		}
	}

	return strings.TrimSpace(raw)
}

// truncateForLoop 截断累积上下文，保留基础上下文 + 最近的工具结果
func (dm *DecisionMaker) truncateForLoop(baseContext, accumulatedContext string, maxChars int) string {
	runes := []rune(accumulatedContext)
	if len(runes) <= maxChars {
		return accumulatedContext
	}
	baseRunes := []rune(baseContext)
	keepToolChars := maxChars - len(baseRunes)
	if keepToolChars <= 0 {
		return baseContext
	}
	toolStart := len(runes) - keepToolChars
	if toolStart < 0 {
		toolStart = 0
	}
	return baseContext + "\n" + string(runes[toolStart:])
}

func (dm *DecisionMaker) parseDecisionResponse(response string, processedMsg *platform.ProcessedMessage) (*types.DecisionResult, error) {
	thought, jsonBlocks := dm.extractThoughtAndJSONBlocks(response)

	if len(jsonBlocks) == 0 {
		logger.Sugar.Warnw("决策模型未输出JSON，使用默认回复")
		return &types.DecisionResult{
			Thought:         thought + "\n（JSON解析失败，使用默认回复）",
			ActionObjects:   []types.ActionObject{{Action: "reply"}},
			Actions:         []string{"reply"},
			ThinkLevel:      0,
			ReplyNeeded:     true,
			TargetMessageID: processedMsg.OriginalMessage.ID,
		}, nil
	}

	var actionObjects []types.ActionObject
	var actionNames []string
	highestThinkLevel := types.FlexInt(0)
	var targetMsgID string
	var unknownWords []string
	var question string
	quote := false

	for _, jsonBlock := range jsonBlocks {
		var ao types.ActionObject
		if err := json.Unmarshal([]byte(jsonBlock), &ao); err != nil {
			logger.Sugar.Warnw("JSON块解析失败，跳过", "block", jsonBlock, "error", err)
			continue
		}
		if ao.Action == "" {
			logger.Sugar.Warnw("JSON块缺少action字段，跳过", "block", jsonBlock)
			continue
		}
		actionObjects = append(actionObjects, ao)
		actionNames = append(actionNames, ao.Action)

		if ao.ThinkLevel > highestThinkLevel {
			highestThinkLevel = ao.ThinkLevel
		}
		if ao.TargetMessageID != "" {
			targetMsgID = ao.TargetMessageID
		}
		if len(ao.UnknownWords) > 0 {
			unknownWords = append(unknownWords, ao.UnknownWords...)
		}
		if ao.Question != "" && question == "" {
			question = ao.Question
		}
		if ao.Quote {
			quote = true
		}
	}

	if len(actionObjects) == 0 {
		logger.Sugar.Warnw("所有JSON块解析失败，使用默认回复")
		return &types.DecisionResult{
			Thought:         thought + "\n（JSON解析失败，使用默认回复）",
			ActionObjects:   []types.ActionObject{{Action: "reply"}},
			Actions:         []string{"reply"},
			ThinkLevel:      0,
			ReplyNeeded:     true,
			TargetMessageID: processedMsg.OriginalMessage.ID,
		}, nil
	}

	if targetMsgID == "" {
		targetMsgID = processedMsg.OriginalMessage.ID
	}

	confidence := 0.7
	if len(actionNames) > 0 {
		confidence = dm.defaultConfidence(actionNames[0])
	}

	result := &types.DecisionResult{
		Thought:         thought,
		ActionObjects:   actionObjects,
		Actions:         actionNames,
		ThinkLevel:      int(highestThinkLevel),
		TargetMessageID: targetMsgID,
		UnknownWords:    unknownWords,
		Question:        question,
		Quote:           quote,
		Confidence:      confidence,
	}

	// 根据 actions 判断是否需要回复、是否需要自动调用工具
	hasReply := false
	hasToolCall := false
	for _, a := range actionNames {
		switch a {
		case "reply":
			hasReply = true
		case "send_emoji":
			// send_emoji 是独立动作，不触发文字回复
			// 模型想同时回复文字+表情包时，应同时输出 reply 和 send_emoji
		case "tool_use":
			// 规划器显式调用工具，不产生回复但标记需要工具执行
			hasToolCall = true
		case "no_action", "no_reply", "silence", "wait", "finish":
			// 这些不产生回复
		default:
			// 插件注册的action
			if dm.IsPluginAction(a) {
				hasReply = true
			} else {
				logger.Sugar.Warnw("未知action，忽略", "action", a)
			}
		}
	}
	// think_level=1 → 系统自动调用工具模型，把工具结果注入回复器
	if highestThinkLevel >= 1 {
		hasToolCall = true
	}
	result.ReplyNeeded = hasReply
	result.ToolCallNeeded = hasToolCall

	logger.Sugar.Infow("决策结果",
		"actions", result.Actions,
		"think_level", result.ThinkLevel,
		"reply_needed", result.ReplyNeeded,
		"tool_call_needed", result.ToolCallNeeded,
		"action_count", len(result.ActionObjects))

	return result, nil
}

func (dm *DecisionMaker) defaultConfidence(primaryAction string) float64 {
	switch primaryAction {
	case "reply", "send_emoji":
		return 0.7
	case "no_action", "no_reply", "silence":
		return 0.8
	case "wait", "finish":
		return 0.5
	default:
		return 0.6
	}
}

// IsPluginAction 检查 action 是否为插件注册的 action
func (dm *DecisionMaker) IsPluginAction(action string) bool {
	for _, a := range dm.getActionDefinitions() {
		if a.Name == action {
			return true
		}
	}
	return false
}

func (dm *DecisionMaker) extractThoughtAndJSONBlocks(response string) (string, []string) {
	response = strings.TrimSpace(response)

	var jsonBlocks []string

	// 找所有 ```json ... ``` 块
	remaining := response
	for {
		start := strings.Index(remaining, "```json")
		markerLen := 7
		if start == -1 {
			start = strings.Index(remaining, "```")
			markerLen = 3
		}
		if start == -1 {
			break
		}
		contentStart := start + markerLen
		end := strings.Index(remaining[contentStart:], "```")
		if end == -1 {
			break
		}
		jsonBlock := strings.TrimSpace(remaining[contentStart : contentStart+end])
		if jsonBlock != "" {
			jsonBlocks = append(jsonBlocks, jsonBlock)
		}
		remaining = remaining[contentStart+end+3:]
	}

	if len(jsonBlocks) == 0 {
		// 没代码块，找裸JSON对象
		braceStart := strings.Index(response, "{")
		if braceStart != -1 {
			left := response[braceStart:]
			for {
				block, rest := extractJSONObject(left)
				if block == "" {
					break
				}
				jsonBlocks = append(jsonBlocks, block)
				left = rest
			}
			if len(jsonBlocks) > 0 {
				thought := strings.TrimSpace(response[:braceStart])
				return thought, jsonBlocks
			}
		}
		return response, nil
	}

	// 第一段 ```json 之前的是分析文本
	firstMarker := strings.Index(response, "```")
	thought := response
	if firstMarker != -1 {
		thought = strings.TrimSpace(response[:firstMarker])
	}

	return thought, jsonBlocks
}

// extractJSONObject 提取一个完整的JSON对象 {...}，处理嵌套
func extractJSONObject(s string) (string, string) {
	s = strings.TrimSpace(s)
	if !strings.HasPrefix(s, "{") {
		return "", s
	}
	depth := 0
	for i, c := range s {
		switch c {
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return s[:i+1], s[i+1:]
			}
		}
	}
	return "", s
}

func timeOfDayContext(t time.Time) string {
	hour := t.Hour()
	switch {
	case hour >= 5 && hour < 8:
		return "现在是清晨，新的一天刚开始"
	case hour >= 8 && hour < 12:
		return "现在是上午，精力充沛的时段"
	case hour >= 12 && hour < 14:
		return "现在是中午，午休时间"
	case hour >= 14 && hour < 18:
		return "现在是下午，适合活跃交流"
	case hour >= 18 && hour < 22:
		return "现在是傍晚到晚间，大家放松休息的时间"
	default:
		return "现在是深夜，四周安静下来"
	}
}