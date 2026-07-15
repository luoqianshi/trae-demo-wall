"""
设置管理服务
将配置持久化到 JSON 文件
"""

import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

DEFAULT_SETTINGS = {
    "ai": {
        "provider": "deepseek",
        "api_key": "",
        "model": "",
        "base_url": "",
        "enabled": False,
    },
    "asr": {
        "engine": "none",  # none, funasr, tencent
        "funasr_url": "http://127.0.0.1:10095",
        "tencent_secret_id": "",
        "tencent_secret_key": "",
        "enabled": False,
    },
}

_settings_path: Optional[Path] = None
_settings_cache: dict = {}


def init_settings(data_dir: str):
    """初始化设置文件路径"""
    global _settings_path
    _settings_path = Path(data_dir) / "settings.json"


def _ensure_dir():
    if _settings_path is None:
        raise RuntimeError("设置服务未初始化，请先调用 init_settings()")
    _settings_path.parent.mkdir(parents=True, exist_ok=True)


def load_settings() -> dict:
    """加载设置"""
    global _settings_cache
    _ensure_dir()

    if _settings_path.exists():
        try:
            _settings_cache = json.loads(_settings_path.read_text(encoding="utf-8"))
            logger.info("设置加载成功")
            return _settings_cache
        except Exception as e:
            logger.warning(f"加载设置失败: {e}，使用默认设置")

    _settings_cache = json.loads(json.dumps(DEFAULT_SETTINGS))
    return _settings_cache


def save_settings(settings: dict):
    """保存设置"""
    global _settings_cache
    _ensure_dir()
    _settings_cache = settings
    _settings_path.write_text(json.dumps(settings, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("设置保存成功")


def get_settings() -> dict:
    """获取设置（带缓存）"""
    if not _settings_cache:
        return load_settings()
    return _settings_cache


def update_ai_settings(provider: str, api_key: str, model: Optional[str] = None, base_url: Optional[str] = None):
    """更新 AI 设置并应用到服务"""
    from app.services.ai_service import ai_service

    settings = get_settings()
    settings["ai"] = {
        "provider": provider,
        "api_key": api_key,
        "model": model or "",
        "base_url": base_url or "",
        "enabled": bool(api_key),
    }
    save_settings(settings)

    # 应用到运行中的服务
    if api_key:
        ai_service.configure(provider, api_key, model, base_url)
    else:
        ai_service._enabled = False


def update_asr_settings(engine: str, **kwargs):
    """更新 ASR 设置"""
    from app.services.asr_service import asr_service

    settings = get_settings()
    settings["asr"]["engine"] = engine

    if engine == "funasr":
        settings["asr"]["funasr_url"] = kwargs.get("funasr_url", "http://127.0.0.1:10095")
        asr_service.configure_funasr(settings["asr"]["funasr_url"])
        settings["asr"]["enabled"] = True
    elif engine == "tencent":
        settings["asr"]["tencent_secret_id"] = kwargs.get("tencent_secret_id", "")
        settings["asr"]["tencent_secret_key"] = kwargs.get("tencent_secret_key", "")
        asr_service.configure_tencent(
            settings["asr"]["tencent_secret_id"],
            settings["asr"]["tencent_secret_key"],
        )
        settings["asr"]["enabled"] = True
    else:
        asr_service.disable()
        settings["asr"]["enabled"] = False

    save_settings(settings)