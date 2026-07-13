"""LangGraph 工作流状态定义。"""
from __future__ import annotations

from typing import TypedDict


class AssetItem(TypedDict, total=False):
    id: str
    name: str
    description: str
    prompt: str
    image_path: str | None
    status: str


class StoryboardItem(TypedDict, total=False):
    id: str
    episode_id: str
    episode_index: int
    index: int  # 集内序号
    prompt: str
    image_path: str | None
    image_url: str | None  # Agnes 返回的公网 URL，供视频生成图生视频
    status: str
    prev_storyboard_id: str | None
    character_ref_ids: list[str]
    scene_ref_ids: list[str]
    prop_ref_ids: list[str]


class EpisodeItem(TypedDict, total=False):
    id: str
    index: int
    title: str
    plot_summary: str
    duration_seconds: int
    involved_character_names: list[str]
    involved_scene_names: list[str]
    involved_prop_names: list[str]


class VideoItem(TypedDict, total=False):
    id: str
    storyboard_id: str
    prompt: str
    task_id: str | None
    video_id: str | None
    status: str
    progress: int
    video_path: str | None
    video_url: str | None
    error: str | None


class WorkflowState(TypedDict, total=False):
    project_id: str
    script_text: str
    characters: list[AssetItem]
    scenes: list[AssetItem]
    props: list[AssetItem]
    episodes: list[EpisodeItem]
    storyboards: list[StoryboardItem]
    videos: list[VideoItem]
    errors: list[str]
