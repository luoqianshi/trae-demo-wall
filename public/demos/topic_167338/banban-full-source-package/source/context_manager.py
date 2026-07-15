"""
伴伴 - 上下文管理器（Context Manager）
全天活动记忆层，连接视觉模型和高级模型

视觉模型每 N 分钟产出一条描述 → 累积到 context_manager
主模型每隔一段时间读取全部上下文 → 决定是否主动弹窗

跨天时：将昨日活动总结持久化到文件，次日加载为"昨日摘要"供 AI 保持连续记忆。
"""
import json
import os
import threading
import time as _time
from datetime import datetime, date
from typing import Optional, Callable


# 昨日总结持久化路径
YESTERDAY_SUMMARY_PATH = os.path.join(
    os.path.expanduser("~"), ".banban", "yesterday_summary.json"
)


class ContextManager:
    """全天活动上下文管理器"""

    MAX_ENTRIES = 50  # 最多保留 50 条

    def __init__(self):
        self._entries: list[dict] = []  # [{time, type, description, app}]
        self._last_speak_time: Optional[float] = None  # 上次主动说话的时间戳
        self._speak_history: list[dict] = []  # 说话历史
        self._lock = threading.Lock()
        self._today = date.today().isoformat()
        self._yesterday_summary: str = ""  # 昨日活动摘要（跨天记忆）
        # 启动时加载昨日总结
        self._load_yesterday_summary()

    # ========= 写 =========

    def add_activity(self, description: str, app_name: str = "",
                     window_title: str = "", entry_type: str = "screenshot"):
        """添加一条活动记录（视觉模型产出）"""
        with self._lock:
            self._check_day_reset()

            entry = {
                "time": datetime.now().strftime("%H:%M"),
                "type": entry_type,
                "description": description,
                "app": app_name or "",
                "window": window_title or "",
            }
            self._entries.append(entry)

            # 超过上限就裁剪
            if len(self._entries) > self.MAX_ENTRIES:
                self._entries = self._entries[-self.MAX_ENTRIES:]

    def add_window_switch(self, app_name: str, window_title: str, duration_sec: int = 0):
        """添加窗口切换记录"""
        with self._lock:
            self._check_day_reset()

            dur_str = f"停留 {duration_sec // 60} 分钟" if duration_sec >= 30 else ""
            entry = {
                "time": datetime.now().strftime("%H:%M"),
                "type": "window",
                "description": f"切换到 {app_name} - {window_title}{'（' + dur_str + '）' if dur_str else ''}",
                "app": app_name,
                "window": window_title,
            }
            self._entries.append(entry)

    def record_speak(self, message: str):
        """记录一次主动发言"""
        with self._lock:
            self._last_speak_time = _time.time()
            self._speak_history.append({
                "time": datetime.now().strftime("%H:%M"),
                "message": message,
            })
            # 只保留最近 5 条
            if len(self._speak_history) > 5:
                self._speak_history = self._speak_history[-5:]

    # ========= 读 =========

    @property
    def last_speak_time(self) -> Optional[float]:
        return self._last_speak_time

    @property
    def minutes_since_last_speak(self) -> float:
        """距离上次发言多少分钟"""
        if self._last_speak_time is None:
            return 999.0
        return (_time.time() - self._last_speak_time) / 60.0

    def get_day_summary(self) -> str:
        """获取全天活动摘要，供主模型分析

        Returns:
            JSON 数组字符串，每条含 time/type/description/app
        """
        with self._lock:
            self._check_day_reset()
            return json.dumps(self._entries, ensure_ascii=False, indent=2)

    def get_recent(self, n: int = 10) -> list[dict]:
        """获取最近 N 条记录"""
        with self._lock:
            return self._entries[-n:]

    def get_speak_history(self) -> str:
        """获取近期发言历史"""
        with self._lock:
            return json.dumps(self._speak_history, ensure_ascii=False)

    @property
    def entry_count(self) -> int:
        return len(self._entries)

    @property
    def yesterday_summary(self) -> str:
        """获取昨日活动摘要（跨天记忆）"""
        return self._yesterday_summary

    # ========= 内部 =========

    def _check_day_reset(self):
        """跨天重置：存昨日总结 → 清空当天记录 → 加载昨日记忆"""
        today = date.today().isoformat()
        if today != self._today:
            # 1. 将昨天的活动存为"昨日总结"
            self._save_yesterday_summary()
            # 2. 清空当天记录
            self._entries.clear()
            self._speak_history.clear()
            self._last_speak_time = None
            self._today = today
            # 3. 重新加载昨日总结（刚存的）
            self._load_yesterday_summary()
            print("[ContextManager] 跨天重置完成，已加载昨日记忆")

    def _save_yesterday_summary(self):
        """将当天活动总结存到文件，供次日使用"""
        if not self._entries:
            return
        try:
            # 生成简洁的昨日摘要
            activities = []
            for e in self._entries:
                activities.append(f"{e.get('time', '')} {e.get('description', '')}")
            speaks = [f"{s.get('time', '')} 说了「{s.get('message', '')}」" for s in self._speak_history]
            summary_data = {
                "date": self._today,
                "activity_count": len(self._entries),
                "activities": activities[-20:],  # 最多保留20条
                "speak_history": speaks,
            }
            os.makedirs(os.path.dirname(YESTERDAY_SUMMARY_PATH), exist_ok=True)
            with open(YESTERDAY_SUMMARY_PATH, "w", encoding="utf-8") as f:
                json.dump(summary_data, f, ensure_ascii=False, indent=2)
            print(f"[ContextManager] 昨日总结已保存（{len(activities)} 条活动）")
        except Exception as e:
            print(f"[ContextManager] 保存昨日总结失败: {e}")

    def _load_yesterday_summary(self):
        """从文件加载昨日总结"""
        try:
            if os.path.exists(YESTERDAY_SUMMARY_PATH):
                with open(YESTERDAY_SUMMARY_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                activities = data.get("activities", [])
                speaks = data.get("speak_history", [])
                date_str = data.get("date", "")
                parts = [f"昨日（{date_str}）的活动记录："]
                for a in activities:
                    parts.append(f"  - {a}")
                if speaks:
                    parts.append("昨日主动发言：")
                    for s in speaks:
                        parts.append(f"  - {s}")
                self._yesterday_summary = "\n".join(parts)
                print(f"[ContextManager] 昨日记忆已加载（{len(activities)} 条活动）")
            else:
                self._yesterday_summary = ""
        except Exception as e:
            print(f"[ContextManager] 加载昨日总结失败: {e}")
            self._yesterday_summary = ""


# 全局单例
context_manager = ContextManager()
