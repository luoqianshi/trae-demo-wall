"""乒乓球分析项目配置文件"""
import os
from pathlib import Path

# 乒乓球后端根目录（backend/pingpong）
BASE_DIR = Path(__file__).resolve().parent

# 乒乓球上传文件存储目录（独立于足球分支）
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# 数据库路径（复用同一个数据库文件，但表名用 pingpong_ 前缀）
# 足球分支使用 backend/soccer_analysis.db，这里指向同一文件
DATABASE_PATH = BASE_DIR.parent / "soccer_analysis.db"

# YOLOv8 模型路径（首次运行会自动下载，与足球分支复用）
YOLO_MODEL_PATH = "yolov8n.pt"

# 视频采样帧率（乒乓球球速快，使用 10fps）
SAMPLE_FPS = 10

# 标准乒乓球桌尺寸（米）
TABLE_LENGTH_METERS = 2.74
TABLE_WIDTH_METERS = 1.525

# 归一化后的球桌坐标范围（0-100）
TABLE_NORMALIZED_MAX = 100.0

# 乒乓球参考直径（毫米），用于 Z 轴高度估算
BALL_DIAMETER_MM = 40.0
BALL_DIAMETER_M = BALL_DIAMETER_MM / 1000.0  # 0.04m

# Z 轴估算的参考相机焦距（像素），用于针孔相机模型反推距离
# 这是一个假设的等效焦距，实际场景下作为估算基准
REFERENCE_FOCAL_LENGTH_PX = 800.0

# Z 轴估算的镜头距离基准（米），假设摄像机距球桌的典型距离
REFERENCE_CAMERA_DISTANCE_M = 3.0

# 落点判定：Z 高度低于此值（厘米）且在球桌范围内，认为是落点
LANDING_Z_THRESHOLD_CM = 5.0

# 击球判定：球与球员在归一化坐标中的距离阈值
HIT_DISTANCE_THRESHOLD = 5.0

# 回合间隔：连续两次击球的最大时间间隔（秒），超过则视为回合结束
RALLY_GAP_THRESHOLD = 3.0

# 正反手判定：球员在球桌同侧且球位于持拍侧判定为正手，异侧判定为反手
# 此处用球员 X 坐标与球 X 坐标的差值符号判断（简化版）
FOREHAND_BACKHAND_THRESHOLD = 0.0

# 站位区域阈值（归一化坐标，距球桌端线的距离）
NEAR_TABLE_THRESHOLD = 15.0   # 近台
MID_TABLE_THRESHOLD = 30.0    # 中台（超过此值为远台）

# 弧线类型判定的弧度阈值
# 高吊弧圈：弧度高（抛物线顶点与两端连线的最大偏差大）
# 前冲弧圈：弧度中等
# 扣杀：弧度低（近似直线）
LOOP_ARC_THRESHOLD = 15.0     # 高吊弧圈阈值（厘米）
DRIVE_ARC_THRESHOLD = 5.0     # 前冲弧圈阈值（厘米）

# CORS 允许的前端来源
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 服务器配置
HOST = "0.0.0.0"
PORT = 8001  # 乒乓球后端使用不同端口，避免与足球后端冲突

# 是否使用 GPU（自动检测）
try:
    import torch
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    # torch 未安装时降级到 CPU
    DEVICE = "cpu"
