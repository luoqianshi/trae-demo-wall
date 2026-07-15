"""
AI 调度服务
支持多个 LLM 提供商，统一使用 OpenAI 兼容 API 格式
"""

import json
import logging
import httpx
from typing import Optional

logger = logging.getLogger(__name__)

# 预设的提供商配置
PRESET_PROVIDERS = {
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "models": ["deepseek-chat", "deepseek-reasoner"],
        "default_model": "deepseek-chat",
    },
    "qwen": {
        "name": "通义千问",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "models": ["qwen-turbo", "qwen-plus", "qwen-max"],
        "default_model": "qwen-turbo",
    },
    "ernie": {
        "name": "文心一言",
        "base_url": "https://qianfan.baidubce.com/v2",
        "models": ["ernie-speed-128k", "ernie-lite-8k", "ernie-4.0-8k"],
        "default_model": "ernie-speed-128k",
    },
}


class AIService:
    """AI 调度服务，管理 LLM API 调用"""

    def __init__(self):
        self._provider: str = "deepseek"
        self._base_url: str = PRESET_PROVIDERS["deepseek"]["base_url"]
        self._model: str = PRESET_PROVIDERS["deepseek"]["default_model"]
        self._api_key: str = ""
        self._enabled: bool = False

    @property
    def is_configured(self) -> bool:
        return self._enabled and bool(self._api_key)

    def configure(self, provider: str, api_key: str, model: Optional[str] = None, base_url: Optional[str] = None):
        """配置 AI 服务"""
        self._api_key = api_key
        self._enabled = True

        if provider in PRESET_PROVIDERS:
            self._provider = provider
            preset = PRESET_PROVIDERS[provider]
            self._base_url = base_url or preset["base_url"]
            self._model = model or preset["default_model"]
        else:
            # 自定义提供商
            self._provider = provider
            self._base_url = base_url or "https://api.openai.com/v1"
            self._model = model or "gpt-3.5-turbo"

    def get_config(self) -> dict:
        """获取当前配置"""
        return {
            "provider": self._provider,
            "base_url": self._base_url,
            "model": self._model,
            "api_key_set": bool(self._api_key),
            "enabled": self._enabled,
        }

    def get_presets(self) -> dict:
        """获取所有预设提供商信息（不包含 api_key）"""
        return PRESET_PROVIDERS

    async def chat(self, messages: list[dict], temperature: float = 0.7, max_tokens: int = 2000) -> str:
        """
        发送聊天请求

        Args:
            messages: 消息列表 [{"role": "system/user/assistant", "content": "..."}]
            temperature: 温度参数
            max_tokens: 最大 token 数

        Returns:
            AI 回复文本

        Raises:
            RuntimeError: AI 未配置或请求失败
        """
        if not self.is_configured:
            raise RuntimeError("AI 服务未配置，请先在设置中填入 API Key")

        url = f"{self._base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except httpx.TimeoutException:
            raise RuntimeError("AI 请求超时，请检查网络连接")
        except httpx.HTTPStatusError as e:
            detail = ""
            try:
                detail = e.response.json().get("error", {}).get("message", str(e))
            except Exception:
                detail = str(e)
            raise RuntimeError(f"AI 请求失败: {detail}")
        except Exception as e:
            raise RuntimeError(f"AI 请求异常: {e}")

    async def analyze_note(self, title: str, content: str) -> dict:
        """
        分析笔记内容，提取待办事项、时间信息、关键主题

        Returns:
            {"todos": [...], "schedule_items": [...], "topics": [...], "summary": "..."}
        """
        system_prompt = """你是一个个人助手，帮助用户分析笔记内容。请从用户的笔记中提取以下信息，以 JSON 格式返回：

{
  "todos": ["待办事项1", "待办事项2"],
  "schedule_items": [{"content": "日程内容", "datetime": "2024-01-15 14:00"}],
  "topics": ["主题1", "主题2"],
  "summary": "一句话摘要"
}

规则：
1. todos: 从文本中识别明确的待办、承诺、约定
2. schedule_items: 识别包含时间信息的条目，datetime 尽量提取原文中的时间表达
3. topics: 提取 1-5 个关键主题/话题
4. summary: 用一句话概括这条笔记的核心内容
5. 如果某项提取不到，返回空数组
6. 只返回 JSON，不要其他文字"""

        user_prompt = f"标题：{title}\n\n内容：{content}"

        try:
            result = await self.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
            )
            # 尝试解析 JSON
            result = result.strip()
            if result.startswith("```"):
                # 去掉 markdown 代码块
                lines = result.split("\n")
                result = "\n".join(lines[1:-1])
            return json.loads(result)
        except json.JSONDecodeError:
            return {"todos": [], "schedule_items": [], "topics": [], "summary": result}
        except RuntimeError:
            return {"todos": [], "schedule_items": [], "topics": [], "summary": "AI 分析不可用"}

    async def generate_tags(self, title: str, content: str) -> list[str]:
        """为笔记自动生成标签建议"""
        system_prompt = """为以下笔记生成 2-5 个标签，以 JSON 数组格式返回，如 ["标签1", "标签2"]。只返回 JSON 数组，不要其他文字。"""
        user_prompt = f"标题：{title}\n内容：{content}"

        try:
            result = await self.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.5,
                max_tokens=200,
            )
            result = result.strip()
            if result.startswith("```"):
                lines = result.split("\n")
                result = "\n".join(lines[1:-1])
            tags = json.loads(result)
            return tags if isinstance(tags, list) else []
        except Exception:
            return []


# 全局单例
ai_service = AIService()