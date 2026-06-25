from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM配置
    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = "sk-your-api-key-here"
    llm_model: str = "gpt-4o-mini"
    llm_mock: bool = True

    # 服务配置
    host: str = "0.0.0.0"
    port: int = 8000

    model_config = {"env_file": ".env", "env_prefix": ""}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
