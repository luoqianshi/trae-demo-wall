"""日志系统 — 基于 loguru，支持控制台彩色输出和文件轮转。"""

import sys
from pathlib import Path

from loguru import logger

from app.core.config import get_settings


def setup_logger() -> None:
    """初始化日志配置，应在应用启动时调用一次。"""
    settings = get_settings()

    # 移除默认 handler
    logger.remove()

    # 控制台输出
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    logger.add(
        sys.stderr,
        format=log_format,
        level="DEBUG" if settings.app_debug else "INFO",
        colorize=True,
    )

    # 文件输出（按天轮转）
    log_dir = Path(settings.storage_dir) / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    logger.add(
        str(log_dir / "app_{time:YYYY-MM-DD}.log"),
        format=log_format,
        level="DEBUG",
        rotation="00:00",
        retention="30 days",
        encoding="utf-8",
    )

    logger.info("日志系统初始化完成 env={}", settings.app_env)


def get_logger(name: str = __name__):
    """获取带模块标识的 logger 实例。"""
    return logger.bind(module=name)
