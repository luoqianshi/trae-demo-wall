"""
伴伴 - 闹钟管理模块
后台线程定时检查，触发时弹出系统通知
支持一次性闹钟和按星期重复
"""
import threading
import time as _time
from datetime import datetime, timedelta
from typing import Callable, Optional
from companion_db import Database, Alarm

# 星期映射
WEEKDAY_MAP = {
    "mon": 0, "tue": 1, "wed": 2, "thu": 3,
    "fri": 4, "sat": 5, "sun": 6,
}
WEEKDAY_NAMES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


class AlarmManager:
    """闹钟管理器 - 后台线程每秒检查"""

    def __init__(self, db: Database = None,
                 on_trigger: Callable[[Alarm], None] = None):
        self.db = db or Database()
        self.on_trigger = on_trigger or self._default_trigger
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._triggered_today: set = set()  # (alarm_id, date_str) 防止重复触发

    def start(self):
        """启动闹钟检查线程"""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True, name="alarm-checker")
        self._thread.start()
        print("[AlarmManager] 已启动")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)
        print("[AlarmManager] 已停止")

    def _loop(self):
        """主循环，每 10 秒检查一次"""
        while self._running:
            try:
                self._check_alarms()
            except Exception as e:
                print(f"[AlarmManager] 检查出错: {e}")
            _time.sleep(10)

    def _check_alarms(self):
        now = datetime.now()
        today_str = now.strftime("%Y-%m-%d")
        now_time = now.strftime("%H:%M")
        today_weekday = WEEKDAY_NAMES[now.weekday()]

        alarms = self.db.get_alarms(enabled_only=True)

        for alarm in alarms:
            # 检查是否到了触发时间
            if alarm.time != now_time:
                continue

            # 防止同一分钟内重复触发
            key = (alarm.id, today_str, now_time)
            if key in self._triggered_today:
                continue

            # 检查重复日期
            if alarm.repeat_days:
                if today_weekday not in alarm.repeat_days:
                    continue
            # 一次性闹钟：已触发过的不再触发
            elif alarm.last_triggered and alarm.last_triggered.startswith(today_str):
                continue

            # 触发！
            self._triggered_today.add(key)
            alarm.last_triggered = now.isoformat()
            self.db.update_alarm(alarm)
            self.on_trigger(alarm)

    def add_alarm(self, label: str, time_str: str, repeat_days: list = None,
                  tone: str = "gentle") -> int:
        """添加闹钟。time_str: "HH:MM", repeat_days: ["mon","tue",...]"""
        alarm = Alarm(
            label=label,
            time=time_str,
            repeat_days=repeat_days or [],
            tone=tone,
        )
        alarm_id = self.db.add_alarm(alarm)
        print(f"[AlarmManager] 添加闹钟 #{alarm_id}: {label} @ {time_str}")
        return alarm_id

    def remove_alarm(self, alarm_id: int):
        self.db.delete_alarm(alarm_id)
        print(f"[AlarmManager] 删除闹钟 #{alarm_id}")

    def list_alarms(self) -> list[Alarm]:
        return self.db.get_alarms()

    def toggle_alarm(self, alarm_id: int, enabled: bool):
        alarms = self.db.get_alarms()
        for a in alarms:
            if a.id == alarm_id:
                a.is_enabled = enabled
                self.db.update_alarm(a)
                break

    def _default_trigger(self, alarm: Alarm):
        """默认触发行为 - Windows 系统通知"""
        print(f"[AlarmManager] 闹钟触发: {alarm.label} ({alarm.time})")
        try:
            from win11toast import toast
            toast("伴伴提醒", alarm.label or "该起床啦", duration="short")
        except ImportError:
            try:
                from plyer import notification
                notification.notify(title="伴伴提醒", message=alarm.label or "该起床啦",
                                    timeout=10)
            except ImportError:
                print(f"  -> {alarm.label or '该起床啦'}")


# ============================================================
# 快速测试
# ============================================================
if __name__ == "__main__":
    mgr = AlarmManager()

    # 添加一个 1 分钟后的闹钟测试
    now = datetime.now() + timedelta(minutes=1)
    test_time = now.strftime("%H:%M")
    print(f"测试: 添加闹钟 {test_time}")
    mgr.add_alarm("测试闹钟", test_time, tone="gentle")

    print("闹钟列表:")
    for a in mgr.list_alarms():
        repeat = ", ".join(a.repeat_days) if a.repeat_days else "一次性"
        print(f"  #{a.id} {a.time} {a.label} [{repeat}] {'on' if a.is_enabled else 'off'}")

    print("\n启动检查（等 2 分钟）...")
    mgr.start()
    _time.sleep(120)
    mgr.stop()
