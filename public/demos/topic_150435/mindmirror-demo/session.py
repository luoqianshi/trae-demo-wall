"""
心镜 MindMirror — 会话记录模块
使用 SQLite 记录每次对话的内容和情绪数据
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Optional


DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "mindmirror.db")


def get_db():
    """获取数据库连接"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """初始化数据库表"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'default',
            start_time TEXT NOT NULL,
            end_time TEXT,
            summary TEXT,
            dominant_emotion TEXT,
            emotion_change TEXT,
            message_count INTEGER DEFAULT 0
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            face_emotion TEXT,
            voice_emotion TEXT,
            text_emotion TEXT,
            fused_emotion TEXT,
            emotion_intensity REAL,
            emotion_trend TEXT,
            cbt_strategy TEXT,
            crisis_flag INTEGER DEFAULT 0,
            FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS emotion_samples (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            emotion TEXT NOT NULL,
            intensity REAL NOT NULL,
            source TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
    """)

    conn.commit()
    conn.close()


def start_session(user_id: str = "default") -> str:
    """开始新的会话"""
    import uuid
    session_id = str(uuid.uuid4())[:8]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sessions (id, user_id, start_time) VALUES (?, ?, ?)",
        (session_id, user_id, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
    return session_id


def add_message(
    session_id: str,
    role: str,
    content: str,
    face_emotion: str = "",
    voice_emotion: str = "",
    text_emotion: str = "",
    fused_emotion: str = "",
    emotion_intensity: float = 0.0,
    emotion_trend: str = "",
    cbt_strategy: str = "",
    crisis_flag: bool = False,
) -> str:
    """添加一条消息"""
    import uuid
    msg_id = str(uuid.uuid4())[:8]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO messages
           (id, session_id, role, content, timestamp,
            face_emotion, voice_emotion, text_emotion, fused_emotion,
            emotion_intensity, emotion_trend, cbt_strategy, crisis_flag)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (msg_id, session_id, role, content, datetime.now().isoformat(),
         face_emotion, voice_emotion, text_emotion, fused_emotion,
         emotion_intensity, emotion_trend, cbt_strategy, 1 if crisis_flag else 0)
    )
    cursor.execute(
        "UPDATE sessions SET message_count = message_count + 1 WHERE id = ?",
        (session_id,)
    )
    conn.commit()
    conn.close()
    return msg_id


def add_emotion_sample(session_id: str, emotion: str, intensity: float, source: str = "fused"):
    """添加一条情绪采样"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO emotion_samples (session_id, timestamp, emotion, intensity, source) VALUES (?, ?, ?, ?, ?)",
        (session_id, datetime.now().isoformat(), emotion, intensity, source)
    )
    conn.commit()
    conn.close()


def end_session(session_id: str, summary: str = "", dominant_emotion: str = "", emotion_change: str = ""):
    """结束会话"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        """UPDATE sessions
           SET end_time = ?, summary = ?, dominant_emotion = ?, emotion_change = ?
           WHERE id = ?""",
        (datetime.now().isoformat(), summary, dominant_emotion, emotion_change, session_id)
    )
    conn.commit()
    conn.close()


def get_session(session_id: str) -> dict:
    """获取会话详情"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    if not session:
        return None

    cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp", (session_id,))
    messages = cursor.fetchall()

    cursor.execute(
        "SELECT * FROM emotion_samples WHERE session_id = ? ORDER BY timestamp",
        (session_id,)
    )
    samples = cursor.fetchall()

    conn.close()

    return {
        "id": session["id"],
        "user_id": session["user_id"],
        "start_time": session["start_time"],
        "end_time": session["end_time"],
        "summary": session["summary"],
        "dominant_emotion": session["dominant_emotion"],
        "emotion_change": session["emotion_change"],
        "message_count": session["message_count"],
        "messages": [
            {
                "role": m["role"],
                "content": m["content"],
                "timestamp": m["timestamp"],
                "face_emotion": m["face_emotion"],
                "voice_emotion": m["voice_emotion"],
                "text_emotion": m["text_emotion"],
                "fused_emotion": m["fused_emotion"],
                "emotion_intensity": m["emotion_intensity"],
                "emotion_trend": m["emotion_trend"],
                "cbt_strategy": m["cbt_strategy"],
                "crisis_flag": bool(m["crisis_flag"]),
            }
            for m in messages
        ],
        "emotion_samples": [
            {
                "timestamp": s["timestamp"],
                "emotion": s["emotion"],
                "intensity": s["intensity"],
                "source": s["source"],
            }
            for s in samples
        ],
    }


def list_sessions() -> list:
    """列出所有会话"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, user_id, start_time, end_time, dominant_emotion, emotion_change, message_count FROM sessions ORDER BY start_time DESC"
    )
    sessions = cursor.fetchall()
    conn.close()
    return [
        {
            "id": s["id"],
            "user_id": s["user_id"],
            "start_time": s["start_time"],
            "end_time": s["end_time"],
            "dominant_emotion": s["dominant_emotion"],
            "emotion_change": s["emotion_change"],
            "message_count": s["message_count"],
        }
        for s in sessions
    ]


def get_session_emotion_trajectory(session_id: str) -> list:
    """获取会话的情绪轨迹数据"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT timestamp, emotion, intensity, source FROM emotion_samples WHERE session_id = ? ORDER BY timestamp",
        (session_id,)
    )
    samples = cursor.fetchall()
    conn.close()
    return [
        {
            "timestamp": s["timestamp"],
            "emotion": s["emotion"],
            "intensity": s["intensity"],
            "source": s["source"],
        }
        for s in samples
    ]
