"""应用配置"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""

    # 数据库
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/zhiyou"
    sync_database_url: str = "postgresql://postgres:postgres@localhost:5432/zhiyou"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24小时
    refresh_token_expire_days: int = 30

    # AI 服务
    ai_base_url: str = "https://api.openai.com/v1"
    ai_api_key: str = "your-api-key"
    ai_model: str = "gpt-4o-mini"

    # 服务信息
    app_name: str = "智友服务"
    app_version: str = "1.0.0"
    debug: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
