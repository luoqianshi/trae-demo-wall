"""智友模型"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import Guid, Json


class Friend(Base):
    """智友表"""
    __tablename__ = "friends"

    id = Column(Guid(), primary_key=True, default=uuid.uuid4)
    user_id = Column(Guid(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False, comment="智友名称")
    description = Column(String(255), nullable=True, comment="一句话描述")
    identity = Column(String(20), nullable=False, comment="身份类型")
    avatar_config = Column(Json(), nullable=False, default=dict, comment="形象配置")
    personality_traits = Column(Json(), nullable=False, default=list, comment="性格特点标签")
    speaking_style = Column(String(20), nullable=False, default="normal", comment="说话风格")
    is_default = Column(Boolean, default=False, comment="是否默认智友")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    companion_days = Column(Integer, default=0, comment="陪伴天数")
    chat_count = Column(Integer, default=0, comment="聊天次数")
    memory_count = Column(Integer, default=0, comment="记忆点数量")

    # 唯一约束：同一用户下智友名称唯一
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_friend_name"),
    )

    # 关系
    user = relationship("User", back_populates="friends")
    sessions = relationship("ChatSession", back_populates="friend", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="friend", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="friend", cascade="all, delete-orphan")


# 身份类型映射
IDENTITY_MAP = {
    "friend": "朋友",
    "bestie": "闺蜜",
    "teacher": "教师",
    "doctor": "医生",
    "lawyer": "律师",
    "counselor": "心理咨询师",
}

# 说话风格映射
SPEAKING_STYLE_MAP = {
    "gentle": "温柔亲切",
    "humorous": "幽默风趣",
    "professional": "专业严谨",
    "warm": "热情温暖",
    "calm": "冷静理性",
    "normal": "自然日常",
}
