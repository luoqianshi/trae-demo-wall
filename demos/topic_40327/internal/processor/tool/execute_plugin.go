package tool

import (
	"fmt"

	"YaraFlow/internal/processor/types"
)

// executePluginToolByName 按指定工具名执行插件工具
func (te *ToolExecutor) executePluginToolByName(toolName string, toolArgs map[string]interface{}) ([]types.ToolResult, error) {
	pluginID, err := te.pluginExecutor.FindPluginByToolName(toolName)
	if err != nil {
		return nil, err
	}
	result, err := te.pluginExecutor.ExecuteTool(pluginID, toolName, toolArgs)
	if err != nil {
		return nil, err
	}
	resultStr := fmt.Sprintf("%v", result)
	return []types.ToolResult{{
		Success:  true,
		ToolName: toolName,
		Result:   resultStr,
	}}, nil
}