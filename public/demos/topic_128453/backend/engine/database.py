# -*- coding: utf-8 -*-
"""
文件：engine/database.py
说明：墨问 · SQLite 数据库模块
      支持用户账号、收藏云同步、社区问答、对话历史四大功能。
      使用 Python 标准库 sqlite3，无需额外安装依赖。
      数据库文件路径：mowen-app/backend/data/mowen.db（自动创建目录）。

      包含的表：
        - users          用户账号表
        - favorites      收藏云同步表
        - conversations  多轮对话历史表
        - community_qa   社区共问共答表

      所有函数均包含错误处理，返回 dict 包含 success (bool) 和 data/error 字段。
"""

import os
import sqlite3
import hashlib
import json
import uuid


# ============================================================
# 数据库路径配置
# ============================================================
# engine/ 目录的父目录即为 backend/，数据库存放在 backend/data/mowen.db
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DATA_DIR = os.path.join(_BASE_DIR, "data")
DB_PATH = os.path.join(_DATA_DIR, "mowen.db")


def _get_connection():
    """获取数据库连接，设置 Row 工厂以便以字典方式访问结果。"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _row_to_dict(row):
    """将 sqlite3.Row 转换为普通 dict。"""
    if row is None:
        return None
    return dict(row)


# ============================================================
# 数据库初始化
# ============================================================

def init_db():
    """
    初始化数据库，创建所有表。
    若 data 目录不存在则自动创建。
    使用 IF NOT EXISTS 确保可重复调用。
    """
    # 自动创建数据目录
    os.makedirs(_DATA_DIR, exist_ok=True)

    conn = _get_connection()
    try:
        cursor = conn.cursor()

        # ----------------------------------------------------------
        # users 表 —— 用户账号
        # ----------------------------------------------------------
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                username      TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                nickname      TEXT,
                created_at    TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ----------------------------------------------------------
        # favorites 表 —— 收藏云同步
        # ----------------------------------------------------------
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS favorites (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id       INTEGER NOT NULL,
                question      TEXT NOT NULL,
                role_key      TEXT NOT NULL,
                role_name     TEXT NOT NULL,
                quote         TEXT NOT NULL,
                source        TEXT NOT NULL,
                plain         TEXT,
                interpretation TEXT,
                created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        # ----------------------------------------------------------
        # conversations 表 —— 多轮对话历史
        # ----------------------------------------------------------
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id    TEXT NOT NULL,
                user_id       INTEGER,
                role_key      TEXT NOT NULL,
                question      TEXT NOT NULL,
                quote         TEXT,
                source        TEXT,
                plain         TEXT,
                interpretation TEXT,
                created_at    TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ----------------------------------------------------------
        # community_qa 表 —— 社区共问共答
        # ----------------------------------------------------------
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS community_qa (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id       INTEGER,
                user_nickname TEXT,
                question      TEXT NOT NULL,
                role_key      TEXT NOT NULL,
                role_name     TEXT NOT NULL,
                quote         TEXT NOT NULL,
                source        TEXT NOT NULL,
                plain         TEXT,
                interpretation TEXT,
                likes         INTEGER DEFAULT 0,
                created_at    TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 为常用查询字段创建索引，提升性能
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_community_qa_created_at ON community_qa(created_at)")

        conn.commit()
    finally:
        conn.close()


# ============================================================
# 密码工具函数
# ============================================================

def hash_password(password: str) -> str:
    """
    使用 SHA256 对密码进行哈希。
    返回十六进制字符串。
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, hash_str: str) -> bool:
    """
    验证密码是否匹配给定的哈希值。
    返回 True 表示匹配成功，False 表示密码错误。
    """
    if not password or not hash_str:
        return False
    return hash_password(password) == hash_str


# ============================================================
# 用户相关函数
# ============================================================

def create_user(username: str, password: str, nickname: str = "") -> dict:
    """
    注册新用户。
    参数：
        username  用户名（唯一）
        password  明文密码
        nickname  昵称（可选）
    返回：
        dict: { success: True, data: {...} } 或 { success: False, error: "..." }
    """
    if not username or not password:
        return {"success": False, "error": "用户名和密码不能为空"}

    username = username.strip()
    nickname = nickname.strip() if nickname else ""

    if len(username) < 2:
        return {"success": False, "error": "用户名至少需要 2 个字符"}
    if len(password) < 6:
        return {"success": False, "error": "密码至少需要 6 个字符"}

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        password_hash = hash_password(password)

        cursor.execute(
            "INSERT INTO users (username, password_hash, nickname) VALUES (?, ?, ?)",
            (username, password_hash, nickname),
        )
        conn.commit()
        user_id = cursor.lastrowid

        # 查询完整用户信息（含 created_at）
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        user_data = _row_to_dict(row)
        # 不返回密码哈希
        user_data.pop("password_hash", None)

        return {"success": True, "data": user_data}
    except sqlite3.IntegrityError:
        return {"success": False, "error": "用户名已存在"}
    except Exception as e:
        return {"success": False, "error": f"注册失败: {str(e)}"}
    finally:
        conn.close()


