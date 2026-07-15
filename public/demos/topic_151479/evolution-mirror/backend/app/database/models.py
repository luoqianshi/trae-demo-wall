"""
SQLAlchemy ORM 数据模型
定义 Folder、Tag、Note、NoteTag 四张表
"""

from datetime import datetime
import uuid

from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """ORM 基类"""
    pass


class Folder(Base):
    """文件夹模型"""
    __tablename__ = "folders"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("folders.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    # 关系：文件夹下的所有笔记
    notes: Mapped[list["Note"]] = relationship(back_populates="folder")


class Tag(Base):
    """标签模型"""
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#0D7377")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class Note(Base):
    """笔记模型"""
    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(200), default="")
    content: Mapped[str] = mapped_column(Text, default="")
    folder_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("folders.id"), nullable=True
    )
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_trashed: Mapped[bool] = mapped_column(Boolean, default=False)
    # 笔记类型：note-普通笔记, voice_memo-语音备忘, inspiration-灵感, schedule-日程
    note_type: Mapped[str] = mapped_column(String(20), default="note")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    # 关系：所属文件夹
    folder: Mapped["Folder | None"] = relationship(back_populates="notes")
    # 关系：笔记的标签关联
    tags: Mapped[list["NoteTag"]] = relationship(back_populates="note")


class NoteTag(Base):
    """笔记-标签关联模型（多对多）"""
    __tablename__ = "note_tags"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    note_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("notes.id"), nullable=False
    )
    tag_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tags.id"), nullable=False
    )

    # 关系
    note: Mapped["Note"] = relationship(back_populates="tags")
    tag: Mapped["Tag"] = relationship()


class NoteLink(Base):
    """笔记链接关系模型（双链）"""
    __tablename__ = "note_links"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    source_note_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("notes.id"), nullable=False
    )
    target_note_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("notes.id"), nullable=False
    )
    link_text: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


# ==================== 弱点改进系统 ====================


class Weakness(Base):
    """弱点记录模型"""
    __tablename__ = "weaknesses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(
        String(30), default="other"
    )  # habit, emotion, skill, social, thinking, other
    severity: Mapped[int] = mapped_column(Integer, default=3)  # 1-5
    frequency: Mapped[str] = mapped_column(
        String(20), default="occasional"
    )  # daily, weekly, occasional, rare
    trigger_context: Mapped[str] = mapped_column(Text, default="")
    impact: Mapped[str] = mapped_column(Text, default="")
    tried_solutions: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(
        String(20), default="active"
    )  # active, improving, resolved, archived
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    # 关系
    plans: Mapped[list["ImprovementPlan"]] = relationship(
        back_populates="weakness", cascade="all, delete-orphan"
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="weakness", cascade="all, delete-orphan"
    )


class ImprovementPlan(Base):
    """改进计划模型"""
    __tablename__ = "improvement_plans"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    weakness_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("weaknesses.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    strategy: Mapped[str] = mapped_column(Text, default="")  # AI 生成的改进策略
    duration_days: Mapped[int] = mapped_column(Integer, default=30)
    start_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="draft"
    )  # draft, active, paused, completed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    # 关系
    weakness: Mapped["Weakness"] = relationship(back_populates="plans")
    actions: Mapped[list["MicroAction"]] = relationship(
        back_populates="plan", cascade="all, delete-orphan"
    )


class MicroAction(Base):
    """微行动模型"""
    __tablename__ = "micro_actions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    plan_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("improvement_plans.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    frequency: Mapped[str] = mapped_column(
        String(20), default="daily"
    )  # daily, weekly, custom
    scheduled_time: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )  # e.g. "09:00"
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=5)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    plan: Mapped["ImprovementPlan"] = relationship(back_populates="actions")
    logs: Mapped[list["ActionLog"]] = relationship(
        back_populates="action", cascade="all, delete-orphan"
    )


class ActionLog(Base):
    """行动日志模型"""
    __tablename__ = "action_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    action_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("micro_actions.id"), nullable=False
    )
    log_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, default="")
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5
    difficulty: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5

    # 关系
    action: Mapped["MicroAction"] = relationship(back_populates="logs")


class Review(Base):
    """复盘记录模型"""
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    weakness_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("weaknesses.id"), nullable=False
    )
    review_type: Mapped[str] = mapped_column(
        String(20), default="weekly"
    )  # weekly, monthly, milestone
    content: Mapped[str] = mapped_column(Text, default="")
    progress_score: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    insights: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    # 关系
    weakness: Mapped["Weakness"] = relationship(back_populates="reviews")