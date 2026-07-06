"""数据库引擎与会话工厂（独立 SQLAlchemy，不依赖 Flask-SQLAlchemy）"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import Config

# SQLite 需要关闭线程检查（FastAPI 多线程访问）
engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    connect_args={'check_same_thread': False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI 依赖注入：提供数据库会话，请求结束自动关闭"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
