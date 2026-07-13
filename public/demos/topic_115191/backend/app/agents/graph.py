"""多 Agent 协作工作流（LangGraph）。

由 6 个专业 Agent 顺序协作：
1. script_analyzer   — 剧本分析师：提取角色/场景/道具/分集（Agnes 文本）
2. asset_prompt_writer — 资产提示词工程师：为每个资产写英文生图 prompt（Agnes 文本）
3. storyboard_prompt_writer — 分镜提示词工程师：为每集故事板写 prompt（Agnes 文本）
4. asset_generator   — 资产生成器：调用 Agnes agnes-image-2.1-flash 生成 1K 资产图
5. storyboard_generator — 故事板生成器：串行生成 2K 故事板图并保证连续性（Agnes 图片）
6. video_generator   — 视频生成器：故事板全部生图完成后，为每个故事板生成 5 秒图生视频（Agnes 视频）

所有文本提示词（步骤1-3）先于所有图片生成（步骤4-5），最后生成视频（步骤6）。
"""
from __future__ import annotations

import asyncio
import logging

from langgraph.graph import END, START, StateGraph

from app.agents.events import emit_event, unregister_emitter
from app.agents.nodes.asset_generator import asset_generator
from app.agents.nodes.asset_prompt_writer import asset_prompt_writer
from app.agents.nodes.script_analyzer import script_analyzer
from app.agents.nodes.storyboard_generator import storyboard_generator
from app.agents.nodes.storyboard_prompt_writer import storyboard_prompt_writer
from app.agents.nodes.video_generator import video_generator
from app.agents.state import WorkflowState
from app.database import SessionLocal
from app.models import Project

logger = logging.getLogger(__name__)


def build_graph():
    """构建并编译工作流图。"""
    g = StateGraph(WorkflowState)
    g.add_node("script_analyzer", script_analyzer)
    g.add_node("asset_prompt_writer", asset_prompt_writer)
    g.add_node("asset_generator", asset_generator)
    g.add_node("storyboard_prompt_writer", storyboard_prompt_writer)
    g.add_node("storyboard_generator", storyboard_generator)
    g.add_node("video_generator", video_generator)

    g.add_edge(START, "script_analyzer")
    g.add_edge("script_analyzer", "asset_prompt_writer")
    g.add_edge("asset_prompt_writer", "storyboard_prompt_writer")
    g.add_edge("storyboard_prompt_writer", "asset_generator")
    g.add_edge("asset_generator", "storyboard_generator")
    g.add_edge("storyboard_generator", "video_generator")
    g.add_edge("video_generator", END)

    return g.compile()


# 编译一次复用
_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


async def run_workflow(project_id: str, script_text: str) -> None:
    """后台运行完整工作流。由 API 层通过 asyncio.create_task 调用。"""
    # 标记项目运行中
    with SessionLocal() as db:
        proj = db.get(Project, project_id)
        if proj:
            proj.script_text = script_text
            proj.status = "running"
            db.commit()

    initial_state: WorkflowState = {
        "project_id": project_id,
        "script_text": script_text,
        "characters": [],
        "scenes": [],
        "props": [],
        "episodes": [],
        "storyboards": [],
        "videos": [],
        "errors": [],
    }

    try:
        graph = get_graph()
        await graph.ainvoke(initial_state)
    except Exception as e:  # noqa: BLE001
        logger.exception("工作流执行失败")
        await emit_event(project_id, {"event": "error", "stage": "workflow", "message": str(e)})
        with SessionLocal() as db:
            proj = db.get(Project, project_id)
            if proj:
                proj.status = "failed"
                db.commit()
    finally:
        unregister_emitter(project_id)
