"""记忆模型"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import Guid, Json


class Memory(Base):
    """记忆表"""
    __tablename__ = "memories"

    id = Column(Guid(), primary_key=True, default=uuid.uuid4)
    user_id = Column(Guid(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    friend_id = Column(Guid(), ForeignKey("friends.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False, comment="记忆内容")
    source = Column(String(20), default="auto_extract", comment="记忆来源: auto_extract/manual")
    importance = Column(Integer, default=3, comment="重要程度 1-5")
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, comment="记录时间")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    extra_data = Column(Json(), nullable=True, comment="额外元数据")

    # 关系
    user = relationship("User", back_populates="memories")
    friend = relationship("Friend", back_populates="memories")
