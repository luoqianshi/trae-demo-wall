"""好友 API 路由"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..utils.dependencies import get_current_user
from ..models.user import User
from ..schemas.friend import FriendRequestCreate, FriendRequestResponse, FriendResponse
from ..services.friend_service import (
    send_friend_request, accept_friend_request, reject_friend_request,
    get_pending_requests, get_friends,
)
from ..websocket.notifier import notify_friend_request, notify_friend_accepted

router = APIRouter(prefix="/api/friends", tags=["好友"])


@router.post("/requests", response_model=FriendRequestResponse)
async def send_request(
    req: FriendRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fr = await send_friend_request(db, current_user.id, req.to_user_id)
    await notify_friend_request(req.to_user_id, current_user.id, current_user.username, fr.id)
    return FriendRequestResponse(
        id=fr.id, from_user_id=fr.from_user_id, from_username=current_user.username,
        to_user_id=fr.to_user_id, status=fr.status, created_at=str(fr.created_at),
    )


@router.get("/requests", response_model=list[FriendRequestResponse])
async def list_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reqs = await get_pending_requests(db, current_user.id)
    return [FriendRequestResponse(**r) for r in reqs]


@router.post("/requests/{request_id}/accept", response_model=FriendRequestResponse)
async def accept_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fr = await accept_friend_request(db, request_id, current_user.id)
    await notify_friend_accepted(fr.from_user_id, current_user.id, current_user.username)
    return FriendRequestResponse(
        id=fr.id, from_user_id=fr.from_user_id, to_user_id=fr.to_user_id,
        status=fr.status, created_at=str(fr.created_at),
    )


@router.post("/requests/{request_id}/reject", response_model=FriendRequestResponse)
async def reject_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fr = await reject_friend_request(db, request_id, current_user.id)
    return FriendRequestResponse(
        id=fr.id, from_user_id=fr.from_user_id, to_user_id=fr.to_user_id,
        status=fr.status, created_at=str(fr.created_at),
    )


@router.get("", response_model=list[FriendResponse])
async def list_friends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    friends = await get_friends(db, current_user.id)
    return [FriendResponse(**f) for f in friends]
