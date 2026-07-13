"""SQLAlchemy 数据模型。"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return uuid.uuid4().hex


class AssetStatus(str, enum.Enum):
    pending = "pending"
    generating = "generating"
    done = "done"
    failed = "failed"
    user_edited = "user_edited"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200))
    script_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="created")  # created/running/done/failed
    canvas_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)

    characters: Mapped[list["Character"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    scenes: Mapped[list["Scene"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    props: Mapped[list["Prop"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    episodes: Mapped[list["Episode"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    director_stages: Mapped[list["DirectorStage"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    videos: Mapped[list["Video"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    prompt: Mapped[str] = mapped_column(Text, default="")
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)  # 三视图
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus), default=AssetStatus.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="characters")


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    prompt: Mapped[str] = mapped_column(Text, default="")
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus), default=AssetStatus.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="scenes")


class Prop(Base):
    __tablename__ = "props"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")
    prompt: Mapped[str] = mapped_column(Text, default="")
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus), default=AssetStatus.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="props")


class Episode(Base):
    __tablename__ = "episodes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    index: Mapped[int] = mapped_column(Integer)  # 第几集
    title: Mapped[str] = mapped_column(String(200), default="")
    plot_summary: Mapped[str] = mapped_column(Text, default="")
    duration_seconds: Mapped[int] = mapped_column(Integer, default=60)
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus), default=AssetStatus.pending)
    involved_character_names: Mapped[list] = mapped_column(JSON, default=list)
    involved_scene_names: Mapped[list] = mapped_column(JSON, default=list)
    involved_prop_names: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="episodes")
    storyboards: Mapped[list["Storyboard"]] = relationship(
        back_populates="episode", cascade="all, delete-orphan", order_by="Storyboard.index"
    )


class Storyboard(Base):
    __tablename__ = "storyboards"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    episode_id: Mapped[str] = mapped_column(ForeignKey("episodes.id", ondelete="CASCADE"))
    index: Mapped[int] = mapped_column(Integer)  # 集内序号 1..N
    prompt: Mapped[str] = mapped_column(Text, default="")
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Agnes 返回的图片公网 URL，用于视频生成图生视频
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus), default=AssetStatus.pending)
    # 连续性参考：前一个故事板 id
    prev_storyboard_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    # 该故事板涉及的角色/场景/道具 id 列表
    character_ref_ids: Mapped[list] = mapped_column(JSON, default=list)
    scene_ref_ids: Mapped[list] = mapped_column(JSON, default=list)
    prop_ref_ids: Mapped[list] = mapped_column(JSON, default=list)
    # 导演台截图 id 列表，用于生成时作为构图参考
    director_stage_ref_ids: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    episode: Mapped["Episode"] = relationship(back_populates="storyboards")
    video: Mapped["Video | None"] = relationship(back_populates="storyboard", uselist=False, cascade="all, delete-orphan")


class DirectorStage(Base):
    __tablename__ = "director_stages"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(200), default="导演台")
    scene_data: Mapped[dict | None] = mapped_column(JSON, default=dict)
    screenshots: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus), default=AssetStatus.pending)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="director_stages")


class Video(Base):
    """视频生成记录：每个故事板对应一个图生视频任务。"""

    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    storyboard_id: Mapped[str] = mapped_column(ForeignKey("storyboards.id", ondelete="CASCADE"), unique=True)
    prompt: Mapped[str] = mapped_column(Text, default="")
    # Agnes 异步任务 id
    task_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    video_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Agnes 的 video_id
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus), default=AssetStatus.pending)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    video_path: Mapped[str | None] = mapped_column(String(500), nullable=True)  # 本地相对路径
    video_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # Agnes 返回的 mp4 URL
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    num_frames: Mapped[int] = mapped_column(Integer, default=121)
    frame_rate: Mapped[int] = mapped_column(Integer, default=24)
    width: Mapped[int] = mapped_column(Integer, default=1152)
    height: Mapped[int] = mapped_column(Integer, default=768)
    seconds: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="videos")
    storyboard: Mapped["Storyboard"] = relationship(back_populates="video")
