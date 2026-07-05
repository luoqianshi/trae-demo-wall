"""任务队列 — 基于 asyncio 的轻量级并发控制。

特性：
- Semaphore 限制最大并发数
- 排队状态追踪（队列位置、等待数）
- 任务取消支持
- 全局队列状态查询
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Callable, Any

from loguru import logger

from app.core.config import get_settings


class QueueTaskStatus(str, Enum):
    PENDING = "pending"       # 排队中
    RUNNING = "running"       # 执行中
    COMPLETED = "completed"   # 已完成
    FAILED = "failed"         # 失败
    CANCELLED = "cancelled"   # 已取消


@dataclass
class QueueTask:
    task_id: str
    status: QueueTaskStatus = QueueTaskStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)
    started_at: datetime | None = None
    finished_at: datetime | None = None
    error: str = ""
    future: asyncio.Task | None = None


class TaskQueue:
    """异步任务队列，限制并发执行数量。"""

    def __init__(self, max_concurrent: int = 2):
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._max_concurrent = max_concurrent
        self._queue: dict[str, QueueTask] = {}
        self._pending_order: list[str] = []  # 排队顺序
        self._lock = asyncio.Lock()

    @property
    def max_concurrent(self) -> int:
        return self._max_concurrent

    def get_queue_status(self) -> dict:
        """获取全局队列状态。"""
        pending = [t for t in self._queue.values() if t.status == QueueTaskStatus.PENDING]
        running = [t for t in self._queue.values() if t.status == QueueTaskStatus.RUNNING]
        return {
            "max_concurrent": self._max_concurrent,
            "running_count": len(running),
            "pending_count": len(pending),
            "running_tasks": [t.task_id for t in running],
            "pending_tasks": [t.task_id for t in pending],
        }

    def get_task_position(self, task_id: str) -> dict:
        """获取指定任务在队列中的位置。"""
        qt = self._queue.get(task_id)
        if not qt:
            return {"in_queue": False}

        if qt.status == QueueTaskStatus.RUNNING:
            return {"in_queue": True, "status": "running", "position": 0}
        elif qt.status == QueueTaskStatus.PENDING:
            # 计算排队位置
            pending = [t for t in self._queue.values() if t.status == QueueTaskStatus.PENDING]
            pending.sort(key=lambda t: t.created_at)
            pos = next((i for i, t in enumerate(pending) if t.task_id == task_id), -1)
            return {"in_queue": True, "status": "pending", "position": pos + 1, "total_pending": len(pending)}
        elif qt.status == QueueTaskStatus.COMPLETED:
            return {"in_queue": False, "status": "completed"}
        elif qt.status == QueueTaskStatus.FAILED:
            return {"in_queue": False, "status": "failed", "error": qt.error}
        elif qt.status == QueueTaskStatus.CANCELLED:
            return {"in_queue": False, "status": "cancelled"}
        return {"in_queue": False}

    async def submit(self, task_id: str, coro_func: Callable) -> None:
        """提交任务到队列。

        Args:
            task_id: 任务 ID
            coro_func: 异步函数（无参数），返回协程
        """
        async with self._lock:
            qt = QueueTask(task_id=task_id)
            self._queue[task_id] = qt
            self._pending_order.append(task_id)

        logger.info("📋 任务入队: {} (队列中 {} 个)", task_id, len(self._pending_order))

        # 创建包装协程
        async def _wrapper():
            await self._semaphore.acquire()
            try:
                async with self._lock:
                    qt = self._queue.get(task_id)
                    if not qt or qt.status == QueueTaskStatus.CANCELLED:
                        return
                    qt.status = QueueTaskStatus.RUNNING
                    qt.started_at = datetime.now()
                    if task_id in self._pending_order:
                        self._pending_order.remove(task_id)

                logger.info("▶️ 任务开始执行: {}", task_id)
                await coro_func()

                async with self._lock:
                    qt = self._queue.get(task_id)
                    if qt:
                        qt.status = QueueTaskStatus.COMPLETED
                        qt.finished_at = datetime.now()
                logger.info("✅ 任务队列完成: {}", task_id)

            except Exception as e:
                async with self._lock:
                    qt = self._queue.get(task_id)
                    if qt:
                        qt.status = QueueTaskStatus.FAILED
                        qt.error = str(e)
                        qt.finished_at = datetime.now()
                logger.error("❌ 任务队列失败: {} - {}", task_id, e)
            finally:
                self._semaphore.release()
                # 清理已完成的任务（保留最近 50 个）
                await self._cleanup()

        future = asyncio.create_task(_wrapper())
        async with self._lock:
            qt = self._queue.get(task_id)
            if qt:
                qt.future = future

    async def cancel(self, task_id: str) -> bool:
        """取消排队中的任务。"""
        async with self._lock:
            qt = self._queue.get(task_id)
            if not qt:
                return False
            if qt.status == QueueTaskStatus.PENDING:
                qt.status = QueueTaskStatus.CANCELLED
                if task_id in self._pending_order:
                    self._pending_order.remove(task_id)
                if qt.future:
                    qt.future.cancel()
                logger.info("🚫 任务已取消: {}", task_id)
                return True
            elif qt.status == QueueTaskStatus.RUNNING:
                if qt.future:
                    qt.future.cancel()
                qt.status = QueueTaskStatus.CANCELLED
                logger.info("🚫 运行中任务已取消: {}", task_id)
                return True
        return False

    async def _cleanup(self):
        """清理旧的已完成任务，保留最近 50 个。"""
        async with self._lock:
            done = [
                (tid, qt) for tid, qt in self._queue.items()
                if qt.status in (QueueTaskStatus.COMPLETED, QueueTaskStatus.FAILED, QueueTaskStatus.CANCELLED)
            ]
            if len(done) > 50:
                done.sort(key=lambda x: x[1].finished_at or datetime.min)
                for tid, _ in done[:len(done) - 50]:
                    self._queue.pop(tid, None)


# 全局单例（从配置读取并发数）
task_queue = TaskQueue(max_concurrent=get_settings().download_concurrency)
