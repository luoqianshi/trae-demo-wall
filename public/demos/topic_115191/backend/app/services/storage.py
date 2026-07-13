"""本地文件存储服务。生成的图片按 project_id 分目录存放。"""
from pathlib import Path

from app.config import settings


def project_dir(project_id: str) -> Path:
    d = settings.storage_dir / project_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_image(project_id: str, filename: str, data: bytes) -> str:
    """保存图片字节到本地，返回相对路径（用于 URL 访问）。"""
    p = project_dir(project_id) / filename
    p.write_bytes(data)
    # 返回相对 storage_dir 的路径，前端通过 /storage/{path} 访问
    return f"{project_id}/{filename}"


def save_video(project_id: str, filename: str, data: bytes) -> str:
    """保存视频字节到本地，返回相对路径（用于 URL 访问）。"""
    p = project_dir(project_id) / filename
    p.write_bytes(data)
    return f"{project_id}/{filename}"


def abs_path(rel_path: str) -> Path:
    return settings.storage_dir / rel_path
