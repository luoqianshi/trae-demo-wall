"""ReadMate 统一日志模块

日志同时输出到终端和文件。
- 文件路径: ~/.readmate/logs/readmate_YYYYMMDD.log
- 日志格式: 2026-07-05 16:41:44 [INFO] 消息
- 使用 RotatingFileHandler，每个文件最大 5MB，保留 3 个备份
"""
import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime

# 日志目录
LOG_DIR = Path.home() / ".readmate" / "logs"

# 日志格式
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# RotatingFileHandler 参数
MAX_BYTES = 5 * 1024 * 1024  # 5MB
BACKUP_COUNT = 3


def get_logger(name: str = "readmate") -> logging.Logger:
    """获取统一配置的 logger。

    日志同时输出到终端（stdout）和文件，文件按大小滚动。

    Args:
        name: logger 名称

    Returns:
        配置好的 logging.Logger 实例
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        # 已配置过则直接返回
        return logger

    logger.setLevel(logging.DEBUG)
    fmt = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)

    # 终端输出
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(fmt)
    logger.addHandler(console)

    # 文件输出（滚动）
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        log_file = LOG_DIR / f"readmate_{datetime.now().strftime('%Y%m%d')}.log"
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=MAX_BYTES,
            backupCount=BACKUP_COUNT,
            encoding="utf-8",
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(fmt)
        logger.addHandler(file_handler)
    except Exception as e:
        # 文件 handler 创建失败不应阻断终端日志
        sys.stderr.write(f"[logger] 初始化文件日志失败: {e}\n")

    # 避免日志向 root logger 重复传播
    logger.propagate = False
    return logger
