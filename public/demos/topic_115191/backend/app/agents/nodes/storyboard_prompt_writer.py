"""节点4: 故事板提示词生成 - 为每集生成 N 个故事板的生图提示词。"""
from __future__ import annotations

import logging
from datetime import datetime

from app.agents.events import emit_event
from app.agents.state import WorkflowState
from app.config import settings
from app.database import SessionLocal
from app.models import Storyboard
from app.services.openai_client import generate_storyboard_prompt

logger = logging.getLogger(__name__)


async def storyboard_prompt_writer(state: WorkflowState) -> dict:
    project_id = state["project_id"]
    await emit_event(project_id, {"event": "status", "stage": "storyboard_prompt_writing"})

    characters = state.get("characters", [])
    scenes = state.get("scenes", [])
    props = state.get("props", [])
    episodes = state.get("episodes", [])

    # 名称 -> id 映射
    char_name_to_id = {c["name"]: c["id"] for c in characters}
    scene_name_to_id = {s["name"]: s["id"] for s in scenes}
    prop_name_to_id = {p["name"]: p["id"] for p in props}

    storyboards: list[dict] = []
    prev_sb_id = None

    for ep in episodes:
        duration = ep.get("duration_seconds", 60)
        n_storyboards = max(1, (duration + 14) // 15)  # ceil(duration/15)
        involved = {
            "characters": ep.get("involved_character_names", []),
            "scenes": ep.get("involved_scene_names", []),
            "props": ep.get("involved_prop_names", []),
        }

        for i in range(n_storyboards):
            try:
                prompt = await generate_storyboard_prompt(
                    episode_plot=ep["plot_summary"],
                    storyboard_index=i + 1,
                    total_storyboards=n_storyboards,
                    prev_storyboard_desc=None,  # 提示词阶段无前一图描述
                    involved_assets=involved,
                )
            except Exception as e:  # noqa: BLE001
                logger.exception("故事板提示词生成失败")
                prompt = ""

            sb_id = None
            with SessionLocal() as db:
                sb = Storyboard(
                    episode_id=ep["id"],
                    index=i + 1,
                    prompt=prompt,
                    prev_storyboard_id=prev_sb_id,
                    character_ref_ids=[char_name_to_id[n] for n in involved["characters"] if n in char_name_to_id],
                    scene_ref_ids=[scene_name_to_id[n] for n in involved["scenes"] if n in scene_name_to_id],
                    prop_ref_ids=[prop_name_to_id[n] for n in involved["props"] if n in prop_name_to_id],
                )
                db.add(sb)
                db.commit()
                db.refresh(sb)
                sb_id = sb.id

            sb_item = {
                "id": sb_id,
                "episode_id": ep["id"],
                "episode_index": ep["index"],
                "index": i + 1,
                "prompt": prompt,
                "image_path": None,
                "status": "pending",
                "prev_storyboard_id": prev_sb_id,
                "character_ref_ids": [char_name_to_id[n] for n in involved["characters"] if n in char_name_to_id],
                "scene_ref_ids": [scene_name_to_id[n] for n in involved["scenes"] if n in scene_name_to_id],
                "prop_ref_ids": [prop_name_to_id[n] for n in involved["props"] if n in prop_name_to_id],
            }
            storyboards.append(sb_item)
            prev_sb_id = sb_id

            await emit_event(project_id, {
                "event": "storyboard_prompt_done",
                "episode_id": ep["id"],
                "episode_index": ep["index"],
                "storyboard_id": sb_id,
                "index": i + 1,
                "prompt": prompt,
                "prev_storyboard_id": sb_item["prev_storyboard_id"],
            })

    return {"storyboards": storyboards}
