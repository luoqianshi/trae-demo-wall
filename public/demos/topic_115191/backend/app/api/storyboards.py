"""故事板查询/编辑/重生成路由。"""
from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.events import emit_event
from app.config import settings
from app.database import get_db
from app.models import Character, DirectorStage, Episode, Prop, Scene, Storyboard
from app.schemas import StoryboardUpdate
from app.services.image_client import generate_image_with_url
from app.services.storage import save_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/storyboards", tags=["storyboards"])


@router.put("/{storyboard_id}")
def update_storyboard(storyboard_id: str, payload: StoryboardUpdate, db: Session = Depends(get_db)) -> dict:
    sb = db.get(Storyboard, storyboard_id)
    if not sb:
        raise HTTPException(404, "故事板不存在")
    if payload.prompt is not None:
        sb.prompt = payload.prompt
        sb.status = "user_edited"
    if payload.director_stage_ref_ids is not None:
        sb.director_stage_ref_ids = payload.director_stage_ref_ids
        sb.status = "user_edited"
    db.commit()
    return {"ok": True}


@router.post("/{storyboard_id}/regenerate")
async def regenerate_storyboard(storyboard_id: str, db: Session = Depends(get_db)) -> dict:
    """重新生成单个故事板，重新走参考链（取前一个故事板图 + 涉及资产图）。"""
    sb = db.get(Storyboard, storyboard_id)
    if not sb:
        raise HTTPException(404, "故事板不存在")
    if not sb.prompt:
        raise HTTPException(400, "故事板提示词为空")

    episode = db.get(Episode, sb.episode_id)
    project_id = episode.project_id if episode else None
    if not project_id:
        raise HTTPException(400, "无法定位项目")

    sb.status = "generating"
    db.commit()

    await emit_event(project_id, {
        "event": "storyboard_generating",
        "episode_id": sb.episode_id,
        "storyboard_id": storyboard_id,
        "index": sb.index,
    })

    # 收集参考图路径（image_client 支持传 rel_path 字符串，自动转 URL 或 base64）
    reference_images: list[str] = []

    # 前一个故事板图
    if sb.prev_storyboard_id:
        prev_sb = db.get(Storyboard, sb.prev_storyboard_id)
        if prev_sb and prev_sb.image_path:
            reference_images.append(prev_sb.image_path)

    # 涉及的角色/场景/道具图
    for cid in sb.character_ref_ids or []:
        c = db.get(Character, cid)
        if c and c.image_path:
            reference_images.append(c.image_path)
    for sid in sb.scene_ref_ids or []:
        s = db.get(Scene, sid)
        if s and s.image_path:
            reference_images.append(s.image_path)
    for pid in sb.prop_ref_ids or []:
        pr = db.get(Prop, pid)
        if pr and pr.image_path:
            reference_images.append(pr.image_path)

    # 导演台截图
    reference_images.extend(_resolve_director_stage_refs(sb.director_stage_ref_ids or [], db))

    try:
        img_bytes, image_url = await generate_image_with_url(
            sb.prompt,
            reference_images=reference_images or None,
            size=settings.agnes_storyboard_size,
            channel="image_2k",
        )
        filename = f"storyboard_{storyboard_id}_{datetime.now().strftime('%H%M%S')}.png"
        rel_path = save_image(project_id, filename, img_bytes)
        sb.image_path = rel_path
        sb.image_url = image_url
        sb.status = "done"
        db.commit()

        await emit_event(project_id, {
            "event": "storyboard_generated",
            "episode_id": sb.episode_id,
            "storyboard_id": storyboard_id,
            "index": sb.index,
            "image_path": rel_path,
            "image_url": image_url,
            "reference_count": len(reference_images),
        })
        return {"ok": True, "image_path": rel_path}
    except Exception as e:  # noqa: BLE001
        sb.status = "failed"
        db.commit()
        await emit_event(project_id, {
            "event": "storyboard_failed",
            "episode_id": sb.episode_id,
            "storyboard_id": storyboard_id,
            "index": sb.index,
            "message": str(e),
        })
        raise HTTPException(500, f"生成失败: {e}")


def _resolve_director_stage_refs(ref_ids: list[str], db: Session) -> list[str]:
    """把导演台截图 id 列表解析成图片路径列表。"""
    paths: list[str] = []
    if not ref_ids:
        return paths
    # 收集所有导演台的 screenshots，按 shot_id 匹配
    stages = db.query(DirectorStage).all()
    shot_map = {}
    for stage in stages:
        for shot in stage.screenshots or []:
            shot_map[shot.get("id")] = shot.get("image_path")
    for rid in ref_ids:
        path = shot_map.get(rid)
        if path:
            paths.append(path)
    return paths
