from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ARRAY, func
from sqlalchemy.orm import DeclarativeBase
import uuid
from datetime import datetime


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    quota_total = Column(Integer, default=50)
    quota_used = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class RecognitionTask(Base):
    __tablename__ = "recognition_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, nullable=True, index=True)
    image_url = Column(Text, nullable=False)
    status = Column(String(20), default="pending", index=True)  # pending | processing | completed | failed
    result_latex = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Formula(Base):
    __tablename__ = "formulas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, nullable=False, index=True)
    latex_code = Column(Text, nullable=False)
    rendered_image_url = Column(Text, nullable=True)
    source_paper_title = Column(String(512), nullable=True)
    source_paper_url = Column(Text, nullable=True)
    tags = Column(ARRAY(String), default=[])
    category = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Paper(Base):
    __tablename__ = "papers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, nullable=False, index=True)
    title = Column(String(512), nullable=False)
    authors = Column(Text, nullable=True)
    url = Column(Text, nullable=True)
    formulas_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())