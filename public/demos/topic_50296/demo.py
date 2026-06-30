# -*- coding: utf-8 -*-
"""RunOverlay 功能演示版（Demo）

本演示脚本展示了 RunOverlay 项目的核心功能：
将跑步运动数据（时间、心率、配速、距离、步频、海拔）叠加到视频上。

特点：
- 自包含：无需安装 PySide6/Qt，仅依赖 opencv-python、pillow、numpy、pandas
- 自带示例数据生成器：无需准备 .fit/.gpx 文件
- 自带示例视频生成器：无需准备输入视频即可运行
- 简化版渲染：使用 PIL 绘制半透明背景框 + 文字，演示叠加效果

用法：
    python demo.py                          # 完整演示（生成示例视频 + 处理）
    python demo.py --video input.mp4        # 使用指定视频
    python demo.py --duration 60            # 指定演示数据时长（秒）
    python demo.py --output result.mp4      # 指定输出路径
"""

import argparse
import logging
import os
import sys
import math
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

import cv2
import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger('runoverlay.demo')

# ---------------------------------------------------------------------------
# 路径配置
# ---------------------------------------------------------------------------
DEMO_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = DEMO_DIR / 'output'
OUTPUT_DIR.mkdir(exist_ok=True)


# ===========================================================================
# 1. 示例运动数据生成
# ===========================================================================
def generate_sample_data(duration_seconds: int = 300,
                         start_time: Optional[datetime] = None) -> pd.DataFrame:
    """生成模拟跑步运动数据

    Args:
        duration_seconds: 数据时长（秒），默认 5 分钟
        start_time: 起始时间，默认为当前时间整点

    Returns:
        包含 timestamp/heart_rate/pace/cadence/distance/altitude 列的 DataFrame
    """
    if start_time is None:
        start_time = datetime.now().replace(microsecond=0)

    records: List[Dict[str, Any]] = []
    # 基础数值
    base_hr = 145
    base_pace = 320  # 5:20 /km (秒)
    base_cadence = 170
    base_altitude = 50.0
    total_distance = 0.0

    for i in range(duration_seconds):
        t = start_time + timedelta(seconds=i)
        # 心率：随时间缓慢上升 + 小幅波动
        hr = base_hr + int(i * 0.05) + random.randint(-3, 3)
        hr = max(120, min(185, hr))
        # 配速：基础值 + 正弦波动模拟地形变化
        pace = base_pace + int(15 * math.sin(i / 30.0)) + random.randint(-5, 5)
        pace = max(280, min(420, pace))
        # 步频：小幅波动
        cadence = base_cadence + random.randint(-4, 4)
        # 距离：按配速累加
        speed_mps = 1000.0 / pace  # 米/秒
        total_distance += speed_mps
        # 海拔：正弦波模拟起伏
        altitude = base_altitude + 10 * math.sin(i / 45.0) + random.uniform(-1, 1)

        records.append({
            'timestamp': t,
            'heart_rate': hr,
            'pace': pace,
            'cadence': cadence,
            'distance': round(total_distance, 1),
            'altitude': round(altitude, 1),
        })

    df = pd.DataFrame(records)
    logger.info(f'已生成示例数据：{len(df)} 条记录，'
                f'时长 {duration_seconds} 秒，'
                f'总距离 {df["distance"].iloc[-1]:.1f} m')
    return df


