from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class Camera(Base):
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rtsp_url = Column(String, nullable=False)
    resolution = Column(String, default="1920x1080")
    sample_interval = Column(Integer, default=2)
    status = Column(String, default="offline")
    created_at = Column(DateTime, server_default=func.now())


class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    camera_id = Column(Integer, nullable=True)  # Link to camera (auto-created datasets)
    created_at = Column(DateTime, server_default=func.now())


class Frame(Base):
    __tablename__ = "frames"
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer)
    dataset_id = Column(Integer, nullable=True)  # Which dataset this frame belongs to
    image_path = Column(String, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())
    is_annotated = Column(Boolean, default=False)
    phash = Column(String, default="")  # Perceptual hash for deduplication
    video_timestamp = Column(Float, default=0.0)  # Timestamp within source video
    source = Column(String, default="auto")  # "auto", "manual", or "video"
    status = Column(String, default="confirmed")  # "pending" (awaiting review) or "confirmed"


class Annotation(Base):
    __tablename__ = "annotations"
    id = Column(Integer, primary_key=True, index=True)
    frame_id = Column(Integer, nullable=False)
    label = Column(String, nullable=False)
    annotated_by = Column(String, default="admin")
    source = Column(String, default="manual")  # "manual" or "auto"
    confidence = Column(Float, default=1.0)  # Model confidence for auto-annotations
    created_at = Column(DateTime, server_default=func.now())


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)
    risk_level = Column(String, nullable=False)
    description = Column(Text)
    confidence = Column(Float)
    image_path = Column(String)
    camera_id = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    is_notified = Column(Boolean, default=False)


class ModelVersion(Base):
    __tablename__ = "model_versions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    path = Column(String, nullable=False)
    accuracy = Column(Float)
    num_samples = Column(Integer)
    num_labels = Column(Integer)
    is_active = Column(Boolean, default=False)
    status = Column(String, default="idle")
    created_at = Column(DateTime, server_default=func.now())


class AlertRule(Base):
    __tablename__ = "alert_rules"
    id = Column(Integer, primary_key=True, index=True)
    state_name = Column(String, nullable=False)
    risk_level = Column(String, default="P2")
    trigger_condition = Column(String, default="")
    notify_method = Column(String, default="wechat")
    notify_targets = Column(String, default="all")
    is_enabled = Column(Boolean, default=True)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    password = Column(String, default="")
    role = Column(String, default="viewer")
    permissions = Column(String, default="")
    notify_levels = Column(String, default="P0")
    last_login = Column(DateTime, server_default=func.now())


class SystemConfig(Base):
    __tablename__ = "system_configs"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(String, default="")


class VideoImport(Base):
    __tablename__ = "video_imports"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_size = Column(Integer, default=0)           # bytes
    camera_id = Column(Integer)
    camera_name = Column(String, default="")
    uploaded_by = Column(String, default="admin")
    strategy = Column(String, default="smart")       # smart / fixed
    duration_sec = Column(Float, default=0.0)
    total_frames = Column(Integer, default=0)
    extracted_frames = Column(Integer, default=0)
    action_frames = Column(Integer, default=0)
    static_frames = Column(Integer, default=0)
    skipped_duplicates = Column(Integer, default=0)
    num_chunks = Column(Integer, default=1)
    status = Column(String, default="processing")    # processing / done / error
    error_msg = Column(String, default="")
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)
