package processor

import (
	"testing"

	"YaraFlow/internal/config"
	"YaraFlow/internal/processor/tool"
)

func TestExecutorCheckNoExecutor(t *testing.T) {
	te := &tool.ToolExecutor{}
	if te.GetBuiltinTools() != nil {
		t.Error("expected no executor configured")
	}
}

func TestExecutorCheckWithPlugin(t *testing.T) {
	te := &tool.ToolExecutor{}
	te.SetPluginExecutor(&mockPluginExecutor{})
	// 插件执行器已设置，通过 GetBuiltinTools 检查
	if te.GetBuiltinTools() != nil {
		t.Error("expected no builtin tools configured")
	}
}

func TestExecutorCheckWithBuiltinOnly(t *testing.T) {
	te := tool.NewToolExecutor(nil, nil)
	te.SetBuiltinTools(tool.NewBuiltinToolRegistry(nil))
	if te.GetBuiltinTools() == nil {
		t.Error("expected builtinTools configured")
	}
}

type mockPluginExecutor struct{}

func (m *mockPluginExecutor) ExecuteTool(pluginID string, toolName string, params map[string]interface{}) (interface{}, error) {
	return nil, nil
}
func (m *mockPluginExecutor) FindPluginByToolName(toolName string) (string, error) {
	return "", nil
}
func (m *mockPluginExecutor) SearchTools(query string) []config.ToolDefData {
	return nil
}
func (m *mockPluginExecutor) ExecuteAction(pluginID string, actionName string, params map[string]interface{}) (interface{}, error) {
	return nil, nil
}
func (m *mockPluginExecutor) FindPluginByActionName(actionName string) (string, error) {
	return "", nil
}