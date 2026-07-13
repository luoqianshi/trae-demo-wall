"""WebSocket 事件发射器注册表。

工作流节点通过 emit_event 推送进度，WS 端点注册对应 project 的发射器。
"""
from __future__ import annotations

import asyncio
from typing import Any, Awaitable, Callable

# project_id -> emit coroutine function
_emitters: dict[str, Callable[[dict[str, Any]], Awaitable[None]]] = {}


def register_emitter(project_id: str, emitter: Callable[[dict[str, Any]], Awaitable[None]]) -> None:
    _emitters[project_id] = emitter


def unregister_emitter(project_id: str) -> None:
    _emitters.pop(project_id, None)


async def emit_event(project_id: str, event: dict[str, Any]) -> None:
    emitter = _emitters.get(project_id)
    if emitter is not None:
        try:
            await emitter(event)
        except Exception:  # noqa: BLE001  发射失败不应阻断工作流
            pass
