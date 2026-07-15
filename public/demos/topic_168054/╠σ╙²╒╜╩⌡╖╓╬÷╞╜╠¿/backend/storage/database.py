"""SQLite 数据库连接和表管理"""
import sqlite3
from pathlib import Path
from typing import Optional
from config import DATABASE_PATH


def get_connection() -> sqlite3.Connection:
    """获取数据库连接，启用外键约束"""
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row  # 返回字典形式的行
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """初始化数据库，创建所有需要的表"""
    conn = get_connection()
    cursor = conn.cursor()

    # 任务表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            video_filename TEXT NOT NULL,
            video_path TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            total_frames INTEGER DEFAULT 0,
            processed_frames INTEGER DEFAULT 0,
            duration_seconds REAL DEFAULT 0,
            error_message TEXT,
            created_at TEXT NOT NULL,
            completed_at TEXT
        )
        """
    )

    # 球员轨迹表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS player_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            player_id INTEGER NOT NULL,
            team TEXT DEFAULT 'team_a',
            frame_number INTEGER NOT NULL,
            timestamp REAL NOT NULL,
            x_field REAL NOT NULL,
            y_field REAL NOT NULL,
            x_pixel REAL NOT NULL,
            y_pixel REAL NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
        """
    )

    # 足球轨迹表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS ball_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            frame_number INTEGER NOT NULL,
            timestamp REAL NOT NULL,
            x_field REAL,
            y_field REAL,
            x_pixel REAL,
            y_pixel REAL,
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
        """
    )

    # 球员统计表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS player_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            player_id INTEGER NOT NULL,
            team TEXT DEFAULT 'team_a',
            total_distance REAL DEFAULT 0,
            possession_time REAL DEFAULT 0,
            possession_rate REAL DEFAULT 0,
            pass_count INTEGER DEFAULT 0,
            pass_success_count INTEGER DEFAULT 0,
            pass_success_rate REAL DEFAULT 0,
            shot_count INTEGER DEFAULT 0,
            avg_speed REAL DEFAULT 0,
            max_speed REAL DEFAULT 0,
            main_zone TEXT DEFAULT '',
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
        """
    )

    # 创建索引以加速查询
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_player_tracks_task ON player_tracks(task_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_ball_tracks_task ON ball_tracks(task_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_player_stats_task ON player_stats(task_id)"
    )

    conn.commit()
    conn.close()


def execute_query(query: str, params: tuple = ()) -> list:
    """执行查询并返回结果列表"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        results = cursor.fetchall()
        return [dict(row) for row in results]
    finally:
        conn.close()


def execute_update(query: str, params: tuple = ()) -> None:
    """执行更新/插入/删除操作"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
    finally:
        conn.close()


def execute_single(query: str, params: tuple = ()) -> Optional[dict]:
    """执行查询并返回单条结果"""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()
