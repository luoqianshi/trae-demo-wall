"""WebSocket 模块：实时推送分析进度（含过滤帧数）"""
import json
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from collections import defaultdict

router = APIRouter()


class ProgressManager:
    """进度推送管理器：管理每个任务的 WebSocket 连接"""

    def __init__(self):
        # task_id -> set of WebSocket connections
        self.connections: Dict[str, Set[WebSocket]] = defaultdict(set)

    async def connect(self, task_id: str, websocket: WebSocket):
        """接受新的 WebSocket 连接"""
        await websocket.accept()
        self.connections[task_id].add(websocket)

    def disconnect(self, task_id: str, websocket: WebSocket):
        """断开 WebSocket 连接"""
        if task_id in self.connections:
            self.connections[task_id].discard(websocket)
            if not self.connections[task_id]:
                del self.connections[task_id]

    async def broadcast(self, task_id: str, message: dict):
        """向指定任务的所有连接推送消息"""
        if task_id not in self.connections:
            return

        message_str = json.dumps(message, ensure_ascii=False)
        dead_connections = []

        for websocket in self.connections[task_id]:
            try:
                await websocket.send_text(message_str)
            except Exception:
                dead_connections.append(websocket)

        # 清理断开的连接
        for ws in dead_connections:
            self.connections[task_id].discard(ws)


# 全局进度管理器实例
progress_manager = ProgressManager()


@router.websocket("/api/pingpong/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """WebSocket 端点：推送分析进度

    推送消息格式：
        - 进度: {"type": "progress", "processed": 100, "total": 1200, "percentage": 8.3, "filtered_frames": 10}
        - 完成: {"type": "completed", "message": "分析完成", "filtered_frames": 120}
        - 错误: {"type": "error", "message": "错误信息"}
    """
    await progress_manager.connect(task_id, websocket)
    try:
        while True:
            # 保持连接，等待客户端消息（可用于心跳或命令）
            data = await websocket.receive_text()
            # 可以处理客户端发来的命令
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        progress_manager.disconnect(task_id, websocket)