# ===========================================================================
# 2. 示例视频生成
# ===========================================================================
def generate_sample_video(output_path: Path,
                          width: int = 1280,
                          height: int = 720,
                          fps: int = 30,
                          duration_seconds: int = 10) -> Path:
    """生成一段纯色渐变 + 计时器的示例视频

    Args:
        output_path: 输出视频路径
        width: 视频宽度
        height: 视频高度
        fps: 帧率
        duration_seconds: 视频时长（秒）

    Returns:
        输出视频路径
    """
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
    if not writer.isOpened():
        raise RuntimeError(f'无法创建视频写入器：{output_path}')

    total_frames = fps * duration_seconds
    for i in range(total_frames):
        # 渐变背景：从左到右蓝->绿
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        for x in range(width):
            ratio = x / width
            frame[:, x] = (int(255 * (1 - ratio) * 0.3),
                           int(255 * ratio * 0.6),
                           int(255 * (1 - ratio) * 0.8))
        # 中央计时器
        sec = i / fps
        text = f'SAMPLE VIDEO  {sec:05.2f}s'
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(frame, text, (width // 2 - 200, height // 2),
                    font, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
        writer.write(frame)

    writer.release()
    logger.info(f'已生成示例视频：{output_path} '
                f'({width}x{height}@{fps}fps, {duration_seconds}s)')
    return output_path


# ===========================================================================
# 3. 数据叠加渲染器
# ===========================================================================
class OverlayRenderer:
    """简化的数据叠加渲染器

    使用 PIL 在视频帧上绘制半透明背景框 + 运动数据文字。
    """

    # 字段显示配置：(字段名, 取值函数, 格式化函数, 图标符号)
    FIELD_CONFIG = [
        ('时间',     lambda d: d['timestamp'].strftime('%H:%M:%S'),  '{0}',          '🕐'),
        ('心率',     lambda d: d['heart_rate'],                      '{0} BPM',      '❤'),
        ('配速',     lambda d: d['pace'],                            '{0}',          '🏃'),
        ('距离',     lambda d: d['distance'],                        '{0:.2f} km',   '📍'),
        ('步频',     lambda d: d['cadence'],                         '{0} spm',      '👣'),
        ('海拔',     lambda d: d['altitude'],                        '{0:.0f} m',    '⛰'),
    ]

    def __init__(self,
                 font_path: Optional[str] = None,
                 font_size: int = 24,
                 bg_color: Tuple[int, int, int, int] = (0, 0, 0, 160),
                 text_color: Tuple[int, int, int, int] = (255, 255, 255, 255),
                 label_color: Tuple[int, int, int, int] = (180, 220, 255, 255),
                 padding: int = 12,
                 line_spacing: int = 8):
        self.font_size = font_size
        self.bg_color = bg_color
        self.text_color = text_color
        self.label_color = label_color
        self.padding = padding
        self.line_spacing = line_spacing

        # 字体加载：优先使用指定路径，其次尝试系统字体
        self.font = self._load_font(font_path, font_size)
        self.label_font = self._load_font(font_path, max(14, font_size - 6))

    @staticmethod
    def _load_font(font_path: Optional[str], size: int) -> ImageFont.FreeTypeFont:
        """加载字体，依次尝试：指定路径 -> 系统中文字体 -> 默认字体"""
        candidates: List[str] = []
        if font_path and os.path.exists(font_path):
            candidates.append(font_path)
        # Windows 常见中文字体
        win_dir = os.environ.get('WINDIR', r'C:\Windows')
        candidates.extend([
            os.path.join(win_dir, 'Fonts', 'msyh.ttc'),    # 微软雅黑
            os.path.join(win_dir, 'Fonts', 'simhei.ttf'),  # 黑体
            os.path.join(win_dir, 'Fonts', 'arial.ttf'),   # Arial
        ])
        for path in candidates:
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
        logger.warning('未找到合适字体，使用 PIL 默认字体')
        return ImageFont.load_default()

    @staticmethod
    def _format_pace(pace_seconds: int) -> str:
        """配速格式化：320 秒 -> 5:20"""
        m, s = divmod(int(pace_seconds), 60)
        return f'{m}:{s:02d}'

    def _build_lines(self, data_row: pd.Series) -> List[Tuple[str, str, str]]:
        """构造每一行 (图标, 标签, 值)"""
        lines = []
        for name, getter, fmt, icon in self.FIELD_CONFIG:
            try:
                raw = getter(data_row)
                if name == '配速':
                    value = self._format_pace(raw)
                else:
                    value = fmt.format(raw)
                lines.append((icon, name, value))
            except Exception as e:
                logger.debug(f'字段 {name} 渲染失败：{e}')
        return lines

    def _measure_box(self, lines: List[Tuple[str, str, str]]) -> Tuple[int, int]:
        """测量文字框总尺寸"""
        max_label_w = max(self.label_font.getlength(f'{icon} {name}')
                          for icon, name, _ in lines)
        max_value_w = max(self.font.getlength(value)
                          for _, _, value in lines)
        line_h = self.font.size + self.line_spacing
        total_h = line_h * len(lines) + self.padding * 2
        total_w = int(max_label_w + max_value_w + self.padding * 3)
        return total_w, total_h

    def render(self, frame_bgr: np.ndarray, data_row: pd.Series,
               position: str = 'top-left') -> np.ndarray:
        """在帧上叠加数据

        Args:
            frame_bgr: OpenCV BGR 帧
            data_row: 当前时刻的运动数据（DataFrame 一行）
            position: 叠加位置 top-left/top-right/bottom-left/bottom-right

        Returns:
            叠加后的 BGR 帧（同输入对象）
        """
        lines = self._build_lines(data_row)
        if not lines:
            return frame_bgr

        h, w = frame_bgr.shape[:2]
        box_w, box_h = self._measure_box(lines)

        # 计算左上角坐标
        margin = 20
        if position.startswith('top'):
            y = margin
        else:
            y = h - box_h - margin
        if position.endswith('left'):
            x = margin
        else:
            x = w - box_w - margin

        # BGR -> RGBA 用于 PIL 绘制
        pil_img = Image.fromarray(cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGBA))
        draw = ImageDraw.Draw(pil_img, 'RGBA')

        # 半透明背景框
        draw.rectangle([x, y, x + box_w, y + box_h],
                       fill=self.bg_color, outline=(255, 255, 255, 60), width=1)

        # 逐行绘制：图标+标签 | 值
        line_h = self.font.size + self.line_spacing
        text_y = y + self.padding
        label_x = x + self.padding
        value_x = x + box_w - self.padding

        for icon, name, value in lines:
            label_text = f'{icon} {name}'
            # 标签（左对齐）
            draw.text((label_x, text_y), label_text,
                      font=self.label_font, fill=self.label_color)
            # 值（右对齐）
            value_w = self.font.getlength(value)
            draw.text((value_x - value_w, text_y), value,
                      font=self.font, fill=self.text_color)
            text_y += line_h

        # RGBA -> BGR 回写
        frame_bgr[:] = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2BGR)
        return frame_bgr


