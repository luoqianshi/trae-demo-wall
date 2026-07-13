"""智友路由"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import FriendService
from app.schemas import (
    BaseResponse,
    PageResponse,
    PageData,
    FriendListItem,
    FriendDetail,
    FriendResponse,
    CreateFriendRequest,
    UpdateFriendRequest,
)
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/friends", tags=["智友"])


@router.get("", response_model=PageResponse[FriendListItem])
async def get_friends(
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取智友列表"""
    friend_service = FriendService(db)
    items, total = await friend_service.get_friend_list(
        user_id=user_id,
        keyword=keyword,
        page=page,
        page_size=page_size,
    )

    return PageResponse(
        data=PageData(
            list=items,
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{friend_id}", response_model=BaseResponse[FriendDetail])
async def get_friend(
    friend_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """获取智友详情"""
    friend_service = FriendService(db)
    result = await friend_service.get_friend_detail(user_id, friend_id)
    return BaseResponse(data=result)


@router.post("", response_model=BaseResponse[FriendResponse])
async def create_friend(
    request: CreateFriendRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """创建智友"""
    friend_service = FriendService(db)
    result = await friend_service.create_friend(user_id, request)
    return BaseResponse(data=result)


@router.put("/{friend_id}", response_model=BaseResponse[FriendResponse])
async def update_friend(
    friend_id: str,
    request: UpdateFriendRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """更新智友"""
    friend_service = FriendService(db)
    result = await friend_service.update_friend(user_id, friend_id, request)
    return BaseResponse(data=result)


@router.delete("/{friend_id}", response_model=BaseResponse[None])
async def delete_friend(
    friend_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """删除智友"""
    friend_service = FriendService(db)
    await friend_service.delete_friend(user_id, friend_id)
    return BaseResponse(data=None)
