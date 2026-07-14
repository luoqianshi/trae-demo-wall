"""
AI 多引擎框架 — 支持 6 种 AI 模型自由切换

抽象基类 AIProvider + 6 个具体实现：
- DeepSeekProvider  (api.deepseek.com,  deepseek-chat,     recommended)
- TongyiProvider    (dashscope,         qwen-plus)
- ZhipuProvider     (open.bigmodel.cn,  glm-4-flash)
- KimiProvider      (api.moonshot.cn,   moonshot-v1-8k)
- OpenAIProvider    (api.openai.com,    gpt-3.5-turbo)
- OllamaProvider    (localhost:11434,   qwen:7b, 无需 API Key)

设计要点：
- 所有 HTTP 调用使用 urllib（标准库，避免引入 requests 依赖）
- 所有异常必须捕获，不向调用方抛出
- 所有 API 调用统一 15 秒超时
- API Key 仅在内存中传递，不写入任何文件
"""

import json
import os
import urllib.request
import urllib.error
from abc import ABC, abstractmethod
from typing import Optional, Dict, List, Tuple

# ============================================
# 默认配置
# ============================================
DEFAULT_TIMEOUT = 15  # 统一超时 15 秒

# 各 Provider 默认 API 地址与模型
DEFAULT_CONFIGS = {
    "deepseek": {
        "api_url": "https://api.deepseek.com/v1/chat/completions",
        "model": "deepseek-chat",
    },
    "tongyi": {
        "api_url": "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
        "model": "qwen-plus",
    },
    "zhipu": {
        "api_url": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        "model": "glm-4-flash",
    },
    "kimi": {
        "api_url": "https://api.moonshot.cn/v1/chat/completions",
        "model": "moonshot-v1-8k",
    },
    "openai": {
        "api_url": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-3.5-turbo",
    },
    "ollama": {
        "api_url": "http://localhost:11434/api/generate",
        "model": "qwen:7b",
    },
}

# 获取 API Key 的官方页面（用于 UI 跳转）
API_KEY_LINKS = {
    "deepseek": "https://platform.deepseek.com/api_keys",
    "tongyi": "https://dashscope.console.aliyun.com/apiKey",
    "zhipu": "https://open.bigmodel.cn/usercenter/apikeys",
    "kimi": "https://platform.moonshot.cn/console/api-keys",
    "openai": "https://platform.openai.com/api-keys",
    "ollama": "https://ollama.ai/download",
}

# ============================================
# Provider 信息（用于 UI 展示）
# ============================================
PROVIDER_INFO = {
    "deepseek": {
        "id": "deepseek",
        "name": "DeepSeek",
        "icon": "🐋",
        "recommended": True,
        "desc": "国产高性价比，推理能力强",
    },
    "tongyi": {
        "id": "tongyi",
        "name": "通义千问",
        "icon": "🌟",
        "recommended": False,
        "desc": "阿里云出品，中文表现优秀",
    },
    "zhipu": {
        "id": "zhipu",
        "name": "智谱 GLM",
        "icon": "🧠",
        "recommended": False,
        "desc": "清华系，glm-4-flash 免费可用",
    },
    "kimi": {
        "id": "kimi",
        "name": "Kimi",
        "icon": "🌙",
        "recommended": False,
        "desc": "月之暗面，长上下文表现优异",
    },
    "openai": {
        "id": "openai",
        "name": "OpenAI",
        "icon": "🟢",
        "recommended": False,
        "desc": "GPT 系列开创者，海外服务",
    },
    "ollama": {
        "id": "ollama",
        "name": "Ollama",
        "icon": "🦙",
        "recommended": False,
        "desc": "本地部署，完全离线，无需 API Key",
    },
}


