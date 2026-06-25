package memory

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
)

const MaxSummaryInputChars = 16000

type sessionState struct {
	lastTriggerCount int
}

type PeriodicMemoryWriter struct {
	llmProvider   llm.LLMProvider
	memoryManager *MemoryManager
	mu            sync.Mutex
	sessionStates map[string]*sessionState
	triggerCount  int
	maxInputChars int
}

func NewPeriodicMemoryWriter(llmProvider llm.LLMProvider, mm *MemoryManager, triggerCount int, maxInputChars int) *PeriodicMemoryWriter {
	if triggerCount <= 0 {
		triggerCount = 50
	}
	if maxInputChars <= 0 {
		maxInputChars = MaxSummaryInputChars
	}
	return &PeriodicMemoryWriter{
		llmProvider:   llmProvider,
		memoryManager: mm,
		sessionStates: make(map[string]*sessionState),
		triggerCount:  triggerCount,
		maxInputChars: maxInputChars,
	}
}

func (w *PeriodicMemoryWriter) OnMessage(sessionID, platform, groupID string, totalMessageCount int, recentContext string) {
	if w.llmProvider == nil || w.memoryManager == nil {
		return
	}

	if totalMessageCount <= 0 {
		return
	}

	w.mu.Lock()
	state, ok := w.sessionStates[sessionID]
	if !ok {
		state = &sessionState{lastTriggerCount: 0}
		w.sessionStates[sessionID] = state
	}
	pending := totalMessageCount - state.lastTriggerCount
	if pending < w.triggerCount {
		w.mu.Unlock()
		return
	}

	contextLength := w.triggerCount
	if pending < contextLength {
		contextLength = pending
	}

	state.lastTriggerCount = totalMessageCount
	w.mu.Unlock()

	go w.generateAndStore(sessionID, platform, groupID, recentContext, contextLength)
}

func (w *PeriodicMemoryWriter) generateAndStore(sessionID, platform, groupID, recentContext string, contextLength int) {
	recentContext = strings.TrimSpace(recentContext)
	if recentContext == "" {
		return
	}

	if contextLength > 0 {
		maxChars := contextLength * 200
		runes := []rune(recentContext)
		if len(runes) > maxChars {
			recentContext = string(runes[len(runes)-maxChars:])
		}
	}

	prompt := fmt.Sprintf(`请把以下聊天消息压缩成摘要，作为长期记忆保存。

聊天消息：
%s

要求：
1. 保留话题脉络、人物立场、已达成结论、待办和重要细节，适合之后恢复上下文
2. 保留对话中的情感氛围（如聊得很开心、吵了一架、有人情绪低落等），这对之后回忆很重要
3. brief 用 3-5 句概括这段聊天，包含情感氛围
4. keywords 输出 3-8 个关键词，使用简体中文，避免空泛词
5. emotional_tone 判断这段聊天整体的情感基调：positive（积极/开心/温馨）、negative（消极/难过/争吵）或 neutral（中性/日常闲聊）
6. 只根据消息内容总结，不要编造没有出现的信息
7. 严格输出 JSON，字段为 long_summary、brief、keywords、emotional_tone

输出格式：
{"long_summary":"摘要内容","brief":"简述","keywords":["关键词1","关键词2"],"emotional_tone":"positive"}`, recentContext)

	chatMessages := []llm.ChatMessage{
		{Role: "user", Content: prompt},
	}

	response, err := w.llmProvider.Chat(chatMessages)
	if err != nil {
		logger.Sugar.Warnw("[PeriodicMemoryWriter] LLM 摘要生成失败", "error", err)
		return
	}

	summary, emotionalTone := w.parseSummary(response)
	if summary == "" {
		return
	}

	if err := w.memoryManager.Ingest(summary, sessionID, platform, groupID, "", SourceChatSummary, emotionalTone); err != nil {
		logger.Sugar.Warnw("[PeriodicMemoryWriter] 存储摘要失败", "error", err)
	} else {
		logger.Sugar.Infow("[PeriodicMemoryWriter] 已存储记忆提取", "chars", len([]rune(summary)))
	}
}

func (w *PeriodicMemoryWriter) parseSummary(response string) (string, string) {
	response = strings.TrimSpace(response)

	start := strings.Index(response, "{")
	end := strings.LastIndex(response, "}")
	if start >= 0 && end > start {
		response = response[start : end+1]
	}

	var result struct {
		LongSummary   string   `json:"long_summary"`
		Brief         string   `json:"brief"`
		Keywords      []string `json:"keywords"`
		EmotionalTone string   `json:"emotional_tone"`
	}
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		logger.Sugar.Warnw("[PeriodicMemoryWriter] JSON解析失败", "error", err, "response", response)
		return "", ""
	}

	if result.LongSummary == "" {
		return "", ""
	}

	// 校验 emotional_tone 值域
	emotionalTone := result.EmotionalTone
	if emotionalTone != "" && emotionalTone != "positive" && emotionalTone != "negative" && emotionalTone != "neutral" {
		logger.Sugar.Debugw("[PeriodicMemoryWriter] 无效的 emotional_tone，已忽略", "value", emotionalTone)
		emotionalTone = ""
	}

	parts := []string{result.LongSummary}
	if result.Brief != "" && result.Brief != result.LongSummary {
		parts = append(parts, "简述："+result.Brief)
	}
	if len(result.Keywords) > 0 {
		parts = append(parts, "关键词："+strings.Join(result.Keywords, "、"))
	}
	return strings.Join(parts, "\n"), emotionalTone
}

type PersonFactWriter struct {
	llmProvider   llm.LLMProvider
	memoryManager *MemoryManager
}

