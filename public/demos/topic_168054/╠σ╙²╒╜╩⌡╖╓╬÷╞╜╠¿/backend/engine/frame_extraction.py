"""视频帧提取模块：按指定帧率采样视频帧"""
import cv2
import numpy as np
from typing import Generator, Tuple


def extract_frames(video_path: str, fps: int = 5) -> Generator[Tuple[np.ndarray, int, float], None, None]:
    """从视频中按指定帧率采样帧

    Args:
        video_path: 视频文件路径
        fps: 采样帧率（每秒采样多少帧）

    Yields:
        (frame, frame_number, timestamp): 帧图像、原始帧号、时间戳（秒）
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"无法打开视频文件: {video_path}")

    # 获取视频原始帧率
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    if original_fps <= 0:
        original_fps = 25.0  # 默认假设 25fps

    # 计算采样间隔（每多少帧取一帧）
    frame_interval = max(1, int(round(original_fps / fps)))

    frame_number = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # 按间隔采样
        if frame_number % frame_interval == 0:
            timestamp = frame_number / original_fps
            yield frame, frame_number, timestamp

        frame_number += 1

    cap.release()


def get_video_info(video_path: str) -> dict:
    """获取视频基本信息

    Returns:
        dict: 包含 fps, frame_count, width, height, duration
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"无法打开视频文件: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = frame_count / fps if fps > 0 else 0

    cap.release()

    return {
        "fps": fps,
        "frame_count": frame_count,
        "width": width,
        "height": height,
        "duration": duration,
    }


def count_sampled_frames(video_path: str, fps: int = 5) -> int:
    """计算按指定帧率采样后的总帧数"""
    info = get_video_info(video_path)
    original_fps = info["fps"]
    frame_count = info["frame_count"]
    if original_fps <= 0:
        return 0
    frame_interval = max(1, int(round(original_fps / fps)))
    return frame_count // frame_interval
