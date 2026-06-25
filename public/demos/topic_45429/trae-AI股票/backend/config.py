"""
AI智股 - 全局配置
支持 MySQL / SQLite / CSV / JSON 多种数据源
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # 基础配置
    SECRET_KEY = os.getenv("SECRET_KEY", "ai-zhigu-dev-secret-2026")
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"

    # 文件上传
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "..", "data", "uploads")
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls", "json"}

    # 数据库配置 (MySQL) —— 默认回退到 SQLite 便于本地快速启动
    DB_TYPE = os.getenv("DB_TYPE", "sqlite")  # mysql | sqlite
    MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
    MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ai_zhigu")

    @property
    def SQLALCHEMY_DATABASE_URI(self):
        if self.DB_TYPE == "mysql":
            return (
                f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
                f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}?charset=utf8mb4"
            )
        # 默认 SQLite，零配置即可启动
        sqlite_path = os.path.join(os.path.dirname(__file__), "..", "data", "ai_zhigu.db")
        return f"sqlite:///{os.path.abspath(sqlite_path)}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 模型训练默认参数
    DEFAULT_MODEL_PARAMS = {
        "time_step": 30,
        "epochs": 50,
        "learning_rate": 0.001,
        "batch_size": 32,
        "hidden_units": 64,
        "dropout": 0.2,
    }


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}

ENV = os.getenv("FLASK_ENV", "development")
Config = config_map.get(ENV, DevelopmentConfig)
