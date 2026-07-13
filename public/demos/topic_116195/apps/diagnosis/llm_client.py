"""
LLM客户端抽象层
提供统一的LLM调用接口，屏蔽不同厂商的差异
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
import time


@dataclass
class LLMResponse:
    """LLM响应统一数据结构"""
    text: str                    # 生成的文本
    latency_ms: int             # 响应延迟（毫秒）
    token_usage: Optional[Dict[str, int]] = None  # Token使用情况（可选）
    raw: Optional[Dict[str, Any]] = None          # 原始响应数据（可选）
    model: Optional[str] = None                   # 实际使用的模型名称


class LLMClient(ABC):
    """
    LLM客户端抽象基类
    所有LLM客户端都应继承此类并实现generate方法
    """

    def __init__(self, model: str, timeout: int = 30, max_retries: int = 2):
        """
        初始化LLM客户端

        Args:
            model: 模型名称
            timeout: 超时时间（秒）
            max_retries: 最大重试次数
        """
        self.model = model
        self.timeout = timeout
        self.max_retries = max_retries

    @abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> LLMResponse:
        """
        生成文本（抽象方法，子类必须实现）

        Args:
            prompt: 用户提示词
            system_prompt: 系统提示词（可选）
            **kwargs: 其他参数（如temperature、max_tokens等）

        Returns:
            LLMResponse: 统一的响应对象

        Raises:
            LLMException: LLM调用失败时抛出
        """
        pass

    def _retry_on_failure(self, func, *args, **kwargs):
        """
        失败重试装饰器

        Args:
            func: 要执行的函数
            *args, **kwargs: 函数参数

        Returns:
            函数执行结果

        Raises:
            最后一次失败的异常
        """
        last_exception = None
        for attempt in range(self.max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries:
                    # 等待一段时间后重试（指数退避）
                    wait_time = 2 ** attempt
                    time.sleep(wait_time)
                    continue
                else:
                    raise last_exception


class LLMException(Exception):
    """LLM调用异常基类"""
    pass


class LLMTimeoutException(LLMException):
    """LLM调用超时异常"""
    pass


class LLMConnectionException(LLMException):
    """LLM连接异常"""
    pass


class LLMResponseException(LLMException):
    """LLM响应异常"""
    pass