# ============================================
# 通用 HTTP 工具（标准库实现）
# ============================================
def _http_post_json(url: str, headers: dict, payload: dict, timeout: int = DEFAULT_TIMEOUT) -> Optional[dict]:
    """通用 POST JSON 请求，失败返回 None（不抛异常）。"""
    try:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={**{"Content-Type": "application/json"}, **headers},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        # 4xx/5xx
        return None
    except urllib.error.URLError:
        # 网络不通
        return None
    except Exception:
        # 任何其他异常均静默处理
        return None


def _http_get(url: str, timeout: int = DEFAULT_TIMEOUT) -> Optional[dict]:
    """通用 GET 请求（用于 Ollama 健康检查）。"""
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
            return json.loads(raw)
    except Exception:
        return None


# ============================================
# 抽象基类
# ============================================
class AIProvider(ABC):
    """AI Provider 抽象基类，所有具体 Provider 必须实现以下方法。"""

    def __init__(self, name: str, api_key: str = "", timeout: int = DEFAULT_TIMEOUT, config: Optional[Dict] = None):
        self.name = name
        self.api_key = api_key or ""
        self.timeout = timeout
        # config 至少包含 api_url / model
        self.config = config or {}

    # ---------- 抽象方法 ----------
    @abstractmethod
    def generate_plan(self, user_input: str, floorplan: str, budget_tier: str, devices: List[Dict]) -> Optional[Dict]:
        """
        调用 AI 生成智能家居方案。
        :param user_input: 用户需求描述
        :param floorplan: 户型名（一室一厅/两室一厅/三室一厅）
        :param budget_tier: 预算档位（经济/平衡/高端）
        :param devices: 候选设备库（dict 列表）
        :return: 方案字典，失败返回 None
        """

    @abstractmethod
    def validate_api_key(self, api_key: str) -> Tuple[bool, str]:
        """
        验证 API Key 有效性。
        :return: (是否有效, 提示信息)
        """

    @abstractmethod
    def get_models(self) -> List[str]:
        """返回该 Provider 支持的模型列表。"""

    # ---------- 通用方法 ----------
    def _build_prompt(self, user_input: str, floorplan: str, budget_tier: str, devices: List[Dict]) -> str:
        """构建统一的 prompt（子类可调用，避免重复）。"""
        # 控制设备列表长度，避免 token 爆炸
        max_devices = 200
        sample = devices[:max_devices]
        device_lines = []
        for d in sample:
            device_lines.append(
                f"- id={d.get('id','')} | {d.get('name','')} | 类别={d.get('category','')} | "
                f"价格={d.get('price',0)}元 | 区域={d.get('applicable_area','')} | "
                f"特性={','.join(d.get('features', []) or [])}"
            )
        device_text = "\n".join(device_lines) if device_lines else "（无候选设备）"

        prompt = (
            f"你是智能家居规划专家。请根据用户需求，从候选设备库中挑选合适的设备组合成一套方案。\n\n"
            f"【户型】{floorplan}\n"
            f"【预算档位】{budget_tier}\n"
            f"【用户需求】{user_input}\n\n"
            f"【候选设备库】\n{device_text}\n\n"
            f"请严格按以下 JSON 格式返回（仅返回 JSON，不要任何额外说明）：\n"
            "{\n"
            '  "scene_name": "场景名称",\n'
            '  "description": "方案描述",\n'
            '  "devices": [{"id": "设备id", "reason": "推荐理由"}],\n'
            '  "actions": ["联动规则1", "联动规则2"],\n'
            '  "confidence": 0.8\n'
            "}"
        )
        return prompt

    def _parse_plan_response(self, raw_text: str, devices: List[Dict], provider_name: str) -> Optional[Dict]:
        """解析 AI 返回的 JSON 文本为方案 dict。失败返回 None。"""
        if not raw_text:
            return None
        try:
            # 兼容代码块包裹
            text = raw_text.strip()
            if text.startswith("```"):
                # 去掉 ```json ... ``` 包裹
                text = text.strip("`")
                if text.lower().startswith("json"):
                    text = text[4:]
                text = text.strip()
            data = json.loads(text)
        except Exception:
            return None

        if not isinstance(data, dict):
            return None

        # 将 AI 返回的设备 id 映射回完整设备信息
        device_map = {d.get("id"): d for d in devices if d.get("id")}
        matched_devices = []
        for item in data.get("devices", []) or []:
            if not isinstance(item, dict):
                continue
            dev_id = item.get("id", "")
            dev = device_map.get(dev_id)
            if dev:
                matched_devices.append(dev)

        if not matched_devices:
            return None

        return {
            "scene_name": data.get("scene_name", "AI 推荐方案"),
            "description": data.get("description", ""),
            "devices": matched_devices,
            "actions": data.get("actions", []) or [],
            "confidence": float(data.get("confidence", 0.7)),
            "source": f"ai:{provider_name}",
            "matched_keywords": [],
        }


