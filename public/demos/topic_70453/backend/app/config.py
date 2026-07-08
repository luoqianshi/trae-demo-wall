"""应用配置管理，从 .env 文件读取配置"""
import os
import secrets
from dotenv import load_dotenv

load_dotenv()

# 启动时校验 SECRET_KEY 不能是默认值
_SECRET = os.getenv("SECRET_KEY", "").strip()
_DEFAULTS = {"", "default-secret-key", "chat-platform-secret-key-change-in-production-2026"}
if _SECRET in _DEFAULTS:
    # 自动生成随机密钥（开发环境用）
    _SECRET = secrets.token_urlsafe(32)
    print(f"[WARNING] SECRET_KEY 未设置，已自动生成随机密钥（仅本次会话有效）")

SECRET_KEY = _SECRET
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./chat_platform.db")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
