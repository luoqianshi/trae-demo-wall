"""WebSocket 事件通知服务 — 解耦 HTTP 路由与 WebSocket 推送"""
from .manager import manager


async def notify_friend_request(to_user_id: int, from_user_id: int, from_username: str, request_id: int):
    """通知用户收到好友请求"""
    await manager.send_to_user(to_user_id, {
        "type": "friend_request",
        "from_user_id": from_user_id,
        "from_username": from_username,
        "request_id": request_id,
    })


async def notify_friend_accepted(to_user_id: int, user_id: int, username: str):
    """通知用户好友请求被接受"""
    await manager.send_to_user(to_user_id, {
        "type": "friend_accepted",
        "user_id": user_id,
        "username": username,
    })
