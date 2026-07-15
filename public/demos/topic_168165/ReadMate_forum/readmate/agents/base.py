"""Agent 抽象基类 - 统一接口"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Generator
from ..core.logger import get_logger
from ..core.exceptions import AgentError

logger = get_logger(__name__)


@dataclass
class AgentContext:
    """Agent 执行上下文"""
    selected_text: str = ""                    # 用户选中的文字
    action: str = ""                           # 预设动作（解释/翻译/总结/分析）
    custom_question: str = ""                  # 自定义提问
    conversation_history: List[Dict[str, str]] = field(default_factory=list)  # 对话历史
    screenshot: Optional[bytes] = None         # 当前屏幕截图
    recent_screenshots: List[bytes] = field(default_factory=list)  # 最近截图


@dataclass
class AgentResult:
    """Agent 执行结果"""
    success: bool
    answer: str = ""                           # 回答内容
    error: str = ""                            # 错误信息
    metadata: Dict[str, Any] = field(default_factory=dict)  # 元数据（耗时、token数等）


class BaseAgent(ABC):
    """所有 Agent 的抽象基类"""

    def __init__(self, name: str = ""):
        self.name = name or self.__class__.__name__

    @abstractmethod
    def run(self, context: AgentContext) -> AgentResult:
        """同步执行，返回完整结果"""
        ...

    def run_stream(self, context: AgentContext) -> Generator[str, None, AgentResult]:
        """流式执行，yield 文本片段，返回最终结果。子类可覆盖。"""
        result = self.run(context)
        if result.answer:
            yield result.answer
        return result

    def safe_run(self, context: AgentContext) -> AgentResult:
        """安全执行：捕获异常"""
        try:
            logger.info(f"Agent {self.name} 开始执行, action={context.action}")
            result = self.run(context)
            logger.info(f"Agent {self.name} 执行完成, success={result.success}")
            return result
        except Exception as e:
            logger.error(f"Agent {self.name} 执行失败: {e}")
            return AgentResult(success=False, error=str(e))
