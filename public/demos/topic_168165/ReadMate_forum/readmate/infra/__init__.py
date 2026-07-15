"""ReadMate 基础设施层 - 选区监听、屏幕记忆、历史记录"""
from .selection import SelectionMonitor
from .memory import ScreenMemory
from .history import HistoryStore

__all__ = ["SelectionMonitor", "ScreenMemory", "HistoryStore"]
