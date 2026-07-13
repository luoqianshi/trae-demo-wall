# -*- coding: utf-8 -*-
"""
文件：llm_service.py
说明：墨问 · 大语言模型集成服务
      支持多种 OpenAI 兼容的 LLM 提供商（DeepSeek、通义千问、智谱GLM、月之暗面、OpenAI），
      自动检测可用的 API Key 并选择提供商，使用 httpx 直接发送 HTTP 请求（避免依赖 openai 包）。
      核心功能：根据角色系统提示词和用户提问，生成三层结构回答（原文 / 白话 / 解读）。

      设计说明：
        - API Key 优先从环境变量读取，其次从配置文件读取（.env 或 llm_config.json）
        - 使用 httpx 异步发送请求，兼容所有 OpenAI 接口格式的提供商
        - 若 LLM 不可用或调用失败，返回 None，调用方可回退到语料库匹配
        - 支持 streaming 流式输出，用于前端打字机效果
"""

import os
import json
import re
import logging
from typing import Optional, AsyncGenerator

import httpx

# ============================================================
# 日志配置
# ============================================================
logger = logging.getLogger("mowen.llm_service")

# ============================================================
# 后端目录路径（用于定位配置文件）
# ============================================================
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ============================================================
# LLM 提供商配置
# 每个提供商包含：
#   - name:       显示名称
#   - base_url:   API 基础 URL（OpenAI 兼容格式）
#   - model:      默认模型名称
#   - api_key_env: 对应的环境变量名
# ============================================================
LLM_PROVIDERS = {
    "doubao": {
        "name": "豆包",
        "base_url": "https://ark.cn-beijing.volces.com/api/v3",
        "model": os.environ.get("DOUBAO_MODEL_ID", "ep-2025xxxxxxxxxxx"),  # 优先从环境变量读取，否则使用占位符
        "api_key_env": "DOUBAO_API_KEY",
        "free": True,
        "free_quota": "每日200万Tokens（每日刷新，永久免费）",
    },
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
        "api_key_env": "DEEPSEEK_API_KEY",
    },
    "qwen": {
        "name": "通义千问",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "model": "qwen-plus",
        "api_key_env": "QWEN_API_KEY",
    },
    "zhipu": {
        "name": "智谱GLM",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "model": "glm-4",
        "api_key_env": "ZHIPU_API_KEY",
    },
    "moonshot": {
        "name": "月之暗面",
        "base_url": "https://api.moonshot.cn/v1",
        "model": "moonshot-v1-8k",
        "api_key_env": "MOONSHOT_API_KEY",
    },
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
        "api_key_env": "OPENAI_API_KEY",
    },
}

# 提供商优先级（按顺序检测 API Key）
# 豆包排第一，因为它免费且中文对话质量好
PROVIDER_PRIORITY = ["doubao", "deepseek", "qwen", "zhipu", "moonshot", "openai"]


