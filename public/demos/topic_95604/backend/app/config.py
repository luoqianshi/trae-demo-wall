from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "灾害预警与趋势预测平台"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./disaster_warning.db"
    
    # API配置
    API_PREFIX: str = "/api/v1"
    
    # CORS配置
    CORS_ORIGINS: list = ["*"]
    
    # JWT配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
