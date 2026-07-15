"""
语音识别路由
提供语音转文字 API
"""

import logging

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.services.asr_service import asr_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/asr", tags=["语音识别"])


@router.post("/transcribe", summary="语音转文字")
async def transcribe_audio(
    file: UploadFile = File(..., description="音频文件"),
    audio_format: str = Form(default="wav", description="音频格式"),
):
    """
    上传音频文件，返回识别出的文字
    支持的格式: wav, mp3, m4a, flac, ogg
    """
    if not asr_service.is_configured:
        raise HTTPException(
            status_code=503,
            detail="语音识别未配置，请先在设置中配置 ASR 引擎（推荐 FunASR 本地模式）",
        )

    try:
        audio_data = await file.read()
        if len(audio_data) == 0:
            raise HTTPException(status_code=400, detail="音频文件为空")

        text = await asr_service.transcribe(audio_data, audio_format)
        return {"text": text}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"语音识别异常: {e}")
        raise HTTPException(status_code=500, detail=f"识别失败: {e}")


@router.get("/status", summary="ASR 服务状态")
def asr_status():
    """检查 ASR 服务是否已配置"""
    return asr_service.get_config()