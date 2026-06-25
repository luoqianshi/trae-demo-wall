package tool

import (
	"fmt"

	"YaraFlow/internal/processor/types"
)

// executeBuiltinToolByName 按指定工具名执行内置工具
func (te *ToolExecutor) executeBuiltinToolByName(_ *types.DecisionResult, toolName string, toolArgs map[string]interface{}) ([]types.ToolResult, error) {
	resultStr, err := te.builtinTools.Execute(toolName, toolArgs, te.builtinToolCtx)
	if err != nil {
		return nil, err
	}
	return []types.ToolResult{{
		Success:  true,
		ToolName: toolName,
		Result:   resultStr,
	}}, nil
}

// ExecuteActionByName 按action名称执行（新接口，不需要 DecisionResult）
func (te *ToolExecutor) ExecuteActionByName(actionName string, params map[string]interface{}) ([]types.ToolResult, error) {
	if te.pluginExecutor == nil {
		return nil, fmt.Errorf("插件执行器未配置")
	}
	if actionName == "" {
		return nil, nil
	}
	pluginID, err := te.pluginExecutor.FindPluginByActionName(actionName)
	if err != nil {
		return nil, fmt.Errorf("找不到action %s 对应的插件: %w", actionName, err)
	}
	if params == nil {
		params = make(map[string]interface{})
	}
	result, err := te.pluginExecutor.ExecuteAction(pluginID, actionName, params)
	if err != nil {
		return nil, fmt.Errorf("插件 %s action %s 执行失败: %w", pluginID, actionName, err)
	}
	resultStr := fmt.Sprintf("%v", result)
	return []types.ToolResult{{
		Success:  true,
		ToolName: actionName,
		Result:   resultStr,
	}}, nil
}