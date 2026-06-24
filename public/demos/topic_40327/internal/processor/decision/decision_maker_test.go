package decision

import (
	"fmt"
	"strings"
	"testing"

	"YaraFlow/internal/config"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
)

func makeDMTestConfig(maxRounds int) *config.Config {
	return &config.Config{
		Bot: config.BotConfig{Nickname: "瞳瞳"},
		Trigger: config.TriggerConfig{
			AutoReply: true,
		},
		Decision: config.DecisionConfig{MaxRounds: maxRounds},
	}
}

func TestCalcAdaptiveMaxRounds_Simple(t *testing.T) {
	dm := NewDecisionMaker(makeDMTestConfig(3), nil)

	// 非常短的消息 → 1轮
	msg := &platform.ProcessedMessage{Content: "好", IsPureEmoji: false}
	if got := dm.calcAdaptiveMaxRounds(msg); got != 1 {
		t.Errorf("短消息应为1轮，实际: %d", got)
	}
}

func TestCalcAdaptiveMaxRounds_PureEmoji(t *testing.T) {
	dm := NewDecisionMaker(makeDMTestConfig(3), nil)

	msg := &platform.ProcessedMessage{Content: "[表情:开心]", IsPureEmoji: true}
	if got := dm.calcAdaptiveMaxRounds(msg); got != 1 {
		t.Errorf("纯表情应为1轮，实际: %d", got)
	}
}

func TestCalcAdaptiveMaxRounds_Medium(t *testing.T) {
	dm := NewDecisionMaker(makeDMTestConfig(3), nil)

	// 中等长度无问句 → 最多2轮
	msg := &platform.ProcessedMessage{Content: "今天天气很好", IsPureEmoji: false}
	if got := dm.calcAdaptiveMaxRounds(msg); got != 2 {
		t.Errorf("中等消息应为2轮，实际: %d", got)
	}
}

func TestCalcAdaptiveMaxRounds_MediumConfig1(t *testing.T) {
	dm := NewDecisionMaker(makeDMTestConfig(1), nil)

	// 配置只有1轮时，任何消息都是1轮
	msg := &platform.ProcessedMessage{Content: "今天天气很好，适合出去玩，你有什么推荐的地方吗？", IsPureEmoji: false}
	if got := dm.calcAdaptiveMaxRounds(msg); got != 1 {
		t.Errorf("配置1轮时消息应为1轮，实际: %d", got)
	}
}

func TestCalcAdaptiveMaxRounds_Complex(t *testing.T) {
	dm := NewDecisionMaker(makeDMTestConfig(3), nil)

	// 多问号 → 满配
	msg := &platform.ProcessedMessage{Content: "今天天气怎么样？适合出门吗？", IsPureEmoji: false}
	if got := dm.calcAdaptiveMaxRounds(msg); got != 3 {
		t.Errorf("多问号消息应为3轮(满配)，实际: %d", got)
	}
}

func TestCalcAdaptiveMaxRounds_LongContent(t *testing.T) {
	dm := NewDecisionMaker(makeDMTestConfig(3), nil)

	// 长消息 → 满配
	longContent := ""
	for i := 0; i < 110; i++ {
		longContent += "哈"
	}
	msg := &platform.ProcessedMessage{Content: longContent, IsPureEmoji: false}
	if got := dm.calcAdaptiveMaxRounds(msg); got != 3 {
		t.Errorf("超长消息应为3轮(满配)，实际: %d", got)
	}
}

func TestCalcAdaptiveMaxRounds_ImageWithQuestion(t *testing.T) {
	dm := NewDecisionMaker(makeDMTestConfig(3), nil)

	// 有图且有问号 → 满配
	msg := &platform.ProcessedMessage{
		Content:  "这是什么？",
		HasImage: true,
	}
	if got := dm.calcAdaptiveMaxRounds(msg); got != 3 {
		t.Errorf("有图有问号应为3轮(满配)，实际: %d", got)
	}
}

func TestTruncateForTrace(t *testing.T) {
	tests := []struct {
		input    string
		maxLen   int
		expected string
	}{
		{"短文本", 10, "短文本"},
		{"一个非常长的文本需要被截断", 5, "一个非常长..."},
		{"", 5, ""},
		{"hello", 3, "hel..."},
	}

	for _, tt := range tests {
		got := types.Truncate(tt.input, tt.maxLen)
		if got != tt.expected {
			t.Errorf("Truncate(%q, %d) = %q, want %q",
				tt.input, tt.maxLen, got, tt.expected)
		}
	}
}

// ── 提示词生成验证测试 ──
// 模拟：群聊中，用户"月白清风"@了瞳瞳，问了一个需要查记忆+查知识库的复杂问题
// 目的：验证新提示词是否正确注入内置action、插件action、行为规则，且无硬编码残留

