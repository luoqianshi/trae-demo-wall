"""认证服务"""
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import PhoneExistsError, UnauthorizedError, TokenExpiredError
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserInfo
from app.config import settings


class AuthService:
    """认证服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, request: RegisterRequest) -> TokenResponse:
        """用户注册"""
        # 检查手机号是否已存在
        stmt = select(User).where(User.phone == request.phone)
        result = await self.db.execute(stmt)
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise PhoneExistsError()

        # 创建用户
        user = User(
            phone=request.phone,
            password_hash=get_password_hash(request.password),
            nickname=f"用户{request.phone[-4:]}",
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # 生成 Token
        return self._create_token_response(user)

    async def login(self, request: LoginRequest) -> TokenResponse:
        """用户登录"""
        stmt = select(User).where(User.phone == request.phone)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not verify_password(request.password, user.password_hash):
            raise UnauthorizedError("手机号或密码错误")

        # 更新最后登录时间
        user.last_login_at = datetime.utcnow()
        await self.db.commit()

        return self._create_token_response(user)

    async def get_current_user(self, token: str) -> User:
        """获取当前用户"""
        payload = decode_token(token)
        if not payload:
            raise UnauthorizedError()

        if payload.get("type") != "access":
            raise UnauthorizedError("无效的Token类型")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError()

        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise UnauthorizedError("用户不存在")

        return user

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        """刷新Token"""
        payload = decode_token(refresh_token)
        if not payload:
            raise UnauthorizedError("无效的Refresh Token")

        if payload.get("type") != "refresh":
            raise UnauthorizedError("无效的Token类型")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError()

        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise UnauthorizedError("用户不存在")

        return self._create_token_response(user)

    def _create_token_response(self, user: User) -> TokenResponse:
        """创建Token响应"""
        token_data = {"sub": str(user.id)}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserInfo(
                id=str(user.id),
                phone=user.phone,
                nickname=user.nickname,
                avatar_url=user.avatar_url,
                created_at=user.created_at,
            ),
        )
