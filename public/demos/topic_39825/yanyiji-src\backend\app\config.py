from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "研易记 API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # 数据库
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/yanyiji"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # VLM 配置 (支持多种提供商)
    VLM_PROVIDER: str = "openai"  # openai | qwen | local
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    VLM_MODEL: str = "gpt-4o"  # 或 gpt-4-vision-preview

    # 图像处理
    MAX_IMAGE_SIZE: int = 4096  # 最大图片边长
    IMAGE_QUALITY: int = 85  # JPEG 压缩质量

    # 安全
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 小时

    # 配额
    FREE_USER_DAILY_QUOTA: int = 50  # 免费用户每日识别次数

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()