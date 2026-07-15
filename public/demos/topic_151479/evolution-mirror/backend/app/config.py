"""
应用配置模块
使用 pydantic-settings 管理配置项，支持环境变量覆盖
"""

import os
import secrets
import logging
from pathlib import Path

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """应用配置类"""

    # 数据库文件路径
    DATABASE_PATH: str = "./data/evolution_mirror.db"
    # 数据库加密密钥（空表示首次运行，会自动生成）
    DATABASE_KEY: str = ""
    # 密钥文件存储路径
    KEY_FILE_PATH: str = "./data/.db_key"
    # 服务主机地址
    HOST: str = "127.0.0.1"
    # 服务端口
    PORT: int = 8964

    model_config = {
        "env_prefix": "",  # 环境变量前缀，空表示直接使用属性名
        "env_file": ".env",  # 从 .env 文件加载
        "extra": "ignore",  # 忽略多余的字段
    }


# 全局配置实例缓存
_config_instance: Settings | None = None


def _ensure_key_file(key_file_path: str) -> str:
    """
    确保密钥文件存在，如果不存在则自动生成 32 字节随机密钥并保存

    Args:
        key_file_path: 密钥文件路径

    Returns:
        密钥字符串（十六进制格式）
    """
    key_path = Path(key_file_path)

    if key_path.exists():
        # 读取已有密钥
        try:
            key = key_path.read_text(encoding="utf-8").strip()
            if key:
                logger.info("从密钥文件加载加密密钥成功")
                return key
        except Exception as e:
            logger.warning(f"读取密钥文件失败: {e}，将重新生成密钥")

    # 生成新的 32 字节随机密钥（64 个十六进制字符）
    key = secrets.token_hex(32)
    try:
        # 确保父目录存在
        key_path.parent.mkdir(parents=True, exist_ok=True)
        key_path.write_text(key, encoding="utf-8")
        logger.info("已生成新的数据库加密密钥并保存到文件")
    except Exception as e:
        logger.warning(f"保存密钥文件失败: {e}")

    return key


def get_config() -> Settings:
    """
    获取全局配置单例
    首次调用时会处理密钥的自动生成与加载

    Returns:
        Settings 配置实例
    """
    global _config_instance

    if _config_instance is None:
        _config_instance = Settings()

        # 如果未设置密钥，尝试从文件加载或自动生成
        if not _config_instance.DATABASE_KEY:
            _config_instance.DATABASE_KEY = _ensure_key_file(
                _config_instance.KEY_FILE_PATH
            )

    return _config_instance