"""ReadMate 统一配置管理

支持 JSON 配置文件 + 环境变量覆盖。
- 配置文件路径: ~/.readmate/config.json
- 环境变量前缀: READMATE_ (如 READMATE_MINIMAX_API_KEY)
- 环境变量优先级高于配置文件
"""
import os
import json
from pathlib import Path
from typing import Any, Dict, Optional

from .logger import get_logger

logger = get_logger(__name__)

# 配置文件路径
CONFIG_PATH = Path.home() / ".readmate" / "config.json"

# 环境变量前缀
ENV_PREFIX = "READMATE_"

# 默认配置
DEFAULT_CONFIG: Dict[str, Any] = {
    "minimax_api_key": "",
    "minimax_model": "MiniMax-M3",
    "provider": "minimaxi",  # minimaxi / openai / deepseek / custom
    "base_url": "https://api.minimaxi.com/v1",
    "popup_timeout": 5.0,
    "screen_capture_interval": 30.0,
    "max_history_records": 1000,
}

# 预设服务商配置（用户选了下拉框就自动填 base_url + model）
PROVIDER_PRESETS: Dict[str, Dict[str, str]] = {
    "minimaxi": {
        "label": "MiniMax",
        "base_url": "https://api.minimaxi.com/v1",
        "model": "MiniMax-M3",
        "key_hint_url": "https://platform.MiniMax.io/user-center/basic-information/interface-key",
        "key_prefix": "eyJ",
    },
    "openai": {
        "label": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
        "key_hint_url": "https://platform.openai.com/api-keys",
        "key_prefix": "sk-",
    },
    "deepseek": {
        "label": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
        "key_hint_url": "https://platform.deepseek.com/api_keys",
        "key_prefix": "sk-",
    },
    "custom": {
        "label": "自定义（兼容 OpenAI 协议）",
        "base_url": "",
        "model": "",
        "key_hint_url": "",
        "key_prefix": "",
    },
}


class Config:
    """统一配置管理类（单例模式）

    从配置文件加载配置，环境变量优先级更高，可覆盖配置文件中的值。
    """

    _instance: Optional["Config"] = None

    def __new__(cls, *args: Any, **kwargs: Any) -> "Config":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if getattr(self, "_initialized", False):
            return
        self._initialized = True
        # 当前生效的配置（已合并环境变量）
        self._config: Dict[str, Any] = DEFAULT_CONFIG.copy()
        # 仅来自配置文件的配置（save 时基于此增改）
        self._file_config: Dict[str, Any] = {}
        self.load()

    def load(self) -> Dict[str, Any]:
        """加载配置：先读配置文件，再用环境变量覆盖。

        Returns:
            合并后的完整配置字典
        """
        # 读取配置文件
        file_cfg: Dict[str, Any] = {}
        if CONFIG_PATH.exists():
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    file_cfg = json.load(f) or {}
                logger.info(f"已加载配置文件: {CONFIG_PATH}")
            except Exception as e:
                logger.error(f"读取配置文件失败，使用默认配置: {e}")
                file_cfg = {}
        self._file_config = file_cfg

        # 合并: 默认配置 <- 配置文件 <- 环境变量
        merged = DEFAULT_CONFIG.copy()
        merged.update(file_cfg)

        # 环境变量覆盖
        for key in DEFAULT_CONFIG.keys():
            env_key = ENV_PREFIX + key.upper()
            env_val = os.environ.get(env_key)
            if env_val is not None:
                # 按默认值类型做简单转换
                merged[key] = self._cast_env(env_val, DEFAULT_CONFIG.get(key))

        self._config = merged
        return merged

    @staticmethod
    def _cast_env(env_val: str, default_val: Any) -> Any:
        """按默认值类型转换环境变量字符串值。"""
        if isinstance(default_val, bool):
            return env_val.lower() in ("1", "true", "yes", "on")
        if isinstance(default_val, int):
            try:
                return int(env_val)
            except ValueError:
                return default_val
        if isinstance(default_val, float):
            try:
                return float(env_val)
            except ValueError:
                return default_val
        return env_val

    def save(self, cfg: Optional[Dict[str, Any]] = None) -> None:
        """保存配置到配置文件。

        Args:
            cfg: 要保存的配置字典；为 None 时保存当前已加载的文件配置
        """
        data = cfg if cfg is not None else self._file_config
        try:
            CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"配置已保存至: {CONFIG_PATH}")
            # 保存后重新加载，使新配置生效
            self.load()
        except Exception as e:
            logger.error(f"保存配置文件失败: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        """获取指定配置项的值。

        Args:
            key: 配置键名
            default: 键不存在时的默认返回值

        Returns:
            配置值
        """
        return self._config.get(key, default)

    def set(self, key: str, value: Any) -> None:
        """设置配置项（仅写入内存，需调用 save 持久化）。"""
        self._file_config[key] = value
        self._config[key] = value

    def as_dict(self) -> Dict[str, Any]:
        """返回当前生效配置的副本。"""
        return self._config.copy()


def get_config() -> Config:
    """获取配置单例。"""
    return Config()
