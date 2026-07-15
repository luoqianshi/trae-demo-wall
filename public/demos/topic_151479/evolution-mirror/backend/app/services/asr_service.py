"""
语音识别（ASR）服务
支持本地 FunASR 和云端 ASR（腾讯云）
"""

import json
import logging
import httpx
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class ASRService:
    """语音识别服务"""

    def __init__(self):
        self._engine: str = "none"  # none, funasr, tencent
        self._funasr_url: str = "http://127.0.0.1:10095"
        self._tencent_secret_id: str = ""
        self._tencent_secret_key: str = ""
        self._enabled: bool = False

    @property
    def is_configured(self) -> bool:
        return self._enabled

    def configure_funasr(self, url: str = "http://127.0.0.1:10095"):
        """配置本地 FunASR 服务"""
        self._engine = "funasr"
        self._funasr_url = url.rstrip("/")
        self._enabled = True

    def configure_tencent(self, secret_id: str, secret_key: str):
        """配置腾讯云 ASR"""
        self._engine = "tencent"
        self._tencent_secret_id = secret_id
        self._tencent_secret_key = secret_key
        self._enabled = True

    def disable(self):
        """禁用 ASR"""
        self._engine = "none"
        self._enabled = False

    def get_config(self) -> dict:
        return {
            "engine": self._engine,
            "enabled": self._enabled,
            "funasr_url": self._funasr_url,
            "tencent_configured": bool(self._tencent_secret_id),
        }

    async def transcribe(self, audio_data: bytes, audio_format: str = "wav") -> str:
        """
        将音频数据转成文字

        Args:
            audio_data: 音频文件二进制数据
            audio_format: 音频格式 (wav, mp3, m4a, etc.)

        Returns:
            识别出的文字内容
        """
        if not self._enabled:
            raise RuntimeError("语音识别未配置")

        if self._engine == "funasr":
            return await self._transcribe_funasr(audio_data, audio_format)
        elif self._engine == "tencent":
            return await self._transcribe_tencent(audio_data, audio_format)
        else:
            raise RuntimeError("未知的语音识别引擎")

    async def _transcribe_funasr(self, audio_data: bytes, audio_format: str) -> str:
        """通过本地 FunASR 服务识别"""
        url = f"{self._funasr_url}/asr"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                files = {"audio_file": (f"recording.{audio_format}", audio_data)}
                data = {"audio_format": audio_format}
                resp = await client.post(url, files=files, data=data)
                resp.raise_for_status()
                result = resp.json()
                text = result.get("text", "")
                return text.strip()
        except httpx.ConnectError:
            raise RuntimeError(f"无法连接 FunASR 服务 ({self._funasr_url})，请确认 Docker 容器已启动")
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"FunASR 请求失败: {e.response.status_code}")
        except Exception as e:
            raise RuntimeError(f"FunASR 识别异常: {e}")

    async def _transcribe_tencent(self, audio_data: bytes, audio_format: str) -> str:
        """通过腾讯云 ASR 识别（录音文件识别 API）"""
        # 腾讯云录音文件识别需要先上传音频获取 engine_id，然后轮询结果
        # 简化实现：使用一句话识别 API（60秒内音频）
        # 实际生产中应使用完整的录音文件识别流程
        raise RuntimeError("腾讯云 ASR 暂未实现，请先使用 FunASR 本地模式")


# 全局单例
asr_service = ASRService()