"""视频去重引擎（v2 — 支持实时进度）。

支持：
1. MD5 修改（二进制尾部追加随机数据）
2. 变速处理（FFmpeg atempo 滤镜）
3. 帧率微调
4. 分辨率微调
5. 元数据清除
6. 处理后自动校验
"""

import hashlib
import json
import os
import random
import shutil
import subprocess
import uuid
from dataclasses import dataclass, field
from pathlib import Path

from loguru import logger

from app.core.config import get_settings
from app.services.dedup_filters import FILTER_REGISTRY
from app.utils.bin import get_ffmpeg_bin, get_ffprobe_bin


@dataclass
class DedupConfig:
    """去重处理配置。"""
    modify_md5: bool = True
    change_speed: bool = True
    speed_min: float = 0.95
    speed_max: float = 1.05
    change_resolution: bool = False
    resolution_offset: int = 2
    change_framerate: bool = False
    framerate_range: tuple = (24, 30)
    strip_metadata: bool = True
    random_padding_bytes: int = 1024
    custom_filters: list[str] = None  # 自定义滤镜列表，如 ["mirror", "pip", "color_shift"]
    filter_level: str = "medium"  # 滤镜强度: light / medium / heavy
    max_filters: int = 3  # 随机选取的最大滤镜数


@dataclass
class DedupResult:
    """去重处理结果。"""
    success: bool = False
    input_path: str = ""
    output_path: str = ""
    original_md5: str = ""
    output_md5: str = ""
    speed_factor: float = 1.0
    input_duration: float = 0.0
    output_duration: float = 0.0
    input_size: int = 0
    output_size: int = 0
    operations: list[str] = field(default_factory=list)
    verified: bool = False
    error: str = ""


class ProgressTracker:
    """FFmpeg 实时进度追踪器。"""

    def __init__(self, task_id: str, total_steps: int):
        self.task_id = task_id
        self.total_steps = total_steps
        self.current_step = 0
        self.current_step_name = ""
        self.percent = 0.0
        self.step_detail = ""
        self.is_complete = False
        self.error = ""

    def start_step(self, name: str, step_num: int):
        self.current_step = step_num
        self.current_step_name = name
        self.percent = (step_num - 1) / self.total_steps * 100
        self.step_detail = f"开始 {name}"
        self._update_global()

    def update_percent(self, pct: float, detail: str = ""):
        base = (self.current_step - 1) / self.total_steps * 100
        step_weight = 100 / self.total_steps
        self.percent = base + (pct / 100) * step_weight
        if detail:
            self.step_detail = detail
        self._update_global()

    def finish_step(self, name: str):
        self.step_detail = f"完成 {name}"
        self.percent = self.current_step / self.total_steps * 100
        self._update_global()

    def complete(self):
        self.percent = 100
        self.is_complete = True
        self.step_detail = "全部完成"
        self._update_global()

    def fail(self, error: str):
        self.error = error
        self.is_complete = True
        self._update_global()

    def _update_global(self):
        """更新全局进度存储。"""
        _PROGRESS_STORE[self.task_id] = {
            "task_id": self.task_id,
            "step": self.current_step,
            "total_steps": self.total_steps,
            "step_name": self.current_step_name,
            "percent": round(self.percent, 1),
            "detail": self.step_detail,
            "complete": self.is_complete,
            "error": self.error,
        }


# 全局进度存储（内存）
_PROGRESS_STORE: dict[str, dict] = {}


def get_progress(task_id: str) -> dict | None:
    """获取任务进度。"""
    return _PROGRESS_STORE.get(task_id)


def clear_progress(task_id: str):
    _PROGRESS_STORE.pop(task_id, None)


