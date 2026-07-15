"""工具层测试"""
import pytest
from readmate.tools import ToolRegistry, get_tool_registry, MemorySearchTool, ClipboardTool


def test_tool_registry():
    """测试工具注册表"""
    registry = ToolRegistry()
    tool = ClipboardTool()
    registry.register(tool)
    assert registry.get("clipboard") is tool
    assert registry.get("nonexistent") is None


def test_tool_list():
    """测试工具列表"""
    registry = ToolRegistry()
    registry.register(ClipboardTool())
    tools = registry.list_tools()
    assert len(tools) == 1
    assert tools[0]["name"] == "clipboard"
    assert "description" in tools[0]
    assert "parameters" in tools[0]


def test_clipboard_write_read():
    """测试剪贴板工具"""
    tool = ClipboardTool()
    result = tool.safe_execute(action="write", text="hello_test")
    assert "已复制" in result
    result = tool.safe_execute(action="read")
    assert "hello_test" in result


def test_tool_not_found():
    """测试不存在的工具"""
    registry = ToolRegistry()
    result = registry.execute("nonexistent")
    assert "不存在" in result


def test_global_registry():
    """测试全局注册表"""
    registry = get_tool_registry()
    registry.register(MemorySearchTool())
    registry.register(ClipboardTool())
    tools = registry.list_tools()
    names = [t["name"] for t in tools]
    assert "memory_status" in names
    assert "clipboard" in names
