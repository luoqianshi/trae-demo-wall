"""剧本导入与工作流触发路由。"""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.events import register_emitter
from app.agents.graph import run_workflow
from app.api.ws import manager
from app.database import get_db, SessionLocal
from app.models import Project
from app.schemas import ScriptUpload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["script"])


@router.post("/{project_id}/script")
async def upload_script(project_id: str, payload: ScriptUpload, db: Session = Depends(get_db)) -> dict:
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(404, "项目不存在")

    if not payload.script_text.strip():
        raise HTTPException(400, "剧本文本不能为空")

    proj.script_text = payload.script_text
    proj.status = "running"
    db.commit()

    # 注册 WebSocket 事件发射器：工作流节点 emit_event -> manager.broadcast
    async def _emitter(event: dict) -> None:
        await manager.broadcast(project_id, event)

    register_emitter(project_id, _emitter)

    # 后台运行工作流
    asyncio.create_task(run_workflow(project_id, payload.script_text))

    return {"ok": True, "project_id": project_id, "status": "running"}
