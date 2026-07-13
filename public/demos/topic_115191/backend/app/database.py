"""数据库初始化与会话管理。"""
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


engine = create_engine(
    settings.db_url,
    connect_args={"check_same_thread": False},  # SQLite 多线程
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """创建所有表，并为旧数据库做轻量列迁移。"""
    from app import models  # noqa: F401  确保模型被导入

    Base.metadata.create_all(bind=engine)
    # 旧数据库 projects 表可能缺 pinned 列，ALTER TABLE 补上
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE projects ADD COLUMN pinned BOOLEAN DEFAULT 0"))
            conn.commit()
        except Exception:
            pass  # 列已存在
