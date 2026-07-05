"""去重滤镜模块 — 每个滤镜支持 3 个强度级别。

级别说明：
  light  (轻度) — 微量改动，肉眼几乎不可见，适合高质量要求
  medium (中度) — 均衡方案，去重效果好且画质损失小
  heavy  (重度) — 最大去重力度，画质有一定损失
"""

import random
import subprocess
import uuid
from pathlib import Path

from loguru import logger

from app.utils.bin import get_ffmpeg_bin, get_ffprobe_bin


# ──────────────────────────── 参数配置 ────────────────────────────

FILTER_PARAMS = {
    "mirror": {
        "name": "镜像翻转",
        "weight": 3,
        "levels": {
            "light":  {"desc": "水平翻转"},
            "medium": {"desc": "水平翻转"},
            "heavy":  {"desc": "水平翻转"},
        },
    },
    "color_shift": {
        "name": "调色微调",
        "weight": 4,
        "levels": {
            "light":  {"desc": "轻微调色", "brightness": (-0.02, 0.02), "contrast": (0.98, 1.02), "saturation": (0.95, 1.05)},
            "medium": {"desc": "中度调色", "brightness": (-0.05, 0.05), "contrast": (0.93, 1.07), "saturation": (0.88, 1.12)},
            "heavy":  {"desc": "深度调色", "brightness": (-0.08, 0.08), "contrast": (0.88, 1.12), "saturation": (0.82, 1.18)},
        },
    },
    "pip": {
        "name": "画中画",
        "weight": 5,
        "levels": {
            "light":  {"desc": "迷你画中画", "ratio": (0.10, 0.15), "margin": (0.08, 0.15), "opacity": 0.2},
            "medium": {"desc": "标准画中画", "ratio": (0.18, 0.25), "margin": (0.05, 0.12), "opacity": 0.3},
            "heavy":  {"desc": "大号画中画", "ratio": (0.28, 0.38), "margin": (0.03, 0.10), "opacity": 0.4},
        },
    },
    "crop_zoom": {
        "name": "裁剪缩放",
        "weight": 3,
        "levels": {
            "light":  {"desc": "微裁剪",   "crop_pct": (0.02, 0.04)},
            "medium": {"desc": "标准裁剪", "crop_pct": (0.04, 0.07)},
            "heavy":  {"desc": "深度裁剪", "crop_pct": (0.07, 0.12)},
        },
    },
    "blur_border": {
        "name": "模糊边框",
        "weight": 2,
        "levels": {
            "light":  {"desc": "轻微模糊", "radius": (1, 3),   "power": 3},
            "medium": {"desc": "中度模糊", "radius": (3, 6),   "power": 5},
            "heavy":  {"desc": "强模糊",   "radius": (5, 10),  "power": 7},
        },
    },
    "noise": {
        "name": "添加噪点",
        "weight": 2,
        "levels": {
            "light":  {"desc": "极淡噪点", "intensity": (1, 3)},
            "medium": {"desc": "标准噪点", "intensity": (3, 7)},
            "heavy":  {"desc": "明显噪点", "intensity": (7, 14)},
        },
    },
    "flip_v": {
        "name": "垂直翻转",
        "weight": 3,
        "levels": {
            "light":  {"desc": "垂直翻转"},
            "medium": {"desc": "垂直翻转"},
            "heavy":  {"desc": "垂直翻转"},
        },
    },

    "rotate_crop": {
        "name": "旋转裁剪",
        "weight": 4,
        "levels": {
            "light":  {"desc": "微旋转",   "angle": (-1.5, 1.5), "border": "black"},
            "medium": {"desc": "标准旋转", "angle": (-3.0, 3.0), "border": "black"},
            "heavy":  {"desc": "大幅旋转", "angle": (-5.0, 5.0), "border": "black"},
        },
    },

}


# ──────────────────────────── 滤镜函数 ────────────────────────────

def apply_mirror(input_path: Path, level: str = "medium") -> Path:
    """镜像翻转（水平翻转）。"""
    output = input_path.parent / f"mirror_{uuid.uuid4().hex[:6]}.mp4"
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-vf", "hflip",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-c:a", "copy", str(output),
    ]
    _run(cmd)
    logger.info("镜像翻转完成 [{}]", level)
    return output


def apply_flip_v(input_path: Path, level: str = "medium") -> Path:
    """垂直翻转。"""
    output = input_path.parent / f"flipv_{uuid.uuid4().hex[:6]}.mp4"
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-vf", "vflip",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-c:a", "copy", str(output),
    ]
    _run(cmd)
    logger.info("垂直翻转完成 [{}]", level)
    return output


