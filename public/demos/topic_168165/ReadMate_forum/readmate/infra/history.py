"""ReadMate 历史记录模块 - SQLite 持久化问答记录（HistoryStore 类）

线程安全：threading.Lock 保护所有数据库操作，WAL 模式提升并发读性能。
支持自定义数据库路径（方便测试使用临时数据库）。
"""
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict

from ..core.logger import get_logger

logger = get_logger(__name__)

_DEFAULT_DB_PATH = Path.home() / ".readmate" / "history.db"


class HistoryStore:
    """历史记录存储，封装 SQLite 持久化。"""

    def __init__(self, db_path: Optional[Path] = None):
        self._lock = threading.Lock()
        self._db_path = Path(db_path) if db_path else _DEFAULT_DB_PATH
        self._wal_set = False

    def _get_conn(self) -> sqlite3.Connection:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self._db_path), timeout=5.0)
        conn.row_factory = sqlite3.Row
        if not self._wal_set:
            try:
                conn.execute("PRAGMA journal_mode=WAL")
            except sqlite3.OperationalError:
                logger.warning("WAL模式不可用，使用默认回滚日志模式")
            self._wal_set = True
        return conn

    def init_db(self):
        try:
            with self._lock:
                conn = self._get_conn()
                try:
                    conn.execute("""
                        CREATE TABLE IF NOT EXISTS qa_history (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            selected_text TEXT NOT NULL,
                            action TEXT NOT NULL,
                            answer TEXT NOT NULL,
                            app_name TEXT,
                            created_at TEXT NOT NULL
                        )
                    """)
                    conn.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON qa_history(created_at DESC)")
                    conn.commit()
                finally:
                    conn.close()
            logger.info("历史记录数据库已初始化")
        except Exception as e:
            logger.error(f"初始化历史数据库失败: {e}")

    def save_record(
        self,
        selected_text: str,
        action: str,
        answer: str,
        app_name: Optional[str] = None,
    ) -> Optional[int]:
        if not selected_text or not action or answer is None:
            logger.warning("save_record 参数不完整，跳过")
            return None
        try:
            with self._lock:
                conn = self._get_conn()
                try:
                    cur = conn.execute(
                        "INSERT INTO qa_history (selected_text, action, answer, app_name, created_at) "
                        "VALUES (?, ?, ?, ?, ?)",
                        (
                            selected_text,
                            action,
                            answer,
                            app_name,
                            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        ),
                    )
                    record_id = cur.lastrowid
                    conn.commit()
                finally:
                    conn.close()
            logger.debug(f"历史记录已保存 (id={record_id}, action={action})")
            return record_id
        except Exception as e:
            logger.error(f"保存历史记录失败: {e}")
            return None

    def get_recent_records(self, limit: int = 20) -> List[Dict]:
        limit = max(1, min(int(limit), 500))
        try:
            with self._lock:
                conn = self._get_conn()
                try:
                    rows = conn.execute(
                        "SELECT id, selected_text, action, answer, app_name, created_at "
                        "FROM qa_history ORDER BY created_at DESC LIMIT ?",
                        (limit,),
                    ).fetchall()
                finally:
                    conn.close()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"查询历史记录失败: {e}")
            return []

    def search_records(self, keyword: str, limit: int = 20) -> List[Dict]:
        if not keyword or not keyword.strip():
            return []
        limit = max(1, min(int(limit), 500))
        try:
            with self._lock:
                conn = self._get_conn()
                try:
                    rows = conn.execute(
                        "SELECT id, selected_text, action, answer, app_name, created_at "
                        "FROM qa_history "
                        "WHERE selected_text LIKE ? OR answer LIKE ? "
                        "ORDER BY created_at DESC LIMIT ?",
                        (f"%{keyword}%", f"%{keyword}%", limit),
                    ).fetchall()
                finally:
                    conn.close()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"搜索历史记录失败: {e}")
            return []

    def delete_record(self, record_id: int) -> bool:
        if record_id is None or record_id <= 0:
            return False
        try:
            with self._lock:
                conn = self._get_conn()
                try:
                    conn.execute("DELETE FROM qa_history WHERE id = ?", (record_id,))
                    conn.commit()
                finally:
                    conn.close()
            logger.info(f"历史记录已删除 (id={record_id})")
            return True
        except Exception as e:
            logger.error(f"删除历史记录失败: {e}")
            return False

    def clear_all(self) -> bool:
        try:
            with self._lock:
                conn = self._get_conn()
                try:
                    conn.execute("DELETE FROM qa_history")
                    conn.commit()
                finally:
                    conn.close()
            logger.info("所有历史记录已清空")
            return True
        except Exception as e:
            logger.error(f"清空历史记录失败: {e}")
            return False

    def get_stats(self) -> Dict:
        try:
            with self._lock:
                conn = self._get_conn()
                try:
                    row = conn.execute("SELECT COUNT(*) as count FROM qa_history").fetchone()
                    total = row["count"] if row else 0
                    today = datetime.now().strftime("%Y-%m-%d")
                    row = conn.execute(
                        "SELECT COUNT(*) as count FROM qa_history WHERE created_at LIKE ?",
                        (f"{today}%",),
                    ).fetchone()
                    today_count = row["count"] if row else 0
                finally:
                    conn.close()
            return {"total": total, "today": today_count}
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {"total": 0, "today": 0}
