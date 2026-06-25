"""模型适配器：把统一的对话请求发给具体 LLM 端点。

registry/strategy 模式：新增端点 = 注册一个 Adapter。
统一走火山 CodingPlan 的 OpenAI 兼容 API。
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Callable, Optional

from .config import ModelConfig
from .models import Attempt, Task

# token 回调：每收到一段增量文本（delta）即调用一次，用于实时观赛
TokenSink = Optional[Callable[[str], None]]

# 适配器注册表：adapter 名 -> Adapter 类
_REGISTRY: dict[str, type] = {}


def register_adapter(name: str) -> Callable[[type], type]:
    """注册模型适配器的装饰器。"""

    def decorator(cls: type) -> type:
        _REGISTRY[name] = cls
        return cls

    return decorator


def get_adapter(cfg: ModelConfig) -> "ModelAdapter":
    """按配置创建适配器实例。"""
    if cfg.adapter not in _REGISTRY:
        raise ValueError(f"未注册的模型适配器：{cfg.adapter}（已注册：{list(_REGISTRY)}）")
    return _REGISTRY[cfg.adapter](cfg)


class ModelAdapter(ABC):
    """模型适配器抽象基类。"""

    def __init__(self, cfg: ModelConfig):
        self.cfg = cfg

    @abstractmethod
    def complete(self, system: str, user: str, task: Task, on_token: TokenSink = None) -> Attempt:
        """发起一次对话补全，返回 Attempt（含真实响应时长）。

        task 透传给适配器以支持本地 mock 等特殊场景；真实适配器可忽略。
        on_token 非空时，每生成一段增量文本即回调一次（用于实时观赛）。
        """
        raise NotImplementedError


@register_adapter("openai")
class OpenAIAdapter(ModelAdapter):
    """火山 CodingPlan / OpenAI 兼容端点适配器。"""

    def __init__(self, cfg: ModelConfig):
        super().__init__(cfg)
        # 延迟导入，未安装 openai 时也能加载本模块（mock 适配器可用）
        from openai import OpenAI

        if not cfg.api_key:
            raise ValueError(
                f"模型 '{cfg.name}' 未从环境变量 '{cfg.api_key_env}' 读到 API key"
            )
        self._client = OpenAI(base_url=cfg.base_url or None, api_key=cfg.api_key)

    def complete(self, system: str, user: str, task: Task, on_token: TokenSink = None) -> Attempt:
        # 计时只覆盖 API 调用本身，保证耗时各自独立、不受并发影响
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        temperature = self.cfg.extra.get("temperature", 0)

        # 无回调时走普通非流式，保持原有最简路径
        if on_token is None:
            start = time.perf_counter()
            resp = self._client.chat.completions.create(
                model=self.cfg.model, messages=messages, temperature=temperature,
            )
            elapsed = time.perf_counter() - start
            content = resp.choices[0].message.content or ""
            return Attempt(fixed_code=_extract_code(content), elapsed=elapsed, raw_response=content)

        # 有回调：流式逐块接收，节流后回调；端点不支持流式则回退非流式
        start = time.perf_counter()
        try:
            content = self._stream_complete(messages, temperature, on_token)
        except Exception:
            resp = self._client.chat.completions.create(
                model=self.cfg.model, messages=messages, temperature=temperature,
            )
            content = resp.choices[0].message.content or ""
            on_token(content)  # 回退路径：一次性补发全文，前端仍能看到内容
        elapsed = time.perf_counter() - start
        return Attempt(fixed_code=_extract_code(content), elapsed=elapsed, raw_response=content)

    def _stream_complete(self, messages: list, temperature: float, on_token: Callable[[str], None]) -> str:
        """流式接收并累积完整内容；按缓冲阈值节流回调，避免事件风暴。"""
        stream = self._client.chat.completions.create(
            model=self.cfg.model, messages=messages, temperature=temperature, stream=True,
        )
        parts: list[str] = []
        buf = ""
        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta.content or ""
            if not delta:
                continue
            parts.append(delta)
            buf += delta
            # 攒够约 24 字符再 flush，平衡实时性与事件数
            if len(buf) >= 24:
                on_token(buf)
                buf = ""
        if buf:
            on_token(buf)
        return "".join(parts)


@register_adapter("mock")
class MockAdapter(ModelAdapter):
    """本地 mock 适配器：用参考修复直接作答，用于自测闭环（无需真实 API）。

    通过 extra.mode 控制行为：
      - "reference"（默认）：返回题目 reference/fixed.py（必过）
      - "buggy"：原样返回 buggy 代码（必挂，用于验证判分负例）
    """

    def complete(self, system: str, user: str, task: Task, on_token: TokenSink = None) -> Attempt:
        # mock 不真正调用网络，但仍模拟一点耗时让观赛体感真实
        latency = self.cfg.extra.get("latency", 0.05)
        time.sleep(latency)

        mode = self.cfg.extra.get("mode", "reference")
        if mode == "buggy":
            code = task.buggy_code
        else:
            # 参考修复与 entry_file 同扩展名（兼容 C++/Rust 等非 Python 题）
            ext = Path(task.entry_file).suffix
            ref_path = task.directory / "reference" / f"fixed{ext}"
            code = ref_path.read_text(encoding="utf-8") if ref_path.exists() else task.buggy_code
        raw = f"```\n{code}\n```"
        # 有回调时分块"假装打字"，保证自测闭环也能验证流式链路
        if on_token is not None:
            for i in range(0, len(raw), 24):
                on_token(raw[i:i + 24])
        return Attempt(fixed_code=code, elapsed=latency, raw_response=raw)


def _extract_code(content: str) -> str:
    """从模型回复中提取代码：优先取 ``` 代码块，否则返回原文。"""
    if "```" not in content:
        return content.strip()

    # 取第一个代码块内容
    parts = content.split("```")
    if len(parts) < 3:
        return content.strip()
    block = parts[1]
    # 去掉可能的语言标注首行（如 python\n...）
    lines = block.splitlines()
    if lines and lines[0].strip().lower() in {"python", "py", ""}:
        lines = lines[1:]
    return "\n".join(lines).strip()