def apply_color_shift(input_path: Path, level: str = "medium") -> Path:
    """随机调色 — 根据级别调整参数范围。"""
    params = FILTER_PARAMS["color_shift"]["levels"][level]
    output = input_path.parent / f"color_{uuid.uuid4().hex[:6]}.mp4"

    b_range = params["brightness"]
    c_range = params["contrast"]
    s_range = params["saturation"]
    brightness = round(random.uniform(*b_range), 3)
    contrast = round(random.uniform(*c_range), 3)
    saturation = round(random.uniform(*s_range), 3)

    vf = f"eq=brightness={brightness}:contrast={contrast}:saturation={saturation}"
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-c:a", "copy", str(output),
    ]
    _run(cmd)
    logger.info("调色完成 [{}]: b={} c={} s={}", level, brightness, contrast, saturation)
    return output


def apply_pip(input_path: Path, level: str = "medium") -> Path:
    """画中画叠加 — 根据级别调整小画面大小和位置。"""
    params = FILTER_PARAMS["pip"]["levels"][level]
    output = input_path.parent / f"pip_{uuid.uuid4().hex[:6]}.mp4"

    probe = _probe(input_path)
    w = probe.get("width", 1080)
    h = probe.get("height", 1920)

    ratio_range = params["ratio"]
    margin_range = params["margin"]
    opacity = params["opacity"]

    pip_ratio = random.uniform(*ratio_range)
    pip_w = int(w * pip_ratio)
    pip_h = int(h * pip_ratio)
    pip_w = pip_w + (pip_w % 2)
    pip_h = pip_h + (pip_h % 2)

    margin_x = int(w * random.uniform(*margin_range))
    margin_y = int(h * random.uniform(*margin_range))
    x = random.choice([margin_x, w - pip_w - margin_x])
    y = random.choice([margin_y, h - pip_h - margin_y])

    vf = (
        f"[0:v]split=2[main][small];"
        f"[small]scale={pip_w}:{pip_h},"
        f"pad={pip_w}:{pip_h}:0:0:color=black@{opacity}[pipped];"
        f"[main][pipped]overlay={x}:{y}[out]"
    )
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-filter_complex", vf,
        "-map", "[out]", "-map", "0:a?",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-c:a", "copy", str(output),
    ]
    _run(cmd)
    logger.info("画中画完成 [{}]: {}x{} pos={},{}", level, pip_w, pip_h, x, y)
    return output


def apply_crop_zoom(input_path: Path, level: str = "medium") -> Path:
    """裁剪缩放 — 根据级别调整裁剪比例。"""
    params = FILTER_PARAMS["crop_zoom"]["levels"][level]
    output = input_path.parent / f"crop_{uuid.uuid4().hex[:6]}.mp4"

    probe = _probe(input_path)
    w = probe.get("width", 1080)
    h = probe.get("height", 1920)

    crop_range = params["crop_pct"]
    crop_pct = random.uniform(*crop_range)
    crop_x = int(w * crop_pct)
    crop_y = int(h * crop_pct)
    crop_w = w - crop_x * 2
    crop_h = h - crop_y * 2
    crop_w = crop_w + (crop_w % 2)
    crop_h = crop_h + (crop_h % 2)

    vf = f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y},scale={w}:{h}"
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-c:a", "copy", str(output),
    ]
    _run(cmd)
    logger.info("裁剪缩放完成 [{}]: crop={}x{} → {}x{}", level, crop_w, crop_h, w, h)
    return output


def apply_blur_border(input_path: Path, level: str = "medium") -> Path:
    """模糊边框 — 根据级别调整模糊半径。"""
    params = FILTER_PARAMS["blur_border"]["levels"][level]
    output = input_path.parent / f"blur_{uuid.uuid4().hex[:6]}.mp4"

    r_range = params["radius"]
    power = params["power"]
    blur_r = random.randint(*r_range)

    vf = f"boxblur={blur_r}:{blur_r}:{power}:{power}:{power}:{power}"
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-c:a", "copy", str(output),
    ]
    _run(cmd)
    logger.info("模糊边框完成 [{}]: radius={}", level, blur_r)
    return output


def apply_noise(input_path: Path, level: str = "medium") -> Path:
    """添加噪点 — 根据级别调整强度。"""
    params = FILTER_PARAMS["noise"]["levels"][level]
    output = input_path.parent / f"noise_{uuid.uuid4().hex[:6]}.mp4"

    i_range = params["intensity"]
    intensity = random.randint(*i_range)

    vf = f"noise=c0s={intensity}:c0f=t"
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-c:a", "copy", str(output),
    ]
    _run(cmd)
    logger.info("噪点添加完成 [{}]: intensity={}", level, intensity)
    return output



