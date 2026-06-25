"""
Agent management routes.
"""

from fastapi import APIRouter, Header
from typing import Optional

router = APIRouter(prefix="/api", tags=["agent"])

# Shared state is injected via router.state by server.py


@router.get("/agents")
async def list_agents(authorization: Optional[str] = Header(default=None)):
    """List all available agents."""
    router.state.check_auth(authorization)
    agents = []
    for name, adapter in router.state.adapters.items():
        info = await adapter.get_info()
        agents.append({
            "name": name,
            "displayName": info.name,
            "description": info.description,
            "available": info.available,
            "version": info.version,
        })
    return {"agents": agents}


@router.get("/workspaces")
async def list_workspaces(authorization: Optional[str] = Header(default=None)):
    """List allowed working directories."""
    router.state.check_auth(authorization)
    from pathlib import Path
    return {
        "workspaces": [
            {"path": root, "name": Path(root).name or root}
            for root in router.state.workspace_roots()
        ]
    }
