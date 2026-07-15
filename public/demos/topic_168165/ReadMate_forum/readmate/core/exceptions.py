"""ReadMate 异常体系

分级设计，所有异常均继承自 ReadMateError。
每个异常带 message 和可选的 cause。
"""
from typing import Optional


class ReadMateError(Exception):
    """所有 ReadMate 异常的基类。"""

    def __init__(self, message: str = "", cause: Optional[BaseException] = None) -> None:
        super().__init__(message)
        self.message = message
        self.cause = cause

    def __str__(self) -> str:
        if self.cause is not None:
            return f"{self.message} (cause: {self.cause})"
        return self.message


class ConfigError(ReadMateError):
    """配置相关错误。"""


class AgentError(ReadMateError):
    """Agent 执行错误。"""


class ToolError(ReadMateError):
    """工具调用错误。"""


class LLMError(ReadMateError):
    """LLM 调用错误。"""


class ValidationError(ReadMateError):
    """输出验证错误。"""