def apply_rotate_crop(input_path: Path, level: str = "medium") -> Path:
    """旋转裁剪 — 随机微旋转后裁剪黑边。"""
    params = FILTER_PARAMS["rotate_crop"]["levels"][level]
    output = input_path.parent / f"rotcrop_{uuid.uuid4().hex[:6]}.mp4"

    a_range = params["angle"]
    angle = round(random.uniform(*a_range), 2)
    border = params["border"]

    probe = _probe(input_path)
    w = probe.get("width", 1080)
    h = probe.get("height", 1920)

    # 旋转后裁剪掉黑边，再缩放回原尺寸
    vf = (
        f"rotate={angle}*PI/180:fillcolor={border},"
        f"crop={w}:{h}"
    )
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-c:a", "copy", str(output),
    ]
    _run(cmd)
    logger.info("旋转裁剪完成 [{}]: angle={}°", level, angle)
    return output


# ──────────────────────────── 注册表 ────────────────────────────

FILTER_REGISTRY = {
    "mirror":      {"fn": apply_mirror,      **FILTER_PARAMS["mirror"]},
    "color_shift": {"fn": apply_color_shift, **FILTER_PARAMS["color_shift"]},
    "pip":         {"fn": apply_pip,         **FILTER_PARAMS["pip"]},
    "crop_zoom":   {"fn": apply_crop_zoom,   **FILTER_PARAMS["crop_zoom"]},
    "blur_border": {"fn": apply_blur_border, **FILTER_PARAMS["blur_border"]},
    "noise":       {"fn": apply_noise,       **FILTER_PARAMS["noise"]},
    "flip_v":      {"fn": apply_flip_v,      **FILTER_PARAMS["flip_v"]},
    "rotate_crop": {"fn": apply_rotate_crop, **FILTER_PARAMS["rotate_crop"]},
}


def get_available_filters() -> list[dict]:
    """返回所有可用滤镜信息（含级别描述）。"""
    result = []
    for key, info in FILTER_REGISTRY.items():
        levels = {}
        for lv, params in info["levels"].items():
            levels[lv] = params.get("desc", "")
        result.append({
            "key": key,
            "name": info["name"],
            "weight": info["weight"],
            "levels": levels,
        })
    return result


# ──────────────────────────── 工具函数 ────────────────────────────

def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg 失败:\n{result.stderr[-300:]}")


def _probe(file_path: Path) -> dict:
    import json
    cmd = [
        get_ffprobe_bin(), "-v", "quiet", "-print_format", "json",
        "-show_streams", str(file_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        return {}
    info = json.loads(result.stdout)
    for s in info.get("streams", []):
        if s.get("codec_type") == "video":
            return {"width": int(s.get("width", 1080)), "height": int(s.get("height", 1920))}
    return {}


# ──────────────────────────── 新增高效果滤镜 ────────────────────────────

def apply_audio_pitch(input_path: Path, level: str = "medium") -> Path:
    """音频微调 — 改变音调/速度，绕过音频指纹检测。"""
    params = {
        "light":  {"pitch": (0.97, 1.03), "tempo": (0.98, 1.02)},
        "medium": {"pitch": (0.94, 1.06), "tempo": (0.96, 1.04)},
        "heavy":  {"pitch": (0.90, 1.10), "tempo": (0.93, 1.07)},
    }[level]
    output = input_path.parent / f"apitch_{uuid.uuid4().hex[:6]}.mp4"

    pitch_factor = round(random.uniform(*params["pitch"]), 3)
    tempo_factor = round(random.uniform(*params["tempo"]), 3)

    # rubberband 或 asetrate + atempo 组合
    af = f"asetrate=44100*{pitch_factor},aresample=44100,atempo={tempo_factor}"
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-af", af,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        str(output),
    ]
    _run(cmd)
    logger.info("音频微调完成 [{}]: pitch={} tempo={}", level, pitch_factor, tempo_factor)
    return output


def apply_gop_restructure(input_path: Path, level: str = "medium") -> Path:
    """GOP 结构重排 — 改变关键帧位置，绕过视频指纹。"""
    params = {
        "light":  {"gop": (60, 90)},
        "medium": {"gop": (30, 60)},
        "heavy":  {"gop": (15, 30)},
    }[level]
    output = input_path.parent / f"gop_{uuid.uuid4().hex[:6]}.mp4"

    gop_size = random.randint(*params["gop"])
    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-g", str(gop_size),
        "-keyint_min", str(gop_size // 2),
        "-sc_threshold", "40",
        "-c:a", "copy",
        str(output),
    ]
    _run(cmd)
    logger.info("GOP 重排完成 [{}]: gop_size={}", level, gop_size)
    return output


def apply_bitrate_shift(input_path: Path, level: str = "medium") -> Path:
    """码率微调 — 改变编码参数，生成不同的二进制流。"""
    params = {
        "light":  {"crf_offset": (-1, 1), "bufsize": (1500, 2500)},
        "medium": {"crf_offset": (-3, 3), "bufsize": (1000, 3000)},
        "heavy":  {"crf_offset": (-5, 5), "bufsize": (800, 4000)},
    }[level]
    output = input_path.parent / f"br_{uuid.uuid4().hex[:6]}.mp4"

    crf = 18 + random.randint(*params["crf_offset"])
    crf = max(15, min(26, crf))
    bufsize = random.randint(*params["bufsize"])

    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
        "-tune", "film",
        "-maxrate", f"{bufsize}k", "-bufsize", f"{bufsize * 2}k",
        "-c:a", "aac", "-b:a", "192k",
        str(output),
    ]
    _run(cmd)
    logger.info("码率微调完成 [{}]: crf={} bufsize={}k", level, crf, bufsize)
    return output


