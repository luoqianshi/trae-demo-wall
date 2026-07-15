"""3D 坐标提取模块：将像素坐标映射到球桌归一化坐标，并估算 Z 轴高度"""
from typing import Tuple
from config import (
    TABLE_NORMALIZED_MAX,
    BALL_DIAMETER_MM,
    REFERENCE_FOCAL_LENGTH_PX,
    REFERENCE_CAMERA_DISTANCE_M,
    LANDING_Z_THRESHOLD_CM,
)


def pixel_to_table(
    x_pixel: float,
    y_pixel: float,
    frame_width: int,
    frame_height: int,
) -> Tuple[float, float]:
    """将像素坐标映射到球桌归一化坐标（0-100）

    将视频画面中看到的区域归一化到 0x0 ~ 100x100 的范围。
    x_table / y_table 表示"画面内归一化坐标"，对应球桌平面位置。

    Args:
        x_pixel: 像素 x 坐标
        y_pixel: 像素 y 坐标
        frame_width: 帧宽度
        frame_height: 帧高度

    Returns:
        (x_table, y_table): 球桌归一化坐标（0-100）
    """
    if frame_width <= 0 or frame_height <= 0:
        return 0.0, 0.0

    x_table = (x_pixel / frame_width) * TABLE_NORMALIZED_MAX
    y_table = (y_pixel / frame_height) * TABLE_NORMALIZED_MAX

    # 确保坐标在有效范围内
    x_table = max(0.0, min(TABLE_NORMALIZED_MAX, x_table))
    y_table = max(0.0, min(TABLE_NORMALIZED_MAX, y_table))

    return round(x_table, 2), round(y_table, 2)


def estimate_z_height(ball_pixel_size: float, frame_height: int) -> float:
    """通过球的像素大小估算 Z 轴高度（厘米）

    原理：基于针孔相机模型，物体在画面中的像素大小与距离成反比。
    - 球越大 → 离镜头越近 → z 越低（接近球桌高度）
    - 球越小 → 离镜头越远 → z 越高（但乒乓球比赛中球高度有限）

    参考球直径：40mm
    简化模型：以参考相机距离为基准，计算球与镜头的距离变化，
    再减去基准距离得到高度变化。

    Args:
        ball_pixel_size: 球在画面中的像素直径
        frame_height: 帧高度（用于归一化）

    Returns:
        z_height_cm: 估算的 Z 轴高度（厘米，相对于球桌表面）
    """
    if ball_pixel_size <= 0 or frame_height <= 0:
        return 0.0

    # 球的参考直径换算为像素（在参考距离下）
    # 针孔模型：pixel_size = focal_length * real_size / distance
    # 在参考距离 REFERENCE_CAMERA_DISTANCE_M 下：
    # reference_pixel_size = REFERENCE_FOCAL_LENGTH_PX * BALL_DIAMETER_M / REFERENCE_CAMERA_DISTANCE_M
    ball_diameter_m = BALL_DIAMETER_MM / 1000.0
    reference_pixel_size = (
        REFERENCE_FOCAL_LENGTH_PX * ball_diameter_m / REFERENCE_CAMERA_DISTANCE_M
    )

    if reference_pixel_size <= 0:
        return 0.0

    # 反推球与镜头的距离
    # distance = focal_length * real_size / pixel_size
    estimated_distance = (
        REFERENCE_FOCAL_LENGTH_PX * ball_diameter_m / ball_pixel_size
    )

    # 高度变化 = 估算距离 - 参考距离（球离镜头越远，说明球越高）
    # 转换为厘米
    height_diff_m = estimated_distance - REFERENCE_CAMERA_DISTANCE_M
    z_height_cm = height_diff_m * 100.0

    # 限制在合理范围内（乒乓球飞行高度通常 0-100cm）
    z_height_cm = max(0.0, min(150.0, z_height_cm))

    return round(z_height_cm, 2)


def is_landing_point(z_height: float, x_table: float, y_table: float) -> bool:
    """判断是否为落点

    落点条件：Z 高度接近 0（球落到桌面）且在球桌范围内

    Args:
        z_height: Z 轴高度（厘米）
        x_table: 球桌 X 坐标（0-100）
        y_table: 球桌 Y 坐标（0-100）

    Returns:
        是否为落点
    """
    # Z 高度低于阈值
    if z_height > LANDING_Z_THRESHOLD_CM:
        return False

    # 在球桌范围内（0-100）
    if x_table < 0 or x_table > TABLE_NORMALIZED_MAX:
        return False
    if y_table < 0 or y_table > TABLE_NORMALIZED_MAX:
        return False

    return True


def get_landing_zone(x_table: float, y_table: float) -> str:
    """根据落点位置返回区域（左/中/右）

    球桌宽度方向分为左、中、右三区

    Args:
        x_table: 球桌 X 坐标（0-100）
        y_table: 球桌 Y 坐标（0-100）

    Returns:
        "left", "center", 或 "right"
    """
    if x_table < 33.33:
        return "left"
    elif x_table < 66.66:
        return "center"
    else:
        return "right"


def get_standing_zone(y_table: float) -> str:
    """根据球员 Y 坐标判断站位区域（近台/中台/远台）

    Args:
        y_table: 球员 Y 坐标（0-100）

    Returns:
        "near"（近台）, "mid"（中台）, 或 "far"（远台）
    """
    from config import NEAR_TABLE_THRESHOLD, MID_TABLE_THRESHOLD
    if y_table < NEAR_TABLE_THRESHOLD:
        return "near"
    elif y_table < MID_TABLE_THRESHOLD:
        return "mid"
    else:
        return "far"
