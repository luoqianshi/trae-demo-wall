"""第三方登录模型"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import Guid


class SocialAccount(Base):
    """第三方登录表"""
    __tablename__ = "social_accounts"

    id = Column(Guid(), primary_key=True, default=uuid.uuid4)
    user_id = Column(Guid(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(20), nullable=False, comment="第三方平台: wechat/apple")
    provider_user_id = Column(String(100), nullable=False, comment="第三方用户唯一标识")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 关系
    user = relationship("User", back_populates="social_accounts")
