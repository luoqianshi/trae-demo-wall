"""节点1: 剧本分析 - 解析剧本，提取角色/场景/道具/分集，写入 DB 并推送事件。"""
from __future__ import annotations

import logging

from app.agents.events import emit_event
from app.agents.state import WorkflowState
from app.database import SessionLocal
from app.models import Character, Episode, Project, Prop, Scene
from app.services.openai_client import analyze_script

logger = logging.getLogger(__name__)


async def script_analyzer(state: WorkflowState) -> dict:
    project_id = state["project_id"]
    script_text = state["script_text"]

    await emit_event(project_id, {"event": "workflow_started", "project_id": project_id})
    await emit_event(project_id, {"event": "status", "stage": "script_analyzing"})

    try:
        result = await analyze_script(script_text)
    except Exception as e:  # noqa: BLE001
        logger.exception("剧本分析失败")
        await emit_event(project_id, {"event": "error", "stage": "script_analyzing", "message": str(e)})
        return {"errors": [f"剧本分析失败: {e}"]}

    characters = result.get("characters", [])
    scenes = result.get("scenes", [])
    props = result.get("props", [])
    episodes = result.get("episodes", [])

    # 写入 DB（先清除旧数据，避免重复分析时数据叠加导致越界）
    with SessionLocal() as db:
        # 删除旧故事板（通过 Episode 级联删除也可，但显式删除更安全）
        from app.models import Storyboard
        old_ep_ids = [e.id for e in db.query(Episode).filter(Episode.project_id == project_id).all()]
        if old_ep_ids:
            db.query(Storyboard).filter(Storyboard.episode_id.in_(old_ep_ids)).delete(synchronize_session=False)
        db.query(Character).filter(Character.project_id == project_id).delete(synchronize_session=False)
        db.query(Scene).filter(Scene.project_id == project_id).delete(synchronize_session=False)
        db.query(Prop).filter(Prop.project_id == project_id).delete(synchronize_session=False)
        db.query(Episode).filter(Episode.project_id == project_id).delete(synchronize_session=False)
        db.commit()

        for c in characters:
            db.add(Character(
                project_id=project_id,
                name=c.get("name", ""),
                description=c.get("description", ""),
            ))
        for s in scenes:
            db.add(Scene(
                project_id=project_id,
                name=s.get("name", ""),
                description=s.get("description", ""),
            ))
        for p in props:
            db.add(Prop(
                project_id=project_id,
                name=p.get("name", ""),
                description=p.get("description", ""),
            ))
        for i, ep in enumerate(episodes):
            db.add(Episode(
                project_id=project_id,
                index=i + 1,
                title=ep.get("title", f"第{i + 1}集"),
                plot_summary=ep.get("plot_summary", ""),
                duration_seconds=ep.get("duration_seconds", 60),
                involved_character_names=ep.get("involved_character_names", []),
                involved_scene_names=ep.get("involved_scene_names", []),
                involved_prop_names=ep.get("involved_prop_names", []),
            ))
        db.commit()

        # 重新查询拿到 id
        db_chars = db.query(Character).filter(Character.project_id == project_id).all()
        db_scenes = db.query(Scene).filter(Scene.project_id == project_id).all()
        db_props = db.query(Prop).filter(Prop.project_id == project_id).all()
        db_eps = db.query(Episode).filter(Episode.project_id == project_id).order_by(Episode.index).all()

    # 构建状态数据（带 id）
    state_chars = [
        {"id": c.id, "name": c.name, "description": c.description, "prompt": "", "image_path": None, "status": "pending"}
        for c in db_chars
    ]
    state_scenes = [
        {"id": s.id, "name": s.name, "description": s.description, "prompt": "", "image_path": None, "status": "pending"}
        for s in db_scenes
    ]
    state_props = [
        {"id": p.id, "name": p.name, "description": p.description, "prompt": "", "image_path": None, "status": "pending"}
        for p in db_props
    ]
    state_eps = [
        {
            "id": e.id,
            "index": e.index,
            "title": e.title,
            "plot_summary": e.plot_summary,
            "duration_seconds": e.duration_seconds,
            "involved_character_names": episodes[i].get("involved_character_names", []),
            "involved_scene_names": episodes[i].get("involved_scene_names", []),
            "involved_prop_names": episodes[i].get("involved_prop_names", []),
        }
        for i, e in enumerate(db_eps)
    ]

    await emit_event(project_id, {
        "event": "script_analyzed",
        "characters": state_chars,
        "scenes": state_scenes,
        "props": state_props,
        "episodes": state_eps,
    })

    return {
        "characters": state_chars,
        "scenes": state_scenes,
        "props": state_props,
        "episodes": state_eps,
    }
