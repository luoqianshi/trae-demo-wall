"""认证服务：用户注册和登录逻辑"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from fastapi import HTTPException, status
from ..models.user import User
from ..utils.security import hash_password, verify_password, create_access_token
from ..schemas.user import TokenResponse


async def register_user(
    db: AsyncSession, account: str, username: str, password: str,
) -> User:
    """注册新用户，检查账号和昵称不重复"""
    result = await db.execute(
        select(User).where(or_(User.account == account, User.username == username))
    )
    existing = result.scalar_one_or_none()
    if existing:
        if existing.account == account:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="账号已存在")
        else:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="昵称已被使用")

    user = User(
        account=account,
        username=username,
        password_hash=hash_password(password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession, account: str, password: str,
) -> TokenResponse:
    """验证用户身份（按账号登录），返回 JWT token"""
    result = await db.execute(select(User).where(User.account == account))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号或密码错误",
        )

    access_token = create_access_token(user.id)
    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        account=user.account,
        username=user.username,
    )
