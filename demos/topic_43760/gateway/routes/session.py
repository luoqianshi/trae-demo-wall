"""
Session and task routes (legacy chat).
"""

import time
import uuid
from typing import Optional
from fastapi import APIRouter, Header, HTTPException

from ..models import SessionState, AgentTask

router = APIRouter(prefix="/api", tags=["session"])


def _session_summary(session: SessionState) -> dict:
    return {
        "id": session.id,
        "title": session.title,
        "agent": session.agent,
        "cwd": session.cwd,
        "status": session.status,
        "createdAt": session.created_at,
        "updatedAt": session.updated_at,
        "messageCount": len(session.messages),
    }


def _task_summary(task: AgentTask) -> dict:
    return {
        "id": task.id,
        "sessionId": task.session_id,
        "agent": task.agent,
        "prompt": task.prompt,
        "cwd": task.cwd,
        "status": task.status,
        "startedAt": task.started_at,
        "finishedAt": task.finished_at,
        "error": task.error,
    }


@router.get("/sessions")
async def list_sessions(authorization: Optional[str] = Header(default=None)):
    router.state.check_auth(authorization)
    return {"sessions": [_session_summary(s) for s in router.state.sessions.values()]}


@router.post("/sessions")
async def create_session(
    agent: str,
    cwd: str = "",
    title: str = "",
    authorization: Optional[str] = Header(default=None),
):
    router.state.check_auth(authorization)
    session_id = str(uuid.uuid4())
    safe_cwd = router.state.safe_cwd(cwd)
    session = SessionState(
        id=session_id,
        title=title or f"New {agent} session",
        agent=agent,
        cwd=safe_cwd,
        created_at=time.time(),
        updated_at=time.time(),
    )
    router.state.sessions[session_id] = session
    return _session_summary(session)


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, authorization: Optional[str] = Header(default=None)):
    router.state.check_auth(authorization)
    session = router.state.sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session": _session_summary(session), "messages": session.messages}


@router.get("/tasks")
async def list_tasks(authorization: Optional[str] = Header(default=None)):
    router.state.check_auth(authorization)
    return {"tasks": [_task_summary(t) for t in router.state.tasks.values()]}
