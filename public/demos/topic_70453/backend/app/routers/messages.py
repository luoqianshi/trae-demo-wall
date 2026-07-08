"""消息 API 路由"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..utils.dependencies import get_current_user
from ..models.user import User
from ..schemas.message import MessageResponse
from ..services.message_service import get_conversation, mark_as_read, save_message
from ..services.friend_service import get_friend_ids

router = APIRouter(prefix="/api/messages", tags=["消息"])


@router.get("/{user_id}", response_model=list[MessageResponse])
async def get_messages(
    user_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """获取与指定用户的聊天历史"""
    messages = await get_conversation(db, current_user.id, user_id, limit, offset)
    # 标记消息为已读
    await mark_as_read(db, sender_id=user_id, receiver_id=current_user.id)
    return [
        MessageResponse(
            id=m.id,
            sender_id=m.sender_id,
            receiver_id=m.receiver_id,
            content=m.content,
            is_read=m.is_read,
            created_at=str(m.created_at),
        )
        for m in messages
    ]
