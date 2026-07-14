"""后端配置：从 .env 读取，不把敏感信息写死到代码。"""
from __future__ import annotations

from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


# 后端根目录：backend/
BACKEND_DIR = Path(__file__).resolve().parent
# 项目根目录：backend/ 的上一级
PROJECT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    """应用配置。API Key 等敏感字段只从环境变量读取，绝不硬编码。"""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # 图像生成
    image_provider: str = "local"
    image_api_key: str = ""
    image_api_base_url: str = ""
    image_model: str = ""

    # 头像搜索
    enable_external_search: bool = True
    search_timeout: int = 8
    # 开源头像源开关（可单独关闭某个源）
    search_enable_dicebear: bool = True
    search_enable_robohash: bool = True
    search_enable_multiavatar: bool = True
    search_enable_boring: bool = True

    # DCGAN-CelebA 本地生成
    dcgan_weights_path: str = "backend/models/dcgan_celeba/dcgan_generator.pth"
    dcgan_nz: int = 100
    dcgan_ngf: int = 64
    dcgan_nc: int = 3
    dcgan_device: str = "cpu"

    # 输出与缓存
    output_dir: str = "backend/outputs"
    cache_dir: str = "backend/.cache"

    # 服务
    host: str = "0.0.0.0"
    port: int = 8000

    # 安全限制
    max_input_length: int = 500
    generate_timeout: int = 30

    @property
    def output_path(self) -> Path:
        """输出目录的绝对路径，自动创建。"""
        p = Path(self.output_dir)
        if not p.is_absolute():
            p = PROJECT_DIR / p
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def cache_path(self) -> Path:
        """缓存目录的绝对路径，自动创建。"""
        p = Path(self.cache_dir)
        if not p.is_absolute():
            p = PROJECT_DIR / p
        p.mkdir(parents=True, exist_ok=True)
        return p

    def has_external_image_key(self) -> bool:
        """是否配置了真实的外部图像生成 API Key。"""
        return bool(self.image_api_key and self.image_api_key.strip())

    def safe_log_dict(self) -> dict:
        """返回用于日志的安全配置快照（绝不包含 API Key）。"""
        return {
            "image_provider": self.image_provider,
            "image_api_key_configured": self.has_external_image_key(),
            "image_api_base_url": self.image_api_base_url or "(empty)",
            "image_model": self.image_model or "(empty)",
            "enable_external_search": self.enable_external_search,
            "dcgan_device": self.dcgan_device,
            "dcgan_weights_path": self.dcgan_weights_path,
            "output_dir": str(self.output_path),
            "max_input_length": self.max_input_length,
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
