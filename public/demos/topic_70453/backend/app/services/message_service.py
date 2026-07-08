"""消息服务：消息持久化和查询"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, update
from ..models.message import Message


async def get_conversation(
    db: AsyncSession, user1_id: int, user2_id: int, limit: int = 50, offset: int = 0
) -> list[Message]:
    """获取两人之间的聊天记录（分页，按时间正序）"""
    result = await db.execute(
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                and_(Message.sender_id == user2_id, Message.receiver_id == user1_id),
            )
        )
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    messages = list(result.scalars().all())
    # 反转使得最早的消息在前
    messages.reverse()
    return messages


async def save_message(
    db: AsyncSession, sender_id: int, receiver_id: int, content: str
) -> Message:
    """保存一条消息"""
    message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def mark_as_read(db: AsyncSession, sender_id: int, receiver_id: int):
    """将某用户发来的消息标记为已读"""
    await db.execute(
        update(Message)
        .where(
            Message.sender_id == sender_id,
            Message.receiver_id == receiver_id,
            Message.is_read == False,
        )
        .values(is_read=True)
    )
    await db.commit()
