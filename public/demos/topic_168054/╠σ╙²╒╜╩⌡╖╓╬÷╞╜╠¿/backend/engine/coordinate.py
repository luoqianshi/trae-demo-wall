"""坐标映射模块：将视频像素坐标映射到画面可视区域归一化坐标

说明：
    本模块不再假设视频能拍到整个球场。对于业余比赛用手机拍摄的场景，
    视频通常只能覆盖球场的一部分（1/3 到 2/3）。
    因此，x_field / y_field 现在表示"画面内归一化坐标"（0-100），
    即把视频画面中实际看到的区域归一化到 0x0 ~ 100x100 的范围。
    前端的热力图和轨迹仍按 0-100 绘制，代表的是视频中看到的局部区域，
    而非标准球场的绝对坐标。
"""
from typing import Tuple
from config import (
    FIELD_NORMALIZED_MAX,
    FIELD_LENGTH_METERS,
    FIELD_WIDTH_METERS,
)


def pixel_to_field(
    x_pixel: float,
    y_pixel: float,
    frame_width: int,
    frame_height: int,
) -> Tuple[float, float]:
    """将像素坐标映射到画面可视区域归一化坐标（0-100）

    将视频画面中看到的区域归一化到 0x0 ~ 100x100 的范围。
    x_field / y_field 表示"画面内归一化坐标"，而非标准球场坐标。

    Args:
        x_pixel: 像素 x 坐标
        y_pixel: 像素 y 坐标
        frame_width: 帧宽度
        frame_height: 帧高度

    Returns:
        (x_field, y_field): 画面内归一化坐标（0-100）
    """
    if frame_width <= 0 or frame_height <= 0:
        return 0.0, 0.0

    x_field = (x_pixel / frame_width) * FIELD_NORMALIZED_MAX
    y_field = (y_pixel / frame_height) * FIELD_NORMALIZED_MAX

    # 确保坐标在有效范围内
    x_field = max(0.0, min(FIELD_NORMALIZED_MAX, x_field))
    y_field = max(0.0, min(FIELD_NORMALIZED_MAX, y_field))

    return round(x_field, 2), round(y_field, 2)


def bbox_center_to_field(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    frame_width: int,
    frame_height: int,
) -> Tuple[float, float]:
    """将检测框中心点映射到画面可视区域归一化坐标

    Args:
        x1, y1, x2, y2: 检测框坐标
        frame_width: 帧宽度
        frame_height: 帧高度

    Returns:
        (x_field, y_field): 画面内归一化坐标（0-100）
    """
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    return pixel_to_field(cx, cy, frame_width, frame_height)


def estimate_coverage(frame_width: int, frame_height: int) -> float:
    """粗略估计画面覆盖率

    基于视频画面宽高比与标准球场（105:68）的比例对比，
    粗略估计视频画面覆盖了多大比例的球场区域。

    原理：
        - 标准球场宽高比为 105/68 ≈ 1.544
        - 当视频画面宽高比与标准球场接近时，可能拍到较多球场区域
        - 当画面宽高比偏离标准值时（如手机竖屏 9:16），
          通常只能拍到球场的一小部分

    Args:
        frame_width: 帧宽度（像素）
        frame_height: 帧高度（像素）

    Returns:
        覆盖率（0-1），1 表示可能覆盖整个球场，越小表示覆盖区域越少
    """
    if frame_width <= 0 or frame_height <= 0:
        return 0.0

    standard_ratio = FIELD_LENGTH_METERS / FIELD_WIDTH_METERS  # 105/68 ≈ 1.544
    video_ratio = frame_width / frame_height

    # 取宽高比比值的最小值作为覆盖率估计
    # 比值越接近 1，说明画面宽高比越接近标准球场，覆盖率越高
    if video_ratio >= standard_ratio:
        coverage = standard_ratio / video_ratio
    else:
        coverage = video_ratio / standard_ratio

    # 限制在 0.1 ~ 1.0 之间（至少给个下限，避免极端值）
    coverage = max(0.1, min(1.0, coverage))

    return round(coverage, 2)


def get_viewport_description(width: int, height: int) -> str:
    """返回对画面范围的描述

    根据画面宽高比估计覆盖率，生成可显示在前端的文字描述，
    让用户知道当前分析的是局部画面而非整个球场。

    Args:
        width: 画面宽度
        height: 画面高度

    Returns:
        描述字符串，如"画面覆盖球场约40%区域（局部画面分析模式）"
    """
    coverage = estimate_coverage(width, height)
    percent = round(coverage * 100)

    if coverage >= 0.9:
        mode = "全画面分析模式"
    elif coverage >= 0.5:
        mode = "局部画面分析模式"
    else:
        mode = "局部画面分析模式（小范围）"

    return f"画面覆盖球场约{percent}%区域（{mode}）"


def get_zone(x_field: float, y_field: float) -> str:
    """根据画面归一化坐标判断球员所在区域

    将画面可视区域分为 9 个区域：
    - 左/中/右 × 前/中/后

    注意：此处分区针对的是画面可视区域，而非标准球场。

    Returns:
        区域名称字符串
    """
    # 横向分区（画面长度方向）
    if x_field < 33.33:
        horizontal = "左侧"
    elif x_field < 66.66:
        horizontal = "中场"
    else:
        horizontal = "右侧"

    # 纵向分区（画面宽度方向）
    if y_field < 33.33:
        vertical = "上部"
    elif y_field < 66.66:
        vertical = "中部"
    else:
        vertical = "下部"

    return f"{horizontal}{vertical}"
