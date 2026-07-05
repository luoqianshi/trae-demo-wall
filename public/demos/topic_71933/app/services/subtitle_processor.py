"""字幕检测与替换模块。

流程：检测字幕区域 → OCR 识别 → 模糊原字幕 → 重新叠加新字幕
"""

import json
import re
import subprocess
import tempfile
import uuid
from pathlib import Path

import cv2
import numpy as np
from loguru import logger

from app.utils.bin import get_ffmpeg_bin, get_ffprobe_bin

# ---- 进度追踪 ----
_progress_store: dict[str, dict] = {}


def _report(task_id: str | None, pct: int, step: str):
    """报告进度到全局 store。"""
    if task_id:
        _progress_store[task_id] = {"pct": pct, "step": step, "done": False}
        logger.debug("[进度 {}] {}% - {}", task_id, pct, step)


def _finish(task_id: str | None, success: bool, detail: str = ""):
    if task_id:
        _progress_store[task_id] = {"pct": 100, "step": detail, "done": True, "success": success}


def get_progress(task_id: str) -> dict | None:
    return _progress_store.get(task_id)


def clear_progress(task_id: str):
    _progress_store.pop(task_id, None)

# Whisper 模型缓存
_whisper_model = None


def transcribe_audio(video_path: Path, model_size: str = "base") -> list[dict]:
    """用 Whisper 从音频轨道识别语音并生成带时间戳的字幕。

    Args:
        video_path: 视频文件路径
        model_size: Whisper 模型大小 tiny/base/small/medium/large

    Returns:
        [{"start": float, "end": float, "text": str}, ...]
    """
    global _whisper_model

    try:
        import whisper
    except ImportError:
        logger.error("whisper 未安装，请运行 pip install openai-whisper")
        return []

    # 加载模型（缓存复用）
    if _whisper_model is None or getattr(_whisper_model, '_size', None) != model_size:
        logger.info("加载 Whisper 模型: {}", model_size)
        _whisper_model = whisper.load_model(model_size)
        _whisper_model._size = model_size

    # 提取音频到临时文件
    audio_tmp = video_path.parent / f"audio_{uuid.uuid4().hex[:6]}.wav"
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(video_path),
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        str(audio_tmp),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode != 0:
        logger.error("音频提取失败: {}", result.stderr[-200:])
        return []

    try:
        logger.info("开始语音识别...")
        result = _whisper_model.transcribe(
            str(audio_tmp),
            language="zh",
            task="transcribe",
        )

        segments = []
        for seg in result.get("segments", []):
            text = seg["text"].strip()
            if text:
                segments.append({
                    "start": round(seg["start"], 2),
                    "end": round(seg["end"], 2),
                    "text": text,
                })

        logger.info("语音识别完成: {} 段", len(segments))
        return segments

    except Exception as e:
        logger.error("语音识别失败: {}", e)
        return []
    finally:
        try:
            audio_tmp.unlink()
        except Exception:
            pass


