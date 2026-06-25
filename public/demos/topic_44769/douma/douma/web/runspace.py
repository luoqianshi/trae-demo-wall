"""评测运行会话：后台线程跑 run_tournament，事件经队列对外推送。

设计：
- RunSession 封装单次评测：后台线程 + queue.Queue 事件队列 + 状态机。
- on_progress 回调把每题结果转 progress 事件投入队列；线程结束投 done/error。
- RunManager 维护全局单例会话，强制"同一时刻仅一个评测"。
"""
from __future__ import annotations

import queue
import threading
import uuid
from typing import Iterator, Optional

from ..config import AppConfig
from ..calibration import calibrate
from ..models import EvalMode, EvalResult, Task
from ..runner import run_tournament
from . import serializers

# 哨兵：标记事件流结束
_SENTINEL = object()


class RunBusyError(Exception):
    """已有评测在运行中。"""


class RunSession:
    """单次评测会话。线程安全：事件经 queue 单向流出。"""

    def __init__(
        self,
        tasks: list[Task],
        config: AppConfig,
        mode: EvalMode,
        calibrate_after: bool = False,
    ):
        self.run_id = uuid.uuid4().hex
        self._tasks = tasks
        self._config = config
        self._mode = mode
        self._calibrate = calibrate_after
        self._queue: "queue.Queue" = queue.Queue()
        self._thread: Optional[threading.Thread] = None
        self.status = "pending"  # pending / running / done / failed
        self.error: Optional[str] = None
        self.snapshot_start: Optional[dict] = None
        self.snapshot_done: Optional[dict] = None  # 完成后缓存，支持 SSE 重连补发
        self._cards: list = []  # 完成后缓存各模型战力卡，供 Console 明细查询

    def start(self) -> None:
        """启动后台评测线程。"""
        self.status = "running"
        start_event = {
            "type": "start",
            "total_tasks": len(self._tasks),
            "total_models": len(self._config.models),
            "total_jobs": len(self._tasks) * len(self._config.models),
        }
        self.snapshot_start = start_event
        self._queue.put(start_event)
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def _on_progress(self, model_name: str, result: EvalResult) -> None:
        payload = serializers.serialize_result(model_name, result)
        payload["type"] = "progress"
        self._queue.put(payload)

    def _on_token(self, model_name: str, task_id: str, round_no: int, delta: str) -> None:
        """把做题过程的增量文本包成 token 事件投入队列，供前端实时观赛。"""
        self._queue.put({
            "type": "token",
            "model_name": model_name,
            "task_id": task_id,
            "round": round_no,
            "delta": delta,
        })

    def _run(self) -> None:
        try:
            cards = run_tournament(
                self._tasks, self._config, self._mode,
                on_progress=self._on_progress, on_token=self._on_token,
            )
            if self._calibrate:
                dir_by_id = {t.id: t.directory for t in self._tasks}
                calibrate(dir_by_id, cards)
            self._cards = cards  # 缓存战力卡供做题明细查询
            summary = serializers.build_summary(cards)
            summary["type"] = "done"
            self.snapshot_done = summary
            self.status = "done"
            self._queue.put(summary)
        except Exception as exc:  # 整轮级异常
            self.error = str(exc)
            self.status = "failed"
            self._queue.put({"type": "error", "message": str(exc)})
        finally:
            self._queue.put(_SENTINEL)

    def iter_events(self, timeout: float = 120.0) -> Iterator[dict]:
        """阻塞迭代事件，直到 done/error（遇哨兵停止）。"""
        while True:
            item = self._queue.get(timeout=timeout)
            if item is _SENTINEL:
                break
            yield item

    def get_detail(self, model_name: str, task_id: str) -> Optional[dict]:
        """返回某 (模型×题) 的做题明细；未找到返回 None。"""
        for card in self._cards:
            if card.model_name != model_name:
                continue
            for r in card.results:
                if r.task_id == task_id:
                    return serializers.serialize_detail(model_name, r)
        return None


class RunManager:
    """全局会话管理：强制同一时刻仅一个运行中的会话。"""

    def __init__(self):
        self._current: Optional[RunSession] = None
        self._lock = threading.Lock()

    def create(
        self,
        tasks: list[Task],
        config: AppConfig,
        mode: EvalMode,
        calibrate_after: bool = False,
    ) -> RunSession:
        with self._lock:
            if self._current is not None and self._current.status == "running":
                raise RunBusyError("上一场比试尚未结束")
            self._current = RunSession(tasks, config, mode, calibrate_after)
            return self._current

    def get(self, run_id: str) -> Optional[RunSession]:
        cur = self._current
        if cur is not None and cur.run_id == run_id:
            return cur
        return None


# 进程内全局单例
manager = RunManager()
