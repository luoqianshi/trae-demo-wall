"""配置加载：模型选手配置（配置驱动，新增模型只改配置）。

安全：API key 一律从环境变量读取，配置文件与日志严禁出现明文 key。
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class ModelConfig:
    """单个模型选手的配置。"""

    name: str
    adapter: str = "openai"          # 模型适配器类型（registry 键）
    base_url: str = ""
    api_key_env: str = ""            # 从该环境变量读取 key
    model: str = ""
    extra: dict = field(default_factory=dict)  # 透传给适配器的额外参数

    @property
    def api_key(self) -> str:
        """从环境变量读取 key；缺失返回空串（由适配器决定是否报错）。"""
        if not self.api_key_env:
            return ""
        return os.environ.get(self.api_key_env, "")


@dataclass
class AppConfig:
    """整体配置。"""

    models: list[ModelConfig]
    max_concurrency: int = 4         # 并发上限，避免触发 API 限流
    agentic_max_rounds: int = 5      # Agentic 模式最大迭代轮次


def load_config(config_path: Path) -> AppConfig:
    """从 YAML 配置文件加载 AppConfig。"""
    config_path = Path(config_path)
    if not config_path.exists():
        raise FileNotFoundError(f"配置文件不存在：{config_path}")

    raw = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    models_raw = raw.get("models", [])
    if not models_raw:
        raise ValueError(f"配置文件未定义任何 models：{config_path}")

    models = [
        ModelConfig(
            name=m["name"],
            adapter=m.get("adapter", "openai"),
            base_url=m.get("base_url", ""),
            api_key_env=m.get("api_key_env", ""),
            model=m.get("model", ""),
            extra=m.get("extra", {}),
        )
        for m in models_raw
    ]
    return AppConfig(
        models=models,
        max_concurrency=raw.get("max_concurrency", 4),
        agentic_max_rounds=raw.get("agentic_max_rounds", 5),
    )
