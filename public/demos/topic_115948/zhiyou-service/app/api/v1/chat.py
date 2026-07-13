"""聊天路由"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import ChatService, FriendService
from app.schemas import (
    BaseResponse,
    ChatHistoryResponse,
    SendMessageRequest,
    SendMessageResponse,
    SendMessageResponse,
)
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/chat", tags=["聊天"])


@router.get("/{friend_id}/messages", response_model=BaseResponse[ChatHistoryResponse])
async def get_chat_history(
    friend_id: str,
    before_time: Optional[datetime] = Query(None, description="获取此时间之前的消息"),
    page_size: int = Query(50, ge=1, le=100, description="每页数量"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取聊天历史"""
    chat_service = ChatService(db)
    result = await chat_service.get_chat_history(
        user_id=user_id,
        friend_id=friend_id,
        before_time=before_time,
        page_size=page_size,
    )
    return BaseResponse(data=result)


@router.post("/{friend_id}/send", response_model=BaseResponse[SendMessageResponse])
async def send_message(
    friend_id: str,
    request: SendMessageRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """发送消息（基础聊天，非流式）"""
    chat_service = ChatService(db)
    result = await chat_service.send_message(
        user_id=user_id,
        friend_id=friend_id,
        request=request,
    )
    return BaseResponse(data=result)


@router.post("/{friend_id}/read", response_model=BaseResponse[None])
async def mark_as_read(
    friend_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """标记消息已读"""
    chat_service = ChatService(db)
    await chat_service.mark_as_read(user_id, friend_id)
    return BaseResponse(data=None)