def authenticate_user(username: str, password: str) -> dict:
    """
    用户登录验证。
    参数：
        username  用户名
        password  明文密码
    返回：
        dict: { success: True, data: {...} } 或 { success: False, error: "..." }
    """
    if not username or not password:
        return {"success": False, "error": "用户名和密码不能为空"}

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username.strip(),))
        row = cursor.fetchone()

        if row is None:
            return {"success": False, "error": "用户名不存在"}

        if not verify_password(password, row["password_hash"]):
            return {"success": False, "error": "密码错误"}

        user_data = _row_to_dict(row)
        user_data.pop("password_hash", None)

        return {"success": True, "data": user_data}
    except Exception as e:
        return {"success": False, "error": f"登录失败: {str(e)}"}
    finally:
        conn.close()


def get_user(user_id: int) -> dict:
    """
    根据 user_id 获取用户信息。
    返回：
        dict: { success: True, data: {...} } 或 { success: False, error: "..." }
    """
    if user_id is None:
        return {"success": False, "error": "user_id 不能为空"}

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()

        if row is None:
            return {"success": False, "error": "用户不存在"}

        user_data = _row_to_dict(row)
        user_data.pop("password_hash", None)

        return {"success": True, "data": user_data}
    except Exception as e:
        return {"success": False, "error": f"获取用户信息失败: {str(e)}"}
    finally:
        conn.close()


# ============================================================
# 收藏相关函数
# ============================================================

def add_favorite(user_id: int, item: dict) -> dict:
    """
    添加收藏。
    参数：
        user_id  用户 ID
        item     收藏内容，需包含以下字段：
                 question, role_key, role_name, quote, source, plain, interpretation
    返回：
        dict: { success: True, data: {...} } 或 { success: False, error: "..." }
    """
    if not user_id:
        return {"success": False, "error": "user_id 不能为空"}
    if not item or not isinstance(item, dict):
        return {"success": False, "error": "收藏内容不能为空"}

    # 必填字段校验
    required_fields = ["question", "role_key", "role_name", "quote", "source"]
    for field in required_fields:
        if not item.get(field):
            return {"success": False, "error": f"缺少必填字段: {field}"}

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO favorites
                (user_id, question, role_key, role_name, quote, source, plain, interpretation)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                item.get("question", ""),
                item.get("role_key", ""),
                item.get("role_name", ""),
                item.get("quote", ""),
                item.get("source", ""),
                item.get("plain", ""),
                item.get("interpretation", ""),
            ),
        )
        conn.commit()
        fav_id = cursor.lastrowid

        cursor.execute("SELECT * FROM favorites WHERE id = ?", (fav_id,))
        row = cursor.fetchone()
        return {"success": True, "data": _row_to_dict(row)}
    except Exception as e:
        return {"success": False, "error": f"添加收藏失败: {str(e)}"}
    finally:
        conn.close()


def remove_favorite(user_id: int, fav_id: int) -> dict:
    """
    删除收藏。
    参数：
        user_id  用户 ID（确保只能删除自己的收藏）
        fav_id   收藏记录 ID
    返回：
        dict: { success: True, data: {...} } 或 { success: False, error: "..." }
    """
    if not user_id or not fav_id:
        return {"success": False, "error": "user_id 和 fav_id 不能为空"}

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM favorites WHERE id = ? AND user_id = ?",
            (fav_id, user_id),
        )
        conn.commit()

        if cursor.rowcount == 0:
            return {"success": False, "error": "收藏记录不存在或无权删除"}

        return {"success": True, "data": {"id": fav_id, "deleted": True}}
    except Exception as e:
        return {"success": False, "error": f"删除收藏失败: {str(e)}"}
    finally:
        conn.close()


def get_favorites(user_id: int) -> list:
    """
    获取用户收藏列表。
    参数：
        user_id  用户 ID
    返回：
        list: 收藏记录列表，按创建时间倒序排列。
              若出错返回空列表。
    """
    if not user_id:
        return []

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
        rows = cursor.fetchall()
        return [_row_to_dict(row) for row in rows]
    except Exception:
        return []
    finally:
        conn.close()


# ============================================================
# 对话历史函数
# ============================================================

def save_conversation(session_id: str, role_key: str, question: str, answer: dict, user_id: int = None) -> dict:
    """
    保存一条对话记录。
    参数：
        session_id  会话 ID（用于标识一次多轮对话）
        role_key    角色键名
        question    用户提问内容
        answer      回答数据，包含 quote, source, plain, interpretation 等字段
        user_id     用户 ID（可选，匿名用户为 None）
    返回：
        dict: { success: True, data: {...} } 或 { success: False, error: "..." }
    """
    if not session_id:
        return {"success": False, "error": "session_id 不能为空"}
    if not role_key:
        return {"success": False, "error": "role_key 不能为空"}
    if not question:
        return {"success": False, "error": "question 不能为空"}
    if not answer or not isinstance(answer, dict):
        return {"success": False, "error": "answer 不能为空"}

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO conversations
                (session_id, user_id, role_key, question, quote, source, plain, interpretation)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                user_id,
                role_key,
                question,
                answer.get("quote", ""),
                answer.get("source", ""),
                answer.get("plain", ""),
                answer.get("interpretation", ""),
            ),
        )
        conn.commit()
        conv_id = cursor.lastrowid

        cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
        row = cursor.fetchone()
        return {"success": True, "data": _row_to_dict(row)}
    except Exception as e:
        return {"success": False, "error": f"保存对话失败: {str(e)}"}
    finally:
        conn.close()


