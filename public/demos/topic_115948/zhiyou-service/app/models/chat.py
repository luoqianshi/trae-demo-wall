"""聊天模型"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.types import Guid


class ChatSession(Base):
    """聊天会话表"""
    __tablename__ = "chat_sessions"

    id = Column(Guid(), primary_key=True, default=uuid.uuid4)
    user_id = Column(Guid(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    friend_id = Column(Guid(), ForeignKey("friends.id", ondelete="CASCADE"), nullable=False, index=True)
    last_message = Column(Text, nullable=True, comment="最后一条消息摘要")
    last_message_at = Column(DateTime, nullable=True, comment="最后消息时间")
    unread_count = Column(Integer, default=0, comment="未读消息数")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # 唯一约束：同一用户和智友只能有一个会话
    __table_args__ = (
        UniqueConstraint("user_id", "friend_id", name="uq_user_friend_session"),
    )

    # 关系
    user = relationship("User", back_populates="sessions")
    friend = relationship("Friend", back_populates="sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    """聊天消息表"""
    __tablename__ = "chat_messages"

    id = Column(Guid(), primary_key=True, default=uuid.uuid4)
    session_id = Column(Guid(), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    friend_id = Column(Guid(), ForeignKey("friends.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(10), nullable=False, comment="消息角色: user/assistant/system")
    content = Column(Text, nullable=False, comment="消息内容")
    message_type = Column(String(20), default="text", comment="消息类型: text/image/voice")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    is_deleted = Column(Boolean, default=False, comment="是否已删除")

    # 关系
    session = relationship("ChatSession", back_populates="messages")
    friend = relationship("Friend", back_populates="messages")
