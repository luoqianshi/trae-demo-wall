"""Pydantic 请求/响应模型。"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str


class ProjectUpdate(BaseModel):
    name: str | None = None
    pinned: bool | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    status: str
    script_text: str | None = None
    canvas_state: dict | None = None
    created_at: datetime | None = None
    pinned: bool = False


class ScriptUpload(BaseModel):
    script_text: str


class AssetUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    prompt: str | None = None


class StoryboardUpdate(BaseModel):
    prompt: str | None = None
    director_stage_ref_ids: list[str] | None = None


class DirectorStageCreate(BaseModel):
    project_id: str
    name: str | None = "导演台"


class DirectorStageUpdate(BaseModel):
    name: str | None = None
    scene_data: dict | None = None
    screenshots: list | None = None
    status: str | None = None


class DirectorStageGenerate3DRequest(BaseModel):
    prompt: str


class CanvasStateUpdate(BaseModel):
    canvas_state: dict