def get_conversation_history(session_id: str, limit: int = 20) -> list:
    """
    获取指定会话的对话历史。
    参数：
        session_id  会话 ID
        limit       返回记录数量上限，默认 20
    返回：
        list: 对话记录列表，按时间正序排列（最早在前）。
              若出错返回空列表。
    """
    if not session_id:
        return []

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM conversations
            WHERE session_id = ?
            ORDER BY created_at ASC
            LIMIT ?
            """,
            (session_id, limit),
        )
        rows = cursor.fetchall()
        return [_row_to_dict(row) for row in rows]
    except Exception:
        return []
    finally:
        conn.close()


# ============================================================
# 社区问答函数
# ============================================================

def save_community_qa(user_id: int, user_nickname: str, question: str, role_key: str, answer: dict) -> dict:
    """
    保存一条社区问答记录。
    参数：
        user_id        用户 ID（可为 None）
        user_nickname  用户昵称
        question       提问内容
        role_key       角色键名
        answer         回答数据，包含 role_name, quote, source, plain, interpretation 等字段
    返回：
        dict: { success: True, data: {...} } 或 { success: False, error: "..." }
    """
    if not question:
        return {"success": False, "error": "question 不能为空"}
    if not role_key:
        return {"success": False, "error": "role_key 不能为空"}
    if not answer or not isinstance(answer, dict):
        return {"success": False, "error": "answer 不能为空"}

    # role_name 优先从 answer 中显式取 role_name 字段，
    # 若不存在则使用 answer 的 role 字段（generate_answer 返回的 role 为角色名称）
    role_name = answer.get("role_name") or answer.get("role", "")

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO community_qa
                (user_id, user_nickname, question, role_key, role_name,
                 quote, source, plain, interpretation)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                user_nickname or "",
                question,
                role_key,
                role_name,
                answer.get("quote", ""),
                answer.get("source", ""),
                answer.get("plain", ""),
                answer.get("interpretation", ""),
            ),
        )
        conn.commit()
        qa_id = cursor.lastrowid

        cursor.execute("SELECT * FROM community_qa WHERE id = ?", (qa_id,))
        row = cursor.fetchone()
        return {"success": True, "data": _row_to_dict(row)}
    except Exception as e:
        return {"success": False, "error": f"保存社区问答失败: {str(e)}"}
    finally:
        conn.close()


def get_community_qa(limit: int = 20, offset: int = 0) -> list:
    """
    获取社区问答列表。
    参数：
        limit   返回数量上限，默认 20
        offset  偏移量，用于分页，默认 0
    返回：
        list: 社区问答记录列表，按创建时间倒序排列（最新在前）。
              若出错返回空列表。
    """
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM community_qa
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        )
        rows = cursor.fetchall()
        return [_row_to_dict(row) for row in rows]
    except Exception:
        return []
    finally:
        conn.close()


def like_community_qa(qa_id: int) -> dict:
    """
    为社区问答点赞（likes + 1）。
    参数：
        qa_id  社区问答记录 ID
    返回：
        dict: { success: True, data: { id, likes } } 或 { success: False, error: "..." }
    """
    if not qa_id:
        return {"success": False, "error": "qa_id 不能为空"}

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE community_qa SET likes = likes + 1 WHERE id = ?",
            (qa_id,),
        )
        conn.commit()

        if cursor.rowcount == 0:
            return {"success": False, "error": "社区问答记录不存在"}

        cursor.execute("SELECT id, likes FROM community_qa WHERE id = ?", (qa_id,))
        row = cursor.fetchone()
        return {"success": True, "data": _row_to_dict(row)}
    except Exception as e:
        return {"success": False, "error": f"点赞失败: {str(e)}"}
    finally:
        conn.close()


def search_community_qa(keyword: str, limit: int = 20) -> list:
    """
    搜索社区问答。
    参数：
        keyword  搜索关键词（匹配 question, quote, plain, interpretation 字段）
        limit    返回数量上限，默认 20
    返回：
        list: 匹配的社区问答记录列表，按创建时间倒序排列。
              若出错返回空列表。
    """
    if not keyword or not keyword.strip():
        return []

    keyword_pattern = f"%{keyword.strip()}%"

    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM community_qa
            WHERE question LIKE ?
               OR quote LIKE ?
               OR plain LIKE ?
               OR interpretation LIKE ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (keyword_pattern, keyword_pattern, keyword_pattern, keyword_pattern, limit),
        )
        rows = cursor.fetchall()
        return [_row_to_dict(row) for row in rows]
    except Exception:
        return []
    finally:
        conn.close()


# ============================================================
# 模块加载时自动初始化数据库
# ============================================================
init_db()
