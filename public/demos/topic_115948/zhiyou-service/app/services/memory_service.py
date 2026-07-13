"""记忆服务"""
from typing import List
from sqlalchemy import select, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Memory, Friend
from app.core.exceptions import NotFoundError
from app.schemas.memory import MemoryItem, MemoryResponse


class MemoryService:
    """记忆服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_memories(
        self, user_id: str, friend_id: str, page: int = 1, page_size: int = 20
    ) -> MemoryResponse:
        """获取智友记忆列表"""
        # 验证智友归属
        await self._verify_friend_ownership(user_id, friend_id)

        # 构建查询
        stmt = (
            select(Memory)
            .where(
                Memory.user_id == user_id,
                Memory.friend_id == friend_id,
            )
            .order_by(desc(Memory.recorded_at))
        )

        # 统计总数
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar()

        # 分页
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(stmt)
        memories = result.scalars().all()

        return MemoryResponse(
            list=[
                MemoryItem(
                    id=str(m.id),
                    content=m.content,
                    recorded_at=m.recorded_at,
                    source=m.source,
                    importance=m.importance,
                )
                for m in memories
            ],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def add_memory(
        self,
        user_id: str,
        friend_id: str,
        content: str,
        source: str = "manual",
        importance: int = 3,
    ) -> MemoryItem:
        """添加记忆"""
        # 验证智友归属
        await self._verify_friend_ownership(user_id, friend_id)

        memory = Memory(
            user_id=user_id,
            friend_id=friend_id,
            content=content,
            source=source,
            importance=importance,
        )
        self.db.add(memory)

        # 更新智友记忆数量
        stmt = select(Friend).where(Friend.id == friend_id)
        result = await self.db.execute(stmt)
        friend = result.scalar_one_or_none()
        if friend:
            friend.memory_count += 1

        await self.db.commit()
        await self.db.refresh(memory)

        return MemoryItem(
            id=str(memory.id),
            content=memory.content,
            recorded_at=memory.recorded_at,
            source=memory.source,
            importance=memory.importance,
        )

    async def delete_memory(self, user_id: str, memory_id: str) -> None:
        """删除记忆"""
        stmt = select(Memory).where(
            Memory.id == memory_id,
            Memory.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        memory = result.scalar_one_or_none()

        if not memory:
            raise NotFoundError("记忆不存在")

        friend_id = memory.friend_id
        await self.db.delete(memory)

        # 更新智友记忆数量
        stmt = select(Friend).where(Friend.id == friend_id)
        result = await self.db.execute(stmt)
        friend = result.scalar_one_or_none()
        if friend and friend.memory_count > 0:
            friend.memory_count -= 1

        await self.db.commit()

    async def _verify_friend_ownership(self, user_id: str, friend_id: str) -> None:
        """验证智友归属"""
        stmt = select(Friend).where(
            Friend.id == friend_id,
            Friend.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        friend = result.scalar_one_or_none()

        if not friend:
            raise NotFoundError("智友不存在")
