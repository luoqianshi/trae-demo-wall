"""剪贴板工具 - 读取/写入剪贴板"""
from typing import Any, Dict
from .base import ToolBase


class ClipboardTool(ToolBase):
    """剪贴板操作工具"""
    
    @property
    def name(self) -> str:
        return "clipboard"
    
    @property
    def description(self) -> str:
        return "读取或写入系统剪贴板。读取剪贴板内容，或将文本复制到剪贴板。"
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["read", "write"],
                    "description": "read=读取剪贴板, write=写入剪贴板"
                },
                "text": {
                    "type": "string",
                    "description": "要写入的文本（action=write时必填）"
                }
            },
            "required": ["action"]
        }
    
    def execute(self, action: str, text: str = "") -> str:
        """执行剪贴板操作"""
        try:
            import pyperclip
            if action == "read":
                content = pyperclip.paste() or ""
                return f"剪贴板内容: {content[:500]}"
            elif action == "write":
                if not text:
                    return "写入剪贴板失败: 缺少 text 参数"
                pyperclip.copy(text)
                return f"已复制到剪贴板: {text[:100]}"
            else:
                return f"未知操作: {action}"
        except Exception as e:
            return f"剪贴板操作失败: {e}"
