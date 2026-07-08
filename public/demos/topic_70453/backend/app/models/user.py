"""用户模型"""
import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    account: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True,
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True,
    )
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(500), default="")
    status: Mapped[str] = mapped_column(String(20), default="offline")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, account='{self.account}', username='{self.username}')>"
