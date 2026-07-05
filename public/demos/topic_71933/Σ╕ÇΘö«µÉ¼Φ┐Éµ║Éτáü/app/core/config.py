"""应用配置管理 — 基于 pydantic-settings，支持 .env 文件加载。"""

import sys
from pathlib import Path
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _get_base_dir() -> Path:
    """获取项目根目录，兼容 PyInstaller 打包。"""
    if getattr(sys, 'frozen', False):
        # PyInstaller 打包后：可执行文件所在目录
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent.parent


BASE_DIR = _get_base_dir()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env") if (BASE_DIR / ".env").exists() else "",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ---- 应用 ----
    app_name: str = "一键搬运"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "127.0.0.1"
    app_port: int = 8000

    # ---- 存储 ----
    storage_dir: Path = BASE_DIR / "storage"
    temp_dir: Path = BASE_DIR / "storage" / "temp"
    output_dir: Path = BASE_DIR / "storage" / "output"

    # ---- 快手 ----
    kuaishou_app_id: str = ""
    kuaishou_app_secret: str = ""
    kuaishou_redirect_uri: str = "http://localhost:8000/api/v1/auth/kuaishou/callback"

    # ---- 抖音（β阶段） ----
    douyin_app_id: str = ""
    douyin_app_secret: str = ""

    # ---- 下载 ----
    download_timeout: int = 120
    download_max_retries: int = 3
    download_concurrency: int = 3

    # ---- 去重 ----
    dedup_speed_min: float = 0.95
    dedup_speed_max: float = 1.05
    dedup_random_padding_bytes: int = 1024

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
