"""资产库路由：按日期汇总所有项目生成的文本、图片、视频。"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project

router = APIRouter(prefix="/api/library", tags=["library"])


def _date_key(dt: datetime | None) -> str:
    if dt is None:
        return "未知日期"
    return dt.strftime("%Y-%m-%d")


def _group_by_date(items: list[dict]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = {}
    for item in sorted(items, key=lambda x: x.get("created_at") or "", reverse=True):
        key = item.get("date") or "未知日期"
        groups.setdefault(key, []).append(item)
    return groups


@router.get("")
def get_library(db: Session = Depends(get_db)) -> dict:
    """返回按日期分组的全局资产库：{ text: {date: [...]}, image: {date: [...]}, video: {date: [...]} }。"""
    text_items: list[dict] = []
    image_items: list[dict] = []

    projects = db.query(Project).all()
    for proj in projects:
        # 剧本原文
        if proj.script_text:
            text_items.append({
                "id": f"script-{proj.id}",
                "project_id": proj.id,
                "project_name": proj.name,
                "type": "script",
                "title": f"{proj.name} · 剧本",
                "content": proj.script_text,
                "date": _date_key(proj.created_at),
                "created_at": proj.created_at.isoformat() if proj.created_at else None,
            })

        # 角色/场景/道具
        for c in proj.characters:
            if c.prompt:
                text_items.append({
                    "id": f"char-prompt-{c.id}",
                    "project_id": proj.id,
                    "project_name": proj.name,
                    "type": "asset_prompt",
                    "asset_type": "character",
                    "title": f"角色 · {c.name}",
                    "content": c.prompt,
                    "date": _date_key(c.created_at),
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                })
            if c.image_path:
                image_items.append({
                    "id": f"char-img-{c.id}",
                    "project_id": proj.id,
                    "project_name": proj.name,
                    "type": "asset_image",
                    "asset_type": "character",
                    "title": f"角色 · {c.name}",
                    "image_path": c.image_path,
                    "prompt": c.prompt,
                    "date": _date_key(c.created_at),
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                })

        for s in proj.scenes:
            if s.prompt:
                text_items.append({
                    "id": f"scene-prompt-{s.id}",
                    "project_id": proj.id,
                    "project_name": proj.name,
                    "type": "asset_prompt",
                    "asset_type": "scene",
                    "title": f"场景 · {s.name}",
                    "content": s.prompt,
                    "date": _date_key(s.created_at),
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                })
            if s.image_path:
                image_items.append({
                    "id": f"scene-img-{s.id}",
                    "project_id": proj.id,
                    "project_name": proj.name,
                    "type": "asset_image",
                    "asset_type": "scene",
                    "title": f"场景 · {s.name}",
                    "image_path": s.image_path,
                    "prompt": s.prompt,
                    "date": _date_key(s.created_at),
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                })

        for p in proj.props:
            if p.prompt:
                text_items.append({
                    "id": f"prop-prompt-{p.id}",
                    "project_id": proj.id,
                    "project_name": proj.name,
                    "type": "asset_prompt",
                    "asset_type": "prop",
                    "title": f"道具 · {p.name}",
                    "content": p.prompt,
                    "date": _date_key(p.created_at),
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                })
            if p.image_path:
                image_items.append({
                    "id": f"prop-img-{p.id}",
                    "project_id": proj.id,
                    "project_name": proj.name,
                    "type": "asset_image",
                    "asset_type": "prop",
                    "title": f"道具 · {p.name}",
                    "image_path": p.image_path,
                    "prompt": p.prompt,
                    "date": _date_key(p.created_at),
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                })

        # 分集剧情 + 故事板
        for ep in proj.episodes:
            if ep.plot_summary:
                text_items.append({
                    "id": f"ep-plot-{ep.id}",
                    "project_id": proj.id,
                    "project_name": proj.name,
                    "type": "episode_plot",
                    "title": f"第 {ep.index} 集 · {ep.title}",
                    "content": ep.plot_summary,
                    "date": _date_key(ep.created_at),
                    "created_at": ep.created_at.isoformat() if ep.created_at else None,
                })
            for sb in ep.storyboards:
                if sb.prompt:
                    text_items.append({
                        "id": f"sb-prompt-{sb.id}",
                        "project_id": proj.id,
                        "project_name": proj.name,
                        "type": "storyboard_prompt",
                        "title": f"故事板 {sb.index}",
                        "content": sb.prompt,
                        "date": _date_key(sb.created_at),
                        "created_at": sb.created_at.isoformat() if sb.created_at else None,
                    })
                if sb.image_path:
                    image_items.append({
                        "id": f"sb-img-{sb.id}",
                        "project_id": proj.id,
                        "project_name": proj.name,
                        "type": "storyboard_image",
                        "title": f"故事板 {sb.index}",
                        "image_path": sb.image_path,
                        "prompt": sb.prompt,
                        "date": _date_key(sb.created_at),
                        "created_at": sb.created_at.isoformat() if sb.created_at else None,
                    })

    return {
        "text": _group_by_date(text_items),
        "image": _group_by_date(image_items),
        "video": {},  # 视频生成尚未接入
    }
