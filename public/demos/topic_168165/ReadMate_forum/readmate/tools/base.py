"""工具基类与注册表 - 可插拔工具系统"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from ..core.logger import get_logger

logger = get_logger(__name__)


class ToolBase(ABC):
    """所有工具的抽象基类"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """工具名称（唯一标识）"""
        ...
    
    @property
    @abstractmethod
    def description(self) -> str:
        """工具描述（供 AI 理解用途）"""
        ...
    
    @property
    def parameters(self) -> Dict[str, Any]:
        """参数 schema（供 function calling 使用）"""
        return {}
    
    @abstractmethod
    def execute(self, **kwargs) -> str:
        """执行工具，返回结果字符串"""
        ...
    
    def safe_execute(self, **kwargs) -> str:
        """安全执行：捕获异常，返回错误信息而非抛出"""
        try:
            logger.info(f"工具调用: {self.name} 参数: {kwargs}")
            result = self.execute(**kwargs)
            logger.info(f"工具 {self.name} 执行成功, 结果长度: {len(result)}")
            return result
        except Exception as e:
            logger.error(f"工具 {self.name} 执行失败: {e}")
            return f"工具执行失败: {e}"


class ToolRegistry:
    """工具注册表 - 管理所有可用工具"""
    
    def __init__(self):
        self._tools: Dict[str, ToolBase] = {}
    
    def register(self, tool: ToolBase) -> None:
        """注册工具"""
        self._tools[tool.name] = tool
        logger.info(f"工具已注册: {tool.name}")
    
    def unregister(self, name: str) -> None:
        """注销工具"""
        if name in self._tools:
            del self._tools[name]
            logger.info(f"工具已注销: {name}")
    
    def get(self, name: str) -> Optional[ToolBase]:
        """获取工具"""
        return self._tools.get(name)
    
    def list_tools(self) -> List[Dict[str, Any]]:
        """列出所有工具的描述（供 AI function calling）"""
        return [
            {
                "name": t.name,
                "description": t.description,
                "parameters": t.parameters,
            }
            for t in self._tools.values()
        ]
    
    def execute(self, name: str, **kwargs) -> str:
        """按名称执行工具"""
        tool = self.get(name)
        if not tool:
            return f"工具不存在: {name}"
        return tool.safe_execute(**kwargs)


# 全局单例
_registry: Optional[ToolRegistry] = None


def get_tool_registry() -> ToolRegistry:
    """获取全局工具注册表单例"""
    global _registry
    if _registry is None:
        _registry = ToolRegistry()
    return _registry
