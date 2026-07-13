"""节点2: 资产提示词生成 - 为每个角色/场景/道具生成英文生图提示词。"""
from __future__ import annotations

import asyncio
import logging

from app.agents.events import emit_event
from app.agents.state import WorkflowState
from app.database import SessionLocal
from app.models import Character, Prop, Scene
from app.services.openai_client import generate_asset_prompt

logger = logging.getLogger(__name__)


async def _gen_one(asset_type: str, item: dict) -> dict:
    try:
        prompt = await generate_asset_prompt(asset_type, item["name"], item["description"])
        item["prompt"] = prompt
        item["status"] = "pending"  # 提示词就绪，待生图
        # 写回 DB
        with SessionLocal() as db:
            Model = {"character": Character, "scene": Scene, "prop": Prop}[asset_type]
            obj = db.get(Model, item["id"])
            if obj:
                obj.prompt = prompt
                db.commit()
        await emit_event(item.get("_project_id", ""), {
            "event": "asset_prompt_done",
            "asset_type": asset_type,
            "asset_id": item["id"],
            "prompt": prompt,
        })
    except Exception as e:  # noqa: BLE001
        logger.exception("资产提示词生成失败: %s", item["name"])
        item["status"] = "failed"
    return item


async def asset_prompt_writer(state: WorkflowState) -> dict:
    project_id = state["project_id"]
    await emit_event(project_id, {"event": "status", "stage": "asset_prompt_writing"})

    tasks = []
    for c in state.get("characters", []):
        c["_project_id"] = project_id
        tasks.append(_gen_one("character", c))
    for s in state.get("scenes", []):
        s["_project_id"] = project_id
        tasks.append(_gen_one("scene", s))
    for p in state.get("props", []):
        p["_project_id"] = project_id
        tasks.append(_gen_one("prop", p))

    await asyncio.gather(*tasks, return_exceptions=True)

    # 清理临时字段
    for items in (state.get("characters", []), state.get("scenes", []), state.get("props", [])):
        for it in items:
            it.pop("_project_id", None)

    return {
        "characters": state.get("characters", []),
        "scenes": state.get("scenes", []),
        "props": state.get("props", []),
    }