def format_segments_to_srt(segments: list[dict]) -> str:
    """将识别结果格式化为 SRT 字幕文件内容。"""
    lines = []
    for i, seg in enumerate(segments, 1):
        start = seg["start"]
        end = seg["end"]
        text = seg["text"]
        sh, sm, ss = int(start // 3600), int((start % 3600) // 60), start % 60
        eh, em, es = int(end // 3600), int((end % 3600) // 60), end % 60
        lines.append(f"{i}")
        lines.append(f"{sh:02d}:{sm:02d}:{ss:06.3f} --> {eh:02d}:{em:02d}:{es:06.3f}".replace(".", ","))
        lines.append(text)
        lines.append("")
    return "\n".join(lines)


def format_segments_to_text(segments: list[dict]) -> list[str]:
    """将识别结果格式化为纯文本列表（每段一行）。"""
    return [seg["text"] for seg in segments]


def detect_subtitle_region(video_path: Path, sample_count: int = 8) -> dict | None:
    """通过帧分析检测字幕区域位置。

    Returns:
        {"x": int, "y": int, "w": int, "h": int, "confidence": float} or None
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        logger.error("无法打开视频: {}", video_path)
        return None

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    if total_frames == 0:
        cap.release()
        return None

    # 均匀采样帧
    interval = max(1, total_frames // (sample_count + 1))
    all_boxes = []

    for i in range(1, sample_count + 1):
        frame_idx = min(i * interval, total_frames - 1)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            continue

        # 分析底部 30% 区域（字幕通常在此）
        bottom_start = int(height * 0.70)
        roi = frame[bottom_start:, :]

        # 转灰度
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

        # 自适应阈值 —— 检测浅色文字（白/黄字幕）
        _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)

        # 形态学操作：连接相邻字符
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 5))
        dilated = cv2.dilate(thresh, kernel, iterations=2)

        # 查找轮廓
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            # 过滤：宽度 > 画面 15%，高度在合理范围
            if w > width * 0.15 and 10 < h < roi.shape[0] * 0.6:
                # 转换回全画面坐标
                all_boxes.append((x, bottom_start + y, w, h))

    cap.release()

    if not all_boxes:
        logger.info("未检测到字幕区域")
        return None

    # 合并所有检测到的框
    min_x = min(b[0] for b in all_boxes)
    min_y = min(b[1] for b in all_boxes)
    max_x = max(b[0] + b[2] for b in all_boxes)
    max_y = max(b[1] + b[3] for b in all_boxes)

    # 添加边距
    pad_x = int(width * 0.02)
    pad_y = 5
    x1 = max(0, min_x - pad_x)
    y1 = max(0, min_y - pad_y)
    x2 = min(width, max_x + pad_x)
    y2 = min(height, max_y + pad_y)

    confidence = min(1.0, len(all_boxes) / (sample_count * 0.5))
    center_y = (y1 + y2) // 2

    result = {
        "x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1,
        "confidence": round(confidence, 2),
        "video_width": width, "video_height": height,
        "center_y": center_y,
    }
    logger.info("字幕区域检测: x={} y={} w={} h={} conf={}", x1, y1, x2-x1, y2-y1, confidence)
    return result


def ocr_subtitle(video_path: Path, region: dict, sample_count: int = 5) -> list[str]:
    """OCR 识别字幕文字。"""
    try:
        import pytesseract
    except ImportError:
        logger.warning("pytesseract 未安装，跳过 OCR")
        return []

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return []

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    interval = max(1, total_frames // (sample_count + 1))

    texts = []
    rx, ry, rw, rh = region["x"], region["y"], region["w"], region["h"]

    for i in range(1, sample_count + 1):
        frame_idx = min(i * interval, total_frames - 1)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            continue

        # 提取字幕区域
        sub_region = frame[ry:ry+rh, rx:rx+rw]
        if sub_region.size == 0:
            continue

        # 预处理增强文字对比度
        gray = cv2.cvtColor(sub_region, cv2.COLOR_BGR2GRAY)
        # CLAHE 增强
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        # 二值化
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # OCR
        try:
            text = pytesseract.image_to_string(
                binary, lang="chi_sim+eng",
                config="--psm 6 --oem 3"
            ).strip()
            if text and len(text) > 1:
                texts.append(text)
        except Exception as e:
            logger.debug("OCR 失败: {}", e)

    cap.release()

    # 去重并返回
    unique_texts = list(dict.fromkeys(texts))
    logger.info("OCR 结果: {}", unique_texts)
    return unique_texts


def _get_video_info(video_path: Path) -> dict:
    """获取视频信息。"""
    cmd = [
        get_ffprobe_bin(), "-v", "quiet", "-print_format", "json",
        "-show_streams", "-show_format", str(video_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        return {}
    info = json.loads(result.stdout)
    for s in info.get("streams", []):
        if s.get("codec_type") == "video":
            return {
                "width": int(s.get("width", 1080)),
                "height": int(s.get("height", 1920)),
                "duration": float(info.get("format", {}).get("duration", 0)),
            }
    return {}


def blur_subtitle_region(
    input_path: Path,
    region: dict,
    output_path: Path,
    blur_level: str = "medium",
) -> Path:
    """用 FFmpeg 对字幕区域施加模糊。"""
    blur_params = {
        "light":  {"luma_radius": 8,  "luma_power": 3},
        "medium": {"luma_radius": 15, "luma_power": 5},
        "heavy":  {"luma_radius": 25, "luma_power": 7},
    }
    bp = blur_params.get(blur_level, blur_params["medium"])

    x, y, w, h = region["x"], region["y"], region["w"], region["h"]
    vw, vh = region["video_width"], region["video_height"]

    # 确保坐标合法
    x = max(0, min(x, vw - 1))
    y = max(0, min(y, vh - 1))
    w = min(w, vw - x)
    h = min(h, vh - y)

    # crop 尺寸必须是偶数
    if w % 2 != 0: w -= 1
    if h % 2 != 0: h -= 1
    if x + w > vw: w = vw - x
    if y + h > vh: h = vh - y

    lr = bp["luma_radius"]
    lp = bp["luma_power"]

    filter_complex = (
        f"[0:v]split=2[bg][fg];"
        f"[fg]boxblur={lr}:{lr}:{lp}:{lp}:{lp}:{lp}[blurred];"
        f"[blurred]crop={w}:{h}:{x}:{y}[sub];"
        f"[bg][sub]overlay={x}:{y}[out]"
    )

    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-filter_complex", filter_complex,
        "-map", "[out]", "-map", "0:a?",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "copy",
        str(output_path),
    ]

    logger.info("FFmpeg 模糊字幕区域: {}x{}@{},{} blur={}", w, h, x, y, blur_level)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg 模糊失败:\n{result.stderr[-300:]}")
    return output_path


def add_subtitles_with_moviepy(
    input_path: Path,
    output_path: Path,
    texts: list[str],
    region: dict,
    segments: list[dict] | None = None,
) -> Path:
    """用 moviepy 在字幕区域叠加新文字。支持精确时间戳。"""
    try:
        from moviepy import VideoFileClip, TextClip, CompositeVideoClip
    except ImportError:
        from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip

    clip = VideoFileClip(str(input_path))
    vw, vh = clip.size
    duration = clip.duration

    font_size = max(16, int(vw * 0.04))
    y_pos = region.get("center_y", int(vh * 0.85))

    text_clips = []

    if segments:
        # 使用 Whisper 的精确时间戳
        for seg in segments:
            text = seg.get("text", "").strip()
            if not text:
                continue
            start = seg.get("start", 0)
            end = seg.get("end", duration)
            # 防止超出视频时长
            end = min(end, duration)
            if start >= duration:
                continue

            txt_clip = TextClip(
                text=text,
                font_size=font_size,
                color="white",
                font="/System/Library/Fonts/STHeiti Medium.ttc",
                stroke_color="black",
                stroke_width=2,
                method="caption",
                text_align="center",
                size=(int(vw * 0.9), None),
            )
            txt_clip = txt_clip.with_position(("center", y_pos - font_size // 2))
            txt_clip = txt_clip.with_start(start).with_end(end)
            text_clips.append(txt_clip)
    else:
        # 无时间戳，均匀分配
        if not texts:
            texts = [""]
        n = len(texts)
        seg_dur = duration / max(n, 1)
        for i, text in enumerate(texts):
            if not text.strip():
                continue
            txt_clip = TextClip(
                text=text,
                font_size=font_size,
                color="white",
                font="/System/Library/Fonts/STHeiti Medium.ttc",
                stroke_color="black",
                stroke_width=2,
                method="caption",
                text_align="center",
                size=(int(vw * 0.9), None),
            )
            txt_clip = txt_clip.with_position(("center", y_pos - font_size // 2))
            txt_clip = txt_clip.with_start(i * seg_dur).with_end((i + 1) * seg_dur)
            text_clips.append(txt_clip)

    if not text_clips:
        clip.write_videofile(str(output_path), codec="libx264", audio_codec="aac", logger=None)
        clip.close()
        return output_path

    final = CompositeVideoClip([clip] + text_clips)
    final.write_videofile(
        str(output_path),
        codec="libx264",
        audio_codec="aac",
        preset="fast",
        ffmpeg_params=["-crf", "23"],
        logger=None,
    )
    clip.close()
    final.close()
    return output_path


def process_subtitle_replace(
    input_path: Path,
    output_path: Path,
    new_texts: list[str] | None = None,
    blur_level: str = "medium",
    use_audio: bool = False,
    whisper_model: str = "base",
    task_id: str | None = None,
) -> dict:
    """完整流程：检测 → OCR/语音识别 → 模糊 → 重叠字幕。

    Args:
        input_path: 输入视频
        output_path: 输出路径
        new_texts: 新字幕文字列表（None 则用 OCR 或语音识别结果）
        blur_level: 模糊强度 light/medium/heavy
        use_audio: 是否用 Whisper 从音频生成字幕
        whisper_model: Whisper 模型大小 tiny/base/small/medium
        task_id: 进度追踪 ID

    Returns:
        {"success": bool, "region": dict, "original_texts": list, "segments": list, "output_path": str}
    """
    logger.info("字幕替换开始: {} (audio={})", input_path.name, use_audio)
    _report(task_id, 5, "开始处理...")

    # Step 1: 检测字幕区域
    _report(task_id, 15, "🔍 检测字幕区域...")
    region = detect_subtitle_region(input_path)
    if not region:
        logger.warning("未检测到字幕区域，使用默认底部区域")
        # 使用默认底部区域
        info = _get_video_info(input_path)
        vw = info.get("width", 1080)
        vh = info.get("height", 1920)
        region = {
            "x": 0, "y": int(vh * 0.75), "w": vw, "h": int(vh * 0.25),
            "confidence": 0.5, "video_width": vw, "video_height": vh,
            "center_y": int(vh * 0.87),
        }

    # Step 2: 获取字幕文字
    _report(task_id, 30, "📝 获取字幕文字...")
    segments = []
    original_texts = []

    if use_audio:
        # 用 Whisper 从音频识别
        segments = transcribe_audio(input_path, model_size=whisper_model)
        original_texts = format_segments_to_text(segments)
        logger.info("语音识别字幕: {} 段", len(segments))
        _report(task_id, 60, f"🎤 识别完成: {len(segments)} 段字幕")
    else:
        # 用 OCR 识别画面中的字幕
        original_texts = ocr_subtitle(input_path, region)
        logger.info("OCR 字幕: {}", original_texts)
        _report(task_id, 60, f"📷 OCR 完成: {len(original_texts)} 段字幕")

    # Step 3: 确定新字幕
    if new_texts is None:
        new_texts = original_texts
    if not new_texts:
        new_texts = original_texts

    # Step 4: 模糊字幕区域
    _report(task_id, 70, "🌫️ 模糊原字幕区域...")
    temp_blurred = output_path.parent / f"blurred_{uuid.uuid4().hex[:6]}.mp4"
    blur_subtitle_region(input_path, region, temp_blurred, blur_level)

    # Step 5: 叠加新字幕
    _report(task_id, 85, "📝 叠加新字幕...")
    if new_texts:
        add_subtitles_with_moviepy(temp_blurred, output_path, new_texts, region, segments=segments if segments else None)
        # 清理临时文件
        try:
            temp_blurred.unlink()
        except Exception:
            pass
    else:
        # 没有新字幕文字，只保留模糊结果
        import shutil
        shutil.move(str(temp_blurred), str(output_path))

    logger.info("字幕替换完成: {}", output_path.name)
    _finish(task_id, True, "✅ 字幕替换完成")
    return {
        "success": True,
        "region": region,
        "original_texts": original_texts,
        "segments": segments,
        "output_path": str(output_path),
    }
