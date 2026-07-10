"""
药管家 AI 服务配置模块
支持通过环境变量配置 AI 服务参数
"""
import os


class Config:
    """AI 服务配置"""

    # AI 大模型 API 配置（兼容 OpenAI 格式）
    AI_API_KEY = os.environ.get("AI_API_KEY", "sk-your-api-key-here")
    AI_BASE_URL = os.environ.get("AI_BASE_URL", "https://api.openai.com/v1")
    AI_MODEL = os.environ.get("AI_MODEL", "gpt-4o")
    AI_VISION_MODEL = os.environ.get("AI_VISION_MODEL", "gpt-4o")  # 支持视觉的模型

    # AI 调用参数
    AI_TEMPERATURE = float(os.environ.get("AI_TEMPERATURE", "0.3"))
    AI_MAX_TOKENS = int(os.environ.get("AI_MAX_TOKENS", "2000"))
    AI_TIMEOUT = int(os.environ.get("AI_TIMEOUT", "30"))  # 请求超时秒数

    # 外部药品知识库 API 配置
    DRUG_API_BASE_URL = os.environ.get("DRUG_API_BASE_URL", "https://api.drugsapi.com/v1")
    DRUG_API_KEY = os.environ.get("DRUG_API_KEY", "")
    DRUG_API_TIMEOUT = int(os.environ.get("DRUG_API_TIMEOUT", "5"))

    # 缓存配置
    DRUG_INFO_CACHE_HOURS = int(os.environ.get("DRUG_INFO_CACHE_HOURS", "24"))

    # 图片上传配置
    MAX_IMAGE_SIZE_MB = int(os.environ.get("MAX_IMAGE_SIZE_MB", "10"))
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}

    # 报告生成配置
    MIN_MEDICINES_FOR_REPORT = int(os.environ.get("MIN_MEDICINES_FOR_REPORT", "3"))


config = Config()