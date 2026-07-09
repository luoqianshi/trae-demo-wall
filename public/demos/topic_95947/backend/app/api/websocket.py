from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, merchant_id: str):
        await websocket.accept()
        if merchant_id not in self.active_connections:
            self.active_connections[merchant_id] = []
        self.active_connections[merchant_id].append(websocket)

    def disconnect(self, websocket: WebSocket, merchant_id: str):
        if merchant_id in self.active_connections:
            self.active_connections[merchant_id].remove(websocket)
            if not self.active_connections[merchant_id]:
                del self.active_connections[merchant_id]

    async def send_message(self, message: dict, merchant_id: str):
        if merchant_id in self.active_connections:
            for connection in self.active_connections[merchant_id]:
                try:
                    await connection.send_json(message)
                except:
                    self.disconnect(connection, merchant_id)

    async def broadcast(self, message: dict):
        for merchant_id, connections in self.active_connections.items():
            await self.send_message(message, merchant_id)

manager = ConnectionManager()

async def websocket_endpoint(websocket: WebSocket, merchant_id: str = "default"):
    await manager.connect(websocket, merchant_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, merchant_id)