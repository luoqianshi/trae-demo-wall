"""导演台 CRUD 与截图管理路由。"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import AssetStatus, DirectorStage, Project
from app.schemas import DirectorStageCreate, DirectorStageGenerate3DRequest, DirectorStageUpdate
from app.services.scene_generator import generate_scene_description

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/director-stages", tags=["director_stages"])


def _stage_dir(project_id: str, stage_id: str) -> Path:
    """导演台截图存储目录。"""
    d = settings.storage_dir / project_id / f"director_stage_{stage_id}"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _uuid() -> str:
    return uuid.uuid4().hex


def _ds_dict(ds: DirectorStage) -> dict:
    return {
        "id": ds.id,
        "project_id": ds.project_id,
        "name": ds.name,
        "scene_data": ds.scene_data or {},
        "screenshots": ds.screenshots or [],
        "status": ds.status.value if ds.status else "pending",
        "created_at": ds.created_at.isoformat() if ds.created_at else None,
        "updated_at": ds.updated_at.isoformat() if ds.updated_at else None,
    }


@router.post("")
def create_director_stage(payload: DirectorStageCreate, db: Session = Depends(get_db)) -> dict:
    proj = db.get(Project, payload.project_id)
    if not proj:
        raise HTTPException(404, "项目不存在")
    ds = DirectorStage(
        id=_uuid(),
        project_id=payload.project_id,
        name=payload.name or "导演台",
        scene_data={
            "background": {"color": "#111111", "showGrid": True},
            "environment": {"ambientIntensity": 0.6},
            "elements": [],
            "cameras": [],
        },
        screenshots=[],
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return _ds_dict(ds)


@router.get("/{stage_id}")
def get_director_stage(stage_id: str, db: Session = Depends(get_db)) -> dict:
    ds = db.get(DirectorStage, stage_id)
    if not ds:
        raise HTTPException(404, "导演台不存在")
    return _ds_dict(ds)


@router.put("/{stage_id}")
def update_director_stage(stage_id: str, payload: DirectorStageUpdate, db: Session = Depends(get_db)) -> dict:
    ds = db.get(DirectorStage, stage_id)
    if not ds:
        raise HTTPException(404, "导演台不存在")
    if payload.name is not None:
        ds.name = payload.name
    if payload.scene_data is not None:
        ds.scene_data = payload.scene_data
    if payload.screenshots is not None:
        ds.screenshots = payload.screenshots
    if payload.status is not None:
        ds.status = payload.status
    ds.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ds)
    return _ds_dict(ds)


@router.delete("/{stage_id}")
def delete_director_stage(stage_id: str, db: Session = Depends(get_db)) -> dict:
    ds = db.get(DirectorStage, stage_id)
    if not ds:
        raise HTTPException(404, "导演台不存在")
    # 清理截图目录
    stage_path = _stage_dir(ds.project_id, stage_id)
    if stage_path.exists():
        for f in stage_path.iterdir():
            f.unlink(missing_ok=True)
        stage_path.rmdir()
    db.delete(ds)
    db.commit()
    return {"ok": True}


@router.post("/{stage_id}/screenshots")
def upload_screenshot(
    stage_id: str,
    camera_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict:
    ds = db.get(DirectorStage, stage_id)
    if not ds:
        raise HTTPException(404, "导演台不存在")

    ext = Path(file.filename or "shot.png").suffix or ".png"
    shot_id = _uuid()
    filename = f"shot_{shot_id}{ext}"
    stage_path = _stage_dir(ds.project_id, stage_id)
    file_path = stage_path / filename

    try:
        file_path.write_bytes(file.file.read())
    except Exception as e:
        logger.exception("保存导演台截图失败")
        raise HTTPException(500, f"保存截图失败: {e}") from e

    rel_path = f"{ds.project_id}/director_stage_{stage_id}/{filename}"
    screenshot = {
        "id": shot_id,
        "camera_id": camera_id,
        "filename": filename,
        "image_path": rel_path,
        "created_at": datetime.utcnow().isoformat(),
    }
    screenshots = list(ds.screenshots or [])
    screenshots.append(screenshot)
    ds.screenshots = screenshots
    ds.status = AssetStatus.done
    ds.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ds)
    return screenshot


@router.post("/{stage_id}/generate-3d")
async def generate_3d_scene(stage_id: str, payload: DirectorStageGenerate3DRequest) -> dict:
    """用 DeepSeek 把一句话描述解析为结构化场景 JSON。

    同步返回 SceneDescription，前端拿到后持久化到 scene_data.elements。
    """
    try:
        scene_description = await generate_scene_description(payload.prompt)
    except ValueError as e:
        raise HTTPException(500, str(e)) from e
    except Exception as e:
        logger.exception("AI 场景生成失败")
        msg = str(e)
        if "balance" in msg.lower() or "quota" in msg.lower() or "余额" in msg:
            raise HTTPException(503, "AI 服务余额不足，请联系管理员") from e
        raise HTTPException(500, f"AI 场景生成失败: {e}") from e
    return {"scene_description": scene_description}


@router.get("/project/{project_id}")
def list_director_stages(project_id: str, db: Session = Depends(get_db)) -> list[dict]:
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(404, "项目不存在")
    return [_ds_dict(ds) for ds in proj.director_stages]
