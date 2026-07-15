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
    """球员轨迹点模型"""
    task_id: str
    player_id: int
    team: str = "team_a"
    frame_number: int
    timestamp: float
    x_field: float
    y_field: float
    x_pixel: float
    y_pixel: float


class BallTrack(BaseModel):
    """足球轨迹点模型"""
    task_id: str
    frame_number: int
    timestamp: float
    x_field: Optional[float] = None
    y_field: Optional[float] = None
    x_pixel: Optional[float] = None
    y_pixel: Optional[float] = None


class PlayerStats(BaseModel):
    """球员统计模型"""
    task_id: str
    player_id: int
    team: str = "team_a"
    total_distance: float = 0.0
    possession_time: float = 0.0
    possession_rate: float = 0.0
    pass_count: int = 0
    pass_success_count: int = 0
    pass_success_rate: float = 0.0
    shot_count: int = 0
    avg_speed: float = 0.0
    max_speed: float = 0.0
    main_zone: str = ""


class PlayerTrajectoryResponse(BaseModel):
    """单个球员轨迹响应"""
    player_id: int
    team: str
    trajectory: List[dict] = []


class PlayerDataResponse(BaseModel):
    """球员数据响应（含统计）"""
    player_id: int
    team: str
    stats: dict
    trajectory: List[dict] = []


class AnalysisReport(BaseModel):
    """分析报告模型"""
    summary: str
    team_a_possession: float = 0.0
    team_b_possession: float = 0.0
    total_passes: int = 0
    total_shots: int = 0
    top_runner: Optional[dict] = None
    key_findings: List[str] = []


class FullAnalysisResponse(BaseModel):
    """完整分析结果响应"""
    task_id: str
    status: str
    players: List[dict] = []
    ball: List[dict] = []
    report: dict = {}