# ============================================
# OpenAI 兼容协议的基类（DeepSeek/Kimi/OpenAI 共用）
# ============================================
class _OpenAICompatibleProvider(AIProvider):
    """OpenAI Chat Completions 协议的通用实现。"""

    # 子类需指定
    provider_id = ""
    default_models: List[str] = []

    def get_models(self) -> List[str]:
        return list(self.default_models)

    def _chat(self, prompt: str) -> Optional[str]:
        """调用 chat/completions 接口，返回模型回复文本，失败返回 None。"""
        api_url = self.config.get("api_url") or DEFAULT_CONFIGS[self.provider_id]["api_url"]
        model = self.config.get("model") or DEFAULT_CONFIGS[self.provider_id]["model"]
        if not self.api_key:
            return None

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "你是专业的智能家居方案规划助手，必须只返回 JSON。"},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.5,
            "max_tokens": 1500,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
        }
        resp = _http_post_json(api_url, headers, payload, timeout=self.timeout)
        if not resp:
            return None
        try:
            return resp["choices"][0]["message"]["content"]
        except Exception:
            return None

    def validate_api_key(self, api_key: str) -> Tuple[bool, str]:
        """发送一个极小请求验证 Key 有效性。"""
        if not api_key or not api_key.strip():
            return False, "API Key 不能为空"
        api_url = self.config.get("api_url") or DEFAULT_CONFIGS[self.provider_id]["api_url"]
        model = self.config.get("model") or DEFAULT_CONFIGS[self.provider_id]["model"]
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 5,
        }
        headers = {"Authorization": f"Bearer {api_key.strip()}"}
        resp = _http_post_json(api_url, headers, payload, timeout=self.timeout)
        if resp and "choices" in resp:
            return True, "验证成功：API Key 有效"
        if resp and "error" in resp:
            msg = resp["error"].get("message", "API Key 无效") if isinstance(resp["error"], dict) else "API Key 无效"
            return False, f"验证失败：{msg}"
        return False, "验证失败：无法连接到 API 服务（请检查网络或代理）"

    def generate_plan(self, user_input: str, floorplan: str, budget_tier: str, devices: List[Dict]) -> Optional[Dict]:
        prompt = self._build_prompt(user_input, floorplan, budget_tier, devices)
        text = self._chat(prompt)
        if not text:
            return None
        return self._parse_plan_response(text, devices, self.provider_id)


# ============================================
# 1. DeepSeek
# ============================================
class DeepSeekProvider(_OpenAICompatibleProvider):
    provider_id = "deepseek"
    default_models = ["deepseek-chat", "deepseek-reasoner"]

    def __init__(self, api_key: str = "", timeout: int = DEFAULT_TIMEOUT, config: Optional[Dict] = None):
        super().__init__("DeepSeek", api_key, timeout, config)


