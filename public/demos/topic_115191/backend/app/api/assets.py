"""资产查询/编辑/重生成路由。"""
from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.events import emit_event
from app.config import settings
from app.database import get_db
from app.models import Character, Prop, Scene
from app.schemas import AssetUpdate
from app.services.image_client import generate_image_with_url
from app.services.storage import save_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assets", tags=["assets"])

_MODELS = {"character": Character, "scene": Scene, "prop": Prop}


def _get_model(asset_type: str):
    if asset_type not in _MODELS:
        raise HTTPException(400, f"未知资产类型: {asset_type}")
    return _MODELS[asset_type]


@router.put("/{asset_type}/{asset_id}")
def update_asset(asset_type: str, asset_id: str, payload: AssetUpdate, db: Session = Depends(get_db)) -> dict:
    Model = _get_model(asset_type)
    obj = db.get(Model, asset_id)
    if not obj:
        raise HTTPException(404, "资产不存在")
    if payload.name is not None:
        obj.name = payload.name
    if payload.description is not None:
        obj.description = payload.description
    if payload.prompt is not None:
        obj.prompt = payload.prompt
        obj.status = "user_edited"
    db.commit()
    return {"ok": True}


@router.post("/{asset_type}/{asset_id}/regenerate")
async def regenerate_asset(asset_type: str, asset_id: str, db: Session = Depends(get_db)) -> dict:
    """重新生成单个资产图片。"""
    Model = _get_model(asset_type)
    obj = db.get(Model, asset_id)
    if not obj:
        raise HTTPException(404, "资产不存在")
    if not obj.prompt:
        raise HTTPException(400, "资产提示词为空，无法生成")

    obj.status = "generating"
    db.commit()

    await emit_event(obj.project_id, {
        "event": "asset_generating",
        "asset_type": asset_type,
        "asset_id": asset_id,
        "name": obj.name,
    })

    try:
        img_bytes, _ = await generate_image_with_url(
            obj.prompt, size=settings.agnes_asset_size, channel="image_1k"
        )
        filename = f"{asset_type}_{asset_id}_{datetime.now().strftime('%H%M%S')}.png"
        rel_path = save_image(obj.project_id, filename, img_bytes)
        obj.image_path = rel_path
        obj.status = "done"
        db.commit()

        await emit_event(obj.project_id, {
            "event": "asset_generated",
            "asset_type": asset_type,
            "asset_id": asset_id,
            "name": obj.name,
            "image_path": rel_path,
        })
        return {"ok": True, "image_path": rel_path}
    except Exception as e:  # noqa: BLE001
        obj.status = "failed"
        db.commit()
        await emit_event(obj.project_id, {
            "event": "asset_failed",
            "asset_type": asset_type,
            "asset_id": asset_id,
            "name": obj.name,
            "message": str(e),
        })
        raise HTTPException(500, f"生成失败: {e}")
