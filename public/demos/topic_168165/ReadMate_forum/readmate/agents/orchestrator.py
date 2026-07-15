"""编排器 - 意图识别、任务拆解、调度子 Agent"""
from typing import Optional, Generator
from .base import BaseAgent, AgentContext, AgentResult
from ..core.logger import get_logger
from ..core.exceptions import AgentError

logger = get_logger(__name__)


class Orchestrator:
    """编排器：根据用户输入选择合适的 Agent"""

    def __init__(self):
        self._agents = {}

    def register_agent(self, agent: BaseAgent) -> None:
        """注册 Agent"""
        self._agents[agent.name] = agent
        logger.info(f"Agent 已注册: {agent.name}")

    def select_agent(self, context: AgentContext) -> BaseAgent:
        """根据上下文选择 Agent（当前只有 SelectionAgent）"""
        # 当前阶段：所有场景都用 SelectionAgent
        agent = self._agents.get("SelectionAgent")
        if not agent:
            raise AgentError("没有可用的 Agent")
        return agent

    def run(self, context: AgentContext) -> AgentResult:
        """编排执行"""
        agent = self.select_agent(context)
        return agent.safe_run(context)

    def run_stream(self, context: AgentContext) -> Generator[str, None, AgentResult]:
        """流式编排执行"""
        agent = self.select_agent(context)

        # 使用流式接口
        try:
            result = None
            for chunk in agent.run_stream(context):
                yield chunk

            # 如果 agent 没有返回 result，构造一个
            # 注意：run_stream 的 return 值在 yield 之后无法直接获取
            # 这里用 safe_run 兜底
            result = AgentResult(success=True, answer="")
            return result
        except Exception as e:
            logger.error(f"编排器流式执行失败: {e}")
            yield f"出错了: {e}"
            return AgentResult(success=False, error=str(e))


# 全局单例
_orchestrator: Optional[Orchestrator] = None


def get_orchestrator() -> Orchestrator:
    """获取全局编排器单例"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
        # 注册默认 Agent
        from .selection_agent import SelectionAgent
        _orchestrator.register_agent(SelectionAgent())
    return _orchestrator
