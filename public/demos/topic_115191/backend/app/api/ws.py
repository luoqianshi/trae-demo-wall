"""WebSocket 连接管理与事件广播。"""
from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """project_id -> 活跃 WebSocket 连接集合。"""

    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = {}

    async def connect(self, project_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.setdefault(project_id, set()).add(ws)
        logger.info("WS 连接建立: project=%s, 当前连接数=%d", project_id, len(self._connections[project_id]))

    def disconnect(self, project_id: str, ws: WebSocket) -> None:
        conns = self._connections.get(project_id)
        if conns:
            conns.discard(ws)
            if not conns:
                del self._connections[project_id]

    async def broadcast(self, project_id: str, event: dict[str, Any]) -> None:
        conns = self._connections.get(project_id)
        if not conns:
            return
        msg = json.dumps(event, ensure_ascii=False, default=str)
        dead: list[WebSocket] = []
        for ws in conns:
            try:
                await ws.send_text(msg)
            except Exception:  # noqa: BLE001
                dead.append(ws)
        for ws in dead:
            conns.discard(ws)


manager = ConnectionManager()
