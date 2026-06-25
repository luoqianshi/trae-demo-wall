"""
Agent 适配器基类
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional
from dataclasses import dataclass


@dataclass
class AgentInfo:
    """Agent 信息"""
    name: str
    description: str
    available: bool
    version: Optional[str] = None


class BaseAdapter(ABC):
    """Agent 适配器基类"""
    
    def __init__(self, name: str):
        self.name = name
    
    @abstractmethod
    async def is_available(self) -> bool:
        """检查 Agent 是否可用"""
        pass
    
    @abstractmethod
    async def get_info(self) -> AgentInfo:
        """获取 Agent 信息"""
        pass
    
    @abstractmethod
    async def execute(self, prompt: str, cwd: str = ".") -> AsyncIterator[str]:
        """
        执行命令，流式返回输出
        
        Args:
            prompt: 用户输入
            cwd: 工作目录
        
        Yields:
            str: 输出内容（流式）
        """
        pass
    
    async def stop(self):
        """停止当前执行"""
        pass