# ============================================
# 2. 通义千问
# ============================================
class TongyiProvider(AIProvider):
    """通义千问使用 DashScope 协议（与 OpenAI 不完全相同）。"""

    default_models = ["qwen-plus", "qwen-turbo", "qwen-max"]

    def __init__(self, api_key: str = "", timeout: int = DEFAULT_TIMEOUT, config: Optional[Dict] = None):
        super().__init__("通义千问", api_key, timeout, config)

    def get_models(self) -> List[str]:
        return list(self.default_models)

    def _chat(self, prompt: str) -> Optional[str]:
        api_url = self.config.get("api_url") or DEFAULT_CONFIGS["tongyi"]["api_url"]
        model = self.config.get("model") or DEFAULT_CONFIGS["tongyi"]["model"]
        if not self.api_key:
            return None
        payload = {
            "model": model,
            "input": {
                "messages": [
                    {"role": "system", "content": "你是专业的智能家居方案规划助手，必须只返回 JSON。"},
                    {"role": "user", "content": prompt},
                ]
            },
            "parameters": {"temperature": 0.5, "max_tokens": 1500},
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        resp = _http_post_json(api_url, headers, payload, timeout=self.timeout)
        if not resp:
            return None
        try:
            return resp["output"]["choices"][0]["message"]["content"]
        except Exception:
            # 兼容部分返回结构
            try:
                return resp["output"]["text"]
            except Exception:
                return None

    def validate_api_key(self, api_key: str) -> Tuple[bool, str]:
        if not api_key or not api_key.strip():
            return False, "API Key 不能为空"
        api_url = self.config.get("api_url") or DEFAULT_CONFIGS["tongyi"]["api_url"]
        model = self.config.get("model") or DEFAULT_CONFIGS["tongyi"]["model"]
        payload = {
            "model": model,
            "input": {"messages": [{"role": "user", "content": "ping"}]},
            "parameters": {"max_tokens": 5},
        }
        headers = {"Authorization": f"Bearer {api_key.strip()}"}
        resp = _http_post_json(api_url, headers, payload, timeout=self.timeout)
        if resp and resp.get("output"):
            return True, "验证成功：API Key 有效"
        if resp and "code" in resp:
            return False, f"验证失败：{resp.get('message', 'API Key 无效')}"
        return False, "验证失败：无法连接到 DashScope 服务"

    def generate_plan(self, user_input: str, floorplan: str, budget_tier: str, devices: List[Dict]) -> Optional[Dict]:
        prompt = self._build_prompt(user_input, floorplan, budget_tier, devices)
        text = self._chat(prompt)
        if not text:
            return None
        return self._parse_plan_response(text, devices, "tongyi")


# ============================================
# 3. 智谱 GLM
# ============================================
class ZhipuProvider(_OpenAICompatibleProvider):
    """智谱使用 OpenAI 兼容协议（v4 接口）。"""

    provider_id = "zhipu"
    default_models = ["glm-4-flash", "glm-4", "glm-4-air"]

    def __init__(self, api_key: str = "", timeout: int = DEFAULT_TIMEOUT, config: Optional[Dict] = None):
        super().__init__("智谱 GLM", api_key, timeout, config)


# ============================================
# 4. Kimi（Moonshot）— OpenAI 兼容
# ============================================
class KimiProvider(_OpenAICompatibleProvider):
    provider_id = "kimi"
    default_models = ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"]

    def __init__(self, api_key: str = "", timeout: int = DEFAULT_TIMEOUT, config: Optional[Dict] = None):
        super().__init__("Kimi", api_key, timeout, config)


# ============================================
# 5. OpenAI
# ============================================
class OpenAIProvider(_OpenAICompatibleProvider):
    provider_id = "openai"
    default_models = ["gpt-3.5-turbo", "gpt-4", "gpt-4o-mini", "gpt-4o"]

    def __init__(self, api_key: str = "", timeout: int = DEFAULT_TIMEOUT, config: Optional[Dict] = None):
        super().__init__("OpenAI", api_key, timeout, config)


# ============================================
# 6. Ollama（本地，无需 API Key）
# ============================================
class OllamaProvider(AIProvider):
    """Ollama 本地部署，使用 /api/generate 接口。"""

    default_models = ["qwen:7b", "qwen:14b", "llama3:8b", "mistral:7b"]

    def __init__(self, api_key: str = "", timeout: int = DEFAULT_TIMEOUT, config: Optional[Dict] = None):
        # Ollama 无需 api_key，但仍保留参数以保持接口一致
        super().__init__("Ollama", "", timeout, config)

    def get_models(self) -> List[str]:
        return list(self.default_models)

    def _generate(self, prompt: str) -> Optional[str]:
        api_url = self.config.get("api_url") or DEFAULT_CONFIGS["ollama"]["api_url"]
        model = self.config.get("model") or DEFAULT_CONFIGS["ollama"]["model"]
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.5, "num_predict": 1500},
        }
        resp = _http_post_json(api_url, {}, payload, timeout=self.timeout)
        if not resp:
            return None
        # /api/generate 返回 {"response": "..."}
        return resp.get("response")

    def validate_api_key(self, api_key: str) -> Tuple[bool, str]:
        """Ollama 不需要 API Key，改为检查服务状态。"""
        api_url = self.config.get("api_url") or DEFAULT_CONFIGS["ollama"]["api_url"]
        # 尝试调用 /api/tags 检查服务是否在线
        tags_url = api_url.replace("/api/generate", "/api/tags")
        resp = _http_get(tags_url, timeout=5)
        if resp is not None:
            model_count = len(resp.get("models", []) or [])
            return True, f"Ollama 服务在线，已安装 {model_count} 个模型"
        return False, "无法连接到本地 Ollama 服务（请确认已启动 ollama serve）"

    def generate_plan(self, user_input: str, floorplan: str, budget_tier: str, devices: List[Dict]) -> Optional[Dict]:
        prompt = self._build_prompt(user_input, floorplan, budget_tier, devices)
        text = self._generate(prompt)
        if not text:
            return None
        return self._parse_plan_response(text, devices, "ollama")


