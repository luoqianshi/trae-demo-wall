from sqlalchemy.orm import Session
from app.models.models import User
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.schemas import UserCreate, Token
from typing import Optional


class AuthService:
    """认证服务"""
    
    async def register(self, db: Session, user_data: UserCreate) -> User:
        """用户注册"""
        # 检查手机号是否已存在
        existing = db.query(User).filter(User.phone == user_data.phone).first()
        if existing:
            raise ValueError("该手机号已注册")
        
        # 创建用户
        user = User(
            phone=user_data.phone,
            nickname=user_data.nickname or f"用户{user_data.phone[-4:]}"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    async def login(self, db: Session, phone: str, code: str) -> Token:
        """手机号验证码登录"""
        # TODO: 实际生产环境需要验证短信验证码
        # 这里简化处理：验证码为 123456
        if code != "123456":
            raise ValueError("验证码错误")
        
        # 查找用户
        user = db.query(User).filter(User.phone == phone).first()
        if not user:
            # 自动注册
            user = User(phone=phone, nickname=f"用户{phone[-4:]}")
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # 生成 Token
        access_token = create_access_token(data={"sub": str(user.id), "type": "user"})
        return Token(access_token=access_token, token_type="bearer")
    
    async def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """根据 ID 获取用户"""
        return db.query(User).filter(User.id == user_id).first()


auth_service = AuthService()
