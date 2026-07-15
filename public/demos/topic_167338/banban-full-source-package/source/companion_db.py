"""
伴伴 - 数据库管理模块
SQLite 存储：闹钟、提醒、截图分析记录、窗口活动、用户画像
"""
import sqlite3
import json
import threading
from datetime import datetime, date
from typing import Optional
from dataclasses import dataclass, field, asdict
import os
from pathlib import Path

# 使用统一配置模块
try:
    from banban_config import DB_PATH
except ImportError:
    _data_dir = os.environ.get("BANBAN_DATA_DIR", str(Path.home() / ".banban"))
    DB_PATH = os.path.join(_data_dir, "companion.db")


def _now_iso() -> str:
    return datetime.now().isoformat()


# ============================================================
# 数据模型
# ============================================================
@dataclass
class Alarm:
    id: Optional[int] = None
    created_at: str = field(default_factory=_now_iso)
    label: str = ""
    time: str = ""  # "HH:MM"
    repeat_days: list = field(default_factory=list)  # ["mon","tue",...] 空=一次性
    is_enabled: bool = True
    tone: str = "gentle"  # gentle | direct | friend | coach
    last_triggered: Optional[str] = None


@dataclass
class Reminder:
    id: Optional[int] = None
    created_at: str = field(default_factory=_now_iso)
    reminder_type: str = "focus"  # focus | rest | task
    label: str = ""
    stage1_minutes: int = 25
    stage2_minutes: int = 50
    stage3_minutes: int = 60
    is_recurring: bool = False
    recurring_days: list = field(default_factory=list)
    start_time: Optional[str] = None  # "09:00"
    end_time: Optional[str] = None  # "22:00"
    is_enabled: bool = True
    tone_style: str = "gentle"
    last_triggered_stage: int = 0
    last_triggered_at: Optional[str] = None
    session_start: Optional[str] = None  # 当前专注会话开始时间


@dataclass
class ReminderLog:
    id: Optional[int] = None
    reminder_id: int = 0
    triggered_at: str = field(default_factory=_now_iso)
    stage: int = 0
    message: str = ""
    acknowledged: bool = False
    acknowledged_at: Optional[str] = None


@dataclass
class ScreenshotRecord:
    id: Optional[int] = None
    created_at: str = field(default_factory=_now_iso)
    image_path: str = ""
    ocr_text: str = ""
    ai_analysis: str = ""
    app_name: str = ""
    window_title: str = ""


@dataclass
class WindowEvent:
    id: Optional[int] = None
    timestamp: str = field(default_factory=_now_iso)
    app_name: str = ""
    window_title: str = ""
    pid: int = 0
    duration: int = 0  # 秒


@dataclass
class UserProfile:
    id: int = 1
    updated_at: str = field(default_factory=_now_iso)
    big_five: dict = field(default_factory=dict)  # {O:0.7, C:0.6, E:0.5, A:0.8, N:0.4}
    values: list = field(default_factory=list)
    social_preference: str = ""
    work_style: str = ""
    lifestyle: str = ""
    summary: str = ""


@dataclass
class Task:
    id: Optional[int] = None
    created_at: str = field(default_factory=_now_iso)
    title: str = ""
    type: str = "work"  # work/rest/meal/exercise/study/social/routine
    priority: str = "medium"  # high/medium/low
    channel: str = ""  # 渠道/上下文
    planned_minutes: int = 60
    actual_minutes: int = 0
    start_time: Optional[str] = None  # "HH:MM" or None
    end_time: Optional[str] = None    # "HH:MM" or None
    status: str = "backlog"  # backlog/planned/done
    date: str = ""  # "YYYY-MM-DD"
    note: str = ""
    completed_at: Optional[str] = None


