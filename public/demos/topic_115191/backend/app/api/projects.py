"""项目 CRUD 路由。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Character, DirectorStage, Episode, Project, Prop, Scene, Storyboard, Video
from app.schemas import CanvasStateUpdate, ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> Project:
    proj = Project(name=payload.name)
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


@router.get("", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db)) -> list[Project]:
    return db.query(Project).order_by(Project.pinned.desc(), Project.created_at.desc()).all()


@router.get("/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(404, "项目不存在")
    return {
        "id": proj.id,
        "name": proj.name,
        "status": proj.status,
        "script_text": proj.script_text,
        "canvas_state": proj.canvas_state,
        "created_at": proj.created_at.isoformat() if proj.created_at else None,
        "characters": [_asset_dict(c, "character") for c in proj.characters],
        "scenes": [_asset_dict(s, "scene") for s in proj.scenes],
        "props": [_asset_dict(p, "prop") for p in proj.props],
        "episodes": [
            {
                "id": e.id,
                "index": e.index,
                "title": e.title,
                "plot_summary": e.plot_summary,
                "duration_seconds": e.duration_seconds,
                "status": e.status.value if e.status else "pending",
                "involved_character_names": e.involved_character_names or [],
                "involved_scene_names": e.involved_scene_names or [],
                "involved_prop_names": e.involved_prop_names or [],
                "storyboards": [_sb_dict(sb) for sb in e.storyboards],
            }
            for e in proj.episodes
        ],
        "director_stages": [_ds_dict(ds) for ds in proj.director_stages],
        "videos": [_video_dict(v) for v in proj.videos],
    }


@router.delete("/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)) -> dict:
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(404, "项目不存在")
    db.delete(proj)
    db.commit()
    return {"ok": True}


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db)) -> Project:
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(404, "项目不存在")
    if payload.name is not None:
        proj.name = payload.name
    if payload.pinned is not None:
        proj.pinned = payload.pinned
    db.commit()
    db.refresh(proj)
    return proj


@router.put("/{project_id}/canvas")
def save_canvas(project_id: str, payload: CanvasStateUpdate, db: Session = Depends(get_db)) -> dict:
    proj = db.get(Project, project_id)
    if not proj:
        raise HTTPException(404, "项目不存在")
    proj.canvas_state = payload.canvas_state
    db.commit()
    return {"ok": True}


def _asset_dict(obj, asset_type: str) -> dict:
    return {
        "id": obj.id,
        "type": asset_type,
        "name": obj.name,
        "description": obj.description,
        "prompt": obj.prompt,
        "image_path": obj.image_path,
        "status": obj.status.value if obj.status else "pending",
    }


def _sb_dict(sb: Storyboard) -> dict:
    return {
        "id": sb.id,
        "index": sb.index,
        "prompt": sb.prompt,
        "image_path": sb.image_path,
        "image_url": sb.image_url,
        "status": sb.status.value if sb.status else "pending",
        "prev_storyboard_id": sb.prev_storyboard_id,
        "character_ref_ids": sb.character_ref_ids or [],
        "scene_ref_ids": sb.scene_ref_ids or [],
        "prop_ref_ids": sb.prop_ref_ids or [],
        "director_stage_ref_ids": sb.director_stage_ref_ids or [],
    }


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


def _video_dict(v: Video) -> dict:
    return {
        "id": v.id,
        "storyboard_id": v.storyboard_id,
        "prompt": v.prompt,
        "status": v.status.value if v.status else "pending",
        "progress": v.progress,
        "video_path": v.video_path,
        "video_url": v.video_url,
        "error": v.error,
        "num_frames": v.num_frames,
        "frame_rate": v.frame_rate,
        "width": v.width,
        "height": v.height,
        "seconds": v.seconds,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }
