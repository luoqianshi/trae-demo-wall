"""视频查询/重生成路由。"""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.nodes.video_generator import regenerate_single_video
from app.database import get_db
from app.models import Video

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.post("/{video_id}/regenerate")
async def regenerate_video(video_id: str, db: Session = Depends(get_db)) -> dict:
    """重新生成单个视频（后台异步执行，立即返回）。

    前端点击刷新按钮后调用此接口，实际生成在后台进行，
    通过 WebSocket 事件推送进度/完成/失败。
    """
    video = db.get(Video, video_id)
    if not video:
        raise HTTPException(404, "视频不存在")

    project_id = video.project_id

    # 后台异步执行（不阻塞 API 响应）
    asyncio.create_task(regenerate_single_video(project_id, video_id))

    return {"ok": True}