# ============================================================
# 数据库
# ============================================================
class Database:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, db_path: str = None):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._init(db_path or DB_PATH)
            return cls._instance

    def _init(self, db_path: str):
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._db_path = db_path
        self._local = threading.local()
        self._init_schema()

    @property
    def db_path(self) -> str:
        """数据库文件路径（供外部模块直接用 sqlite3 操作）"""
        return self._db_path

    def _conn(self) -> sqlite3.Connection:
        if not hasattr(self._local, "conn") or self._local.conn is None:
            self._local.conn = sqlite3.connect(self._db_path)
            self._local.conn.row_factory = sqlite3.Row
            try:
                self._local.conn.execute("PRAGMA journal_mode=WAL")
            except sqlite3.OperationalError:
                # WAL 模式不可用时降级为 DELETE 模式
                try:
                    self._local.conn.execute("PRAGMA journal_mode=DELETE")
                except sqlite3.OperationalError:
                    pass
        return self._local.conn

    def _init_schema(self):
        conn = self._conn()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS alarms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                label TEXT NOT NULL DEFAULT '',
                time TEXT NOT NULL,
                repeat_days TEXT DEFAULT '[]',
                is_enabled INTEGER DEFAULT 1,
                tone TEXT DEFAULT 'gentle',
                last_triggered TEXT
            );

            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                reminder_type TEXT NOT NULL DEFAULT 'focus',
                label TEXT NOT NULL DEFAULT '',
                stage1_minutes INTEGER DEFAULT 25,
                stage2_minutes INTEGER DEFAULT 50,
                stage3_minutes INTEGER DEFAULT 60,
                is_recurring INTEGER DEFAULT 0,
                recurring_days TEXT DEFAULT '[]',
                start_time TEXT,
                end_time TEXT,
                is_enabled INTEGER DEFAULT 1,
                tone_style TEXT DEFAULT 'gentle',
                last_triggered_stage INTEGER DEFAULT 0,
                last_triggered_at TEXT,
                session_start TEXT
            );

            CREATE TABLE IF NOT EXISTS reminder_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reminder_id INTEGER NOT NULL,
                triggered_at TEXT NOT NULL,
                stage INTEGER NOT NULL,
                message TEXT NOT NULL DEFAULT '',
                acknowledged INTEGER DEFAULT 0,
                acknowledged_at TEXT,
                FOREIGN KEY (reminder_id) REFERENCES reminders(id)
            );

            CREATE TABLE IF NOT EXISTS screenshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                image_path TEXT DEFAULT '',
                ocr_text TEXT DEFAULT '',
                ai_analysis TEXT DEFAULT '',
                app_name TEXT DEFAULT '',
                window_title TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS window_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                app_name TEXT DEFAULT '',
                window_title TEXT DEFAULT '',
                pid INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS user_profile (
                id INTEGER PRIMARY KEY DEFAULT 1,
                updated_at TEXT NOT NULL,
                big_five TEXT DEFAULT '{}',
                user_values TEXT DEFAULT '[]',
                social_preference TEXT DEFAULT '',
                work_style TEXT DEFAULT '',
                lifestyle TEXT DEFAULT '',
                summary TEXT DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS app_config (
                key TEXT PRIMARY KEY,
                value TEXT
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                title TEXT NOT NULL DEFAULT '',
                type TEXT DEFAULT 'work',
                priority TEXT DEFAULT 'medium',
                channel TEXT DEFAULT '',
                planned_minutes INTEGER DEFAULT 60,
                actual_minutes INTEGER DEFAULT 0,
                start_time TEXT,
                end_time TEXT,
                status TEXT DEFAULT 'backlog',
                date TEXT DEFAULT '',
                note TEXT DEFAULT '',
                completed_at TEXT
            );

            CREATE TABLE IF NOT EXISTS event_nodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                description TEXT DEFAULT '',
                node_type TEXT DEFAULT 'idea',
                state TEXT DEFAULT 'floating',
                parent_id INTEGER,
                related_goal_ids TEXT DEFAULT '[]',
                energy_cost INTEGER DEFAULT 0,
                estimated_time INTEGER,
                preferred_time TEXT,
                importance INTEGER DEFAULT 3,
                confidence REAL DEFAULT 0.5,
                evidence TEXT DEFAULT '[]',
                needs_confirmation INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (parent_id) REFERENCES event_nodes(id)
            );

            CREATE INDEX IF NOT EXISTS idx_event_nodes_state ON event_nodes(state);
            CREATE INDEX IF NOT EXISTS idx_event_nodes_parent ON event_nodes(parent_id);

            CREATE TABLE IF NOT EXISTS behavior_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                timestamp REAL NOT NULL,
                primary_state TEXT DEFAULT 'unknown',
                state_label TEXT DEFAULT '',
                confidence REAL DEFAULT 0.0,
                source TEXT DEFAULT 'rules_only',
                ai_overrode_rules INTEGER DEFAULT 0,
                result_json TEXT DEFAULT '{}'
            );

            CREATE INDEX IF NOT EXISTS idx_behavior_results_ts ON behavior_results(timestamp);

            CREATE TABLE IF NOT EXISTS behavior_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                result_timestamp REAL,
                correct INTEGER DEFAULT 1,
                correction TEXT DEFAULT '',
                result_json TEXT DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS daily_plans (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                status TEXT DEFAULT 'draft',
                plan_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                confirmed_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(date);

            CREATE TABLE IF NOT EXISTS commitments (
                id TEXT PRIMARY KEY,
                plan_id TEXT,
                origin_node_id TEXT,
                title TEXT,
                scheduled_start REAL,
                scheduled_duration INTEGER,
                type TEXT DEFAULT 'light_work',
                cognitive_load TEXT DEFAULT 'medium',
                priority TEXT DEFAULT 'medium',
                status TEXT DEFAULT 'scheduled',
                reason TEXT,
                skipped_reason TEXT,
                actual_start_time REAL,
                actual_end_time REAL,
                actual_duration INTEGER,
                pause_count INTEGER DEFAULT 0,
                total_pause_minutes INTEGER DEFAULT 0,
                postpone_count INTEGER DEFAULT 0,
                last_postponed_from TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_commitments_plan ON commitments(plan_id);
            CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);

            CREATE TABLE IF NOT EXISTS plan_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                entity_id TEXT,
                entity_type TEXT,
                payload TEXT DEFAULT '{}',
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_plan_events_entity ON plan_events(entity_id);
        """)
        # 迁移：为已存在的 commitments 表添加 skipped_reason 列
        try:
            cols = [r[1] for r in conn.execute("PRAGMA table_info(commitments)").fetchall()]
            if cols and "skipped_reason" not in cols:
                conn.execute("ALTER TABLE commitments ADD COLUMN skipped_reason TEXT")
        except Exception:
            pass
        conn.commit()

    # ========= 闹钟 =========
    def add_alarm(self, alarm: Alarm) -> int:
        conn = self._conn()
        c = conn.execute(
            "INSERT INTO alarms (created_at, label, time, repeat_days, is_enabled, tone) VALUES (?,?,?,?,?,?)",
            (alarm.created_at, alarm.label, alarm.time,
             json.dumps(alarm.repeat_days), int(alarm.is_enabled), alarm.tone),
        )
        conn.commit()
        return c.lastrowid

    def get_alarms(self, enabled_only: bool = False) -> list[Alarm]:
        conn = self._conn()
        sql = "SELECT * FROM alarms"
        if enabled_only:
            sql += " WHERE is_enabled=1"
        sql += " ORDER BY time"
        rows = conn.execute(sql).fetchall()
        return [self._row_to_alarm(r) for r in rows]

    def update_alarm(self, alarm: Alarm):
        conn = self._conn()
        conn.execute(
            "UPDATE alarms SET label=?, time=?, repeat_days=?, is_enabled=?, tone=?, last_triggered=? WHERE id=?",
            (alarm.label, alarm.time, json.dumps(alarm.repeat_days),
             int(alarm.is_enabled), alarm.tone, alarm.last_triggered, alarm.id),
        )
        conn.commit()

    def delete_alarm(self, alarm_id: int):
        conn = self._conn()
        conn.execute("DELETE FROM alarms WHERE id=?", (alarm_id,))
        conn.commit()

    def _row_to_alarm(self, row) -> Alarm:
        return Alarm(
            id=row["id"], created_at=row["created_at"], label=row["label"],
            time=row["time"], repeat_days=json.loads(row["repeat_days"]),
            is_enabled=bool(row["is_enabled"]), tone=row["tone"],
            last_triggered=row["last_triggered"],
        )

    # ========= 提醒 =========
    def add_reminder(self, r: Reminder) -> int:
        conn = self._conn()
        c = conn.execute(
            """INSERT INTO reminders (created_at, reminder_type, label, stage1_minutes, stage2_minutes,
               stage3_minutes, is_recurring, recurring_days, start_time, end_time, is_enabled, tone_style)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (r.created_at, r.reminder_type, r.label, r.stage1_minutes, r.stage2_minutes,
             r.stage3_minutes, int(r.is_recurring), json.dumps(r.recurring_days),
             r.start_time, r.end_time, int(r.is_enabled), r.tone_style),
        )
        conn.commit()
        return c.lastrowid

    def get_reminders(self, enabled_only: bool = False) -> list[Reminder]:
        conn = self._conn()
        sql = "SELECT * FROM reminders"
        if enabled_only:
            sql += " WHERE is_enabled=1"
        rows = conn.execute(sql).fetchall()
        return [self._row_to_reminder(r) for r in rows]

    def update_reminder(self, r: Reminder):
        conn = self._conn()
        conn.execute(
            """UPDATE reminders SET label=?, is_enabled=?, tone_style=?, last_triggered_stage=?,
               last_triggered_at=?, session_start=? WHERE id=?""",
            (r.label, int(r.is_enabled), r.tone_style, r.last_triggered_stage,
             r.last_triggered_at, r.session_start, r.id),
        )
        conn.commit()

    def delete_reminder(self, reminder_id: int):
        conn = self._conn()
        conn.execute("DELETE FROM reminders WHERE id=?", (reminder_id,))
        conn.commit()

    def log_reminder(self, log: ReminderLog) -> int:
        conn = self._conn()
        c = conn.execute(
            "INSERT INTO reminder_logs (reminder_id, triggered_at, stage, message, acknowledged) VALUES (?,?,?,?,?)",
            (log.reminder_id, log.triggered_at, log.stage, log.message, int(log.acknowledged)),
        )
        conn.commit()
        return c.lastrowid

    def _row_to_reminder(self, row) -> Reminder:
        return Reminder(
            id=row["id"], created_at=row["created_at"], reminder_type=row["reminder_type"],
            label=row["label"], stage1_minutes=row["stage1_minutes"],
            stage2_minutes=row["stage2_minutes"], stage3_minutes=row["stage3_minutes"],
            is_recurring=bool(row["is_recurring"]), recurring_days=json.loads(row["recurring_days"]),
            start_time=row["start_time"], end_time=row["end_time"],
            is_enabled=bool(row["is_enabled"]), tone_style=row["tone_style"],
            last_triggered_stage=row["last_triggered_stage"],
            last_triggered_at=row["last_triggered_at"], session_start=row["session_start"],
        )

    # ========= 截图 =========
    def add_screenshot(self, s: ScreenshotRecord) -> int:
        conn = self._conn()
        c = conn.execute(
            "INSERT INTO screenshots (created_at, image_path, ocr_text, ai_analysis, app_name, window_title) VALUES (?,?,?,?,?,?)",
            (s.created_at, s.image_path, s.ocr_text, s.ai_analysis, s.app_name, s.window_title),
        )
        conn.commit()
        return c.lastrowid

    def get_screenshots(self, limit: int = 50) -> list[ScreenshotRecord]:
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM screenshots ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [ScreenshotRecord(
            id=r["id"], created_at=r["created_at"], image_path=r["image_path"],
            ocr_text=r["ocr_text"], ai_analysis=r["ai_analysis"],
            app_name=r["app_name"], window_title=r["window_title"],
        ) for r in rows]

    # ========= 窗口活动 =========
    def add_window_event(self, e: WindowEvent) -> int:
        conn = self._conn()
        c = conn.execute(
            "INSERT INTO window_events (timestamp, app_name, window_title, pid, duration) VALUES (?,?,?,?,?)",
            (e.timestamp, e.app_name, e.window_title, e.pid, e.duration),
        )
        conn.commit()
        return c.lastrowid

    def get_window_events(self, limit: int = 100) -> list[WindowEvent]:
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM window_events ORDER BY timestamp DESC LIMIT ?", (limit,)
        ).fetchall()
        return [WindowEvent(
            id=r["id"], timestamp=r["timestamp"], app_name=r["app_name"],
            window_title=r["window_title"], pid=r["pid"], duration=r["duration"],
        ) for r in rows]

    # ========= 行为认知结果 =========
    def add_behavior_result(self, result: dict) -> int:
        """持久化一条行为认知结果"""
        conn = self._conn()
        now = datetime.now().isoformat()
        c = conn.execute(
            "INSERT INTO behavior_results (created_at, timestamp, primary_state, "
            "state_label, confidence, source, ai_overrode_rules, result_json) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (now, result.get("timestamp", 0),
             result.get("primary_state", "unknown"),
             result.get("state_label", ""),
             result.get("confidence", 0.0),
             result.get("source", "rules_only"),
             int(result.get("ai_overrode_rules", False)),
             json.dumps(result, ensure_ascii=False)),
        )
        conn.commit()
        return c.lastrowid

    def get_behavior_results(self, limit: int = 100, since: float = 0) -> list[dict]:
        """获取行为认知结果历史"""
        conn = self._conn()
        if since > 0:
            rows = conn.execute(
                "SELECT * FROM behavior_results WHERE timestamp > ? ORDER BY timestamp DESC LIMIT ?",
                (since, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM behavior_results ORDER BY timestamp DESC LIMIT ?",
                (limit,),
            ).fetchall()
        results = []
        for r in rows:
            try:
                data = json.loads(r["result_json"]) if r["result_json"] else {}
            except (json.JSONDecodeError, TypeError):
                data = {}
            results.append(data)
        return results

    def add_behavior_feedback(self, feedback: dict) -> int:
        """持久化用户对行为判断的反馈"""
        conn = self._conn()
        now = datetime.now().isoformat()
        c = conn.execute(
            "INSERT INTO behavior_feedback (created_at, result_timestamp, correct, correction, result_json) "
            "VALUES (?,?,?,?,?)",
            (now, feedback.get("timestamp", 0),
             int(feedback.get("correct", True)),
             feedback.get("correction", ""),
             json.dumps(feedback.get("result", {}), ensure_ascii=False)),
        )
        conn.commit()
        return c.lastrowid

    def get_behavior_feedback(self, limit: int = 50) -> list[dict]:
        """获取行为反馈历史"""
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM behavior_feedback ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [
            {"timestamp": r["result_timestamp"], "correct": bool(r["correct"]),
             "correction": r["correction"]}
            for r in rows
        ]

    # ========= 每日计划 =========
    def save_daily_plan(self, plan: dict) -> str:
        """保存或更新每日计划"""
        conn = self._conn()
        now = datetime.now().isoformat()
        plan_id = plan.get("id", "")
        date_str = plan.get("date", "")
        existing = conn.execute("SELECT id FROM daily_plans WHERE date = ?", (date_str,)).fetchone()
        if existing:
            conn.execute(
                "UPDATE daily_plans SET plan_json = ?, status = ? WHERE date = ?",
                (json.dumps(plan, ensure_ascii=False), plan.get("status", "draft"), date_str),
            )
            plan_id = existing["id"]
        else:
            if not plan_id:
                import uuid
                plan_id = str(uuid.uuid4())[:8]
            conn.execute(
                "INSERT INTO daily_plans (id, date, status, plan_json, created_at) VALUES (?,?,?,?,?)",
                (plan_id, date_str, plan.get("status", "draft"),
                 json.dumps(plan, ensure_ascii=False), now),
            )
        conn.commit()
        return plan_id

    def get_daily_plan(self, date_str: str = None) -> Optional[dict]:
        """获取某天的计划"""
        conn = self._conn()
        date_str = date_str or datetime.now().strftime("%Y-%m-%d")
        row = conn.execute("SELECT * FROM daily_plans WHERE date = ?", (date_str,)).fetchone()
        if row:
            try:
                return json.loads(row["plan_json"])
            except (json.JSONDecodeError, TypeError):
                return None
        return None

    def get_daily_plans_range(self, start_date: str, end_date: str) -> list[dict]:
        """获取日期范围内的计划"""
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM daily_plans WHERE date >= ? AND date <= ? ORDER BY date",
            (start_date, end_date),
        ).fetchall()
        results = []
        for r in rows:
            try:
                plan = json.loads(r["plan_json"])
                plan["id"] = r["id"]
                plan["status"] = r["status"]
                results.append(plan)
            except (json.JSONDecodeError, TypeError):
                pass
        return results

    # ========= 承诺 =========
    def save_commitment(self, comm: dict) -> str:
        """保存承诺"""
        conn = self._conn()
        now = datetime.now().isoformat()
        comm_id = comm.get("id", "")
        existing = conn.execute("SELECT id FROM commitments WHERE id = ?", (comm_id,)).fetchone() if comm_id else None
        if existing:
            conn.execute(
                "UPDATE commitments SET plan_id=?, origin_node_id=?, title=?, "
                "scheduled_start=?, scheduled_duration=?, type=?, cognitive_load=?, "
                "priority=?, status=?, reason=?, actual_start_time=?, actual_end_time=?, "
                "actual_duration=?, pause_count=?, total_pause_minutes=?, "
                "postpone_count=?, last_postponed_from=?, updated_at=? WHERE id=?",
                (comm.get("planId",""), comm.get("originNodeId",""), comm.get("title",""),
                 comm.get("scheduledStart",0), comm.get("scheduledDuration",45),
                 comm.get("type","light_work"), comm.get("cognitiveLoad","medium"),
                 comm.get("priority","medium"), comm.get("status","scheduled"),
                 comm.get("reason",""),
                 comm.get("actualStartTime"), comm.get("actualEndTime"),
                 comm.get("actualDuration"),
                 comm.get("pauseCount",0), comm.get("totalPauseMinutes",0),
                 comm.get("postponeCount",0), comm.get("lastPostponedFrom"),
                 now, comm_id),
            )
        else:
            if not comm_id:
                import uuid
                comm_id = str(uuid.uuid4())[:8]
            conn.execute(
                "INSERT INTO commitments (id, plan_id, origin_node_id, title, "
                "scheduled_start, scheduled_duration, type, cognitive_load, priority, "
                "status, reason, actual_start_time, actual_end_time, actual_duration, "
                "pause_count, total_pause_minutes, postpone_count, last_postponed_from, "
                "created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (comm_id, comm.get("planId",""), comm.get("originNodeId",""), comm.get("title",""),
                 comm.get("scheduledStart",0), comm.get("scheduledDuration",45),
                 comm.get("type","light_work"), comm.get("cognitiveLoad","medium"),
                 comm.get("priority","medium"), comm.get("status","scheduled"),
                 comm.get("reason",""),
                 comm.get("actualStartTime"), comm.get("actualEndTime"),
                 comm.get("actualDuration"),
                 comm.get("pauseCount",0), comm.get("totalPauseMinutes",0),
                 comm.get("postponeCount",0), comm.get("lastPostponedFrom"),
                 now, now),
            )
        conn.commit()
        return comm_id

    def get_commitments_by_plan(self, plan_id: str) -> list[dict]:
        """获取某计划的所有承诺"""
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM commitments WHERE plan_id = ? ORDER BY scheduled_start",
            (plan_id,),
        ).fetchall()
        return [self._row_to_commitment(r) for r in rows]

    def get_commitments_by_date(self, date_str: str = None) -> list[dict]:
        """获取某天的所有承诺"""
        conn = self._conn()
        date_str = date_str or datetime.now().strftime("%Y-%m-%d")
        # 通过 plan 的 date 关联
        plan = conn.execute("SELECT id FROM daily_plans WHERE date = ?", (date_str,)).fetchone()
        if not plan:
            return []
        rows = conn.execute(
            "SELECT * FROM commitments WHERE plan_id = ? ORDER BY scheduled_start",
            (plan["id"],),
        ).fetchall()
        return [self._row_to_commitment(r) for r in rows]

    def get_commitment(self, comm_id: str) -> Optional[dict]:
        """获取单个承诺"""
        conn = self._conn()
        row = conn.execute("SELECT * FROM commitments WHERE id = ?", (comm_id,)).fetchone()
        return self._row_to_commitment(row) if row else None

    def update_commitment_status(self, comm_id: str, status: str, extra: dict = None) -> bool:
        """更新承诺状态"""
        conn = self._conn()
        now = datetime.now().isoformat()
        extra = extra or {}
        sets = ["status = ?", "updated_at = ?"]
        vals = [status, now]
        for k, v in extra.items():
            snake = k
            if k == "actualStartTime": snake = "actual_start_time"
            elif k == "actualEndTime": snake = "actual_end_time"
            elif k == "actualDuration": snake = "actual_duration"
            elif k == "pauseCount": snake = "pause_count"
            elif k == "totalPauseMinutes": snake = "total_pause_minutes"
            elif k == "postponeCount": snake = "postpone_count"
            elif k == "lastPostponedFrom": snake = "last_postponed_from"
            elif k == "skippedReason": snake = "skipped_reason"
            sets.append(f"{snake} = ?")
            vals.append(v)
        vals.append(comm_id)
        conn.execute(f"UPDATE commitments SET {', '.join(sets)} WHERE id = ?", vals)
        conn.commit()
        return True

    def _row_to_commitment(self, row) -> dict:
        return {
            "id": row["id"],
            "planId": row["plan_id"],
            "originNodeId": row["origin_node_id"],
            "title": row["title"],
            "scheduledStart": row["scheduled_start"],
            "scheduledDuration": row["scheduled_duration"],
            "type": row["type"],
            "cognitiveLoad": row["cognitive_load"],
            "priority": row["priority"],
            "status": row["status"],
            "reason": row["reason"],
            "skippedReason": row["skipped_reason"] if "skipped_reason" in row.keys() else None,
            "actualStartTime": row["actual_start_time"],
            "actualEndTime": row["actual_end_time"],
            "actualDuration": row["actual_duration"],
            "pauseCount": row["pause_count"],
            "totalPauseMinutes": row["total_pause_minutes"],
            "postponeCount": row["postpone_count"],
            "lastPostponedFrom": row["last_postponed_from"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }

    # ========= 计划事件溯源 =========
    def add_plan_event(self, event_type: str, entity_id: str, entity_type: str, payload: dict):
        """记录计划/承诺生命周期事件"""
        conn = self._conn()
        now = datetime.now().isoformat()
        conn.execute(
            "INSERT INTO plan_events (event_type, entity_id, entity_type, payload, created_at) "
            "VALUES (?,?,?,?,?)",
            (event_type, entity_id, entity_type,
             json.dumps(payload, ensure_ascii=False), now),
        )
        conn.commit()

    def get_plan_events(self, entity_id: str = None, limit: int = 50) -> list[dict]:
        """获取计划事件历史"""
        conn = self._conn()
        if entity_id:
            rows = conn.execute(
                "SELECT * FROM plan_events WHERE entity_id = ? ORDER BY created_at DESC LIMIT ?",
                (entity_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM plan_events ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
        results = []
        for r in rows:
            try:
                payload = json.loads(r["payload"]) if r["payload"] else {}
            except (json.JSONDecodeError, TypeError):
                payload = {}
            results.append({
                "id": r["id"], "eventType": r["event_type"],
                "entityId": r["entity_id"], "entityType": r["entity_type"],
                "payload": payload, "createdAt": r["created_at"],
            })
        return results

    # ========= 用户画像 =========
    def get_profile(self) -> UserProfile:
        conn = self._conn()
        row = conn.execute("SELECT * FROM user_profile WHERE id=1").fetchone()
        if not row:
            return UserProfile()
        return UserProfile(
            id=1, updated_at=row["updated_at"],
            big_five=json.loads(row["big_five"]),
            values=json.loads(row["user_values"]),
            social_preference=row["social_preference"],
            work_style=row["work_style"], lifestyle=row["lifestyle"],
            summary=row["summary"],
        )

    def save_profile(self, p: UserProfile):
        conn = self._conn()
        conn.execute(
            """INSERT OR REPLACE INTO user_profile (id, updated_at, big_five, user_values, social_preference, work_style, lifestyle, summary)
               VALUES (1,?,?,?,?,?,?,?)""",
            (_now_iso(), json.dumps(p.big_five, ensure_ascii=False),
             json.dumps(p.values, ensure_ascii=False), p.social_preference,
             p.work_style, p.lifestyle, p.summary),
        )
        conn.commit()

    # ========= 配置 =========
    def get_config(self, key: str, default: str = None) -> Optional[str]:
        conn = self._conn()
        row = conn.execute("SELECT value FROM app_config WHERE key=?", (key,)).fetchone()
        if row is None:
            return default
        val = row["value"]
        # 空字符串或None时返回默认值，避免配置项存在但值为空导致问题
        if val is None or (isinstance(val, str) and val.strip() == ""):
            return default
        return val

    def set_config(self, key: str, value: str):
        conn = self._conn()
        conn.execute("INSERT OR REPLACE INTO app_config (key, value) VALUES (?,?)", (key, value))
        conn.commit()

    def get_all_config(self) -> dict:
        conn = self._conn()
        rows = conn.execute("SELECT key, value FROM app_config").fetchall()
        return {r["key"]: r["value"] for r in rows}

    # ========= 任务（Sunsama 风格工作区）=========
    def add_task(self, t: Task) -> int:
        conn = self._conn()
        c = conn.execute(
            """INSERT INTO tasks (created_at, title, type, priority, channel, planned_minutes,
               actual_minutes, start_time, end_time, status, date, note, completed_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (t.created_at, t.title, t.type, t.priority, t.channel, t.planned_minutes,
             t.actual_minutes, t.start_time, t.end_time, t.status, t.date, t.note, t.completed_at),
        )
        conn.commit()
        return c.lastrowid

    def get_tasks_by_date(self, date_str: str) -> list[Task]:
        """获取某天的任务（planned 的 + backlog 中无日期或该日期的）"""
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM tasks WHERE date=? OR (status='backlog' AND (date='' OR date IS NULL)) ORDER BY start_time IS NULL, start_time, id",
            (date_str,),
        ).fetchall()
        return [self._row_to_task(r) for r in rows]

    def get_tasks_range(self, start_date: str, end_date: str) -> list[Task]:
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM tasks WHERE date>=? AND date<=? ORDER BY date, start_time IS NULL, start_time",
            (start_date, end_date),
        ).fetchall()
        return [self._row_to_task(r) for r in rows]

    def get_backlog_tasks(self) -> list[Task]:
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM tasks WHERE status='backlog' ORDER BY priority DESC, created_at"
        ).fetchall()
        return [self._row_to_task(r) for r in rows]

    def get_all_tasks(self, limit: int = 500) -> list[Task]:
        conn = self._conn()
        rows = conn.execute(
            "SELECT * FROM tasks ORDER BY date DESC, start_time IS NULL, start_time LIMIT ?", (limit,)
        ).fetchall()
        return [self._row_to_task(r) for r in rows]

    def update_task(self, t: Task):
        conn = self._conn()
        conn.execute(
            """UPDATE tasks SET title=?, type=?, priority=?, channel=?, planned_minutes=?,
               actual_minutes=?, start_time=?, end_time=?, status=?, date=?, note=?, completed_at=?
               WHERE id=?""",
            (t.title, t.type, t.priority, t.channel, t.planned_minutes,
             t.actual_minutes, t.start_time, t.end_time, t.status, t.date, t.note, t.completed_at, t.id),
        )
        conn.commit()

    def delete_task(self, task_id: int):
        conn = self._conn()
        conn.execute("DELETE FROM tasks WHERE id=?", (task_id,))
        conn.commit()

    def _row_to_task(self, row) -> Task:
        return Task(
            id=row["id"], created_at=row["created_at"], title=row["title"],
            type=row["type"], priority=row["priority"], channel=row["channel"],
            planned_minutes=row["planned_minutes"], actual_minutes=row["actual_minutes"],
            start_time=row["start_time"], end_time=row["end_time"], status=row["status"],
            date=row["date"], note=row["note"], completed_at=row["completed_at"],
        )