class VideoDeduplicator:
    """视频去重处理器。"""

    def __init__(self, config: DedupConfig | None = None, task_id: str = ""):
        self.settings = get_settings()
        self.config = config or DedupConfig(
            speed_min=self.settings.dedup_speed_min,
            speed_max=self.settings.dedup_speed_max,
            random_padding_bytes=self.settings.dedup_random_padding_bytes,
        )
        self.task_id = task_id

    def process(self, input_path: Path) -> DedupResult:
        """执行去重处理流水线，返回处理结果。"""
        if not input_path.exists():
            return DedupResult(error=f"输入文件不存在: {input_path}")

        # 验证文件完整性（moov atom 检查）
        try:
            vcheck = subprocess.run(
                [get_ffprobe_bin(), "-v", "error", "-show_entries", "format=duration",
                 "-of", "csv=p=0", str(input_path)],
                capture_output=True, text=True, timeout=15,
            )
            if vcheck.returncode != 0:
                err = vcheck.stderr.strip()[:200]
                logger.error("输入文件损坏: {} — {}", input_path.name, err)
                return DedupResult(error=f"视频文件损坏 (moov atom 缺失或格式无效): {input_path.name}")
            dur = vcheck.stdout.strip()
            if not dur or dur == "N/A" or float(dur) <= 0:
                return DedupResult(error=f"视频时长异常: {dur}")
        except Exception as e:
            logger.warning("文件验证异常: {}", e)

        # 计算总步骤数
        steps = []
        if self.config.change_speed:
            steps.append("变速处理")
        if self.config.change_framerate:
            steps.append("帧率微调")
        if self.config.change_resolution:
            steps.append("分辨率微调")
        if self.config.strip_metadata:
            steps.append("清除元数据")
        if self.config.custom_filters:
            for fname in self.config.custom_filters:
                if fname in FILTER_REGISTRY:
                    steps.append(FILTER_REGISTRY[fname]["name"])
        steps.append("复制输出")
        if self.config.modify_md5:
            steps.append("修改 MD5")
        steps.append("校验")

        tracker = ProgressTracker(self.task_id, len(steps)) if self.task_id else None

        result = DedupResult(
            input_path=str(input_path),
            original_md5=self._calc_md5(input_path),
        )

        stem = input_path.stem
        output_path = input_path.parent / f"{stem}_dedup_{uuid.uuid4().hex[:6]}.mp4"

        current = input_path
        temp_files: list[Path] = []
        step_num = 0

        try:
            # Step 1: 变速处理
            if self.config.change_speed:
                step_num += 1
                if tracker:
                    tracker.start_step("变速处理", step_num)
                speed = round(random.uniform(self.config.speed_min, self.config.speed_max), 2)
                logger.info("变速处理: {}x", speed)
                temp_out = self._change_speed(current, speed, tracker)
                if temp_out != current:
                    temp_files.append(temp_out)
                current = temp_out
                result.speed_factor = speed
                result.operations.append(f"变速 {speed}x")
                if tracker:
                    tracker.finish_step("变速处理")

            # Step 2: 帧率微调
            if self.config.change_framerate:
                step_num += 1
                if tracker:
                    tracker.start_step("帧率微调", step_num)
                logger.info("帧率微调")
                temp_out = self._change_framerate(current, tracker)
                if temp_out != current and temp_out not in temp_files:
                    temp_files.append(temp_out)
                current = temp_out
                result.operations.append("帧率微调")
                if tracker:
                    tracker.finish_step("帧率微调")

            # Step 3: 分辨率微调
            if self.config.change_resolution:
                step_num += 1
                if tracker:
                    tracker.start_step("分辨率微调", step_num)
                logger.info("分辨率微调")
                temp_out = self._change_resolution(current, tracker)
                if temp_out != current and temp_out not in temp_files:
                    temp_files.append(temp_out)
                current = temp_out
                result.operations.append("分辨率微调")
                if tracker:
                    tracker.finish_step("分辨率微调")

            # Step 4: 清除元数据
            if self.config.strip_metadata:
                step_num += 1
                if tracker:
                    tracker.start_step("清除元数据", step_num)
                logger.info("清除视频元数据")
                temp_out = self._strip_metadata(current)
                if temp_out != current and temp_out not in temp_files:
                    temp_files.append(temp_out)
                current = temp_out
                result.operations.append("清除元数据")
                if tracker:
                    tracker.finish_step("清除元数据")

            # Step 4.5: 自定义滤镜
            if self.config.custom_filters:
                for fname in self.config.custom_filters:
                    if fname in FILTER_REGISTRY:
                        step_num += 1
                        finfo = FILTER_REGISTRY[fname]
                        level = self.config.filter_level
                        level_desc = finfo.get("levels", {}).get(level, {}).get("desc", level)
                        if tracker:
                            tracker.start_step(f"{finfo['name']} ({level_desc})", step_num)
                        logger.info("应用滤镜: {} [{}]", finfo["name"], level_desc)
                        if finfo["fn"] is None:
                            # 特殊滤镜（如字幕替换），跳过自动流水线，需要单独调用
                            logger.info("滤镜 {} 需要单独调用，跳过自动流水线", fname)
                            result.operations.append(f"{finfo['name']}(需单独调用)")
                        else:
                            temp_out = finfo["fn"](current, level=level)
                            if temp_out != current and temp_out not in temp_files:
                                temp_files.append(temp_out)
                            current = temp_out
                            result.operations.append(finfo["name"])
                        if tracker:
                            tracker.finish_step(finfo["name"])

            # Step 5: 复制到最终输出路径
            step_num += 1
            if tracker:
                tracker.start_step("复制输出", step_num)
            shutil.copy2(current, output_path)
            if tracker:
                tracker.finish_step("复制输出")

            # Step 6: MD5 修改
            if self.config.modify_md5:
                step_num += 1
                if tracker:
                    tracker.start_step("修改 MD5", step_num)
                logger.info("修改 MD5")
                self._modify_md5(output_path, self.config.random_padding_bytes)
                result.operations.append("修改 MD5")
                if tracker:
                    tracker.finish_step("修改 MD5")

            result.output_path = str(output_path)
            result.output_md5 = self._calc_md5(output_path)
            result.input_size = input_path.stat().st_size
            result.output_size = output_path.stat().st_size

            # Step 7: 校验
            step_num += 1
            if tracker:
                tracker.start_step("校验", step_num)
            logger.info("校验输出文件...")
            verify_result = self._verify_output(input_path, output_path)
            result.verified = verify_result["valid"]
            if verify_result.get("input_duration"):
                result.input_duration = verify_result["input_duration"]
            if verify_result.get("output_duration"):
                result.output_duration = verify_result["output_duration"]
            if tracker:
                tracker.finish_step("校验")

            result.success = True
            if tracker:
                tracker.complete()
            logger.info(
                "去重完成: {} -> {} 校验: {}",
                input_path.name, output_path.name,
                "✅" if result.verified else "⚠️",
            )

        except Exception as e:
            result.error = str(e)
            if tracker:
                tracker.fail(str(e))
            logger.error("去重处理失败: {}", e)
            if output_path.exists():
                output_path.unlink()

        finally:
            for tmp in temp_files:
                if tmp.exists() and tmp != input_path:
                    tmp.unlink()

        return result

    def _run_ffmpeg_with_progress(self, cmd: list[str], tracker: ProgressTracker | None = None) -> None:
        """执行 FFmpeg 并解析实时进度。"""
        logger.debug("FFmpeg: {}", " ".join(cmd))

        if not tracker:
            self._run_ffmpeg(cmd)
            return

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        stderr_lines = []
        duration = 0.0

        for line in process.stderr:
            stderr_lines.append(line)
            line = line.strip()

            # 解析 Duration
            if "Duration:" in line and not duration:
                try:
                    dur_str = line.split("Duration:")[1].split(",")[0].strip()
                    parts = dur_str.split(":")
                    duration = float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                except Exception:
                    pass

            # 解析进度 time=xx.xx
            if "time=" in line and duration > 0:
                try:
                    time_str = line.split("time=")[1].split(" ")[0].strip()
                    parts = time_str.split(":")
                    current_time = float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
                    pct = min(99, (current_time / duration) * 100)
                    tracker.update_percent(pct, f"进度 {pct:.0f}% ({time_str})")
                except Exception:
                    pass

        process.wait()

        if process.returncode != 0:
            error_msg = "".join(stderr_lines[-500:]) if stderr_lines else "未知错误"
            raise RuntimeError(f"FFmpeg 执行失败:\n{error_msg}")

    def _change_speed(self, input_path: Path, speed: float, tracker: ProgressTracker | None = None) -> Path:
        output_path = input_path.parent / f"speed_{uuid.uuid4().hex[:6]}.mp4"
        if 0.5 <= speed <= 2.0:
            audio_filter = f"atempo={speed}"
        elif speed < 0.5:
            audio_filter = f"atempo=0.5,atempo={speed / 0.5}"
        else:
            audio_filter = f"atempo=2.0,atempo={speed / 2.0}"
        cmd = [
            get_ffmpeg_bin(), "-y", "-i", str(input_path),
            "-filter_complex",
            f"[0:v]setpts={1/speed}*PTS[v];[0:a]{audio_filter}[a]",
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
            "-c:a", "aac", "-b:a", "128k",
            str(output_path),
        ]
        self._run_ffmpeg_with_progress(cmd, tracker)
        return output_path

    def _change_framerate(self, input_path: Path, tracker: ProgressTracker | None = None) -> Path:
        output_path = input_path.parent / f"fps_{uuid.uuid4().hex[:6]}.mp4"
        target_fps = random.randint(self.config.framerate_range[0], self.config.framerate_range[1])
        cmd = [
            get_ffmpeg_bin(), "-y", "-i", str(input_path),
            "-r", str(target_fps),
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
            "-c:a", "copy",
            str(output_path),
        ]
        self._run_ffmpeg_with_progress(cmd, tracker)
        return output_path

    def _change_resolution(self, input_path: Path, tracker: ProgressTracker | None = None) -> Path:
        probe_cmd = [
            get_ffprobe_bin(), "-v", "quiet", "-print_format", "json",
            "-show_streams", str(input_path),
        ]
        result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=30)
        info = json.loads(result.stdout)
        width, height = 1920, 1080
        for s in info.get("streams", []):
            if s.get("codec_type") == "video":
                width = int(s.get("width", 1920))
                height = int(s.get("height", 1080))
                break
        offset = self.config.resolution_offset
        new_w = width + random.randint(-offset, offset)
        new_h = height + random.randint(-offset, offset)
        new_w = new_w + (new_w % 2)
        new_h = new_h + (new_h % 2)
        output_path = input_path.parent / f"res_{uuid.uuid4().hex[:6]}.mp4"
        cmd = [
            get_ffmpeg_bin(), "-y", "-i", str(input_path),
            "-vf", f"scale={new_w}:{new_h}",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-tune", "film",
            "-c:a", "copy",
            str(output_path),
        ]
        self._run_ffmpeg_with_progress(cmd, tracker)
        return output_path

    def _strip_metadata(self, input_path: Path) -> Path:
        output_path = input_path.parent / f"meta_{uuid.uuid4().hex[:6]}.mp4"
        cmd = [
            get_ffmpeg_bin(), "-y", "-i", str(input_path),
            "-map_metadata", "-1",
            "-c", "copy",
            str(output_path),
        ]
        self._run_ffmpeg(cmd)
        return output_path

    @staticmethod
    def _get_media_info(file_path: Path) -> dict:
        cmd = [
            get_ffprobe_bin(), "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", str(file_path),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return {}
        return json.loads(result.stdout)

    @staticmethod
    def _verify_output(input_path: Path, output_path: Path) -> dict:
        result = {"valid": True, "message": ""}
        if not output_path.exists():
            return {"valid": False, "message": "输出文件不存在"}
        if output_path.stat().st_size < 1024:
            return {"valid": False, "message": "输出文件过小"}
        try:
            info = VideoDeduplicator._get_media_info(output_path)
            if not info:
                return {"valid": False, "message": "无法读取视频信息"}
            has_video = False
            duration = 0.0
            for stream in info.get("streams", []):
                if stream.get("codec_type") == "video":
                    has_video = True
            duration = float(info.get("format", {}).get("duration", 0))
            if not has_video:
                return {"valid": False, "message": "缺少视频流"}
            if duration < 1:
                return {"valid": False, "message": f"时长异常: {duration}s"}
            result["output_duration"] = duration
            input_info = VideoDeduplicator._get_media_info(input_path)
            if input_info:
                input_duration = float(input_info.get("format", {}).get("duration", 0))
                result["input_duration"] = input_duration
                if input_duration > 0 and duration > 0:
                    ratio = duration / input_duration
                    if ratio < 0.5 or ratio > 2.0:
                        result["valid"] = False
                        result["message"] = f"时长差异过大"
        except Exception as e:
            result["valid"] = False
            result["message"] = str(e)
        return result

    @staticmethod
    def _modify_md5(file_path: Path, padding_bytes: int = 1024) -> None:
        with open(file_path, "ab") as f:
            f.write(os.urandom(padding_bytes))

    @staticmethod
    def _calc_md5(file_path: Path) -> str:
        h = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()

    @staticmethod
    def _run_ffmpeg(cmd: list[str]) -> None:
        logger.debug("FFmpeg: {}", " ".join(cmd))
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg 执行失败:\n{result.stderr[-500:]}")
