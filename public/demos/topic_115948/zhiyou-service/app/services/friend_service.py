"""智友服务"""
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models import Friend, ChatSession, ChatMessage, IDENTITY_MAP, SPEAKING_STYLE_MAP
from app.core.exceptions import NotFoundError, ParameterError
from app.schemas.friend import (
    AvatarConfig,
    CreateFriendRequest,
    UpdateFriendRequest,
    FriendListItem,
    FriendDetail,
    FriendResponse,
)


class FriendService:
    """智友服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_friend(self, user_id: str, request: CreateFriendRequest) -> FriendResponse:
        """创建智友"""
        # 检查名称是否重复
        stmt = select(Friend).where(
            Friend.user_id == user_id,
            Friend.name == request.name
        )
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise ParameterError(f"智友名称「{request.name}」已存在")

        # 如果设置为默认，先取消其他默认
        if request.identity == "friend" or (hasattr(request, 'is_default') and request.is_default):
            await self._clear_default_friend(user_id)

        friend = Friend(
            user_id=user_id,
            name=request.name,
            description=request.description,
            identity=request.identity,
            avatar_config=request.avatar_config.model_dump(),
            personality_traits=request.personality_traits,
            speaking_style=request.speaking_style,
            is_default=True,
        )
        self.db.add(friend)
        await self.db.commit()
        await self.db.refresh(friend)

        return self._to_friend_response(friend)

    async def update_friend(
        self, user_id: str, friend_id: str, request: UpdateFriendRequest
    ) -> FriendResponse:
        """更新智友"""
        friend = await self._get_user_friend(user_id, friend_id)

        # 检查名称是否重复（排除自己）
        if request.name and request.name != friend.name:
            stmt = select(Friend).where(
                Friend.user_id == user_id,
                Friend.name == request.name,
                Friend.id != friend_id,
            )
            result = await self.db.execute(stmt)
            if result.scalar_one_or_none():
                raise ParameterError(f"智友名称「{request.name}」已存在")

        # 如果设置为默认，先取消其他默认
        if request.is_default and not friend.is_default:
            await self._clear_default_friend(user_id)

        # 更新字段
        update_data = request.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "avatar_config" and value:
                value = value.model_dump() if hasattr(value, "model_dump") else value
            setattr(friend, field, value)

        await self.db.commit()
        await self.db.refresh(friend)

        return self._to_friend_response(friend)

    async def delete_friend(self, user_id: str, friend_id: str) -> None:
        """删除智友"""
        friend = await self._get_user_friend(user_id, friend_id)
        await self.db.delete(friend)
        await self.db.commit()

    async def get_friend_list(
        self, user_id: str, keyword: Optional[str] = None, page: int = 1, page_size: int = 20
    ) -> tuple[List[FriendListItem], int]:
        """获取智友列表"""
        # 构建查询
        stmt = select(Friend).where(Friend.user_id == user_id)

        if keyword:
            stmt = stmt.where(
                or_(
                    Friend.name.ilike(f"%{keyword}%"),
                    Friend.description.ilike(f"%{keyword}%"),
                )
            )

        # 统计总数
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar()

        # 分页
        stmt = stmt.order_by(Friend.is_default.desc(), Friend.updated_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(stmt)
        friends = result.scalars().all()

        # 获取每个智友的最新消息
        items = []
        for friend in friends:
            session = await self._get_latest_session(user_id, friend.id)
            items.append(
                FriendListItem(
                    id=str(friend.id),
                    name=friend.name,
                    identity=friend.identity,
                    identity_label=IDENTITY_MAP.get(friend.identity, friend.identity),
                    avatar_config=AvatarConfig(**friend.avatar_config),
                    last_message=session.last_message if session else None,
                    last_message_at=session.last_message_at if session else None,
                    unread_count=session.unread_count if session else 0,
                )
            )

        return items, total

    async def get_friend_detail(self, user_id: str, friend_id: str) -> FriendDetail:
        """获取智友详情"""
        friend = await self._get_user_friend(user_id, friend_id)
        return self._to_friend_detail(friend)

    async def get_friend_by_id(self, friend_id: str) -> Friend:
        """根据ID获取智友"""
        stmt = select(Friend).where(Friend.id == friend_id)
        result = await self.db.execute(stmt)
        friend = result.scalar_one_or_none()
        if not friend:
            raise NotFoundError("智友不存在")
        return friend

    async def _get_user_friend(self, user_id: str, friend_id: str) -> Friend:
        """获取用户所属的智友"""
        stmt = select(Friend).where(Friend.id == friend_id, Friend.user_id == user_id)
        result = await self.db.execute(stmt)
        friend = result.scalar_one_or_none()
        if not friend:
            raise NotFoundError("智友不存在")
        return friend

    async def _get_latest_session(self, user_id: str, friend_id: str) -> Optional[ChatSession]:
        """获取最新会话"""
        stmt = (
            select(ChatSession)
            .where(ChatSession.user_id == user_id, ChatSession.friend_id == friend_id)
            .order_by(ChatSession.last_message_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def _clear_default_friend(self, user_id: str) -> None:
        """清除用户的默认智友"""
        stmt = select(Friend).where(Friend.user_id == user_id, Friend.is_default == True)
        result = await self.db.execute(stmt)
        for friend in result.scalars():
            friend.is_default = False
        await self.db.commit()

    def _to_friend_response(self, friend: Friend) -> FriendResponse:
        """转换为智友响应"""
        return FriendResponse(
            id=str(friend.id),
            name=friend.name,
            identity=friend.identity,
            identity_label=IDENTITY_MAP.get(friend.identity, friend.identity),
            avatar_config=AvatarConfig(**friend.avatar_config),
            companion_days=friend.companion_days,
            chat_count=friend.chat_count,
            memory_count=friend.memory_count,
        )

    def _to_friend_detail(self, friend: Friend) -> FriendDetail:
        """转换为智友详情"""
        # 计算陪伴天数
        if friend.created_at:
            companion_days = (datetime.utcnow().date() - friend.created_at.date()).days
        else:
            companion_days = 0

        return FriendDetail(
            id=str(friend.id),
            name=friend.name,
            description=friend.description,
            identity=friend.identity,
            identity_label=IDENTITY_MAP.get(friend.identity, friend.identity),
            avatar_config=AvatarConfig(**friend.avatar_config),
            personality_traits=friend.personality_traits or [],
            speaking_style=friend.speaking_style,
            speaking_style_label=SPEAKING_STYLE_MAP.get(friend.speaking_style, friend.speaking_style),
            companion_days=companion_days,
            chat_count=friend.chat_count,
            memory_count=friend.memory_count,
            created_at=friend.created_at,
        )
