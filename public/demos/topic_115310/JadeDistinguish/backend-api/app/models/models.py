from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    wechat_openid = Column(String(100), unique=True, index=True, nullable=True)
    nickname = Column(String(50), default="")
    avatar_url = Column(String(500), default="")
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    free_quota = Column(Integer, default=3)  # 每日免费鉴别次数
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class IdentifyRecord(Base):
    """鉴别记录表"""
    __tablename__ = "identify_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    image_url = Column(String(500), nullable=False)
    jade_type = Column(String(50), default="和田玉")  # 玉石品类
    light_mode = Column(String(20), default="side_45")  # side_45 / backlight
    is_authentic = Column(Boolean, nullable=True)  # AI 鉴别结果
    confidence = Column(Float, nullable=True)  # 置信度 0-1
    features = Column(Text, nullable=True)  # JSON 格式特征描述
    suggestion = Column(Text, nullable=True)  # 建议说明
    status = Column(String(20), default="pending")  # pending / processing / completed / failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AdminUser(Base):
    """管理员表"""
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    nickname = Column(String(50), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
