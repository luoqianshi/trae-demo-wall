"""
Agent Everywhere - WebSocket 服务端
"""

import asyncio
import json
import os
import time
import uuid
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .adapters.claude import ClaudeAdapter
from .adapters.codex import CodexAdapter
from .adapters.mock import MockClaudeAdapter, MockCodexAdapter
from .deps import GatewayState
from .terminal import TerminalManager
from .models import AgentTask, SessionState

# Import route modules
from .routes import (
    agent_router,
    memory_router,
    file_router,
    git_router,
    session_router,
    system_router,
    task_router,
    terminal_router,
)


class AgentGateway:
    """Main FastAPI application with WebSocket and REST endpoints."""

    def __init__(self):
        self.state = GatewayState()
        self.app = FastAPI(title="Agent Everywhere")
        self.terminal_manager = TerminalManager()
        self.state.terminal_manager = self.terminal_manager

        # Inject shared state into route modules via router.state
        for router in (agent_router, memory_router, file_router, git_router,
                       session_router, system_router, task_router, terminal_router):
            router.state = self.state

        self._setup_adapters()
        self._setup_routes()

    # ------------------------------------------------------------------
    # Adapters
    # ------------------------------------------------------------------

    def _setup_adapters(self):
        if self.state.use_mock:
            self.state.adapters = {"claude": MockClaudeAdapter(), "codex": MockCodexAdapter()}
        else:
            self.state.adapters = {
                "claude": ClaudeAdapter(),
                "codex": CodexAdapter(),
            }

    # ------------------------------------------------------------------
    # Routes
    # ------------------------------------------------------------------

    def _setup_routes(self):
        # Include all REST routers
        for router in (agent_router, memory_router, file_router, git_router,
                       session_router, system_router, task_router, terminal_router):
            self.app.include_router(router)

        # Legacy chat WebSocket
        @self.app.websocket("/ws/{session_id}")
        async def ws_chat(websocket: WebSocket, session_id: str, token: Optional[str] = None):
            await websocket.accept()
            if not self.state.check_ws_auth(token):
                await websocket.close(code=4001, reason="Unauthorized")
                return

            session = self.state.sessions.get(session_id)
            if not session:
                await websocket.send_json({"type": "error", "message": "Session not found"})
                await websocket.close()
                return

            connections = self.state.session_connections.setdefault(session_id, [])
            connections.append(websocket)

            # Send current messages
            for msg in session.messages:
                await websocket.send_json({"type": "history", "message": msg})

            try:
                while True:
                    data = await websocket.receive_json()
                    action = data.get("action")
                    if action == "execute":
                        await self._handle_execute(websocket, session, data)
                    elif action == "stop":
                        await self._handle_stop(websocket, session)
            except WebSocketDisconnect:
                pass
            finally:
                if websocket in connections:
                    connections.remove(websocket)

        # Terminal WebSocket
        @self.app.websocket("/ws/terminal/{session_id}")
        async def ws_terminal(websocket: WebSocket, session_id: str, token: Optional[str] = None):
            await websocket.accept()
            print(f"[WS] Terminal connection accepted: {session_id}")
            if not self.state.check_ws_auth(token):
                print("[WS] Auth failed, closing")
                await websocket.close(code=4001, reason="Unauthorized")
                return

            try:
                # Wait for config message
                print("[WS] Waiting for config message...")
                config_msg = await websocket.receive_json()
                print(f"[WS] Config received: {config_msg}")
                if config_msg.get("type") != "config":
                    print("[WS] Invalid config type, closing")
                    await websocket.close(code=4002, reason="Expected config message")
                    return

                agent = config_msg.get("agent", "claude")
                cwd = config_msg.get("cwd", self.state.default_cwd)
                cols = config_msg.get("cols", 80)
                rows = config_msg.get("rows", 24)
                print(f"[WS] Creating terminal session: agent={agent}, cwd={cwd}, cols={cols}, rows={rows}")

                session = await self.terminal_manager.create_session(agent, cwd, cols, rows)
                session_id_actual = session.id
                print(f"[WS] Terminal session created: {session_id_actual}, pid={session.pid}")

                await websocket.send_json({
                    "type": "ready",
                    "sessionId": session_id_actual,
                    "agent": agent,
                    "cwd": cwd,
                })
                print("[WS] Ready message sent")

                # Data callback
                async def on_data(data: bytes):
                    try:
                        await websocket.send_bytes(data)
                    except Exception as e:
                        print(f"[WS] send_bytes error: {e}")

                async def on_exit(exit_code):
                    try:
                        print(f"[WS] Terminal exited with code: {exit_code}")
                        await websocket.send_json({"type": "exit", "exitCode": exit_code})
                    except Exception as e:
                        print(f"[WS] send exit error: {e}")

                self.terminal_manager.set_data_callback(session_id_actual, on_data)
                self.terminal_manager.set_exit_callback(session_id_actual, on_exit)
                print("[WS] Callbacks registered, entering read loop")

                # Read loop
                while True:
                    msg = await websocket.receive()
                    if "bytes" in msg:
                        await self.terminal_manager.write(session_id_actual, msg["bytes"])
                    elif "text" in msg:
                        data = json.loads(msg["text"])
                        if data.get("type") == "input":
                            await self.terminal_manager.write(session_id_actual, data["data"].encode())
                        elif data.get("type") == "resize":
                            await self.terminal_manager.resize(session_id_actual, data["cols"], data["rows"])
            except WebSocketDisconnect:
                print("[WS] WebSocket disconnected")
            except Exception as e:
                print(f"[WS] Exception: {e}")
                import traceback
                traceback.print_exc()

        # Static files - serve React build
        static_dir = Path(__file__).parent.parent / "client" / "dist"
        if static_dir.exists():
            self.app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")

        @self.app.get("/")
        async def serve_index():
            index_file = static_dir / "index.html"
            if index_file.exists():
                return FileResponse(str(index_file))
            return {"status": "ok", "message": "Agent Everywhere API is running"}

    # ------------------------------------------------------------------
    # WebSocket handlers
    # ------------------------------------------------------------------

    async def _handle_execute(self, websocket, session, data):
        agent_name = data.get("agent", session.agent)
        prompt = data.get("prompt", "")
        cwd = data.get("cwd", session.cwd)

        if not prompt:
            await websocket.send_json({"type": "error", "message": "Prompt is required"})
            return

        adapter = self.state.adapters.get(agent_name)
        if not adapter:
            await websocket.send_json({"type": "error", "message": f"Agent '{agent_name}' not available"})
            return

        # Update session
        session.agent = agent_name
        session.cwd = cwd
        session.status = "running"
        session.updated_at = time.time()

        # Add user message
        user_msg = {"role": "user", "content": prompt, "timestamp": time.time()}
        session.messages.append(user_msg)

        # Broadcast to all connections
        for conn in self.state.session_connections.get(session.id, []):
            await conn.send_json({"type": "start", "agent": agent_name, "prompt": prompt})

        try:
            result = await adapter.execute(prompt, cwd)
            agent_msg = {"role": "agent", "content": result, "timestamp": time.time()}
            session.messages.append(agent_msg)
            session.status = "done"

            for conn in self.state.session_connections.get(session.id, []):
                await conn.send_json({"type": "output", "content": result})
                await conn.send_json({"type": "done"})
        except Exception as e:
            session.status = "error"
            for conn in self.state.session_connections.get(session.id, []):
                await conn.send_json({"type": "error", "message": str(e)})

    async def _handle_stop(self, websocket, session):
        session.status = "stopped"
        await websocket.send_json({"type": "stopped"})

    # ------------------------------------------------------------------
    # Run
    # ------------------------------------------------------------------

    def run(self, host: str = "0.0.0.0", port: int = 8000):
        uvicorn.run(self.app, host=host, port=port, log_level="info")