# ===========================================================================
# 4. 视频处理器
# ===========================================================================
class DemoVideoProcessor:
    """简化版视频处理器

    读取输入视频，按帧率与运动数据时间对齐，叠加渲染后输出。
    """

    def __init__(self,
                 video_path: str,
                 data: pd.DataFrame,
                 renderer: Optional[OverlayRenderer] = None,
                 position: str = 'top-left',
                 data_start_offset: float = 0.0):
        """
        Args:
            video_path: 输入视频路径
            data: 运动数据 DataFrame（含 timestamp 列）
            renderer: 叠加渲染器，默认使用 OverlayRenderer
            position: 叠加位置
            data_start_offset: 数据相对视频开头的偏移（秒）
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f'视频文件不存在：{video_path}')

        self.video_path = video_path
        self.data = data.reset_index(drop=True)
        self.renderer = renderer or OverlayRenderer()
        self.position = position
        self.data_start_offset = data_start_offset

        # 数据时间基线
        self._data_start_ts = data['timestamp'].min()
        self._data_end_ts = data['timestamp'].max()
        logger.info(f'数据时间范围：{self._data_start_ts} ~ {self._data_end_ts}')

    def _get_frame_data(self, frame_time_sec: float) -> Optional[pd.Series]:
        """根据帧时间获取对应数据行（最近邻匹配）"""
        target_ts = self._data_start_ts + timedelta(
            seconds=frame_time_sec - self.data_start_offset)
        if target_ts < self._data_start_ts or target_ts > self._data_end_ts:
            return None
        # 找最近的时间戳
        idx = (self.data['timestamp'] - target_ts).abs().idxmin()
        return self.data.loc[idx]

    def process(self, output_path: str, progress_every: int = 30) -> str:
        """处理视频并输出

        Args:
            output_path: 输出视频路径
            progress_every: 每隔多少帧打印一次进度

        Returns:
            输出文件路径
        """
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            raise RuntimeError(f'无法打开视频：{self.video_path}')

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        logger.info(f'输入视频：{width}x{height} @ {fps:.2f}fps, '
                    f'共 {total_frames} 帧')

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        if not writer.isOpened():
            raise RuntimeError(f'无法创建输出视频：{output_path}')

        frame_idx = 0
        overlaid = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_time = frame_idx / fps
            row = self._get_frame_data(frame_time)
            if row is not None:
                self.renderer.render(frame, row, position=self.position)
                overlaid += 1

            writer.write(frame)
            if frame_idx % progress_every == 0:
                logger.info(f'进度：{frame_idx}/{total_frames} '
                            f'({frame_idx / max(total_frames, 1) * 100:.1f}%)')
            frame_idx += 1

        cap.release()
        writer.release()
        logger.info(f'处理完成：共写入 {frame_idx} 帧，其中 {overlaid} 帧叠加了数据')
        logger.info(f'输出文件：{output_path}')
        return output_path


# ===========================================================================
# 5. 主入口
# ===========================================================================
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='RunOverlay 功能演示版 - 将跑步数据叠加到视频上',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument('--video', type=str, default=None,
                        help='输入视频路径（不指定则自动生成示例视频）')
    parser.add_argument('--output', type=str, default=None,
                        help='输出视频路径（默认 output/result.mp4）')
    parser.add_argument('--duration', type=int, default=30,
                        help='示例运动数据时长（秒），也是示例视频时长')
    parser.add_argument('--data-duration', type=int, default=None,
                        help='运动数据时长（秒），默认与 --duration 一致')
    parser.add_argument('--fps', type=int, default=30,
                        help='示例视频帧率')
    parser.add_argument('--width', type=int, default=1280,
                        help='示例视频宽度')
    parser.add_argument('--height', type=int, default=720,
                        help='示例视频高度')
    parser.add_argument('--position', type=str,
                        default='top-left',
                        choices=['top-left', 'top-right',
                                 'bottom-left', 'bottom-right'],
                        help='数据叠加位置')
    parser.add_argument('--font-size', type=int, default=26,
                        help='文字大小')
    parser.add_argument('--font', type=str, default=None,
                        help='字体文件路径（.ttf/.ttc）')
    parser.add_argument('--keep-sample', action='store_true',
                        help='保留生成的示例视频文件')
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    logger.info('===== RunOverlay Demo 启动 =====')

    # 1. 准备输入视频
    sample_video_path: Optional[Path] = None
    if args.video:
        video_path = args.video
        if not os.path.exists(video_path):
            logger.error(f'指定的视频不存在：{video_path}')
            return 1
    else:
        logger.info('未指定输入视频，自动生成示例视频...')
        sample_video_path = OUTPUT_DIR / 'sample_input.mp4'
        generate_sample_video(
            output_path=sample_video_path,
            width=args.width,
            height=args.height,
            fps=args.fps,
            duration_seconds=args.duration,
        )
        video_path = str(sample_video_path)

    # 2. 生成运动数据
    data_duration = args.data_duration or args.duration
    logger.info(f'生成 {data_duration} 秒示例运动数据...')
    data = generate_sample_data(duration_seconds=data_duration)

    # 3. 创建渲染器
    renderer = OverlayRenderer(
        font_path=args.font,
        font_size=args.font_size,
    )

    # 4. 处理视频
    output_path = args.output or str(OUTPUT_DIR / 'result.mp4')
    processor = DemoVideoProcessor(
        video_path=video_path,
        data=data,
        renderer=renderer,
        position=args.position,
    )
    processor.process(output_path=output_path)

    # 5. 清理示例视频
    if sample_video_path and not args.keep_sample:
        try:
            sample_video_path.unlink()
            logger.info(f'已清理示例视频：{sample_video_path}')
        except Exception as e:
            logger.warning(f'清理示例视频失败：{e}')

    logger.info('===== Demo 运行结束 =====')
    logger.info(f'请查看输出文件：{output_path}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