# ============================================
# 工厂函数
# ============================================
_PROVIDER_CLASSES = {
    "deepseek": DeepSeekProvider,
    "tongyi": TongyiProvider,
    "zhipu": ZhipuProvider,
    "kimi": KimiProvider,
    "openai": OpenAIProvider,
    "ollama": OllamaProvider,
}


def get_ai_provider(provider_name: str, config: Optional[Dict] = None) -> Optional[AIProvider]:
    """
    根据名称返回对应的 Provider 实例。
    :param provider_name: deepseek/tongyi/zhipu/kimi/openai/ollama
    :param config: 包含 api_key, api_url, model, timeout, custom_configs 等
        {
            "api_key": "sk-xxx",
            "api_url": "https://...",   # 可选，缺省用默认
            "model": "...",             # 可选
            "timeout": 15,
        }
    :return: Provider 实例，未知名称返回 None
    """
    if not provider_name:
        return None
    provider_name = provider_name.lower()
    cls = _PROVIDER_CLASSES.get(provider_name)
    if cls is None:
        return None

    config = config or {}
    api_key = config.get("api_key", "") or ""
    api_url = config.get("api_url")
    model = config.get("model")
    timeout = config.get("timeout", DEFAULT_TIMEOUT)

    # 构造 provider config
    prov_config = {}
    if api_url:
        prov_config["api_url"] = api_url
    if model:
        prov_config["model"] = model

    try:
        return cls(api_key=api_key, timeout=timeout, config=prov_config)
    except Exception:
        return None


def get_ai_provider_from_env(provider_name: str, config: Optional[Dict] = None) -> Optional[AIProvider]:
    """
    与 get_ai_provider 类似，但若 config 中没有 api_key，则尝试从环境变量读取。
    环境变量命名：{PROVIDER}_API_KEY（大写），例如 DEEPSEEK_API_KEY。
    """
    config = dict(config or {})
    if not config.get("api_key"):
        env_key = f"{provider_name.upper()}_API_KEY"
        env_val = os.environ.get(env_key, "")
        if env_val:
            config["api_key"] = env_val
    return get_ai_provider(provider_name, config)
