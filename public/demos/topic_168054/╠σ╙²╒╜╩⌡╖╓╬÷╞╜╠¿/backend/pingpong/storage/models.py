"""数据模型定义（Pydantic 模型，用于 API 响应和数据库交互）"""
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class TaskBase(BaseModel):
    """任务基础模型"""
    video_filename: str
    status: str = "pending"
    total_frames: int = 0
    processed_frames: int = 0
    filtered_frames: int = 0
    duration_seconds: float = 0.0


class TaskCreate(TaskBase):
    """创建任务请求模型"""
    pass


class Task(TaskBase):
    """任务完整模型"""
    id: str
    video_path: str
    error_message: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

    class Config:
        from_attributes = True


class PlayerTrack(BaseModel):
    """球员轨迹点模型（2D）"""
    task_id: str
    player_id: int
    frame_number: int
    timestamp: float
    x_table: float
    y_table: float
    x_pixel: float
    y_pixel: float


class BallTrack3D(BaseModel):
    """球的 3D 轨迹点模型"""
    task_id: str
    frame_number: int
    timestamp: float
    x_table: Optional[float] = None
    y_table: Optional[float] = None
    z_height: Optional[float] = None
    x_pixel: Optional[float] = None
    y_pixel: Optional[float] = None
    ball_pixel_size: Optional[float] = None


class LandingPoint(BaseModel):
    """落点模型"""
    task_id: str
    frame_number: int
    timestamp: float
    x_table: Optional[float] = None
    y_table: Optional[float] = None
    zone: Optional[str] = None
    rally_id: Optional[int] = None


class PlayerStats(BaseModel):
    """球员统计模型"""
    task_id: str
    player_id: int
    hit_count: int = 0
    rally_count: int = 0
    avg_rally_duration: float = 0.0
    hit_frequency: float = 0.0
    forehand_rate: float = 0.0
    backhand_rate: float = 0.0
    total_distance: float = 0.0
    avg_speed: float = 0.0
    max_speed: float = 0.0
    near_table_rate: float = 0.0
    mid_table_rate: float = 0.0
    far_table_rate: float = 0.0
    left_landing_rate: float = 0.0
    center_landing_rate: float = 0.0
    right_landing_rate: float = 0.0
    avg_ball_speed: float = 0.0
    max_ball_speed: float = 0.0
    avg_net_height: float = 0.0
    loop_rate: float = 0.0
    drive_rate: float = 0.0
    smash_rate: float = 0.0
    line_change_count: int = 0
    crossline_rate: float = 0.0
    straightline_rate: float = 0.0


class FullAnalysisResponse(BaseModel):
    """完整分析结果响应"""
    task_id: str
    status: str
    players: List[dict] = []
    ball_3d: List[dict] = []
    landing_points: List[dict] = []
    stats: List[dict] = []
    report: str = ""
    filtered_frames: int = 0
