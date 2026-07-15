"""SQLite 数据库连接和表管理（乒乓球分支，所有表用 pingpong_ 前缀）"""
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
    """初始化数据库，创建乒乓球分支所需的所有表（pingpong_ 前缀）"""
    conn = get_connection()
    cursor = conn.cursor()

    # 任务表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS pingpong_tasks (
            id TEXT PRIMARY KEY,
            video_filename TEXT NOT NULL,
            video_path TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            total_frames INTEGER DEFAULT 0,
            processed_frames INTEGER DEFAULT 0,
            filtered_frames INTEGER DEFAULT 0,
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
        CREATE TABLE IF NOT EXISTS pingpong_player_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            player_id INTEGER NOT NULL,
            frame_number INTEGER NOT NULL,
            timestamp REAL NOT NULL,
            x_table REAL NOT NULL,
            y_table REAL NOT NULL,
            x_pixel REAL NOT NULL,
            y_pixel REAL NOT NULL,
            FOREIGN KEY (task_id) REFERENCES pingpong_tasks(id)
        )
        """
    )

    # 球的 3D 轨迹表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS pingpong_ball_tracks_3d (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            frame_number INTEGER NOT NULL,
            timestamp REAL NOT NULL,
            x_table REAL,
            y_table REAL,
            z_height REAL,
            x_pixel REAL,
            y_pixel REAL,
            ball_pixel_size REAL,
            FOREIGN KEY (task_id) REFERENCES pingpong_tasks(id)
        )
        """
    )

    # 落点表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS pingpong_landing_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            frame_number INTEGER NOT NULL,
            timestamp REAL NOT NULL,
            x_table REAL,
            y_table REAL,
            zone TEXT,
            rally_id INTEGER,
            FOREIGN KEY (task_id) REFERENCES pingpong_tasks(id)
        )
        """
    )

    # 球员统计表
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS pingpong_player_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id TEXT NOT NULL,
            player_id INTEGER NOT NULL,
            hit_count INTEGER DEFAULT 0,
            rally_count INTEGER DEFAULT 0,
            avg_rally_duration REAL DEFAULT 0,
            hit_frequency REAL DEFAULT 0,
            forehand_rate REAL DEFAULT 0,
            backhand_rate REAL DEFAULT 0,
            total_distance REAL DEFAULT 0,
            avg_speed REAL DEFAULT 0,
            max_speed REAL DEFAULT 0,
            near_table_rate REAL DEFAULT 0,
            mid_table_rate REAL DEFAULT 0,
            far_table_rate REAL DEFAULT 0,
            left_landing_rate REAL DEFAULT 0,
            center_landing_rate REAL DEFAULT 0,
            right_landing_rate REAL DEFAULT 0,
            avg_ball_speed REAL DEFAULT 0,
            max_ball_speed REAL DEFAULT 0,
            avg_net_height REAL DEFAULT 0,
            loop_rate REAL DEFAULT 0,
            drive_rate REAL DEFAULT 0,
            smash_rate REAL DEFAULT 0,
            line_change_count INTEGER DEFAULT 0,
            crossline_rate REAL DEFAULT 0,
            straightline_rate REAL DEFAULT 0,
            FOREIGN KEY (task_id) REFERENCES pingpong_tasks(id)
        )
        """
    )

    # 创建索引以加速查询
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_pingpong_player_tracks_task ON pingpong_player_tracks(task_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_pingpong_ball_tracks_3d_task ON pingpong_ball_tracks_3d(task_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_pingpong_landing_points_task ON pingpong_landing_points(task_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_pingpong_player_stats_task ON pingpong_player_stats(task_id)"
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
