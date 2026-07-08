"""WebSocket 连接管理器"""
import json
from typing import Dict
from fastapi import WebSocket


class ConnectionManager:
    """管理所有 WebSocket 连接"""

    def __init__(self):
        # user_id -> WebSocket 映射
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        """注册新连接"""
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        """移除连接"""
        self.active_connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, message: dict):
        """向指定用户发送消息"""
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                self.disconnect(user_id)

    async def broadcast_to_users(self, user_ids: set[int], message: dict):
        """向一组用户广播消息"""
        for uid in user_ids:
            await self.send_to_user(uid, message)

    def is_online(self, user_id: int) -> bool:
        """检查用户是否在线"""
        return user_id in self.active_connections


# 全局单例
manager = ConnectionManager()