def apply_padding_shift(input_path: Path, level: str = "medium") -> Path:
    """画面偏移 — 微移画面位置，改变像素级特征。"""
    params = {
        "light":  {"x": (-2, 2), "y": (-2, 2)},
        "medium": {"x": (-4, 4), "y": (-4, 4)},
        "heavy":  {"x": (-8, 8), "y": (-8, 8)},
    }[level]
    output = input_path.parent / f"pad_{uuid.uuid4().hex[:6]}.mp4"

    x_shift = random.randint(*params["x"])
    y_shift = random.randint(*params["y"])

    probe = _probe(input_path)
    w = probe.get("width", 1080)
    h = probe.get("height", 1920)

    # pad → crop 实现偏移
    pad_x = abs(x_shift) + 4
    pad_y = abs(y_shift) + 4
    vf = (
        f"pad={w + pad_x*2}:{h + pad_y*2}:{pad_x}:{pad_y}:black,"
        f"crop={w}:{h}:{pad_x + x_shift}:{pad_y + y_shift}"
    )

    cmd = [
        get_ffmpeg_bin(), "-y", "-i", str(input_path),
        "-vf", vf,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
        "-c:a", "copy",
        str(output),
    ]
    _run(cmd)
    logger.info("画面偏移完成 [{}]: x={} y={}", level, x_shift, y_shift)
    return output


# 注册新滤镜
FILTER_PARAMS["audio_pitch"] = {
    "name": "音频微调",
    "weight": 5,
    "levels": {
        "light":  {"desc": "轻微变调"},
        "medium": {"desc": "标准变调"},
        "heavy":  {"desc": "明显变调"},
    },
}
FILTER_PARAMS["gop_restructure"] = {
    "name": "帧结构重排",
    "weight": 4,
    "levels": {
        "light":  {"desc": "微调GOP"},
        "medium": {"desc": "标准GOP重排"},
        "heavy":  {"desc": "密集GOP"},
    },
}
FILTER_PARAMS["bitrate_shift"] = {
    "name": "码率微调",
    "weight": 3,
    "levels": {
        "light":  {"desc": "轻微码率变化"},
        "medium": {"desc": "标准码率变化"},
        "heavy":  {"desc": "大幅码率变化"},
    },
}
FILTER_PARAMS["padding_shift"] = {
    "name": "画面偏移",
    "weight": 3,
    "levels": {
        "light":  {"desc": "像素级偏移"},
        "medium": {"desc": "标准偏移"},
        "heavy":  {"desc": "大幅偏移"},
    },
}

FILTER_REGISTRY["audio_pitch"] = {"fn": apply_audio_pitch, **FILTER_PARAMS["audio_pitch"]}
FILTER_REGISTRY["gop_restructure"] = {"fn": apply_gop_restructure, **FILTER_PARAMS["gop_restructure"]}
FILTER_REGISTRY["bitrate_shift"] = {"fn": apply_bitrate_shift, **FILTER_PARAMS["bitrate_shift"]}
FILTER_REGISTRY["padding_shift"] = {"fn": apply_padding_shift, **FILTER_PARAMS["padding_shift"]}
