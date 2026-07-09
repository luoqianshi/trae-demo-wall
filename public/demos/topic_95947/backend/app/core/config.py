from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "商家自动化运营系统"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    
    DATABASE_URL: str
    REDIS_URL: str
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_API_BASE_URL: str = "https://api.deepseek.com"
    AI_MODEL_NAME: str = "deepseek-chat"
    
    LOG_LEVEL: str = "info"
    
    class Config:
        env_file = ".env"

settings = Settings()
