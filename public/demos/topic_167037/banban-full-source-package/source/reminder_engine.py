"""
伴伴 - 消息提醒引擎
三阶段注意力引导：轻提醒 → 觉察提醒 → 轻切换
后台线程监控持续活动时间，到阶段阈值时生成 AI 文案并通知
"""
import threading
import time as _time
from datetime import datetime, timedelta
from typing import Callable, Optional
from companion_db import Database, Reminder, ReminderLog
from ai_client import AIClient


class ReminderEngine:
    """三阶段提醒引擎"""

    def __init__(self, db: Database = None, ai: AIClient = None,
                 on_trigger: Callable[[Reminder, int, str], None] = None,
                 get_current_activity: Callable[[], str] = None):
        self.db = db or Database()
        self.ai = ai or AIClient(self.db)
        self.on_trigger = on_trigger or self._default_trigger
        self.get_current_activity = get_current_activity or (lambda: "")
        self._running = False
        self._thread: Optional[threading.Thread] = None
        # 会话追踪：{reminder_id: {"start": datetime, "last_stage": 0}}
        self._sessions: dict = {}

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True, name="reminder-engine")
        self._thread.start()
        print("[ReminderEngine] 已启动")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)
        print("[ReminderEngine] 已停止")

    def _loop(self):
        """主循环，每 30 秒检查一次"""
        while self._running:
            try:
                self._check_reminders()
            except Exception as e:
                print(f"[ReminderEngine] 检查出错: {e}")
            _time.sleep(30)

    def _check_reminders(self):
        now = datetime.now()
        now_str = now.strftime("%H:%M")
        today_weekday = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][now.weekday()]

        reminders = self.db.get_reminders(enabled_only=True)

        for r in reminders:
            # 检查时间范围
            if r.start_time and r.end_time:
                if not (r.start_time <= now_str <= r.end_time):
                    # 超出时间范围，重置会话
                    if r.id in self._sessions:
                        del self._sessions[r.id]
                    continue

            # 检查重复日期
            if r.is_recurring and r.recurring_days:
                if today_weekday not in r.recurring_days:
                    continue

            # 获取当前活动（如前台窗口标题）
            current_activity = self.get_current_activity()
            if not current_activity:
                continue

            # 会话管理
            session = self._sessions.get(r.id)
            if session is None:
                # 新会话开始
                session = {"start": now, "last_stage": 0, "last_activity": current_activity}
                self._sessions[r.id] = session
                continue

            # 如果活动变化超过 60 秒的空白，重置会话
            if session["last_activity"] != current_activity:
                session["start"] = now
                session["last_activity"] = current_activity
                session["last_stage"] = 0
                continue

            # 计算持续时长
            elapsed = (now - session["start"]).total_seconds() / 60  # 分钟

            # 检查阶段触发
            stages = [
                (1, r.stage1_minutes),
                (2, r.stage2_minutes),
                (3, r.stage3_minutes),
            ]

            for stage_num, stage_minutes in stages:
                if elapsed >= stage_minutes and session["last_stage"] < stage_num:
                    # 触发此阶段
                    session["last_stage"] = stage_num
                    self._trigger_stage(r, stage_num, int(elapsed), current_activity)
                    break  # 一次循环只触发一个阶段

    def _trigger_stage(self, reminder: Reminder, stage: int, elapsed: int, activity: str):
        """触发提醒阶段 - 生成 AI 文案并通知"""
        print(f"[ReminderEngine] 触发: {reminder.label} 第{stage}阶段 ({elapsed}分钟)")

        # 获取用户画像摘要
        profile = self.db.get_profile()
        profile_summary = profile.summary or "一个正在探索生活的人"

        # 生成 AI 文案
        message = ""
        try:
            message = self.ai.generate_reminder_message(
                profile_summary=profile_summary,
                stage=stage,
                elapsed_minutes=elapsed,
                current_activity=activity,
                tone=reminder.tone_style,
            )
        except Exception as e:
            # AI 失败时用默认文案
            defaults = {
                1: f"已经 {elapsed} 分钟了，轻轻动一下肩膀吧",
                2: f"持续了 {elapsed} 分钟，此刻在做的事情是你想要的吗？",
                3: f"已经 {elapsed} 分钟了，试试站起来走两步，喝口水",
            }
            message = defaults.get(stage, f"已 {elapsed} 分钟")
            print(f"[ReminderEngine] AI 生成失败，使用默认文案: {e}")

        # 记录日志
        log = ReminderLog(
            reminder_id=reminder.id,
            stage=stage,
            message=message,
        )
        self.db.log_reminder(log)

        # 更新提醒状态
        reminder.last_triggered_stage = stage
        reminder.last_triggered_at = datetime.now().isoformat()
        self.db.update_reminder(reminder)

        # 回调通知
        self.on_trigger(reminder, stage, message)

    def start_session(self, reminder_id: int):
        """手动开始一个专注会话"""
        now = datetime.now()
        self._sessions[reminder_id] = {"start": now, "last_stage": 0, "last_activity": ""}
        # 更新数据库
        reminders = self.db.get_reminders()
        for r in reminders:
            if r.id == reminder_id:
                r.session_start = now.isoformat()
                r.last_triggered_stage = 0
                self.db.update_reminder(r)
                break
        print(f"[ReminderEngine] 会话开始: 提醒#{reminder_id}")

    def end_session(self, reminder_id: int):
        """手动结束专注会话"""
        if reminder_id in self._sessions:
            del self._sessions[reminder_id]
        reminders = self.db.get_reminders()
        for r in reminders:
            if r.id == reminder_id:
                r.session_start = None
                r.last_triggered_stage = 0
                self.db.update_reminder(r)
                break
        print(f"[ReminderEngine] 会话结束: 提醒#{reminder_id}")

    def add_reminder(self, label: str, reminder_type: str = "focus",
                     stage1: int = 25, stage2: int = 50, stage3: int = 60,
                     tone: str = "gentle", start_time: str = None, end_time: str = None,
                     recurring_days: list = None) -> int:
        r = Reminder(
            label=label, reminder_type=reminder_type,
            stage1_minutes=stage1, stage2_minutes=stage2, stage3_minutes=stage3,
            tone_style=tone, start_time=start_time, end_time=end_time,
            recurring_days=recurring_days or [],
        )
        rid = self.db.add_reminder(r)
        print(f"[ReminderEngine] 添加提醒 #{rid}: {label}")
        return rid

    def _default_trigger(self, reminder: Reminder, stage: int, message: str):
        """默认通知 - Windows 系统通知"""
        stage_emoji = {1: "🍃", 2: "🌀", 3: "⚓"}
        title = f"{stage_emoji.get(stage, '')} 伴伴提醒"
        print(f"  -> {title}: {message}")
        try:
            from win11toast import toast
            toast(title, message, duration="short")
        except ImportError:
            try:
                from plyer import notification
                notification.notify(title=title, message=message, timeout=10)
            except ImportError:
                print(f"  [{title}] {message}")


# ============================================================
# 快速测试
# ============================================================
if __name__ == "__main__":
    engine = ReminderEngine()

    # 添加测试提醒（短间隔）
    rid = engine.add_reminder("测试专注", stage1=1, stage2=2, stage3=3)

    print("提醒列表:")
    for r in engine.db.get_reminders():
        print(f"  #{r.id} {r.label} [{r.reminder_type}] stage={r.stage1_minutes}/{r.stage2_minutes}/{r.stage3_minutes}min")

    print("\n启动引擎（等待 4 分钟）...")
    engine.start()
    _time.sleep(240)
    engine.stop()
