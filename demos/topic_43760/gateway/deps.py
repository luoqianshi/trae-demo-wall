"""
Shared dependencies and utilities for gateway routes.
"""

import os
from pathlib import Path
from typing import Optional
from fastapi import Header, HTTPException


class GatewayState:
    """Shared state container passed to all route modules."""

    def __init__(self):
        self.adapters = {}
        self.sessions = {}
        self.tasks = {}
        self.session_connections = {}
        self.terminal_manager = None
        self.use_mock = os.getenv("USE_MOCK", "false").lower() == "true"
        self.access_token = os.getenv("AGENT_ACCESS_TOKEN", "")
        self.default_cwd = str(Path.cwd())

    def check_auth(self, authorization: Optional[str]):
        """Optional bearer-token guard for phones and remote browsers."""
        if not self.access_token:
            return
        if authorization != f"Bearer {self.access_token}":
            raise HTTPException(status_code=401, detail="Unauthorized")

    def check_ws_auth(self, token: Optional[str]) -> bool:
        if not self.access_token:
            return True
        return token == self.access_token

    def workspace_roots(self) -> list[str]:
        configured = os.getenv("AGENT_WORKSPACES", "")
        roots = [self.default_cwd]
        if configured:
            roots.extend([item for item in configured.split(os.pathsep) if item.strip()])
        normalized = []
        for root in roots:
            path = str(Path(root).expanduser().resolve())
            if path not in normalized:
                normalized.append(path)
        return normalized

    def safe_cwd(self, cwd: str) -> str:
        requested = Path(cwd or self.default_cwd).expanduser().resolve()
        for root in self.workspace_roots():
            root_path = Path(root)
            if requested == root_path or root_path in requested.parents:
                return str(requested)
        return self.default_cwd


def get_auth_header(authorization: Optional[str] = Header(default=None)) -> Optional[str]:
    return authorization
