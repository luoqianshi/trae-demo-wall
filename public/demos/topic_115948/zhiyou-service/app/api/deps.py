"""API 依赖"""
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import AuthService
from app.core.exceptions import UnauthorizedError, TokenExpiredError
from typing import Optional


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> str:
    """获取当前用户 ID"""
    if not authorization:
        raise UnauthorizedError("缺少认证信息")

    # 解析 Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedError("无效的认证格式")

    token = parts[1]

    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    return str(user.id)
