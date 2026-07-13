"""认证路由"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import AuthService
from app.schemas import (
    BaseResponse,
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserInfo,
    RefreshTokenRequest,
)
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/register", response_model=BaseResponse[TokenResponse])
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """用户注册"""
    auth_service = AuthService(db)
    result = await auth_service.register(request)
    return BaseResponse(data=result)


@router.post("/login", response_model=BaseResponse[TokenResponse])
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """用户登录"""
    auth_service = AuthService(db)
    result = await auth_service.login(request)
    return BaseResponse(data=result)


@router.post("/refresh", response_model=BaseResponse[TokenResponse])
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """刷新 Token"""
    auth_service = AuthService(db)
    result = await auth_service.refresh_token(request.refresh_token)
    return BaseResponse(data=result)


@router.get("/me", response_model=BaseResponse[UserInfo])
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取当前用户信息"""
    from app.models import User
    from sqlalchemy import select

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one()

    return BaseResponse(
        data=UserInfo(
            id=str(user.id),
            phone=user.phone,
            nickname=user.nickname,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
        )
    )
