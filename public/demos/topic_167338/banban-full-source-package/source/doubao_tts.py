"""
伴伴 - 语音合成 (TTS) 引擎

优先使用 Edge TTS (微软神经网络语音, 免费, 高质量)
如果豆包 TTS 已配置且可用, 则升级使用豆包 TTS

Edge TTS 音色:
  zh-CN-XiaoxiaoNeural  — 晓晓, 温暖女声 (默认)
  zh-CN-XiaoyiNeural    — 晓伊, 温柔女声
  zh-CN-YunxiNeural     — 云希, 阳光男声
  zh-CN-YunyangNeural   — 云扬, 专业男声

豆包 TTS 音色 (需在火山引擎控制台开通):
  BV700_streaming       — 灿灿, 温暖女声
  BV001_streaming       — 通用女声
  BV701_streaming       — 擎苍, 阳光男声
"""
from __future__ import annotations
import json
import os
import sys
import uuid
import base64
import subprocess
import tempfile
from typing import Optional

import requests

# ============================================================
# 配置
# ============================================================
TTS_URL = "https://openspeech.bytedance.com/api/v1/tts"
CFG_FILE = os.path.join(os.path.expanduser("~"), ".banban", "doubao_config.json")

# Edge TTS 音色映射
EDGE_VOICES = {
    "BV700_streaming": "zh-CN-XiaoxiaoNeural",   # 灿灿 → 晓晓
    "BV001_streaming": "zh-CN-XiaoyiNeural",     # 通用女声 → 晓伊
    "BV701_streaming": "zh-CN-YunxiNeural",      # 擎苍 → 云希
    "default": "zh-CN-XiaoxiaoNeural",
}


