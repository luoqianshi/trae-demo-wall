package tool

import (
	"encoding/json"
	"fmt"
	"strings"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
)

// SelectTool 由工具模型选择具体工具和参数
func (te *ToolExecutor) SelectTool(
	toolDefs []config.ToolDefData,
	processedMsg *platform.ProcessedMessage,
	conversationContext string,
) (string, map[string]interface{}, error) {
	if len(toolDefs) == 0 {
		return "", nil, fmt.Errorf("没有可用的工具定义")
	}

	// 优先尝试原生 Function Calling（效率高、参数准确）
	if te.toolLLMProvider != nil {
		if fcProvider, ok := te.toolLLMProvider.(llm.ToolCallingProvider); ok {
			name, args, err := te.selectToolWithNativeFC(fcProvider, toolDefs, processedMsg, conversationContext)
			if err == nil {
				return name, args, nil
			}
			logger.Sugar.Warnw("[工具选择] 原生 FC 失败，降级到文本模式", "error", err)
		}
		// 文本模式降级
		return te.selectToolWithText(toolDefs, processedMsg, conversationContext)
	}

	return "", nil, fmt.Errorf("工具模型未配置")
}

// selectToolWithText 文本模式：给 LLM 列出所有工具，让它选
func (te *ToolExecutor) selectToolWithText(
	toolDefs []config.ToolDefData,
	processedMsg *platform.ProcessedMessage,
	conversationContext string,
) (string, map[string]interface{}, error) {
	toolsSection := config.FormatToolsForPrompt(toolDefs)

	systemPrompt := fmt.Sprintf(`你是工具选择助手。根据对话上下文，从可用工具中选择最合适的一个并填写参数。

可用工具：
%s

只需返回 JSON，不要其他内容：
{"tool_name":"工具名","tool_args":{"参数":"值"}}`, toolsSection)

	senderName := processedMsg.OriginalMessage.SenderName
	if senderName == "" {
		senderName = processedMsg.OriginalMessage.SenderID
	}

	userPrompt := fmt.Sprintf(`对话上下文：
%s

当前消息（发送者：%s）：
%s

请选择最合适的工具。`, conversationContext, senderName, processedMsg.Content)

	if te.toolLLMProvider == nil {
		return "", nil, fmt.Errorf("工具模型未配置")
	}

	response, err := te.toolLLMProvider.Chat([]llm.ChatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	})
	if err != nil {
		return "", nil, fmt.Errorf("工具选择 LLM 调用失败: %w", err)
	}

	var result struct {
		ToolName string                 `json:"tool_name"`
		ToolArgs map[string]interface{} `json:"tool_args"`
	}

	jsonStr := response
	start := strings.Index(response, "{")
	end := strings.LastIndex(response, "}")
	if start != -1 && end > start {
		jsonStr = response[start : end+1]
	}

	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return "", nil, fmt.Errorf("工具选择 JSON 解析失败: %w, raw=%s", err, response[:min(len(response), 200)])
	}
	if result.ToolName == "" {
		return "", nil, fmt.Errorf("工具模型未选择任何工具")
	}

	return result.ToolName, result.ToolArgs, nil
}

// selectToolWithNativeFC 原生 Function Calling 模式：让模型直接调用 function
func (te *ToolExecutor) selectToolWithNativeFC(
	provider llm.ToolCallingProvider,
	toolDefs []config.ToolDefData,
	processedMsg *platform.ProcessedMessage,
	conversationContext string,
) (string, map[string]interface{}, error) {
	var nativeTools []llm.ToolDefinition
	for _, t := range toolDefs {
		if t.Visibility == "deferred" {
			continue
		}
		props := make(map[string]llm.ToolParamProp)
		required := make([]string, 0)
		for _, p := range t.Parameters {
			props[p.Name] = llm.ToolParamProp{
				Type:        p.Type,
				Description: p.Description,
			}
			if p.Required {
				required = append(required, p.Name)
			}
		}
		nativeTools = append(nativeTools, llm.ToolDefinition{
			Type: "function",
			Function: llm.ToolFunctionSchema{
				Name:        t.Name,
				Description: t.Description,
				Parameters: llm.ToolParameters{
					Type:       "object",
					Properties: props,
					Required:   required,
				},
			},
		})
	}

	senderName := processedMsg.OriginalMessage.SenderName
	if senderName == "" {
		senderName = processedMsg.OriginalMessage.SenderID
	}

	userPrompt := fmt.Sprintf("对话上下文：\n%s\n\n当前消息（发送者：%s）：\n%s\n\n请根据上下文选择最合适的工具。",
		conversationContext, senderName, processedMsg.Content)

	resp, err := provider.ChatWithTools([]llm.ChatMessage{
		{Role: "system", Content: "你是工具选择助手，根据对话上下文选择合适的工具并调用它。"},
		{Role: "user", Content: userPrompt},
	}, nativeTools)
	if err != nil {
		return "", nil, err
	}

	if len(resp.ToolCalls) == 0 {
		return "", nil, fmt.Errorf("工具模型未选择任何工具")
	}

	tc := resp.ToolCalls[0]
	var args map[string]interface{}
	if err := json.Unmarshal([]byte(tc.Function.Arguments), &args); err != nil {
		return "", nil, fmt.Errorf("工具参数解析失败: %w", err)
	}

	return tc.Function.Name, args, nil
}