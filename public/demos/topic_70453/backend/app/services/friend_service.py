"""好友服务：发送/接受/拒绝好友请求，获取好友列表"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from ..models.user import User
from ..models.friend import FriendRequest, Friendship


async def send_friend_request(
    db: AsyncSession, from_user_id: int, to_user_id: int
) -> FriendRequest:
    """发送好友请求"""
    if from_user_id == to_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能添加自己为好友")

    # 检查目标用户是否存在
    result = await db.execute(select(User).where(User.id == to_user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    # 检查是否已经是好友
    existing = await db.execute(
        select(Friendship).where(
            Friendship.user_id == from_user_id, Friendship.friend_id == to_user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="已经是好友")

    # 检查是否已有 pending 请求
    existing_req = await db.execute(
        select(FriendRequest).where(
            FriendRequest.from_user_id == from_user_id,
            FriendRequest.to_user_id == to_user_id,
            FriendRequest.status == "pending",
        )
    )
    if existing_req.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="已发送过好友请求")

    # ★ 用 SELECT ... FOR UPDATE 加行锁，消除竞态条件
    reverse = await db.execute(
        select(FriendRequest).with_for_update().where(
            FriendRequest.from_user_id == to_user_id,
            FriendRequest.to_user_id == from_user_id,
            FriendRequest.status == "pending",
        )
    )
    reverse_req = reverse.scalar_one_or_none()
    if reverse_req:
        # 对方已发过请求，直接接受
        reverse_req.status = "accepted"
        friendship1 = Friendship(user_id=from_user_id, friend_id=to_user_id)
        friendship2 = Friendship(user_id=to_user_id, friend_id=from_user_id)
        db.add_all([friendship1, friendship2])
        await db.commit()
        await db.refresh(reverse_req)
        return reverse_req

    # 创建新请求
    request = FriendRequest(from_user_id=from_user_id, to_user_id=to_user_id)
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return request


async def accept_friend_request(
    db: AsyncSession, request_id: int, user_id: int
) -> FriendRequest:
    """接受好友请求"""
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.id == request_id,
            FriendRequest.to_user_id == user_id,
            FriendRequest.status == "pending",
        )
    )
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="好友请求不存在或已处理")

    request.status = "accepted"
    friendship1 = Friendship(user_id=request.from_user_id, friend_id=request.to_user_id)
    friendship2 = Friendship(user_id=request.to_user_id, friend_id=request.from_user_id)
    db.add_all([friendship1, friendship2])
    await db.commit()
    await db.refresh(request)
    return request


async def reject_friend_request(
    db: AsyncSession, request_id: int, user_id: int
) -> FriendRequest:
    """拒绝好友请求"""
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.id == request_id,
            FriendRequest.to_user_id == user_id,
            FriendRequest.status == "pending",
        )
    )
    request = result.scalar_one_or_none()
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="好友请求不存在或已处理")

    request.status = "rejected"
    await db.commit()
    await db.refresh(request)
    return request


async def get_pending_requests(db: AsyncSession, user_id: int) -> list[dict]:
    """获取向当前用户发送的待处理好友请求"""
    result = await db.execute(
        select(FriendRequest, User)
        .join(User, FriendRequest.from_user_id == User.id)
        .where(FriendRequest.to_user_id == user_id, FriendRequest.status == "pending")
        .order_by(FriendRequest.created_at.desc())
    )
    return [
        {
            "id": req.id, "from_user_id": req.from_user_id,
            "from_username": user.username, "from_avatar_url": user.avatar_url,
            "to_user_id": req.to_user_id, "status": req.status,
            "created_at": str(req.created_at),
        }
        for req, user in result.all()
    ]


async def get_friends(db: AsyncSession, user_id: int) -> list[dict]:
    """获取当前用户的好友列表"""
    result = await db.execute(
        select(User, Friendship)
        .join(Friendship, User.id == Friendship.friend_id)
        .where(Friendship.user_id == user_id)
        .order_by(User.username)
    )
    return [
        {"id": u.id, "username": u.username, "avatar_url": u.avatar_url, "status": u.status}
        for u, _ in result.all()
    ]


async def get_friend_ids(db: AsyncSession, user_id: int) -> set[int]:
    """仅获取好友 ID 集合（轻量查询，不 JOIN User 表）"""
    result = await db.execute(
        select(Friendship.friend_id).where(Friendship.user_id == user_id)
    )
    return {row[0] for row in result.all()}
