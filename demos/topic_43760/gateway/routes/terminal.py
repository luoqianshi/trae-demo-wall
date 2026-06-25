"""
Terminal session management routes.
"""

from typing import Optional
from fastapi import APIRouter, Header, HTTPException

router = APIRouter(prefix="/api", tags=["terminal"])


@router.get("/terminal/sessions")
async def list_terminal_sessions(authorization: Optional[str] = Header(default=None)):
    """List active PTY terminal sessions."""
    router.state.check_auth(authorization)
    sessions = []
    for sid, s in router.state.terminal_manager.sessions.items():
        sessions.append({
            "id": sid,
            "agent": s.agent,
            "cwd": s.cwd,
            "pid": s.pid,
            "createdAt": s.created_at,
            "exitCode": s.exit_code,
        })
    return {"sessions": sessions}


@router.delete("/terminal/sessions/{session_id}")
async def kill_terminal_session(session_id: str, authorization: Optional[str] = Header(default=None)):
    """Kill a terminal session."""
    router.state.check_auth(authorization)
    if session_id not in router.state.terminal_manager.sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    await router.state.terminal_manager.kill(session_id)
    return {"success": True}
