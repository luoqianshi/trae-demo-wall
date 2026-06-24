package config

import (
	"fmt"
	"strings"
)

// RegisterBuiltinActions 返回所有内置action的统一注册表。
// 不管是内置的还是插件注册的，统一走这个注册表 → FormatActionsForPrompt → 注入到对应模型提示词。
func RegisterBuiltinActions() []ActionDefData {
	nickname := AppConfig.Bot.Nickname
	return []ActionDefData{
		{
			Name:                "reply",
			Description:         "回复一条文字消息",
			DetailedDescription: fmt.Sprintf("1. 选择@了%s、但%s还没回应的消息进行回复\n2. 顺着当前话题自然地聊下去，也可以自然地提出新问题\n3. 一次只回一个话题，别啰嗦\n4. 别回%s自己发的消息\n5. 别单独对表情包回复\n6. 看不懂的词、黑话、缩写写入unknown_words\n7. 有搞不清的问题写入question\n8. think_level：0=不用查资料直接回，1=需要查资料或回忆再回\n9. 如果明确指向某条消息，quote=true并填target_message_id", nickname, nickname, nickname),
			Parameters: []ActionParamData{
				{Name: "think_level", Type: "integer", Description: "0=直接回复，1=需要查资料回"},
				{Name: "unknown_words", Type: "array", Description: "看不懂的词/黑话/缩写"},
				{Name: "question", Type: "string", Description: "想搞清楚的问题"},
				{Name: "quote", Type: "boolean", Description: "是否引用原消息"},
			},
		},
		{
			Name:                "tool_use",
			Description:         "调用工具获取信息，先查再回，不要瞎编",
			DetailedDescription: "使用时机：\n- 对方问事实、新闻、知识类问题 → 先查 web_search\n- 对方提到\"之前\"\"上次\"\"还记得吗\"\"我喜欢\"\"我说过\" → 先查 query_memory\n- 工具结果会反馈给你，根据结果再决定 reply 或继续查",
			Parameters: []ActionParamData{
				{Name: "tool_name", Type: "string", Description: "要调用的工具名称"},
				{Name: "tool_args", Type: "object", Description: "工具参数，JSON格式"},
				{Name: "reason", Type: "string", Description: "调用原因，可选"},
			},
		},
		{
			Name:                "no_action",
			Description:         "保持沉默，不做任何事",
			DetailedDescription: "控制发言频率，别太频繁。\n没新消息、没人@你、话题跟你没关系就用这个。\n收到回复的目标消息后、等待新消息时也用它。",
		},
		{
			Name:                "send_emoji",
			Description:         "发送一张表情包来辅助表达情绪",
			DetailedDescription: "从表情包库里选一张表情包发送，用来活跃气氛或表达情绪。\n使用条件：\n- 想用表情包表达情绪时使用\n- 不要连续发送，如果刚刚已经发过了，就别再选\n- 可以和 reply 一起用，先回复文字再配表情",
			Parameters: []ActionParamData{
				{Name: "emotion", Type: "string", Description: "想要表达的情绪，如开心、生气、无语、卖萌、委屈，留空则随机发送"},
				{Name: "context", Type: "string", Description: "使用语境，如回应、安慰、撒娇、嘲讽、鼓励，帮助匹配更合适的表情包，可选"},
			},
		},
	}
}

func FormatActionsForPrompt(actions []ActionDefData) string {
	if len(actions) == 0 {
		return ""
	}

	var builder strings.Builder
	for i, action := range actions {
		if i > 0 {
			builder.WriteString("\n---\n\n")
		}
		builder.WriteString(fmt.Sprintf("**%s**\n", action.Name))
		builder.WriteString(fmt.Sprintf("动作描述：%s\n", action.Description))

		if action.DetailedDescription != "" {
			builder.WriteString(action.DetailedDescription)
			builder.WriteString("\n")
		}

		if action.ActivationType != "" && action.ActivationType != "always" {
			builder.WriteString(fmt.Sprintf("触发方式：%s\n", action.ActivationType))
			if action.ActivationProbability > 0 {
				builder.WriteString(fmt.Sprintf("触发概率：%.0f%%\n", action.ActivationProbability*100))
			}
			if len(action.ActivationKeywords) > 0 {
				builder.WriteString(fmt.Sprintf("触发关键词：%s\n", strings.Join(action.ActivationKeywords, "、")))
			}
		}

		if len(action.ActionParameters) > 0 {
			for paramName, paramDesc := range action.ActionParameters {
				builder.WriteString(fmt.Sprintf("- %s：%s\n", paramName, paramDesc))
			}
		}

		if len(action.ActionRequirements) > 0 {
			builder.WriteString(fmt.Sprintf("权限要求：%s\n", strings.Join(action.ActionRequirements, ", ")))
		}

		jsonExample := buildActionJSONExample(action)
		if jsonExample != "" {
			builder.WriteString(jsonExample)
			builder.WriteString("\n")
		}
	}

	return builder.String()
}

