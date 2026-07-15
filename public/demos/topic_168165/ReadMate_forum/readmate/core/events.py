"""ReadMate 事件总线

用于模块间解耦通信。
- 提供 subscribe / publish / unsubscribe 接口
- 线程安全（使用 threading.Lock）
- 提供单例 get_event_bus()
"""
import threading
from typing import Any, Callable, Dict, List

# 预定义事件名常量
SELECTION_DETECTED = "selection_detected"
AI_RESPONSE_STARTED = "ai_response_started"
AI_RESPONSE_CHUNK = "ai_response_chunk"
AI_RESPONSE_DONE = "ai_response_done"
PANEL_CLOSED = "panel_closed"
TOOL_CALLED = "tool_called"


class EventBus:
    """事件总线：发布-订阅模式，线程安全。"""

    def __init__(self) -> None:
        # 事件名 -> 回调列表
        self._subscribers: Dict[str, List[Callable[[Any], None]]] = {}
        self._lock = threading.Lock()

    def subscribe(self, event_name: str, callback: Callable[[Any], None]) -> None:
        """订阅指定事件。

        Args:
            event_name: 事件名称
            callback: 事件回调函数，接收一个 data 参数
        """
        with self._lock:
            self._subscribers.setdefault(event_name, []).append(callback)

    def unsubscribe(self, event_name: str, callback: Callable[[Any], None]) -> None:
        """取消订阅指定事件的某个回调。"""
        with self._lock:
            callbacks = self._subscribers.get(event_name)
            if not callbacks:
                return
            try:
                callbacks.remove(callback)
            except ValueError:
                # 回调不存在，忽略
                pass
            if not callbacks:
                self._subscribers.pop(event_name, None)

    def publish(self, event_name: str, data: Any = None) -> None:
        """发布事件，依次通知所有订阅者。

        某个回调抛出异常不会影响后续回调的执行。

        Args:
            event_name: 事件名称
            data: 事件数据
        """
        # 在锁内拷贝订阅者列表，避免回调中增删订阅者导致死锁/异常
        with self._lock:
            callbacks = list(self._subscribers.get(event_name, []))
        for cb in callbacks:
            try:
                cb(data)
            except Exception:
                # 回调异常不应阻断事件总线；吞掉异常即可
                pass

    def clear(self) -> None:
        """清空所有订阅。"""
        with self._lock:
            self._subscribers.clear()


# 单例
_event_bus: EventBus = EventBus()


def get_event_bus() -> EventBus:
    """获取全局事件总线单例。"""
    return _event_bus
