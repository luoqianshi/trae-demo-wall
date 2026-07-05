"""任务管理器 — JSON 文件持久化存储 + SSE 事件发布。"""

import asyncio
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from loguru import logger

from app.core.config import get_settings
from app.models.video import VideoTask, VideoTaskStatus


class TaskEvent:
    """任务事件类型。"""
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    STATUS_CHANGED = "status_changed"


class TaskManager:
    """任务管理器（JSON 文件持久化 + SSE 事件发布）。"""

    def __init__(self):
        self._tasks: dict[str, VideoTask] = {}
        self._data_file = get_settings().storage_dir / "tasks.json"
        self._subscribers: list[asyncio.Queue] = []
        self._load()

    # ---- 事件发布/订阅 ----

    def subscribe(self) -> asyncio.Queue:
        """注册一个新订阅者，返回一个 asyncio.Queue 用于接收事件。"""
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        """取消订阅。"""
        if q in self._subscribers:
            self._subscribers.remove(q)

    def _publish(self, event_type: str, task_id: str, data: dict[str, Any] | None = None):
        """向所有订阅者推送事件。"""
        payload = {"type": event_type, "task_id": task_id, "data": data or {}}
        # 清理已关闭的订阅者
        dead = []
        for q in self._subscribers:
            if q.full():
                dead.append(q)
                continue
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            self._subscribers.remove(q)

    def _tasks_to_serializable(self) -> list[dict]:
        """获取可序列化的任务列表。"""
        return [t.model_dump(mode="json") for t in self._tasks.values()]

    # ---- 持久化 ----

    def _load(self):
        """从文件加载任务。"""
        if self._data_file.exists():
            try:
                data = json.loads(self._data_file.read_text(encoding="utf-8"))
                for item in data:
                    task = VideoTask(**item)
                    self._tasks[task.id] = task
                logger.info("加载 {} 个历史任务", len(self._tasks))
            except Exception as e:
                logger.warning("加载任务文件失败: {}", e)

    def _save(self):
        """保存任务到文件。"""
        try:
            self._data_file.parent.mkdir(parents=True, exist_ok=True)
            data = self._tasks_to_serializable()
            self._data_file.write_text(
                json.dumps(data, ensure_ascii=False, indent=2, default=str),
                encoding="utf-8",
            )
        except Exception as e:
            logger.error("保存任务文件失败: {}", e)

    # ---- 任务 CRUD ----

    def create_task(self, url: str) -> VideoTask:
        """创建新的视频处理任务。"""
        from app.services.downloader import detect_platform

        task_id = uuid.uuid4().hex[:12]
        from app.models.video import VideoSource
        source = VideoSource(url=url, platform=detect_platform(url))
        task = VideoTask(id=task_id, source=source)
        self._tasks[task_id] = task
        self._save()
        self._publish(TaskEvent.CREATED, task_id,
                      {"model_dump": task.model_dump(mode="json")})
        logger.info("创建任务: id={} url={}", task_id, url)
        return task

    def get_task(self, task_id: str) -> VideoTask | None:
        return self._tasks.get(task_id)

    def list_tasks(self, status: VideoTaskStatus | None = None) -> list[VideoTask]:
        tasks = list(self._tasks.values())
        if status:
            tasks = [t for t in tasks if t.status == status]
        return sorted(tasks, key=lambda t: t.created_at, reverse=True)

    def update_status(self, task_id: str, status: VideoTaskStatus, error: str = "") -> None:
        task = self._tasks.get(task_id)
        if task:
            task.update_status(status, error)
            self._save()
            self._publish(TaskEvent.STATUS_CHANGED, task_id,
                          {"model_dump": task.model_dump(mode="json")})

    def update_task(self, task_id: str, **kwargs) -> None:
        """更新任务属性并保存。"""
        task = self._tasks.get(task_id)
        if task:
            for k, v in kwargs.items():
                if hasattr(task, k):
                    setattr(task, k, v)
            task.updated_at = datetime.now()
            self._save()
            self._publish(TaskEvent.UPDATED, task_id,
                          {"model_dump": task.model_dump(mode="json")})

    def delete_task(self, task_id: str) -> bool:
        result = self._tasks.pop(task_id, None) is not None
        if result:
            self._save()
            self._publish(TaskEvent.DELETED, task_id)
        return result

    def get_subscriber_count(self) -> int:
        """当前活跃订阅者数。"""
        return len(self._subscribers)


# 全局单例
task_manager = TaskManager()
