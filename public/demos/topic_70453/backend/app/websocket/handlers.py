"""WebSocket 消息处理器"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from ..services.message_service import save_message
from ..services.friend_service import get_friend_ids
from .manager import ConnectionManager


async def handle_private_message(
    data: dict,
    user_id: int,
    db: AsyncSession,
    manager: ConnectionManager,
):
    """处理私信消息"""
    to_user_id = data.get("to_user_id")
    content = data.get("content", "")

    if not to_user_id or not content.strip():
        return

    # 保存消息到数据库
    message = await save_message(db, user_id, to_user_id, content.strip())

    # 推送给接收方（如果在线）
    await manager.send_to_user(
        to_user_id,
        {
            "type": "private_message",
            "message_id": message.id,
            "from_user_id": user_id,
            "to_user_id": to_user_id,
            "content": content.strip(),
            "timestamp": str(message.created_at),
        },
    )


async def handle_websocket_message(
    raw_text: str,
    user_id: int,
    db: AsyncSession,
    manager: ConnectionManager,
):
    """分发 WebSocket 消息"""
    try:
        data = json.loads(raw_text)
    except json.JSONDecodeError:
        return

    msg_type = data.get("type")

    if msg_type == "private_message":
        await handle_private_message(data, user_id, db, manager)