func NewPersonFactWriter(llmProvider llm.LLMProvider, mm *MemoryManager) *PersonFactWriter {
	return &PersonFactWriter{
		llmProvider:   llmProvider,
		memoryManager: mm,
	}
}

func looksEphemeral(text string) bool {
	content := strings.TrimSpace(text)
	if content == "" {
		return true
	}
	if len([]rune(content)) <= 8 {
		ephemeralMarkers := []string{"哈哈", "好的", "收到", "嗯嗯", "晚安", "早安", "拜拜", "谢谢", "在吗", "？"}
		for _, m := range ephemeralMarkers {
			if strings.Contains(content, m) {
				return true
			}
		}
	}
	return false
}

func isConversationMeta(fact string) bool {
	metaPatterns := []string{
		// 对话动词：描述"XX对YY说了什么"的行为
		"说了", "说过", "问了", "问过",
		"回答", "答道", "回复", "问起",
		"询问", "提及", "提过",
		// 使役/互动：描述"XX让YY做ZZ"的行为
		"让瞳瞳", "让语瞳", "叫瞳瞳", "叫语瞳",
		"曾让瞳瞳", "曾让语瞳",
		// 告知/交流方向：描述"XX对/向/和/跟瞳瞳（语瞳）XX"
		"告诉瞳瞳", "告诉语瞳",
		"对瞳瞳", "对语瞳",
		"向瞳瞳", "向语瞳",
		"和瞳瞳", "和语瞳",
		"跟瞳瞳", "跟语瞳",
		"曾和瞳瞳", "曾和语瞳",
		"曾与瞳瞳", "曾与语瞳",
		// 表情/图片元信息
		"发了个表情", "发了张表情", "发来一张",
		// 记忆系统元信息
		"没存到记忆", "没记住", "忘记了之前",
	}
	for _, p := range metaPatterns {
		if strings.Contains(fact, p) {
			return true
		}
	}
	return false
}

func (w *PersonFactWriter) ExtractAndStore(
	userContent string, senderName string, senderID string,
	botReply string, botName string,
	sessionID string, platform string, groupID string,
) {
	if w.llmProvider == nil || w.memoryManager == nil {
		return
	}

	userContent = strings.TrimSpace(userContent)
	if userContent == "" || looksEphemeral(userContent) {
		return
	}

	displayName := senderName
	if displayName == "" {
		displayName = senderID
	}
	if displayName == "" {
		return
	}

	prompt := fmt.Sprintf(`你要从用户原始发言中提取"关于%s的稳定事实"。

目标人物：%s
用户原始发言：
%s

机器人回复：
%s

请只提取满足以下条件的事实：
1. 必须能被"用户原始发言"直接支持，不能只来自机器人回复
2. 明确是关于目标人物本人的信息
3. 具有相对稳定性，可以作为长期记忆保存
4. 用简洁中文陈述句表达，如："张三喜欢打篮球"
5. 如果用户发言中出现"我/我的/自己"，默认指目标人物，改写成第三人称事实

绝对禁止提取（以下例子一律视为无效，直接跳过）：
- 对话元信息：禁止提取任何描述"谁说/问了/回复了/让谁做什么"的内容
  反面示例："张三询问语瞳在做什么"、"张三向语瞳说了一个笑话"、"张三让语瞳写程序"、"张三对语瞳提过事情"、"张三曾和语瞳说过XX"
- 临时行为：禁止提取"张三在某个时刻测试/修改/做了某事"这类一次性的不稳定的行为
  反面示例："张三今天早上吃了面包"、"张三刚才打开了电脑"
- 只适用于当前时刻的短期安排
  反面示例："张三明天要去图书馆"、"张三这周末打算爬山"
- 不确定、猜测、反问
- 与目标人物无关的信息
- 机器人的情绪、计划、客套话（即使机器人回复中提到了目标人物）

正确示例（这些才是要提取的）：
"张三喜欢打篮球"、"张三住在北京"、"张三有一个姐姐叫李四"、"张三的职业是程序员"、"张三擅长弹吉他"

严格输出 JSON 数组，例如：
["张三住在北京", "张三喜欢打篮球"]
如果没有可提取的稳定事实，输出 []`, displayName, displayName, userContent, botReply)

	messages := []llm.ChatMessage{
		{Role: "user", Content: prompt},
	}

	response, err := w.llmProvider.Chat(messages)
	if err != nil {
		logger.Sugar.Warnw("[PersonFactWriter] LLM 提取失败", "error", err)
		return
	}

	facts := w.parseFactList(response)
	for _, fact := range facts {
		fact = strings.TrimSpace(fact)
		if fact == "" || len([]rune(fact)) < 4 {
			continue
		}
		if isConversationMeta(fact) {
			logger.Sugar.Debugw("[PersonFactWriter] 已过滤对话元信息", "fact", fact)
			continue
		}
		if err := w.memoryManager.Ingest(fact, sessionID, platform, groupID, senderID, SourcePersonFact, ""); err != nil {
			logger.Sugar.Warnw("[PersonFactWriter] 存储事实失败", "error", err)
		} else {
			logger.Sugar.Infow("[PersonFactWriter] 已存储人物事实", "fact", fact)
		}
	}
}

func (w *PersonFactWriter) parseFactList(response string) []string {
	response = strings.TrimSpace(response)

	start := strings.Index(response, "[")
	end := strings.LastIndex(response, "]")
	if start >= 0 && end > start {
		response = response[start : end+1]
	}

	var facts []string
	if err := json.Unmarshal([]byte(response), &facts); err != nil {
		logger.Sugar.Warnw("[PersonFactWriter] JSON解析失败", "error", err, "response", response)
		return nil
	}

	return facts
}
