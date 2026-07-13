"""聊天服务"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models import Friend, ChatSession, ChatMessage, Memory
from app.core.exceptions import NotFoundError
from app.schemas.chat import SendMessageRequest, MessageItem, ChatHistoryResponse, SendMessageResponse
from app.services.ai_service import AIService


class ChatService:
    """聊天服务"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_service = AIService()

    async def get_chat_history(
        self, user_id: str, friend_id: str, before_time: Optional[datetime] = None, page_size: int = 50
    ) -> ChatHistoryResponse:
        """获取聊天历史"""
        # 验证智友归属
        await self._verify_friend_ownership(user_id, friend_id)

        # 构建查询
        stmt = (
            select(ChatMessage)
            .where(
                ChatMessage.friend_id == friend_id,
                ChatMessage.is_deleted == False,
            )
            .order_by(desc(ChatMessage.created_at))
        )

        if before_time:
            stmt = stmt.where(ChatMessage.created_at < before_time)

        stmt = stmt.limit(page_size + 1)
        result = await self.db.execute(stmt)
        messages = result.scalars().all()

        has_more = len(messages) > page_size
        messages = messages[:page_size]

        # 反转顺序为正序
        messages = list(reversed(messages))

        return ChatHistoryResponse(
            list=[
                MessageItem(
                    id=str(msg.id),
                    role=msg.role,
                    content=msg.content,
                    message_type=msg.message_type,
                    created_at=msg.created_at,
                )
                for msg in messages
            ],
            has_more=has_more,
        )

    async def send_message(
        self, user_id: str, friend_id: str, request: SendMessageRequest
    ) -> SendMessageResponse:
        """发送消息并获取 AI 回复（基础聊天）"""
        # 验证智友归属
        friend = await self._verify_friend_ownership(user_id, friend_id)

        # 获取或创建会话
        session = await self._get_or_create_session(user_id, friend_id)

        # 保存用户消息
        user_message = ChatMessage(
            session_id=session.id,
            friend_id=friend_id,
            role="user",
            content=request.content,
            message_type=request.message_type,
        )
        self.db.add(user_message)

        # 更新会话
        session.last_message = request.content[:50]
        session.last_message_at = datetime.utcnow()

        # 更新智友聊天次数
        friend.chat_count += 1

        await self.db.commit()
        await self.db.refresh(user_message)

        # 获取对话历史用于构建上下文
        conversation_history = await self._get_conversation_history(friend_id, limit=10)

        # 获取相关记忆
        recent_memories = await self._get_recent_memories(user_id, friend_id, limit=5)

        # 调用 AI 生成回复
        ai_content = await self.ai_service.chat(
            friend=friend,
            conversation_history=conversation_history,
            user_message=request.content,
            recent_memories=recent_memories,
        )

        # 保存 AI 消息
        ai_message = ChatMessage(
            session_id=session.id,
            friend_id=friend_id,
            role="assistant",
            content=ai_content,
            message_type="text",
        )
        self.db.add(ai_message)

        # 更新会话
        session.last_message = ai_content[:50]
        session.last_message_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(ai_message)

        # 异步提取记忆（不阻塞响应）
        # await self._extract_and_save_memories(user_id, friend_id, conversation_history + [user_message, ai_message])

        return SendMessageResponse(
            id=str(ai_message.id),
            role="assistant",
            content=ai_content,
            message_type="text",
            created_at=ai_message.created_at,
        )

    async def mark_as_read(self, user_id: str, friend_id: str) -> None:
        """标记消息已读"""
        # 验证智友归属
        await self._verify_friend_ownership(user_id, friend_id)

        # 获取会话
        stmt = select(ChatSession).where(
            ChatSession.user_id == user_id,
            ChatSession.friend_id == friend_id,
        )
        result = await self.db.execute(stmt)
        session = result.scalar_one_or_none()

        if session:
            session.unread_count = 0
            await self.db.commit()

    async def _verify_friend_ownership(self, user_id: str, friend_id: str) -> Friend:
        """验证智友归属"""
        stmt = select(Friend).where(
            Friend.id == friend_id,
            Friend.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        friend = result.scalar_one_or_none()

        if not friend:
            raise NotFoundError("智友不存在")

        return friend

    async def _get_or_create_session(self, user_id: str, friend_id: str) -> ChatSession:
        """获取或创建会话"""
        stmt = select(ChatSession).where(
            ChatSession.user_id == user_id,
            ChatSession.friend_id == friend_id,
        )
        result = await self.db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            session = ChatSession(
                user_id=user_id,
                friend_id=friend_id,
            )
            self.db.add(session)
            await self.db.commit()
            await self.db.refresh(session)

        return session

    async def _get_conversation_history(self, friend_id: str, limit: int = 10) -> List[ChatMessage]:
        """获取对话历史"""
        stmt = (
            select(ChatMessage)
            .where(
                ChatMessage.friend_id == friend_id,
                ChatMessage.is_deleted == False,
            )
            .order_by(desc(ChatMessage.created_at))
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        messages = result.scalars().all()

        return list(reversed(messages))

    async def _get_recent_memories(self, user_id: str, friend_id: str, limit: int = 5) -> List[str]:
        """获取最近的记忆"""
        stmt = (
            select(Memory)
            .where(
                Memory.user_id == user_id,
                Memory.friend_id == friend_id,
            )
            .order_by(desc(Memory.recorded_at))
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        memories = result.scalars().all()

        return [m.content for m in memories]

    async def _extract_and_save_memories(
        self, user_id: str, friend_id: str, conversation_turns: List[ChatMessage]
    ) -> None:
        """提取并保存记忆"""
        try:
            turns = [
                {"role": msg.role, "content": msg.content}
                for msg in conversation_turns
            ]

            extracted = await self.ai_service.extract_memories(friend_id, turns)

            for mem in extracted:
                memory = Memory(
                    user_id=user_id,
                    friend_id=friend_id,
                    content=mem["content"],
                    importance=mem.get("importance", 3),
                    source="auto_extract",
                )
                self.db.add(memory)

            if extracted:
                # 更新智友记忆数量
                stmt = select(Friend).where(Friend.id == friend_id)
                result = await self.db.execute(stmt)
                friend = result.scalar_one_or_none()
                if friend:
                    friend.memory_count = len(extracted)

                await self.db.commit()

        except Exception:
            # 记忆提取失败不影响主流程
            pass
