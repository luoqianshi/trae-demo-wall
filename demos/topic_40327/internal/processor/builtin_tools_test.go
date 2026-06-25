package processor

import (
	"testing"

	"YaraFlow/internal/processor/tool"
)

// 注意：parseLimitArg 现在是 tool 包中的未导出函数，无法直接测试。
// 如需测试，请将测试移至 tool 包中。

func TestNewBuiltinToolRegistry(t *testing.T) {
	registry := tool.NewBuiltinToolRegistry(nil)
	if registry == nil {
		t.Error("expected non-nil registry")
	}
	tools := registry.GetToolDefinitions()
	if len(tools) == 0 {
		t.Error("expected at least tool_search to be registered")
	}
}

func TestBuiltinToolRegistryHasTool(t *testing.T) {
	registry := tool.NewBuiltinToolRegistry(nil)
	if !registry.HasTool("tool_search") {
		t.Error("expected tool_search to be registered")
	}
	if registry.HasTool("nonexistent") {
		t.Error("expected nonexistent tool to not be found")
	}
}

func TestBuiltinToolRegistryGetDeferredToolNames(t *testing.T) {
	registry := tool.NewBuiltinToolRegistry(nil)
	names := registry.GetDeferredToolNames()
	// 取决于配置，deferred tools 数量可能为 0
	// 只验证不 panic，不做数量断言
	_ = names
}

func TestBuiltinToolRegistryGetVisibleToolDefinitions(t *testing.T) {
	registry := tool.NewBuiltinToolRegistry(nil)
	defs := registry.GetVisibleToolDefinitions()
	if len(defs) == 0 {
		t.Error("expected at least tool_search in visible definitions")
	}
	found := false
	for _, d := range defs {
		if d.Name == "tool_search" {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected tool_search in visible definitions")
	}
}
