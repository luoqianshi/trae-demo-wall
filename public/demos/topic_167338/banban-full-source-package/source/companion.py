"""
伴伴 - 主调度器
整合闹钟、提醒、截图分析、窗口监控、语音对话
后台静默运行，温柔陪伴

双模型架构：
- 视觉模型（GLM-4V-Flash 免费）→ 看图说话 → 存入上下文
- 主模型（DeepSeek 长上下文）→ 读全天上下文 → 主动弹窗
"""
import json
import threading
import time as _time
import sys
from datetime import datetime
from typing import Callable, Optional

from companion_db import Database
from ai_client import AIClient
from alarm_manager import AlarmManager
from reminder_engine import ReminderEngine
from screenshot_analyzer import ScreenshotAnalyzer
from context_manager import context_manager
from behavior_engine import get_behavior_engine
from time_sense import TimeSenseSystem
from memory_journal import MemoryJournal


class Companion:
    """伴伴主调度器 - 整合所有模块"""

    def __init__(self, screenshot_interval: int = 5):
        self.db = Database()
        self.ai = AIClient(self.db)

        # 窗口监控
        self._current_window = ("", "")
        self._window_thread: Optional[threading.Thread] = None

        # 各模块初始化
        self.alarm_mgr = AlarmManager(self.db, on_trigger=self._on_alarm)
        self.reminder_engine = ReminderEngine(
            self.db, self.ai,
            on_trigger=self._on_reminder,
            get_current_activity=lambda: self._current_window[1],
        )
        self.screenshot_analyzer = ScreenshotAnalyzer(
            self.db, self.ai,
            interval_minutes=screenshot_interval,
            on_analysis=self._on_screenshot,
            on_continuity_check=self._on_continuity_check,
        )

        # 连续性判断的最新结果（供前端查询）
        self._last_continuity = None

        # 行为认知引擎 — 连接 AI 复核和数据库持久化
        try:
            from ai_router import AIRouter
            router = AIRouter()
            self.behavior_engine = get_behavior_engine(
                ai_review_fn=router.analyze_behavior,
                db=self.db,
            )
            # 加载用户模型到行为引擎
            self._load_user_model_to_engine()
        except Exception as e:
            print(f"[伴伴] 行为引擎初始化失败（非致命）: {e}")
            self.behavior_engine = None

        # 滚动记忆日志 — 让 AI 拥有一周以上的持续记忆
        self.memory_journal = MemoryJournal(ai_client=self.ai)
        self._memory_last_date = datetime.now().strftime("%Y-%m-%d")
        try:
            self.memory_journal.refresh_on_startup()
        except Exception as e:
            print(f"[伴伴] 记忆日志启动失败（非致命）: {e}")

        # 主动陪伴线程（定期读全天上下文，决定是否弹窗）
        self._companion_thread: Optional[threading.Thread] = None
        self._companion_interval = 10 * 60  # 每 10 分钟检查一次

        self._running = False

    # ========= 通知回调 =========

    def _on_alarm(self, alarm):
        """闹钟触发"""
        print(f"[伴伴] 闹钟响了: {alarm.label}")
        self._notify(f"闹钟: {alarm.label}", alarm.label or "时间到了")

    def _on_reminder(self, reminder, stage, message):
        """提醒触发"""
        emojis = {1: "🍃", 2: "🌀", 3: "⚓"}
        emoji = emojis.get(stage, "")
        print(f"[伴伴] 提醒: {emoji} {message}")
        self._notify(f"{emoji} 伴伴提醒", message)

    def _load_user_model_to_engine(self):
        """从数据库加载用户模型到行为引擎，让 AI 和时间感知都"懂这个人" """
        if not self.behavior_engine:
            return
        try:
            from cognition_store import CognitionStore
            store = CognitionStore(self.db)
            user_model = store.get_user_model_v2()
            if user_model:
                self.behavior_engine.set_user_model(user_model)
                print("[伴伴] 用户模型已加载到行为引擎")
        except Exception as e:
            print(f"[伴伴] 用户模型加载失败（非致命）: {e}")

    def _on_screenshot(self, record):
        """截图分析完成：视觉模型的结果存入上下文 + 行为认知引擎分析"""
        description = ""

        # 视觉模型返回的直接就是描述文本（不截断，保留完整丰富信息）
        if record.ai_analysis:
            description = record.ai_analysis.strip()

        # 如果没有有效的视觉描述，用窗口信息兜底
        if not description:
            description = f"正在使用 {record.app_name} - {record.window_title}"

        # 存入上下文管理器
        context_manager.add_activity(
            description=description,
            app_name=record.app_name or "",
            window_title=record.window_title or "",
        )

        print(f"[伴伴] 视觉: {description}")

        # ---- 行为认知引擎分析 ----
        if self.behavior_engine:
            try:
                # 从 OCR 文本中提取关键词
                ocr_keywords = []
                if record.ocr_text:
                    import re
                    words = re.split(r'[\s\-_·|—–/\[\](){}「」【】《》<>.,;:!?，。；：！？、]+', record.ocr_text)
                    ocr_keywords = [w for w in words if len(w) >= 2][:10]

                # 构造行为引擎输入数据
                behavior_data = {
                    "app_name": record.app_name or "",
                    "window_title": record.window_title or "",
                    "ocr_text": record.ocr_text or "",
                    "ocr_keywords": ocr_keywords,
                    # 截图无法获取的键鼠数据，用合理默认值
                    "mouse_clicks": 0,
                    "key_strokes": 0,
                    "idle_seconds": 0,
                    "is_locked": False,
                    "screen_on": True,
                }

                result = self.behavior_engine.analyze(behavior_data)
                print(f"[伴伴] 行为认知: {result.state_label} (置信度 {result.confidence:.0%})")
            except Exception as e:
                print(f"[伴伴] 行为认知分析失败（非致命）: {e}")

        # 检查是否需要立刻触发主模型（如果超过间隔且数据够了）
        if context_manager.entry_count >= 3 and \
                context_manager.minutes_since_last_speak > 8:
            self._check_and_speak()

    def _on_continuity_check(self, result: dict):
        """快速模式：DeepSeek 连续性判断回调

        result 包含：
        - is_continuing: bool
        - activity: 当前在做的事情
        - duration_minutes: 持续时长
        - trend: focus_building | maintaining | distracting | switching
        - feedback: 简短反馈文案
        - suggestion: 建议伴伴说的话（空字符串则不说）
        """
        # 保存最新结果，供前端查询
        self._last_continuity = {
            **result,
            "timestamp": __import__('datetime').datetime.now().isoformat(),
        }

        print(f"[伴伴] 连续性: {result.get('activity','?')} - {result.get('trend','?')} "
              f"- {result.get('feedback','?')}")

        # 如果有建议说的话，且距离上次发言超过 5 分钟，就说
        suggestion = result.get("suggestion", "").strip()
        if suggestion and context_manager.minutes_since_last_speak > 5:
            self._notify("伴伴", suggestion)
            context_manager.update_last_speak()
            # 存入对话记录
            try:
                self.db.add_message(
                    role="assistant",
                    content=suggestion,
                    source="continuity_check",
                )
            except Exception:
                pass

    def _notify(self, title: str, message: str):
        """发送系统通知"""
        try:
            from win11toast import toast
            toast(title, message, duration="short")
        except ImportError:
            try:
                from plyer import notification
                notification.notify(title=title, message=message, timeout=10)
            except ImportError:
                print(f"  [通知] {title}: {message}")

    # ========= 主动陪伴 =========

    def _generate_daily_memory(self):
        """跨天时触发：从昨日活动生成 AI 日记摘要"""
        try:
            import os
            yesterday_path = os.path.join(
                os.path.expanduser("~"), ".banban", "yesterday_summary.json"
            )
            if not os.path.exists(yesterday_path):
                print("[伴伴] 无昨日活动文件，跳过日记生成")
                return

            with open(yesterday_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            activities = []
            for line in data.get("activities", []):
                # 格式："09:30 正在VS Code中..."
                parts = line.split(" ", 1)
                if len(parts) == 2:
                    activities.append({"time": parts[0], "description": parts[1]})
                else:
                    activities.append({"time": "", "description": line})

            speaks = []
            for line in data.get("speak_history", []):
                speaks.append({"time": "", "message": line})

            if activities:
                print(f"[伴伴] 生成昨日日记（{len(activities)} 条活动）...")
                self.memory_journal.generate_daily_summary(activities, speaks)
        except Exception as e:
            print(f"[伴伴] 生成昨日日记失败（非致命）: {e}")

    def _check_and_speak(self):
        """主模型：读全天上下文 + 长期记忆 + 周度摘要，决定是否主动说话"""
        # 检测跨天：生成昨日日记 + 刷新周度摘要
        today_str = datetime.now().strftime("%Y-%m-%d")
        if self._memory_last_date != today_str:
            print(f"[伴伴] 检测到跨天（{self._memory_last_date} → {today_str}），生成记忆日记...")
            self._generate_daily_memory()
            self.memory_journal.generate_weekly_digest()
            self._memory_last_date = today_str

        if not context_manager.entry_count:
            return

        # 太频繁不说话
        if context_manager.minutes_since_last_speak < 8:
            return

        day_summary = context_manager.get_day_summary()
        yesterday = context_manager.yesterday_summary
        weekly_digest = self.memory_journal.get_weekly_digest()
        print(f"[伴伴] 主模型检查中... ({context_manager.entry_count} 条上下文, "
              f"昨日: {'有' if yesterday else '无'}, 周度: {'有' if weekly_digest else '无'})")

        # 加载长期记忆：用户模型 + 认知摘要
        user_memory = ""
        try:
            from cognition_store import CognitionStore
            store = CognitionStore(self.db)
            # 用户模型摘要
            um = store.get_user_model_v2()
            if um:
                parts = []
                if um.get("desired_self", {}).get("focus"):
                    parts.append(f"当前关注：{um['desired_self']['focus']}")
                if um.get("action_profile", {}).get("thinking_style", {}).get("value"):
                    parts.append(f"思考风格：{um['action_profile']['thinking_style']['value']}")
                if um.get("action_profile", {}).get("execution_style", {}).get("value"):
                    parts.append(f"执行风格：{um['action_profile']['execution_style']['value']}")
                if um.get("communication_profile", {}).get("role"):
                    parts.append(f"陪伴角色：{um['communication_profile']['role']}")
                cp = um.get("communication_profile", {})
                if cp.get("warmth") is not None:
                    parts.append(f"温柔度{cp['warmth']}/直接度{cp.get('directness', 50)}")
                if um.get("energy_pattern", {}).get("hourly"):
                    # 找到当前时段的能量值
                    hour = datetime.now().hour
                    hourly = um["energy_pattern"]["hourly"]
                    if 0 <= hour < len(hourly):
                        energy = hourly[hour].get("energy", 0.5)
                        parts.append(f"当前时段能量：{energy:.1f}")
                if parts:
                    user_memory = "\n".join(parts)
            # 认知图谱高置信度摘要
            ctx = store.get_context_summary()
            if ctx.get("cognition_text"):
                user_memory += "\n" + ctx["cognition_text"]
        except Exception as e:
            print(f"[伴伴] 加载长期记忆失败（非致命）: {e}")

        try:
            decision = self.ai.companion_check(
                day_summary,
                yesterday_summary=yesterday,
                user_memory=user_memory,
                weekly_digest=weekly_digest,
            )
        except Exception as e:
            print(f"[伴伴] 主模型检查失败: {e}")
            return

        if decision.get("should_speak") and decision.get("message"):
            message = decision["message"]
            reason = decision.get("reason", "")
            print(f"[伴伴] 主动说话: 「{message}」\n  原因: {reason}")

            # 记录发言
            context_manager.record_speak(message)

            # 弹窗通知
            self._notify("💬 伴伴", message)

    def _companion_loop(self):
        """主动陪伴后台线程"""
        while self._running:
            _time.sleep(self._companion_interval)
            if not self._running:
                break
            self._check_and_speak()

    # ========= 窗口监控 =========

    def _window_loop(self):
        """后台监控前台窗口变化"""
        last_window = ""
        last_time = _time.time()

        while self._running:
            try:
                app_name, window_title = self._get_foreground_window()
                current = f"{app_name}|{window_title}"

                if current != last_window:
                    # 窗口切换，记录上一个窗口的持续时间
                    duration = int(_time.time() - last_time)
                    if last_window and duration > 0:
                        old_app, old_title = last_window.split("|", 1)
                        from companion_db import WindowEvent
                        self.db.add_window_event(WindowEvent(
                            app_name=old_app, window_title=old_title, duration=duration,
                        ))

                    last_window = current
                    last_time = _time.time()
                    self._current_window = (app_name, window_title)

                _time.sleep(1)
            except Exception as e:
                print(f"[窗口监控] 错误: {e}")
                _time.sleep(5)

    def _get_foreground_window(self) -> tuple:
        """获取前台窗口"""
        try:
            import ctypes
            from ctypes import wintypes

            user32 = ctypes.windll.user32
            hwnd = user32.GetForegroundWindow()
            if not hwnd:
                return ("", "")

            length = user32.GetWindowTextLengthW(hwnd)
            buf = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buf, length + 1)
            window_title = buf.value

            pid = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            app_name = self._get_process_name(pid.value)

            return (app_name, window_title)
        except Exception:
            return ("", "")

    def _get_process_name(self, pid: int) -> str:
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            psapi = ctypes.windll.psapi
            handle = kernel32.OpenProcess(0x0410, False, pid)
            if not handle:
                return ""
            buf = ctypes.create_unicode_buffer(260)
            psapi.GetModuleBaseNameW(handle, None, buf, 260)
            kernel32.CloseHandle(handle)
            return buf.value
        except Exception:
            return ""

    # ========= 生命周期 =========

    def start(self):
        """启动所有后台服务"""
        print(f"\n{'='*40}")
        print(f"  伴伴 启动中... {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'='*40}\n")

        self._running = True

        # 窗口监控
        self._window_thread = threading.Thread(target=self._window_loop, daemon=True, name="window-monitor")
        self._window_thread.start()
        print("[伴伴] 窗口监控已启动")

        # 闹钟
        self.alarm_mgr.start()

        # 提醒
        self.reminder_engine.start()

        # 截图分析
        self.screenshot_analyzer.start()

        # 主动陪伴线程（每 10 分钟读全天上下文，决定是否弹窗）
        self._companion_thread = threading.Thread(
            target=self._companion_loop, daemon=True, name="companion-check")
        self._companion_thread.start()
        print("[伴伴] 主动陪伴线程已启动（每 10 分钟检查一次）")

        print(f"\n[伴伴] 全部服务已启动，静默陪伴中...\n")

    def stop(self):
        """停止所有服务"""
        print("\n[伴伴] 正在停止...")
        self._running = False
        self.alarm_mgr.stop()
        self.reminder_engine.stop()
        self.screenshot_analyzer.stop()
        print("[伴伴] 已停止")

    # ========= 便捷 API =========

    def add_alarm(self, label: str, time_str: str, repeat_days: list = None, tone: str = "gentle"):
        """添加闹钟。time_str: "HH:MM", repeat_days: ["mon","tue",...]"""
        return self.alarm_mgr.add_alarm(label, time_str, repeat_days, tone)

    def add_reminder(self, label: str, stage1: int = 25, stage2: int = 50, stage3: int = 60,
                     tone: str = "gentle", start_time: str = None, end_time: str = None):
        """添加三阶段注意力提醒"""
        return self.reminder_engine.add_reminder(
            label, stage1=stage1, stage2=stage2, stage3=stage3,
            tone=tone, start_time=start_time, end_time=end_time,
        )

    def capture_now(self):
        """立即截图分析一次"""
        return self.screenshot_analyzer.capture_and_analyze()

    def set_screenshot_interval(self, minutes: int):
        """设置截图间隔"""
        self.screenshot_analyzer.set_interval(minutes)

    def status(self) -> dict:
        """获取当前状态"""
        return {
            "running": self._running,
            "current_app": self._current_window[0],
            "current_window": self._current_window[1],
            "alarms": len(self.alarm_mgr.list_alarms()),
            "reminders": len(self.db.get_reminders(enabled_only=True)),
            "screenshots": len(self.screenshot_analyzer.get_history(limit=1)),
            "context_entries": context_manager.entry_count,
            "last_speak_minutes": round(context_manager.minutes_since_last_speak, 1),
            "time": datetime.now().isoformat(),
        }


# ============================================================
# 启动入口
# ============================================================
if __name__ == "__main__":
    companion = Companion(screenshot_interval=5)

    # 添加一些默认配置（首次运行）
    if not companion.db.get_alarms():
        print("[伴伴] 首次运行，添加默认闹钟...")
        companion.add_alarm("起床", "07:30", repeat_days=["mon","tue","wed","thu","fri"], tone="gentle")
        companion.add_alarm("午休结束", "13:30", repeat_days=["mon","tue","wed","thu","fri"], tone="friend")

    if not companion.db.get_reminders():
        print("[伴伴] 首次运行，添加默认提醒...")
        companion.add_reminder("专注提醒", stage1=25, stage2=50, stage3=60,
                               tone="gentle", start_time="09:00", end_time="22:00")

    # 启动
    companion.start()

    # 主循环 - 等待退出
    try:
        while True:
            _time.sleep(60)
            s = companion.status()
            print(f"[{s['time'][:16]}] 当前: {s['current_app']} - {s['current_window']} | "
                  f"闹钟:{s['alarms']} 提醒:{s['reminders']}")
    except KeyboardInterrupt:
        companion.stop()
        print("再见~")