# ============================================================
# LLM 集成服务类
# ============================================================
class LLMService:
    """
    大语言模型集成服务。
    自动检测可用的 LLM 提供商，使用 httpx 发送 OpenAI 兼容格式的请求。
    """

    def __init__(self):
        self.provider = None          # 提供商键名（如 "deepseek"）
        self.provider_name = None     # 提供商显示名称（如 "DeepSeek"）
        self.api_key = None           # API Key
        self.base_url = None          # API 基础 URL
        self.model = None             # 模型名称
        self.client = None            # httpx.AsyncClient 实例（延迟初始化）
        self._config_cache = None     # 配置文件缓存
        self._init_provider()

    # ========================================================
    # 配置文件加载
    # ========================================================

    def _load_config_files(self) -> dict:
        """
        从配置文件加载 API Key。
        支持两种格式：
          1. .env 文件 —— KEY=VALUE 格式
          2. llm_config.json —— JSON 格式，支持 {"KEY": "value"} 或 {"provider": {"api_key": "..."}}
        结果缓存，避免重复读取文件。
        """
        if self._config_cache is not None:
            return self._config_cache

        config = {}

        # ---- 1. 加载 .env 文件 ----
        env_path = os.path.join(_BACKEND_DIR, ".env")
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        # 跳过空行和注释
                        if not line or line.startswith("#"):
                            continue
                        if "=" in line:
                            key, _, value = line.partition("=")
                            key = key.strip()
                            value = value.strip().strip('"').strip("'")
                            if key and value:
                                config[key] = value
                logger.info(f"已加载配置文件: {env_path}")
            except Exception as e:
                logger.warning(f"读取 .env 文件失败: {e}")

        # ---- 2. 加载 llm_config.json 文件 ----
        json_path = os.path.join(_BACKEND_DIR, "llm_config.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    json_config = json.load(f)
                # 兼容两种格式：扁平的 KEY-VALUE 或嵌套的 provider 配置
                for key, value in json_config.items():
                    if isinstance(value, str):
                        # 扁平格式：{"DEEPSEEK_API_KEY": "sk-xxx"}
                        config[key] = value
                    elif isinstance(value, dict):
                        # 嵌套格式：{"deepseek": {"api_key": "sk-xxx", "model": "..."}}
                        env_name = LLM_PROVIDERS.get(key, {}).get("api_key_env")
                        api_key = value.get("api_key") or value.get("key")
                        if env_name and api_key:
                            config[env_name] = api_key
                        # 同时支持自定义 model 覆盖
                        custom_model = value.get("model")
                        if custom_model and key in LLM_PROVIDERS:
                            LLM_PROVIDERS[key]["model"] = custom_model
                logger.info(f"已加载配置文件: {json_path}")
            except Exception as e:
                logger.warning(f"读取 llm_config.json 文件失败: {e}")

        self._config_cache = config
        return config

    def _get_api_key(self, provider_key: str) -> Optional[str]:
        """
        获取指定提供商的 API Key。
        优先从环境变量读取，其次从配置文件读取。
        """
        provider_config = LLM_PROVIDERS.get(provider_key)
        if not provider_config:
            return None

        env_name = provider_config["api_key_env"]

        # 1. 先检查环境变量
        api_key = os.environ.get(env_name)
        if api_key:
            return api_key

        # 2. 再检查配置文件
        config = self._load_config_files()
        api_key = config.get(env_name)
        if api_key:
            return api_key

        return None

    # ========================================================
    # 提供商初始化
    # ========================================================

    def _init_provider(self):
        """
        自动检测可用的 LLM 提供商。
        按优先级顺序检查各提供商的 API Key，选择第一个可用的提供商。
        """
        for provider_key in PROVIDER_PRIORITY:
            api_key = self._get_api_key(provider_key)
            if api_key:
                provider_config = LLM_PROVIDERS[provider_key]
                self.provider = provider_key
                self.provider_name = provider_config["name"]
                self.api_key = api_key
                self.base_url = provider_config["base_url"]
                self.model = provider_config["model"]
                logger.info(
                    f"LLM 提供商已初始化: {self.provider_name} "
                    f"(model={self.model}, base_url={self.base_url})"
                )
                return

        logger.warning(
            "未检测到任何可用的 LLM 提供商 API Key。"
            "请设置环境变量（DEEPSEEK_API_KEY / QWEN_API_KEY / ZHIPU_API_KEY / "
            "MOONSHOT_API_KEY / OPENAI_API_KEY）或配置 mowen-app/backend/.env 文件。"
        )

    # ========================================================
    # 状态查询
    # ========================================================

    def is_available(self) -> bool:
        """
        检查 LLM 服务是否可用（已检测到提供商且持有 API Key）。
        """
        return self.provider is not None and self.api_key is not None

    def get_provider_name(self) -> str:
        """
        获取当前提供商的显示名称。
        若不可用，返回 "未配置"。
        """
        if self.provider_name:
            return self.provider_name
        return "未配置"

    # ========================================================
    # System Prompt 构建
    # ========================================================

    def _build_system_prompt(self, system_prompt: str) -> str:
        """
        构建完整的 system prompt。
        将角色系统提示词与三层回答的 JSON 格式要求组合在一起。

        参数：
        - system_prompt: 角色的系统提示词（来自 roles.py，已包含角色名和描述）

        返回：完整的 system prompt 字符串
        """
        full_prompt = f"""{system_prompt}

你必须以该角色的思想体系和语言风格回答用户问题。

回答必须包含以下三层结构，以 JSON 格式返回：
{{
  "quote": "引用你（该角色）的经典著作中的原文，必须是真实存在的原文",
  "source": "原文出处，格式如《书名·篇名》",
  "plain": "原文的白话文翻译，通俗易懂",
  "interpretation": "结合用户的具体问题，用该角色的思想视角进行深度解读，200-400字",
  "suggestions": ["基于当前对话提出3个追问建议"]
}}

重要规则：
1. quote 必须是该角色真实著作中的原文，不能编造
2. interpretation 必须紧密联系用户的具体问题，不能泛泛而谈
3. 语气要符合角色的个性特征
4. 如果有对话上下文，要参考之前的对话内容

请直接返回 JSON，不要包含其他多余内容。"""
        return full_prompt

    # ========================================================
    # 消息列表构建
    # ========================================================

    def _build_messages(self, question: str, system_prompt: str,
                        context: list = None) -> list:
        """
        构建发送给 LLM 的消息列表。

        消息结构：
          1. system 消息（角色系统提示词 + JSON 格式要求）
          2. context 消息（对话上下文历史，如有）
          3. user 消息（当前用户提问）

        参数：
        - question: 用户当前提问
        - system_prompt: 角色系统提示词
        - context: 对话上下文 [{role, content}, ...]

        返回：消息列表
        """
        messages = []

        # 1. System 消息
        full_system_prompt = self._build_system_prompt(system_prompt)
        messages.append({
            "role": "system",
            "content": full_system_prompt,
        })

        # 2. 上下文消息（多轮对话历史）
        if context and isinstance(context, list):
            for msg in context:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ("user", "assistant", "system") and content:
                    messages.append({
                        "role": role,
                        "content": content,
                    })

        # 3. 当前用户提问
        messages.append({
            "role": "user",
            "content": question,
        })

        return messages

    # ========================================================
    # JSON 解析
    # ========================================================

    def _extract_json(self, text: str) -> Optional[dict]:
        """
        从 LLM 返回的文本中提取 JSON 对象。
        处理以下情况：
          1. 纯 JSON 文本
          2. JSON 包裹在 ```json ... ``` 代码块中
          3. JSON 包裹在 ``` ... ``` 代码块中
          4. JSON 前后有多余文本

        参数：
        - text: LLM 返回的原始文本

        返回：解析后的 dict，失败返回 None
        """
        if not text:
            return None

        text = text.strip()

        # ---- 策略 1：直接解析 ----
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # ---- 策略 2：从 markdown 代码块中提取 ----
        code_block_patterns = [
            r'```json\s*\n?(.*?)\n?\s*```',
            r'```JSON\s*\n?(.*?)\n?\s*```',
            r'```\s*\n?(.*?)\n?\s*```',
        ]
        for pattern in code_block_patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                json_str = match.group(1).strip()
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    continue

        # ---- 策略 3：从文本中提取第一个完整的 JSON 对象 ----
        # 找到第一个 { 和最后一个 }，尝试解析
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            json_str = text[first_brace:last_brace + 1]
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass

        logger.warning(f"无法从 LLM 响应中提取 JSON，原始文本前200字: {text[:200]}")
        return None

    # ========================================================
    # 回答数据校验
    # ========================================================

    def _validate_answer(self, data: dict) -> Optional[dict]:
        """
        校验并规范化 LLM 返回的回答数据。
        确保所有必需字段存在，对缺失字段提供默认值。

        参数：
        - data: 从 JSON 解析得到的 dict

        返回：规范化的回答 dict，校验失败返回 None
        """
        if not isinstance(data, dict):
            return None

        # 检查必需字段
        required_fields = ["quote", "source", "plain", "interpretation", "suggestions"]
        has_required = any(field in data for field in required_fields)
        if not has_required:
            logger.warning("LLM 返回的数据缺少所有必需字段")
            return None

        # 规范化字段
        result = {
            "quote": str(data.get("quote", "")).strip(),
            "source": str(data.get("source", "")).strip(),
            "plain": str(data.get("plain", "")).strip(),
            "interpretation": str(data.get("interpretation", "")).strip(),
            "suggestions": [],
        }

        # 处理 suggestions（确保是列表且每个元素是字符串）
        suggestions = data.get("suggestions", [])
        if isinstance(suggestions, list):
            result["suggestions"] = [
                str(s).strip() for s in suggestions if s and str(s).strip()
            ]
        elif isinstance(suggestions, str):
            # 如果 suggestions 是字符串，尝试按换行或逗号分割
            parts = re.split(r'[\n,，]', suggestions)
            result["suggestions"] = [p.strip() for p in parts if p.strip()]

        # 确保至少有一些有效内容
        if not result["quote"] and not result["interpretation"]:
            logger.warning("LLM 返回的数据中 quote 和 interpretation 均为空")
            return None

        return result

    # ========================================================
    # 核心方法：生成回答
    # ========================================================

    async def generate_answer(self, question: str, role_key: str,
                               system_prompt: str, context: list = None) -> Optional[dict]:
        """
        使用 LLM 生成三层回答（原文 / 白话 / 解读）。

        参数：
        - question: 用户提问
        - role_key: 角色键名（如 "zhuangzi"）
        - system_prompt: 角色系统提示词（来自 roles.py）
        - context: 对话上下文（多轮对话历史）[{role, content}, ...]

        返回：
        {
            "quote": "古籍原文",
            "source": "出处",
            "plain": "白话翻译",
            "interpretation": "现代解读",
            "suggestions": ["追问1", "追问2", "追问3"]
        }
        若 LLM 不可用或调用失败，返回 None。
        """
        # ---- 检查 LLM 是否可用 ----
        if not self.is_available():
            logger.warning("LLM 不可用，无法生成回答")
            return None

        # ---- 构建消息列表 ----
        messages = self._build_messages(question, system_prompt, context)

        # ---- 构建请求 URL 和参数 ----
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2000,
        }

        logger.info(
            f"调用 LLM 生成回答 | 提供商={self.provider_name} | 模型={self.model} | "
            f"角色={role_key} | 提问={question[:50]}..."
        )

        # ---- 发送请求 ----
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()

            response_data = response.json()

        except httpx.TimeoutException:
            logger.error(f"LLM 请求超时 | 提供商={self.provider_name} | URL={url}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(
                f"LLM 请求返回错误状态码 | 提供商={self.provider_name} | "
                f"状态码={e.response.status_code} | 响应={e.response.text[:500]}"
            )
            return None
        except httpx.RequestError as e:
            logger.error(f"LLM 请求网络错误 | 提供商={self.provider_name} | 错误={e}")
            return None
        except Exception as e:
            logger.error(f"LLM 请求异常 | 提供商={self.provider_name} | 错误={e}", exc_info=True)
            return None

        # ---- 解析响应 ----
        try:
            choices = response_data.get("choices", [])
            if not choices:
                logger.warning(f"LLM 响应中没有 choices | 响应={response_data}")
                return None

            content = choices[0].get("message", {}).get("content", "")
            if not content:
                logger.warning("LLM 响应内容为空")
                return None

            logger.info(f"LLM 响应成功 | 内容长度={len(content)}")

        except Exception as e:
            logger.error(f"解析 LLM 响应失败 | 错误={e} | 响应={response_data}")
            return None

        # ---- 提取 JSON 并校验 ----
        parsed = self._extract_json(content)
        if not parsed:
            logger.warning(f"无法从 LLM 响应中提取 JSON | 内容前200字={content[:200]}")
            return None

        result = self._validate_answer(parsed)
        if not result:
            logger.warning("LLM 返回的数据校验失败")
            return None

        logger.info(
            f"LLM 回答生成成功 | quote={result['quote'][:30]}... | "
            f"suggestions数量={len(result['suggestions'])}"
        )
        return result

    # ========================================================
    # 核心方法：流式生成
    # ========================================================

    async def generate_answer_with_stream(
        self, question: str, role_key: str,
        system_prompt: str, context: list = None
    ) -> AsyncGenerator[str, None]:
        """
        流式生成回答（用于前端打字机效果）。

        使用 SSE（Server-Sent Events）流式接口，逐块返回 LLM 生成的内容。
        调用方可累积所有 yield 的文本，最后尝试解析为 JSON。

        参数：
        - question: 用户提问
        - role_key: 角色键名
        - system_prompt: 角色系统提示词
        - context: 对话上下文 [{role, content}, ...]

        生成：
        - 逐块 yield 文本内容（字符串）
        - 若 LLM 不可用或出错，yield 错误提示文本
        """
        # ---- 检查 LLM 是否可用 ----
        if not self.is_available():
            logger.warning("LLM 不可用，无法进行流式生成")
            yield ""
            return

        # ---- 构建消息列表 ----
        messages = self._build_messages(question, system_prompt, context)

        # ---- 构建请求参数 ----
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 2000,
            "stream": True,
        }

        logger.info(
            f"调用 LLM 流式生成 | 提供商={self.provider_name} | 模型={self.model} | "
            f"角色={role_key} | 提问={question[:50]}..."
        )

        # ---- 发送流式请求 ----
        try:
            timeout = httpx.Timeout(connect=10.0, read=60.0, write=10.0, pool=10.0)
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    response.raise_for_status()

                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line:
                            continue
                        # SSE 格式：每行以 "data: " 开头
                        if not line.startswith("data: "):
                            continue

                        data_str = line[6:]  # 去掉 "data: " 前缀

                        # 流结束标志
                        if data_str == "[DONE]":
                            break

                        # 解析 JSON 数据块
                        try:
                            chunk_data = json.loads(data_str)
                            choices = chunk_data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            # 跳过无法解析的行
                            continue

            logger.info(f"LLM 流式生成完成 | 提供商={self.provider_name}")

        except httpx.TimeoutException:
            logger.error(f"LLM 流式请求超时 | 提供商={self.provider_name}")
            yield ""
        except httpx.HTTPStatusError as e:
            logger.error(
                f"LLM 流式请求返回错误状态码 | 提供商={self.provider_name} | "
                f"状态码={e.response.status_code}"
            )
            yield ""
        except httpx.RequestError as e:
            logger.error(f"LLM 流式请求网络错误 | 提供商={self.provider_name} | 错误={e}")
            yield ""
        except Exception as e:
            logger.error(f"LLM 流式请求异常 | 提供商={self.provider_name} | 错误={e}", exc_info=True)
            yield ""


# ============================================================
# 单例实例（供全局共享使用）
# ============================================================
llm_service = LLMService()
