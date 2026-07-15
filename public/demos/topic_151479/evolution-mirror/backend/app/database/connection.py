"""
数据库连接模块
使用普通 sqlite3 + PRAGMA key 实现数据库加密
提供 engine、sessionmaker 和 get_db 依赖
"""

import os
import logging
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session

from app.config import get_config
from app.database.models import Base

logger = logging.getLogger(__name__)

# 全局 engine 和 SessionLocal
_engine = None
_SessionLocal = None


def _get_db_url(db_path: str) -> str:
    """
    构建数据库连接 URL

    Args:
        db_path: 数据库文件路径

    Returns:
        SQLAlchemy 连接 URL
    """
    # 将路径转换为绝对路径，确保 SQLite 能正确找到文件
    abs_path = os.path.abspath(db_path)
    # 使用 sqlite:/// 前缀（三斜杠表示相对路径或绝对路径）
    url = f"sqlite:///{abs_path}"
    return url


def _set_encryption_key(dbapi_connection, connection_record):
    """
    SQLAlchemy 事件监听器：在每次连接时设置加密密钥
    通过 PRAGMA key 指令对数据库进行加密

    Args:
        dbapi_connection: DBAPI 原生连接对象
        connection_record: SQLAlchemy 连接记录
    """
    config = get_config()
    db_key = config.DATABASE_KEY

    if db_key:
        try:
            cursor = dbapi_connection.cursor()
            # 使用 PRAGMA key 设置加密密钥
            cursor.execute(f"PRAGMA key = '{db_key}'")
            cursor.close()
            logger.info("数据库加密密钥设置成功")
        except Exception as e:
            logger.warning(f"设置数据库加密密钥失败: {e}")


def init_engine():
    """
    初始化数据库引擎和会话工厂
    创建数据目录（如果不存在），配置加密事件监听
    """
    global _engine, _SessionLocal

    config = get_config()

    # 确保数据库文件所在目录存在
    db_dir = Path(config.DATABASE_PATH).parent
    db_dir.mkdir(parents=True, exist_ok=True)

    # 构建连接 URL
    db_url = _get_db_url(config.DATABASE_PATH)

    # 创建引擎
    _engine = create_engine(
        db_url,
        echo=False,  # 不输出 SQL 日志
        connect_args={"check_same_thread": False},  # 允许多线程访问
    )

    # 注册连接事件：设置加密密钥
    event.listen(_engine, "connect", _set_encryption_key)

    # 创建会话工厂
    _SessionLocal = sessionmaker(
        bind=_engine,
        autocommit=False,
        autoflush=False,
    )

    logger.info(f"数据库引擎初始化完成，路径: {config.DATABASE_PATH}")


def get_engine():
    """获取数据库引擎实例"""
    global _engine
    if _engine is None:
        init_engine()
    return _engine


def get_session_local():
    """获取 SessionLocal 工厂"""
    global _SessionLocal
    if _SessionLocal is None:
        init_engine()
    return _SessionLocal


def _init_fts5(engine):
    """
    初始化 FTS5 全文搜索虚拟表和触发器
    同时把现有 notes 数据同步到 FTS 索引
    """
    _DDL_STATEMENTS = [
        "CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(title, content, note_id UNINDEXED)",
        "CREATE TRIGGER IF NOT EXISTS notes_fts_ai AFTER INSERT ON notes BEGIN INSERT INTO notes_fts(note_id, title, content) VALUES (new.id, new.title, new.content); END",
        "CREATE TRIGGER IF NOT EXISTS notes_fts_au AFTER UPDATE ON notes BEGIN UPDATE notes_fts SET title=new.title, content=new.content WHERE note_id = new.id; END",
        "CREATE TRIGGER IF NOT EXISTS notes_fts_ad AFTER DELETE ON notes BEGIN DELETE FROM notes_fts WHERE note_id = old.id; END",
    ]

    with engine.connect() as conn:
        try:
            # 逐个创建 FTS5 表和触发器
            for sql in _DDL_STATEMENTS:
                conn.execute(text(sql))
            conn.commit()
            logger.info("FTS5 虚拟表和触发器创建完成")

            # 检查是否需要同步现有数据
            result = conn.execute(text("SELECT COUNT(*) FROM notes_fts"))
            fts_count = result.scalar() or 0

            result = conn.execute(text("SELECT COUNT(*) FROM notes"))
            note_count = result.scalar() or 0

            if fts_count == 0 and note_count > 0:
                conn.execute(text(
                    "INSERT INTO notes_fts(note_id, title, content) "
                    "SELECT id, title, content FROM notes"
                ))
                conn.commit()
                logger.info(f"FTS5 索引初始化完成，同步 {note_count} 条笔记")
            else:
                logger.info(f"FTS5 索引已存在 ({fts_count} 条)，无需同步")
        except Exception as e:
            logger.error(f"FTS5 初始化失败: {e}")
            raise


def init_db():
    """
    初始化数据库：创建所有表 + FTS5 全文搜索索引
    在应用启动时调用
    """
    engine = get_engine()
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建/检查完成")
        _init_fts5(engine)
    except Exception as e:
        logger.error(f"初始化数据库失败: {e}")
        raise


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI 依赖项：获取数据库会话
    使用 yield 确保请求结束后自动关闭会话

    Yields:
        Session: SQLAlchemy 数据库会话
    """
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()