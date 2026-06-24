"""
Background task execution routes.
"""

import asyncio
import time
import uuid
from typing import Optional
from fastapi import APIRouter, Header, HTTPException

from ..models import AgentTask

router = APIRouter(prefix="/api", tags=["task"])


async def _run_background_task(task: AgentTask):
    """Execute a task in the background via the agent adapter."""
    try:
        adapter = router.state.adapters.get(task.agent)
        if not adapter:
            task.status = "error"
            task.error = f"Agent '{task.agent}' not found"
            task.finished_at = time.time()
            return
        result = await adapter.execute(task.prompt, task.cwd)
        task.output = result
        task.status = "done"
    except Exception as e:
        task.status = "error"
        task.error = str(e)
    finally:
        task.finished_at = time.time()


@router.post("/tasks/run")
async def run_task(
    authorization: Optional[str] = Header(default=None),
    agent: str = "",
    cwd: str = "",
    prompt: str = "",
):
    """Submit a background task to an agent (non-interactive)."""
    router.state.check_auth(authorization)
    if not agent or not prompt:
        raise HTTPException(status_code=400, detail="agent and prompt required")
    safe_cwd = router.state.safe_cwd(cwd) if cwd else router.state.default_cwd
    task_id = str(uuid.uuid4())
    task = AgentTask(
        id=task_id,
        session_id="",
        agent=agent,
        prompt=prompt,
        cwd=safe_cwd,
        status="running",
        started_at=time.time(),
    )
    router.state.tasks[task_id] = task
    asyncio.create_task(_run_background_task(task))
    return {"taskId": task_id, "status": "running"}


@router.get("/tasks/{task_id}")
async def get_task(task_id: str, authorization: Optional[str] = Header(default=None)):
    """Get task status and output."""
    router.state.check_auth(authorization)
    task = router.state.tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "id": task.id,
        "agent": task.agent,
        "prompt": task.prompt,
        "cwd": task.cwd,
        "status": task.status,
        "startedAt": task.started_at,
        "finishedAt": task.finished_at,
        "error": task.error,
    }


@router.delete("/tasks/{task_id}")
async def cancel_task(task_id: str, authorization: Optional[str] = Header(default=None)):
    """Cancel a running task."""
    router.state.check_auth(authorization)
    task = router.state.tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "stopped"
    task.finished_at = time.time()
    return {"success": True}