func buildActionJSONExample(action ActionDefData) string {
	// 每个action输出独立JSON格式，示例值用真实数据而非描述文字
	params := make([]string, 0, len(action.Parameters)+1)

	for _, p := range action.Parameters {
		val := paramExampleValue(p.Name, p.Type)
		// 根据类型决定是否加引号
		switch p.Type {
		case "integer", "number", "boolean":
			params = append(params, fmt.Sprintf("\"%s\":%s", p.Name, val))
		case "array", "object":
			// 数组和对象不额外加引号，直接用值
			params = append(params, fmt.Sprintf("\"%s\":%s", p.Name, val))
		default:
			params = append(params, fmt.Sprintf("\"%s\":\"%s\"", p.Name, val))
		}
	}

	if len(params) == 0 {
		return fmt.Sprintf("{\"action\":\"%s\"}", action.Name)
	}
	return fmt.Sprintf("{\"action\":\"%s\", %s}", action.Name, strings.Join(params, ", "))
}

// paramExampleValue 根据参数名和类型返回真实示例值
func paramExampleValue(name, paramType string) string {
	examples := map[string]string{
		"think_level":       "0",
		"unknown_words":     "[]",
		"question":          "",
		"quote":             "false",
		"target_message_id": "",
		"tool_name":         "web_search",
		"tool_args":         "{}",
		"reason":            "需要查资料",
		"emotion":           "开心",
		"context":           "回应对方的夸奖",
		"name":              "action_name",
		"content":           "回复内容",
		"message":           "回复内容",
	}
	if v, ok := examples[name]; ok {
		return v
	}
	// 未匹配到的参数用类型生成通用示例值
	switch paramType {
	case "integer", "number":
		return "0"
	case "boolean":
		return "false"
	case "array":
		return "[]"
	case "object":
		return "{}"
	default:
		return "示例值"
	}
}

func FormatToolsForPrompt(tools []ToolDefData) string {
	if len(tools) == 0 {
		return ""
	}

	var builder strings.Builder
	builder.WriteString("## 可用工具\n\n")
	builder.WriteString("调用方式：设置 action=\"tool_use\"，提供 tool_name 和 tool_args。\n")
	builder.WriteString("工具返回结果会追加到对话中供你参考。\n\n")

	hasDeferredHint := false
	for i, tool := range tools {
		v := tool.Visibility
		if v == "" {
			v = "visible"
		}
		toolType := tool.ToolType
		if toolType == "" {
			toolType = "action"
		}

		builder.WriteString(fmt.Sprintf("%d. **%s**", i+1, tool.Name))
		if v == "deferred" {
			builder.WriteString(" [需通过 tool_search 搜索发现]")
			hasDeferredHint = true
		}
		if toolType == "long_running" {
			builder.WriteString(fmt.Sprintf(" [长时任务, 预计%d秒]", tool.TimeoutSec))
		}
		builder.WriteString("\n")

		if tool.Description != "" {
			builder.WriteString(fmt.Sprintf("   %s\n", tool.Description))
		}

		if len(tool.Parameters) > 0 {
			builder.WriteString("   参数：\n")
			for _, param := range tool.Parameters {
				required := ""
				if param.Required {
					required = "，必填"
				}
				desc := ""
				if param.Description != "" {
					desc = fmt.Sprintf(" — %s", param.Description)
				}
				builder.WriteString(fmt.Sprintf("   · %s (%s%s)%s\n",
					param.Name, param.Type, required, desc))
			}
		}
		builder.WriteString("\n")
	}

	if hasDeferredHint {
		builder.WriteString("\n---\n<system-reminder>\n")
		builder.WriteString("标记 [需通过 tool_search 搜索发现] 的工具属于隐藏工具，")
		builder.WriteString("不直接可见。如需使用，请先调用 **tool_search** 搜索该工具，")
		builder.WriteString("搜索结果会返回工具的完整定义和参数说明。")
		builder.WriteString("\n</system-reminder>\n\n")
	}

	return builder.String()
}

// FormatDeferredToolNames 将延迟加载的工具名称格式化为简短的提示列表
// 仅列出名称和一句话描述，不暴露完整参数定义，减少 token 消耗
func FormatDeferredToolNames(names []string, toolDefs []ToolDefData) string {
	if len(names) == 0 {
		return ""
	}

	// 构建 name → description 的快速查找
	descMap := make(map[string]string, len(toolDefs))
	for _, t := range toolDefs {
		descMap[t.Name] = t.Description
	}

	var builder strings.Builder
	for i, name := range names {
		desc := descMap[name]
		if runes := []rune(desc); len(runes) > 60 {
			desc = string(runes[:57]) + "..."
		}
		if desc != "" {
			builder.WriteString(fmt.Sprintf("%d. %s — %s\n", i+1, name, desc))
		} else {
			builder.WriteString(fmt.Sprintf("%d. %s\n", i+1, name))
		}
	}
	return builder.String()
}
