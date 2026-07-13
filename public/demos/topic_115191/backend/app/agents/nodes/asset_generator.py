"""节点3: 资产图片生成 - 并行调用 Agnes (agnes-image-2.1-flash) 生成角色三视图/场景图/道具图。"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from app.agents.events import emit_event
from app.agents.state import WorkflowState
from app.config import settings
from app.database import SessionLocal
from app.models import Character, Prop, Scene
from app.services.image_client import generate_image_with_url
from app.services.storage import save_image

logger = logging.getLogger(__name__)


async def _gen_image(asset_type: str, item: dict, project_id: str) -> dict:
    if not item.get("prompt") or item.get("status") == "failed":
        return item
    item["status"] = "generating"
    await emit_event(project_id, {
        "event": "asset_generating",
        "asset_type": asset_type,
        "asset_id": item["id"],
        "name": item["name"],
    })
    try:
        # 资产图用 1K 尺寸（20 RPM → 4 秒间隔），资产不需要 2K
        img_bytes, _ = await generate_image_with_url(
            item["prompt"],
            size=settings.agnes_asset_size,
            channel="image_1k",
        )
        filename = f"{asset_type}_{item['id']}_{datetime.now().strftime('%H%M%S')}.png"
        rel_path = save_image(project_id, filename, img_bytes)
        item["image_path"] = rel_path
        item["status"] = "done"
        with SessionLocal() as db:
            Model = {"character": Character, "scene": Scene, "prop": Prop}[asset_type]
            obj = db.get(Model, item["id"])
            if obj:
                obj.image_path = rel_path
                obj.status = "done"
                db.commit()
        await emit_event(project_id, {
            "event": "asset_generated",
            "asset_type": asset_type,
            "asset_id": item["id"],
            "name": item["name"],
            "image_path": rel_path,
        })
    except Exception as e:  # noqa: BLE001
        logger.exception("资产生图失败: %s", item["name"])
        item["status"] = "failed"
        with SessionLocal() as db:
            Model = {"character": Character, "scene": Scene, "prop": Prop}[asset_type]
            obj = db.get(Model, item["id"])
            if obj:
                obj.status = "failed"
                db.commit()
        msg = str(e)
        if "余额" in msg or "金额" in msg or "balance" in msg.lower():
            msg = "生图 API 余额不足，请充值后再试"
        await emit_event(project_id, {
            "event": "asset_failed",
            "asset_type": asset_type,
            "asset_id": item["id"],
            "name": item["name"],
            "message": msg,
        })
    return item


async def asset_generator(state: WorkflowState) -> dict:
    project_id = state["project_id"]
    await emit_event(project_id, {"event": "status", "stage": "asset_generating"})

    sem = asyncio.Semaphore(settings.asset_concurrency)

    async def _bounded(asset_type: str, item: dict):
        async with sem:
            return await _gen_image(asset_type, item, project_id)

    tasks = []
    for c in state.get("characters", []):
        tasks.append(_bounded("character", c))
    for s in state.get("scenes", []):
        tasks.append(_bounded("scene", s))
    for p in state.get("props", []):
        tasks.append(_bounded("prop", p))

    await asyncio.gather(*tasks, return_exceptions=True)

    return {
        "characters": state.get("characters", []),
        "scenes": state.get("scenes", []),
        "props": state.get("props", []),
    }
