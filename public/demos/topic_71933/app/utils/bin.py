"""外部二进制工具定位。"""

import shutil
import sys
from pathlib import Path

from app.core.config import BASE_DIR


def _resolve_binary(name: str) -> str:
    """解析可执行文件路径，兼容源码运行与打包运行。"""
    candidates = [
        shutil.which(name),
        str(BASE_DIR / name),
        str(BASE_DIR / f"{name}.exe"),
        str(Path(sys.executable).parent / name),
        str(Path(sys.executable).parent / f"{name}.exe"),
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    return name


def get_ffmpeg_bin() -> str:
    """获取 ffmpeg 可执行文件路径。"""
    return _resolve_binary("ffmpeg")


def get_ffprobe_bin() -> str:
    """获取 ffprobe 可执行文件路径。"""
    return _resolve_binary("ffprobe")
