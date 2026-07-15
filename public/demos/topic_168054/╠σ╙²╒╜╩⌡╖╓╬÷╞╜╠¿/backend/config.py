"""项目配置文件"""
import os
from pathlib import Path

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent

# 上传文件存储目录
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# 数据库路径
DATABASE_PATH = BASE_DIR / "soccer_analysis.db"

# YOLOv8 模型路径（首次运行会自动下载）
YOLO_MODEL_PATH = "yolov8n.pt"

# 视频采样帧率（每秒采样多少帧）
SAMPLE_FPS = 5

# 标准足球场尺寸（米）
FIELD_LENGTH_METERS = 105.0
FIELD_WIDTH_METERS = 68.0

# 归一化后的球场坐标范围（0-100）
FIELD_NORMALIZED_MAX = 100.0

# 持球判定阈值（归一化坐标距离，小于此值认为球员持球）
POSSESSION_DISTANCE_THRESHOLD = 3.0

# 传球判定阈值（归一化坐标距离，小于此值认为球员可接到球）
PASS_DISTANCE_THRESHOLD = 5.0

# 射门速度阈值（归一化坐标/秒）
SHOT_SPEED_THRESHOLD = 30.0

# 禁区范围（归一化坐标，距离球门的目标区域）
PENALTY_AREA_DEPTH = 16.5 / FIELD_LENGTH_METERS * FIELD_NORMALIZED_MAX

# CORS 允许的前端来源
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 服务器配置
HOST = "0.0.0.0"
PORT = 8000

# 是否使用 GPU（自动检测）
import torch
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
