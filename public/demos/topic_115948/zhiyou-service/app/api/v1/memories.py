"""记忆路由"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import MemoryService
from app.schemas import BaseResponse, MemoryResponse, MemoryItem
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/friends/{friend_id}/memories", tags=["记忆"])


@router.get("", response_model=BaseResponse[MemoryResponse])
async def get_memories(
    friend_id: str,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取智友记忆列表"""
    memory_service = MemoryService(db)
    result = await memory_service.get_memories(
        user_id=user_id,
        friend_id=friend_id,
        page=page,
        page_size=page_size,
    )
    return BaseResponse(data=result)


@router.post("", response_model=BaseResponse[MemoryItem])
async def add_memory(
    friend_id: str,
    content: str = Query(..., description="记忆内容"),
    source: str = Query("manual", description="来源"),
    importance: int = Query(3, ge=1, le=5, description="重要程度"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """添加记忆"""
    memory_service = MemoryService(db)
    result = await memory_service.add_memory(
        user_id=user_id,
        friend_id=friend_id,
        content=content,
        source=source,
        importance=importance,
    )
    return BaseResponse(data=result)


@router.delete("/{memory_id}", response_model=BaseResponse[None])
async def delete_memory(
    friend_id: str,
    memory_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """删除记忆"""
    memory_service = MemoryService(db)
    await memory_service.delete_memory(user_id, memory_id)
    return BaseResponse(data=None)
