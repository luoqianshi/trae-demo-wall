"""认证相关 API 路由"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas.user import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from ..services.auth_service import register_user, authenticate_user
from ..limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
async def register(
    request: Request,
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await register_user(db, req.account, req.username, req.password)
    return UserResponse(
        id=user.id, account=user.account, username=user.username,
        avatar_url=user.avatar_url, status=user.status,
        created_at=str(user.created_at),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    req: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    return await authenticate_user(db, req.account, req.password)