def _load_config() -> dict:
    if not os.path.exists(CFG_FILE):
        return {}
    with open(CFG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


class DoubaoTTS:
    """语音合成引擎 (Edge TTS 优先 + 豆包 TTS 可选升级)"""

    def __init__(self):
        cfg = _load_config()
        self.app_id = cfg.get("app_id", "")
        self.token = cfg.get("token", "") or cfg.get("access_token", "")
        self.cluster = cfg.get("tts_cluster", "volcano_tts")
        self.is_configured = True  # Edge TTS 始终可用

        self.default_voice = "BV700_streaming"
        self._doubao_available = bool(self.app_id and self.token)

    def synthesize(self, text: str, voice_type: str = None,
                   speed: float = 1.0, volume: float = 1.0,
                   pitch: float = 1.0, emotion: str = None) -> dict:
        """
        文字转语音

        优先尝试豆包 TTS (如果已配置), 失败则自动降级到 Edge TTS

        返回:
            {"ok": True, "audio": "base64 mp3", "format": "mp3", "engine": "edge|doubao"}
            或 {"ok": False, "error": "..."}
        """
        if not text or not text.strip():
            return {"ok": False, "error": "文本内容为空"}

        # 截断超长文本
        text_bytes = text.encode("utf-8")
        if len(text_bytes) > 1000:
            text = text_bytes[:1000].decode("utf-8", errors="ignore")
            last_complete = text.rfind("。")
            if last_complete > 100:
                text = text[:last_complete + 1]

        voice = voice_type or self.default_voice

        # 尝试豆包 TTS (如果已配置)
        if self._doubao_available:
            result = self._doubao_synthesize(text, voice, speed, volume, pitch, emotion)
            if result.get("ok"):
                result["engine"] = "doubao"
                return result
            # 豆包失败 → 降级到 Edge TTS
            print(f"[TTS] 豆包合成失败, 降级到 Edge TTS: {result.get('error', '')}")

        # Edge TTS 合成 (始终可用)
        result = self._edge_synthesize(text, voice, speed, pitch)
        if result.get("ok"):
            result["engine"] = "edge"
        return result

    def _doubao_synthesize(self, text: str, voice: str,
                           speed: float, volume: float,
                           pitch: float, emotion: str) -> dict:
        """豆包 TTS HTTP API 合成"""
        reqid = str(uuid.uuid4())
        payload = {
            "app": {
                "appid": self.app_id,
                "token": self.token,
                "cluster": self.cluster,
            },
            "user": {"uid": "banban_user"},
            "audio": {
                "voice_type": voice,
                "encoding": "mp3",
                "rate": 24000,
                "speed_ratio": speed,
                "volume_ratio": volume,
                "pitch_ratio": pitch,
            },
            "request": {
                "reqid": reqid,
                "text": text,
                "text_type": "plain",
                "operation": "query",
            }
        }
        if emotion:
            payload["audio"]["emotion"] = emotion

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer;{self.token}",
        }

        try:
            resp = requests.post(TTS_URL, json=payload, headers=headers, timeout=30)
            result = resp.json()
            if result.get("code") == 3000:
                audio_data = result.get("data", "")
                duration = result.get("addition", {}).get("duration", "0")
                return {"ok": True, "audio": audio_data, "duration": duration, "format": "mp3"}
            else:
                return {"ok": False, "error": f"豆包TTS({result.get('code')}): {result.get('message', '')}"}
        except requests.exceptions.Timeout:
            return {"ok": False, "error": "豆包TTS请求超时"}
        except Exception as e:
            return {"ok": False, "error": f"豆包TTS异常: {str(e)}"}

    def _edge_synthesize(self, text: str, voice: str,
                         speed: float, pitch: float) -> dict:
        """Edge TTS 合成 (使用独立 Python 进程, 避免异步事件循环冲突)"""
        edge_voice = EDGE_VOICES.get(voice, EDGE_VOICES["default"])

        # speed/pitch → edge-tts 格式
        speed_pct = int((speed - 1.0) * 100)
        rate_str = f"+{speed_pct}%" if speed_pct >= 0 else f"{speed_pct}%"
        pitch_hz = int((pitch - 1.0) * 50)
        pitch_str = f"+{pitch_hz}Hz" if pitch_hz >= 0 else f"{pitch_hz}Hz"

        # 用 base64 传递文本, 避免文件编码问题
        b64_text = base64.b64encode(text.encode("utf-8")).decode("ascii")

        # 临时音频文件
        tmp_dir = os.path.join(os.path.expanduser("~"), ".banban", "tts_tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        audio_file = os.path.join(tmp_dir, "tts_output.mp3")

        # 查找 tts_helper.py 脚本
        helper_script = os.path.join(os.path.dirname(__file__), "tts_helper.py")
        if not os.path.exists(helper_script):
            return {"ok": False, "error": "tts_helper.py 不存在"}

        try:
            # 用独立 Python 进程运行 tts_helper.py
            cmd = [
                sys.executable,
                "-B",
                helper_script,
                b64_text,
                edge_voice,
                rate_str,
                pitch_str,
                audio_file,
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=30,
            )

            if result.returncode != 0:
                err = result.stderr.decode("utf-8", errors="replace") if result.stderr else ""
                out = result.stdout.decode("utf-8", errors="replace") if result.stdout else ""
                print(f"[TTS] Edge helper stdout: {out}", flush=True)
                print(f"[TTS] Edge helper stderr: {err}", flush=True)
                return {"ok": False, "error": f"Edge TTS 错误: {(out + err)[:800]}"}

            if not os.path.exists(audio_file) or os.path.getsize(audio_file) == 0:
                out = result.stdout.decode("utf-8", errors="replace") if result.stdout else ""
                return {"ok": False, "error": f"Edge TTS 未生成音频文件. Output: {out[:300]}"}

            # 读取音频文件并编码为 base64
            with open(audio_file, "rb") as f:
                audio_bytes = f.read()

            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            duration = str(int(len(audio_bytes) / 48))  # 粗略估算

            return {"ok": True, "audio": audio_b64, "duration": duration, "format": "mp3"}

        except subprocess.TimeoutExpired:
            return {"ok": False, "error": "Edge TTS 超时"}
        except Exception as e:
            return {"ok": False, "error": f"Edge TTS 异常: {str(e)}"}
        finally:
            # 清理临时文件
            try:
                if os.path.exists(audio_file):
                    os.remove(audio_file)
            except:
                pass

    def reload_config(self):
        """重新加载配置"""
        cfg = _load_config()
        self.app_id = cfg.get("app_id", "")
        self.token = cfg.get("token", "") or cfg.get("access_token", "")
        self.cluster = cfg.get("tts_cluster", "volcano_tts")
        self._doubao_available = bool(self.app_id and self.token)
        self.is_configured = True  # Edge TTS 始终可用


# 全局单例
doubao_tts = DoubaoTTS()
