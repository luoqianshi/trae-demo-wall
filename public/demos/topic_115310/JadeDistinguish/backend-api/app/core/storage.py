import os
import uuid
from pathlib import Path
from typing import BinaryIO
from app.config import settings


class StorageService:
    """存储服务"""
    
    def __init__(self):
        if settings.STORAGE_TYPE == "local":
            Path(settings.LOCAL_STORAGE_PATH).mkdir(parents=True, exist_ok=True)
    
    async def upload_image(self, file: BinaryIO, filename: str) -> str:
        """上传图片，返回访问路径"""
        if settings.STORAGE_TYPE == "local":
            # 生成本地存储路径
            ext = filename.split(".")[-1] if "." in filename else "jpg"
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            file_path = os.path.join(settings.LOCAL_STORAGE_PATH, unique_filename)
            
            # 保存文件
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            return f"/uploads/{unique_filename}"
        else:
            # TODO: 实现 S3/OSS 上传
            raise NotImplementedError(f"Storage type {settings.STORAGE_TYPE} not implemented")
    
    async def delete_image(self, path: str) -> bool:
        """删除图片"""
        if settings.STORAGE_TYPE == "local":
            filename = path.replace("/uploads/", "")
            file_path = os.path.join(settings.LOCAL_STORAGE_PATH, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        else:
            raise NotImplementedError(f"Storage type {settings.STORAGE_TYPE} not implemented")


storage_service = StorageService()
