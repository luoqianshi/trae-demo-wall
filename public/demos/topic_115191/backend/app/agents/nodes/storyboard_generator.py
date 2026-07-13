"""节点5: 故事板图片生成 - 串行生成，第 N 个参考第 N-1 个图 + 涉及资产图，保证连续性。

使用 Agnes agnes-image-2.1-flash 生成 2K (2048x1152) 16:9 电影画面，
免费层 2 RPM → 32 秒间隔。返回的图片公网 URL 保存到 Storyboard.image_url，
供后续 video_generator 节点做图生视频。
"""
from __future__ import annotations

import logging
from datetime import datetime

from app.agents.events import emit_event
from app.agents.state import WorkflowState
from app.config import settings
from app.database import SessionLocal
from app.models import DirectorStage, Storyboard
from app.services.image_client import generate_image_with_url
from app.services.storage import save_image

logger = logging.getLogger(__name__)


async def storyboard_generator(state: WorkflowState) -> dict:
    project_id = state["project_id"]
    await emit_event(project_id, {"event": "status", "stage": "storyboard_generating"})

    characters = {c["id"]: c for c in state.get("characters", [])}
    scenes = {s["id"]: s for s in state.get("scenes", [])}
    props = {p["id"]: p for p in state.get("props", [])}
    storyboards = state.get("storyboards", [])

    # 按 episode_index, index 排序确保顺序
    storyboards_sorted = sorted(storyboards, key=lambda s: (s.get("episode_index", 0), s.get("index", 0)))

    # id -> image_path 映射，用于查找前一个故事板图
    sb_image_map: dict[str, str] = {}

    for sb in storyboards_sorted:
        sb_id = sb["id"]
        sb["status"] = "generating"
        await emit_event(project_id, {
            "event": "storyboard_generating",
            "episode_id": sb["episode_id"],
            "episode_index": sb.get("episode_index", 0),
            "storyboard_id": sb_id,
            "index": sb["index"],
        })

        # 收集参考图路径：前一个故事板 + 涉及的角色/场景/道具图
        # image_client 支持传 rel_path 字符串，会自动转成 URL 或 base64
        reference_images: list[str] = []

        prev_id = sb.get("prev_storyboard_id")
        if prev_id and prev_id in sb_image_map:
            reference_images.append(sb_image_map[prev_id])

        for cid in sb.get("character_ref_ids", []):
            c = characters.get(cid)
            if c and c.get("image_path"):
                reference_images.append(c["image_path"])
        for sid in sb.get("scene_ref_ids", []):
            s = scenes.get(sid)
            if s and s.get("image_path"):
                reference_images.append(s["image_path"])
        for pid in sb.get("prop_ref_ids", []):
            p = props.get(pid)
            if p and p.get("image_path"):
                reference_images.append(p["image_path"])

        # 导演台截图
        reference_images.extend(_resolve_director_stage_refs(sb.get("director_stage_ref_ids", [])))

        try:
            # 故事板用 2K 尺寸（2 RPM → 32 秒间隔）；返回 URL 也保留供视频生成使用
            img_bytes, image_url = await generate_image_with_url(
                sb["prompt"],
                reference_images=reference_images or None,
                size=settings.agnes_storyboard_size,
                channel="image_2k",
            )
            filename = f"storyboard_{sb_id}_{datetime.now().strftime('%H%M%S')}.png"
            rel_path = save_image(project_id, filename, img_bytes)
            sb["image_path"] = rel_path
            sb["image_url"] = image_url
            sb["status"] = "done"
            sb_image_map[sb_id] = rel_path

            with SessionLocal() as db:
                obj = db.get(Storyboard, sb_id)
                if obj:
                    obj.image_path = rel_path
                    obj.image_url = image_url
                    obj.status = "done"
                    db.commit()

            await emit_event(project_id, {
                "event": "storyboard_generated",
                "episode_id": sb["episode_id"],
                "episode_index": sb.get("episode_index", 0),
                "storyboard_id": sb_id,
                "index": sb["index"],
                "image_path": rel_path,
                "image_url": image_url,
                "reference_count": len(reference_images),
            })
        except Exception as e:  # noqa: BLE001
            logger.exception("故事板生图失败: %s", sb_id)
            sb["status"] = "failed"
            with SessionLocal() as db:
                obj = db.get(Storyboard, sb_id)
                if obj:
                    obj.status = "failed"
                    db.commit()
            msg = str(e)
            if "余额" in msg or "金额" in msg or "balance" in msg.lower():
                msg = "生图 API 余额不足，请充值后再试"
            await emit_event(project_id, {
                "event": "storyboard_failed",
                "episode_id": sb["episode_id"],
                "storyboard_id": sb_id,
                "index": sb["index"],
                "message": msg,
            })

    # 注意：项目状态 done 与 workflow_done 事件由后续 video_generator 节点统一发出
    return {"storyboards": storyboards_sorted}


def _resolve_director_stage_refs(ref_ids: list[str]) -> list[str]:
    """把导演台截图 id 列表解析成图片路径列表。"""
    paths: list[str] = []
    if not ref_ids:
        return paths
    with SessionLocal() as db:
        stages = db.query(DirectorStage).all()
    shot_map: dict[str, str] = {}
    for stage in stages:
        for shot in stage.screenshots or []:
            shot_map[shot.get("id", "")] = shot.get("image_path", "")
    for rid in ref_ids:
        path = shot_map.get(rid)
        if path:
            paths.append(path)
    return paths
