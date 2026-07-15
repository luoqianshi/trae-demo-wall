"""
设置管理路由
提供 AI 模型和 ASR 的配置接口
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.ai_service import ai_service, PRESET_PROVIDERS
from app.services.asr_service import asr_service
from app.services import settings_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["设置"])


class AISettingsRequest(BaseModel):
    """AI 设置请求"""
    provider: str = Field(..., description="提供商: deepseek/qwen/ernie 或自定义名称")
    api_key: str = Field(..., description="API Key")
    model: Optional[str] = Field(default=None, description="模型名称，不填则使用默认")
    base_url: Optional[str] = Field(default=None, description="API 基础 URL，不填则使用预设")


class ASRSettingsRequest(BaseModel):
    """ASR 设置请求"""
    engine: str = Field(..., description="ASR 引擎: none/funasr/tencent")
    funasr_url: str = Field(default="http://127.0.0.1:10095", description="FunASR 服务地址")
    tencent_secret_id: str = Field(default="", description="腾讯云 SecretId")
    tencent_secret_key: str = Field(default="", description="腾讯云 SecretKey")


@router.get("/ai", summary="获取 AI 设置")
def get_ai_settings():
    """获取当前 AI 配置"""
    try:
        config = ai_service.get_config()
        return {
            **config,
            "presets": PRESET_PROVIDERS,
            "available_providers": list(PRESET_PROVIDERS.keys()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai", summary="更新 AI 设置")
def update_ai_settings(req: AISettingsRequest):
    """更新 AI 配置并立即生效"""
    try:
        settings_service.update_ai_settings(
            provider=req.provider,
            api_key=req.api_key,
            model=req.model,
            base_url=req.base_url,
        )
        return {"message": "AI 设置已保存", "provider": req.provider}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/asr", summary="获取 ASR 设置")
def get_asr_settings():
    """获取当前语音识别配置"""
    try:
        return asr_service.get_config()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/asr", summary="更新 ASR 设置")
def update_asr_settings(req: ASRSettingsRequest):
    """更新语音识别配置"""
    try:
        settings_service.update_asr_settings(
            engine=req.engine,
            funasr_url=req.funasr_url,
            tencent_secret_id=req.tencent_secret_id,
            tencent_secret_key=req.tencent_secret_key,
        )
        return {"message": "ASR 设置已保存", "engine": req.engine}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all", summary="获取所有设置")
def get_all_settings():
    """获取所有设置（API Key 做脱敏处理）"""
    try:
        settings = settings_service.get_settings()
        # 脱敏 API Key
        if settings.get("ai", {}).get("api_key"):
            key = settings["ai"]["api_key"]
            settings["ai"]["api_key_display"] = key[:4] + "****" + key[-4:] if len(key) > 8 else "****"
        else:
            settings["ai"]["api_key_display"] = ""
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))