func TestPromptGeneration_ComplexIntentWithTools(t *testing.T) {
	// 0. 加载模板（测试需要模板文件，否则回退为空字符串）
	// 测试运行在 internal/processor/decision 目录，需要回退到项目根目录
	if err := config.LoadPrompts("../../.."); err != nil {
		t.Logf("模板加载警告: %v", err)
	}

	// 1. 初始化配置（模拟完整人格）
	cfg := &config.Config{
		Bot: config.BotConfig{
			Nickname: "瞳瞳",
			QQ:       "3970426755",
			Aliases:  []string{"小瞳", "瞳宝"},
		},
		Trigger: config.TriggerConfig{
			AutoReply: true,
		},
		Decision: config.DecisionConfig{
			MaxRounds: 3,
		},
		Personality: config.PersonalityConfig{
			BaseIdentity: "你是瞳瞳，18岁女大学生。\n喜欢编程、甜品，尤其是草莓蛋糕。\n说话温柔幽默，偶尔小俏皮。",
		},
		BehaviorRules: "1. 回复尽量简短\n2. 不要频繁插话\n3. 只回复感兴趣的话题",
	}
	config.AppConfig = *cfg

	// 2. 创建决策器（不需要真实LLM，只测提示词生成）
	dm := NewDecisionMaker(cfg, nil)

	// 3. 模拟插件注册的额外动作（如记忆搜索插件）
	pluginActions := []config.ActionDefData{
		{
			Name:                "search_memory",
			Description:         "搜索用户的长期记忆",
			DetailedDescription: "根据关键词搜索用户的历史记忆，包括偏好、经历、约定等",
			Parameters: []config.ActionParamData{
				{Name: "query", Type: "string", Description: "搜索关键词"},
				{Name: "user_id", Type: "string", Description: "目标用户ID"},
			},
		},
	}
	dm.SetActionDefinitions(pluginActions)

	// 4. 模拟工具定义（决策器需要知道有哪些工具可用）
	builtinTools := []config.ToolDefData{
		{Name: "query_memory", Description: "查询用户记忆"},
		{Name: "web_search", Description: "联网搜索最新信息"},
	}
	dm.SetToolDefinitions(builtinTools)

	// 5. 构造复杂意图的模拟消息
	// 场景：群聊中，月白清风@了瞳瞳，问了一个需要查记忆+查知识的问题
	msg := &platform.ProcessedMessage{
		OriginalMessage: platform.Message{
			ID:         "msg_20260612_001",
			SenderID:   "1628993759",
			SenderName: "月白清风",
			GroupID:    "262221051",
			GroupName:  "甜品研发部",
			Content:    "瞳瞳，你还记得我之前说的那个草莓蛋糕配方吗？还有最近深度学习有什么新进展？",
			Timestamp:  1718200000000,
		},
		Content:     "瞳瞳，你还记得我之前说的那个草莓蛋糕配方吗？还有最近深度学习有什么新进展？",
		IsAtMe:      true,
		IsMentioned: true,
		HasImage:    false,
		Timestamp:   1718200000000,
	}

	// 模拟聊天上下文（含多条历史消息）
	chatContext := `[12:00] 月白清风：今天天气真好
[12:01] 瞳瞳(你)：是呀，适合出去走走~
[12:02] 小明：有没有人打游戏
[12:03] 月白清风：瞳瞳，你还记得我之前说的那个草莓蛋糕配方吗？还有最近深度学习有什么新进展？`

	// 6. 生成系统提示词
	systemPrompt := dm.buildDecisionSystem(msg, chatContext)

	// 7. 生成用户提示词（单轮模式）
	userPrompt := dm.buildDecisionUser()

	// 8. 生成多轮推理用户提示词
	loopUserPrompt := dm.buildDecisionUserForLoop(1, 3)

	// ── 验证 ──

	// 验证系统提示词包含昵称、场景
	if !strings.Contains(systemPrompt, "瞳瞳") {
		t.Error("系统提示词应包含昵称'瞳瞳'")
	}
	if !strings.Contains(systemPrompt, "QQ群") {
		t.Error("系统提示词应包含群聊场景描述")
	}
	if !strings.Contains(systemPrompt, "月白清风") {
		t.Error("系统提示词应包含聊天记录（含发送者名）")
	}

	// 验证用户提示词：内置action通过注入生成，不应有硬编码的冗长描述
	if !strings.Contains(userPrompt, "reply") {
		t.Error("用户提示词应包含内置action 'reply'")
	}
	if !strings.Contains(userPrompt, "tool_use") {
		t.Error("用户提示词应包含内置action 'tool_use'")
	}
	if !strings.Contains(userPrompt, "no_action") {
		t.Error("用户提示词应包含内置action 'no_action'")
	}
	if !strings.Contains(userPrompt, "send_emoji") {
		t.Error("用户提示词应包含内置action 'send_emoji'")
	}

	// 验证插件action被注入
	if !strings.Contains(userPrompt, "search_memory") {
		t.Error("用户提示词应包含插件注册的action 'search_memory'")
	}
	if !strings.Contains(userPrompt, "插件注册的额外动作") {
		t.Error("用户提示词应包含'插件注册的额外动作'标题")
	}

	// 验证行为规则被注入
	if !strings.Contains(userPrompt, "回复尽量简短") {
		t.Error("用户提示词应包含行为规则")
	}

	// 验证多轮模式下包含轮次信息
	if !strings.Contains(loopUserPrompt, "多轮推理模式") {
		t.Error("多轮模式提示词应包含'多轮推理模式'标题")
	}
	if !strings.Contains(loopUserPrompt, "1 / 3") {
		t.Error("多轮模式提示词应包含当前轮次信息")
	}

	// 验证多轮模式下包含 wait/finish 特殊动作
	if !strings.Contains(loopUserPrompt, "wait") {
		t.Error("多轮模式提示词应包含 wait 动作")
	}
	if !strings.Contains(loopUserPrompt, "finish") {
		t.Error("多轮模式提示词应包含 finish 动作")
	}

	// ── 输出提示词内容供人工审查 ──
	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Println("【决策系统提示词】")
	fmt.Println(strings.Repeat("=", 80))
	fmt.Println(systemPrompt)

	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Println("【决策用户提示词 - 单轮模式】")
	fmt.Println(strings.Repeat("=", 80))
	fmt.Println(userPrompt)

	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Println("【决策用户提示词 - 多轮推理模式 (第1/3轮)】")
	fmt.Println(strings.Repeat("=", 80))
	fmt.Println(loopUserPrompt)
}