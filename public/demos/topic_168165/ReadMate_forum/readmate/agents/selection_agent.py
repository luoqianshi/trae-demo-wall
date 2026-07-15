"""选区 Agent - 处理用户选中文字后的提问"""
from typing import Generator
from .base import BaseAgent, AgentContext, AgentResult
from ..core.logger import get_logger

logger = get_logger(__name__)


class SelectionAgent(BaseAgent):
    """处理选中文字的 Agent"""

    def __init__(self):
        super().__init__(name="SelectionAgent")

    def run(self, context: AgentContext) -> AgentResult:
        """同步执行（非流式）"""
        try:
            from ..services.llm import LLMService
            llm = LLMService()

            if context.custom_question:
                answer = llm.ask_custom(
                    selected_text=context.selected_text,
                    custom_question=context.custom_question,
                    screenshot=context.screenshot,
                )
            else:
                answer = llm.ask(
                    selected_text=context.selected_text,
                    action=context.action,
                    screenshot=context.screenshot,
                )

            return AgentResult(success=True, answer=answer)
        except Exception as e:
            logger.error(f"SelectionAgent 执行失败: {e}")
            return AgentResult(success=False, error=str(e))

    def run_stream(self, context: AgentContext) -> Generator[str, None, AgentResult]:
        """流式执行"""
        try:
            from ..services.llm import LLMService
            llm = LLMService()

            full_answer = ""

            if context.custom_question:
                stream = llm.ask_custom_stream(
                    selected_text=context.selected_text,
                    custom_question=context.custom_question,
                    screenshot=context.screenshot,
                )
            else:
                stream = llm.ask_stream(
                    selected_text=context.selected_text,
                    action=context.action,
                    screenshot=context.screenshot,
                )

            for chunk in stream:
                full_answer += chunk
                yield chunk

            return AgentResult(success=True, answer=full_answer)
        except Exception as e:
            logger.error(f"SelectionAgent 流式执行失败: {e}")
            yield f"出错了: {e}"
            return AgentResult(success=False, error=str(e))

    def run_followup_stream(self, context: AgentContext, question: str) -> Generator[str, None, AgentResult]:
        """追问流式执行"""
        try:
            from ..services.llm import LLMService
            llm = LLMService()

            full_answer = ""
            for chunk in llm.ask_followup_stream(
                selected_text=context.selected_text,
                conversation_history=context.conversation_history,
                followup_question=question,
                screenshot=context.screenshot,
            ):
                full_answer += chunk
                yield chunk

            return AgentResult(success=True, answer=full_answer)
        except Exception as e:
            logger.error(f"SelectionAgent 追问执行失败: {e}")
            yield f"出错了: {e}"
            return AgentResult(success=False, error=str(e))
