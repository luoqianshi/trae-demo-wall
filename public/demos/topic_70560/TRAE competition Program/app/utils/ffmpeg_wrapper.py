import subprocess
import json
import os
from typing import Dict, Optional
import imageio_ffmpeg


FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()


def run_ffmpeg_command(args: list) -> str:
    try:
        result = subprocess.run(
            [FFMPEG_PATH] + args,
            capture_output=True,
            text=True,
            timeout=300
        )
        return result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return "FFmpeg command timed out"
    except FileNotFoundError:
        return "FFmpeg not found. Please install imageio-ffmpeg."
    except Exception as e:
        return f"FFmpeg error: {str(e)}"


def run_ffprobe_command(file_path: str) -> Optional[Dict]:
    try:
        result = subprocess.run(
            [FFMPEG_PATH, "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", file_path],
            capture_output=True,
            text=True,
            timeout=60
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
        return None
    except FileNotFoundError:
        return None
    except Exception:
        return None


def analyze_video(file_path: str) -> Dict:
    info = run_ffprobe_command(file_path)
    if info is None:
        return {"error": "Failed to analyze video"}

    metadata = {
        "duration": 0,
        "video_codec": "",
        "audio_codec": "",
        "resolution": "",
        "width": 0,
        "height": 0,
        "frame_rate": 0,
        "bit_rate": 0
    }

    if "format" in info:
        metadata["duration"] = float(info["format"].get("duration", 0))
        metadata["bit_rate"] = int(info["format"].get("bit_rate", 0))

    for stream in info.get("streams", []):
        if stream.get("codec_type") == "video":
            metadata["video_codec"] = stream.get("codec_name", "")
            metadata["width"] = int(stream.get("width", 0))
            metadata["height"] = int(stream.get("height", 0))
            metadata["resolution"] = f"{metadata['width']}x{metadata['height']}"
            r_frame_rate = stream.get("r_frame_rate", "0/1").split("/")
            try:
                metadata["frame_rate"] = int(r_frame_rate[0]) / int(r_frame_rate[1])
            except (ValueError, ZeroDivisionError):
                metadata["frame_rate"] = 0
        elif stream.get("codec_type") == "audio":
            metadata["audio_codec"] = stream.get("codec_name", "")

    return metadata


def is_h264_codec(video_codec: str) -> bool:
    return video_codec.lower() in ["h264", "libx264", "avc1"]


def transcode_to_h264(input_path: str, output_path: str) -> Dict:
    args = [
        "-i", input_path,
        "-c:v", "libx264",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "-y",
        output_path
    ]
    
    output = run_ffmpeg_command(args)
    success = os.path.exists(output_path) and os.path.getsize(output_path) > 0
    
    return {
        "success": success,
        "output": output,
        "output_path": output_path
    }


def repair_video(input_path: str, output_path: str) -> Dict:
    args = [
        "-i", input_path,
        "-c:v", "copy",
        "-c:a", "copy",
        "-y",
        output_path
    ]
    
    output = run_ffmpeg_command(args)
    
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        return {
            "success": True,
            "output": output,
            "output_path": output_path,
            "method": "re-encapsulation"
        }
    
    return transcode_to_h264(input_path, output_path)


def extract_thumbnail(input_path: str, output_path: str, time_second: int = 5) -> bool:
    args = [
        "-i", input_path,
        "-ss", str(time_second),
        "-vframes", "1",
        "-q:v", "2",
        "-y",
        output_path
    ]
    
    run_ffmpeg_command(args)
    return os.path.exists(output_path)