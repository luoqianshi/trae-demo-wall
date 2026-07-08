"""用户服务：搜索、更新个人信息"""
from typing import Optional
import os
import shutil
import uuid
from io import BytesIO
from PIL import Image as PILImage
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi import HTTPException, status, UploadFile
from ..models.user import User

AVATAR_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)

ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"}
ALLOWED_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"}
MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB


async def search_users(db: AsyncSession, query: str, current_user_id: int) -> list[User]:
    """按账号或昵称模糊搜索其他用户（排除自己）"""
    result = await db.execute(
        select(User).where(
            or_(User.account.icontains(query), User.username.icontains(query)),
            User.id != current_user_id,
        ).limit(20)
    )
    return list(result.scalars().all())


async def update_profile(
    db: AsyncSession, user: User, username: Optional[str],
) -> User:
    """更新用户昵称"""
    if username:
        result = await db.execute(
            select(User).where(User.username == username, User.id != user.id)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="昵称已被使用")
        user.username = username
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


async def save_avatar(user: User, file: UploadFile) -> str:
    """保存头像文件（含类型/大小/内容校验），返回 URL 路径"""
    # 1. 校验扩展名
    ext = os.path.splitext(file.filename or "avatar.png")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的图片格式，允许: {', '.join(ALLOWED_EXT)}",
        )

    # 2. 读取文件内容并校验大小
    content = await file.read()
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"头像文件不能超过 {MAX_AVATAR_SIZE // 1024 // 1024}MB",
        )

    # 3. 校验 MIME 类型和是否为真实图片
    try:
        img = PILImage.open(BytesIO(content))
        img.verify()  # 验证图片完整性
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="无效的图片文件",
        )

    # 4. 重新打开（verify 后需 re-open），转为 PNG 统一存储
    img = PILImage.open(BytesIO(content))
    filename = f"user_{user.id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)
    img.save(filepath, format=img.format or "PNG")

    return f"/static/avatars/{filename}"
