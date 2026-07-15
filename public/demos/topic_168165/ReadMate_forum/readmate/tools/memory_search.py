"""屏幕记忆搜索工具 - 查看当前可用的屏幕记忆截图

当前屏幕记忆以最近N张截图形式存储，无法做文本搜索，
但可以告知 LLM 当前有多少张可用截图，LLM 可以通过 recent_screenshots 参数直接看到它们。
"""
import logging
from typing import Any, Dict
from .base import ToolBase

logger = logging.getLogger(__name__)


class MemorySearchTool(ToolBase):
    """查看屏幕记忆状态（可用截图数量）"""

    @property
    def name(self) -> str:
        return "memory_status"

    @property
    def description(self) -> str:
        return "查看当前屏幕记忆状态：返回已捕获的截图数量和时间间隔。当用户问'你能看到什么'、'你记得我看过什么'时调用。"

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {},
        }

    def execute(self, **kwargs) -> str:
        try:
            from ..app import get_memory
            mem = get_memory()
            if mem is None:
                return "屏幕记忆功能未启动。"
            recent = mem.get_recent(3)
            count = len(mem.get_recent(100))
            return (
                f"屏幕记忆已启动。当前缓存了 {count} 张截图，每 {mem.interval:.0f} 秒截取一次。"
                f"最近的 {len(recent)} 张截图已作为上下文提供给你，可以直接基于这些截图内容回答用户问题。"
            )
        except Exception as e:
            logger.error(f"memory_status 工具执行失败: {e}")
            return f"查询屏幕记忆状态失败: {e}"
