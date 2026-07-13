"""
Ollama客户端实现
支持本地Ollama服务调用
"""
import requests
import time
from typing import Optional, Dict, Any
from .llm_client import LLMClient, LLMResponse, LLMException, LLMTimeoutException, LLMConnectionException, LLMResponseException
import logging

logger = logging.getLogger(__name__)


class OllamaClient(LLMClient):
    """
    Ollama客户端实现
    支持本地Ollama服务的调用
    """

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "qwen2.5-coder:7b",
                 timeout: int = 30, max_retries: int = 2):
        """
        初始化Ollama客户端

        Args:
            base_url: Ollama服务地址
            model: 模型名称
            timeout: 超时时间（秒）
            max_retries: 最大重试次数
        """
        super().__init__(model=model, timeout=timeout, max_retries=max_retries)
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api/generate"

    def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> LLMResponse:
        """
        调用Ollama生成文本

        Args:
            prompt: 用户提示词
            system_prompt: 系统提示词（可选）
            **kwargs: 其他参数
                - temperature: 温度参数（0-1）
                - max_tokens: 最大生成token数
                - stream: 是否流式输出（默认False）

        Returns:
            LLMResponse: 统一的响应对象

        Raises:
            LLMException: 调用失败时抛出
        """
        try:
            return self._retry_on_failure(self._do_generate, prompt, system_prompt, **kwargs)
        except Exception as e:
            logger.error(f"Ollama generate failed after retries: {str(e)}")
            raise

    def _do_generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> LLMResponse:
        """
        实际执行生成请求

        Args:
            prompt: 用户提示词
            system_prompt: 系统提示词（可选）
            **kwargs: 其他参数

        Returns:
            LLMResponse: 统一的响应对象
        """
        start_time = time.time()

        # 构建请求体
        request_body = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,  # 不使用流式输出
            "options": {}
        }

        # 添加系统提示词
        if system_prompt:
            request_body["system"] = system_prompt

        # 添加可选参数
        if "temperature" in kwargs:
            request_body["options"]["temperature"] = kwargs["temperature"]
        if "max_tokens" in kwargs:
            request_body["options"]["num_predict"] = kwargs["max_tokens"]

        try:
            # 发送请求
            response = requests.post(
                self.api_url,
                json=request_body,
                timeout=self.timeout
            )

            # 检查HTTP状态码
            if response.status_code != 200:
                raise LLMResponseException(
                    f"Ollama API returned status {response.status_code}: {response.text}"
                )

            # 解析响应
            response_data = response.json()

            # 计算延迟
            latency_ms = int((time.time() - start_time) * 1000)

            # 提取生成的文本
            generated_text = response_data.get("response", "")
            if not generated_text:
                raise LLMResponseException("Ollama returned empty response")

            # 提取token使用情况（如果有）
            token_usage = None
            if "eval_count" in response_data:
                token_usage = {
                    "prompt_tokens": response_data.get("prompt_eval_count", 0),
                    "completion_tokens": response_data.get("eval_count", 0),
                    "total_tokens": response_data.get("prompt_eval_count", 0) + response_data.get("eval_count", 0)
                }

            logger.info(f"Ollama generate success: model={self.model}, latency={latency_ms}ms, "
                       f"tokens={token_usage.get('total_tokens', 0) if token_usage else 0}")

            return LLMResponse(
                text=generated_text,
                latency_ms=latency_ms,
                token_usage=token_usage,
                raw=response_data,
                model=self.model
            )

        except requests.exceptions.Timeout:
            raise LLMTimeoutException(f"Ollama request timeout after {self.timeout} seconds")
        except requests.exceptions.ConnectionError as e:
            raise LLMConnectionException(f"Failed to connect to Ollama at {self.base_url}: {str(e)}")
        except requests.exceptions.RequestException as e:
            raise LLMException(f"Ollama request failed: {str(e)}")
        except Exception as e:
            raise LLMException(f"Unexpected error during Ollama generate: {str(e)}")

    def check_health(self) -> bool:
        """
        检查Ollama服务是否可用

        Returns:
            bool: 服务是否可用
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False

    def list_models(self) -> list:
        """
        列出可用的模型

        Returns:
            list: 模型列表
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                return [model["name"] for model in data.get("models", [])]
            return []
        except:
            return []
