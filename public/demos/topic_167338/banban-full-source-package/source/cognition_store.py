"""
伴伴 认知数据层

整合《AI认知层交互与开发规格 V1.0》和《人格画像规格 V1》，
将八维认知图谱、证据系统、沟通画像、用户模型持久化到 SQLite。

八维认知图谱（对应认知层文档第2章）：
  1. personality_traits   人格特质
  2. action_patterns      行动模式
  3. work_style           工作方式
  4. time_energy          时间能量
  5. emotion_stress       情绪压力
  6. goals_values         目标价值观
  7. constraints          约束条件
  8. communication_style  沟通风格

每个维度对应人格画像的 TraitCluster，包含：
  - cognition_sentence: 一句话认知（"你倾向于..."）
  - value: 结构化值（大五人格、能量节奏等）
  - confidence: 0-1 置信度
  - evidence_list: 证据列表
  - scope: universal / work_only / recent_only
  - status: active / paused
  - timeline: 变更历史
"""

import json
import sqlite3
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import Optional
from companion_db import Database


# ============================================================
# 八维认知维度定义
# ============================================================
COGNITION_DIMENSIONS = [
    {
        "id": "personality_traits",
        "label": "人格特质",
        "icon": "🧠",
        "description": "你的思维和反应模式",
        "fields": ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"],
    },
    {
        "id": "action_patterns",
        "label": "行动模式",
        "icon": "⚡",
        "description": "你倾向于怎样开始和完成任务",
        "fields": ["initiation", "persistence", "completion", "procrastination_tendency"],
    },
    {
        "id": "work_style",
        "label": "工作方式",
        "icon": "💼",
        "description": "你高效工作的条件偏好",
        "fields": ["focus_style", "planning_style", "collaboration_style", "environment_preference"],
    },
    {
        "id": "time_energy",
        "label": "时间能量",
        "icon": "🔋",
        "description": "你的能量节奏和高效时段",
        "fields": ["morning", "afternoon", "evening", "night", "peak_hours"],
    },
    {
        "id": "emotion_stress",
        "label": "情绪压力",
        "icon": "🌊",
        "description": "你的情绪基线和压力反应",
        "fields": ["baseline_mood", "stress_response", "recovery_speed", "triggers"],
    },
    {
        "id": "goals_values",
        "label": "目标价值观",
        "icon": "🎯",
        "description": "你在意什么、追求什么",
        "fields": ["core_values", "current_goals", "long_term_vision", "avoidance"],
    },
    {
        "id": "constraints",
        "label": "约束条件",
        "icon": "🚧",
        "description": "影响你行动的现实限制",
        "fields": ["time_constraints", "resource_constraints", "skill_gaps", "external_dependencies"],
    },
    {
        "id": "communication_style",
        "label": "沟通风格",
        "icon": "💬",
        "description": "你喜欢的被对待方式",
        "fields": ["default_tone", "reminder_style", "interruption_tolerance", "effective_styles", "avoid_styles"],
    },
]

DIMENSION_MAP = {d["id"]: d for d in COGNITION_DIMENSIONS}


def _now_iso() -> str:
    return datetime.now().isoformat()


# ============================================================
# 数据模型
# ============================================================

@dataclass
class Evidence:
    """证据条目 — 对应人格画像文档 Evidence"""
    id: str = ""
    dimension: str = ""           # 属于哪个维度
    source: str = "observed"      # observed | onboarding | chat | review | ai_inference | user_stated
    source_id: Optional[str] = None  # 关联的消息ID/截图ID等
    content: str = ""             # 证据内容描述
    weight: float = 1.0           # 权重 0-1
    timestamp: str = field(default_factory=_now_iso)
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class CognitionItem:
    """一个维度的认知 — 对应认知层文档 CognitionItem + 人格画像 TraitCluster

    V2 增强（对齐 schemas.ts cognitionItemSchema）：
    - perspective: 6 视角（long_term/current_state/behavior/self_description/ai_hypothesis/conflict_unknown）
    - status: 6 状态（observing/supported/confirmed/modified/paused/expired）
    - effects: 影响哪些模块（conversation/planning/reminder/today/proactive_contact）
    - exceptions: 例外情况列表
    - scope_list: 适用范围列表（如 ["工作项目"]）
    - valid_from/valid_until: 时间有效期
    - version: 版本号
    """
    dimension: str = ""
    cognition_sentence: str = ""
    value: dict = field(default_factory=dict)
    confidence: float = 0.0
    scope: str = "universal"       # 旧字段保留：universal/work_only/recent_only
    status: str = "observing"      # V2: observing/supported/confirmed/modified/paused/expired
    perspective: str = "ai_hypothesis"  # V2: 6 视角
    effects: list = field(default_factory=list)    # V2: [{module, description}]
    exceptions: list = field(default_factory=list) # V2: 例外情况
    scope_list: list = field(default_factory=list) # V2: 适用范围
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    version: int = 1
    evidence_ids: list = field(default_factory=list)
    last_updated: str = field(default_factory=_now_iso)
    correction_count: int = 0

    def to_dict(self) -> dict:
        return {
            "dimension": self.dimension,
            "label": DIMENSION_MAP.get(self.dimension, {}).get("label", self.dimension),
            "icon": DIMENSION_MAP.get(self.dimension, {}).get("icon", "❓"),
            "description": DIMENSION_MAP.get(self.dimension, {}).get("description", ""),
            "cognitionSentence": self.cognition_sentence,
            "value": self.value,
            "confidence": self.confidence,
            "scope": self.scope,
            "status": self.status,
            "perspective": self.perspective,
            "effects": self.effects,
            "exceptions": self.exceptions,
            "scopeList": self.scope_list,
            "validFrom": self.valid_from,
            "validUntil": self.valid_until,
            "version": self.version,
            "evidenceIds": self.evidence_ids,
            "lastUpdated": self.last_updated,
            "correctionCount": self.correction_count,
        }


@dataclass
class CommunicationProfile:
    """沟通画像 — 持久化版本"""
    default_tone: str = "warm_direct"
    reminder_style: str = "gentle_nudge"
    interruption_tolerance: str = "low"
    avoid_styles: list = field(default_factory=lambda: ["命令式", "说教式", "频繁打断"])
    effective_styles: list = field(default_factory=lambda: ["具体建议", "轻量提醒", "给出下一步动作"])
    updated_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(d: dict) -> "CommunicationProfile":
        return CommunicationProfile(
            default_tone=d.get("default_tone", "warm_direct"),
            reminder_style=d.get("reminder_style", "gentle_nudge"),
            interruption_tolerance=d.get("interruption_tolerance", "low"),
            avoid_styles=d.get("avoid_styles", ["命令式", "说教式", "频繁打断"]),
            effective_styles=d.get("effective_styles", ["具体建议", "轻量提醒", "给出下一步动作"]),
            updated_at=d.get("updated_at", _now_iso()),
        )


# 用户修正动作（对应认知层文档 5.3）
CORRECTION_TYPES = [
    "accurate",           # 准确，加强置信度
    "work_only",          # 只适用于工作
    "recent_only",        # 只是最近如此
    "inaccurate",         # 这句话不准确
    "pause",              # 暂停使用
]


# ============================================================
# CognitionStore — 认知数据存储
# ============================================================

class CognitionStore:
    """
    认知数据存储层 — 管理八维认知、证据、沟通画像
    所有数据持久化到 companion_db.Database 的 SQLite 中。
    """

    def __init__(self, db: Database = None):
        self.db = db or Database()
        self._ensure_tables()

    def _ensure_tables(self):
        conn = self.db._conn()

        # 八维认知条目 — V2 增强列
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cognition_items (
                dimension TEXT PRIMARY KEY,
                cognition_sentence TEXT NOT NULL DEFAULT '',
                value TEXT NOT NULL DEFAULT '{}',
                confidence REAL NOT NULL DEFAULT 0.0,
                scope TEXT NOT NULL DEFAULT 'universal',
                status TEXT NOT NULL DEFAULT 'observing',
                evidence_ids TEXT NOT NULL DEFAULT '[]',
                last_updated TEXT NOT NULL,
                correction_count INTEGER NOT NULL DEFAULT 0,
                perspective TEXT NOT NULL DEFAULT 'ai_hypothesis',
                effects TEXT NOT NULL DEFAULT '[]',
                exceptions TEXT NOT NULL DEFAULT '[]',
                scope_list TEXT NOT NULL DEFAULT '[]',
                valid_from TEXT,
                valid_until TEXT,
                version INTEGER NOT NULL DEFAULT 1
            )
        """)

        # V2 迁移：为旧表添加新列（如果不存在）
        try:
            cols = conn.execute("PRAGMA table_info(cognition_items)").fetchall()
            col_names = {c["name"] for c in cols}
            migrations = [
                ("perspective", "TEXT NOT NULL DEFAULT 'ai_hypothesis'"),
                ("effects", "TEXT NOT NULL DEFAULT '[]'"),
                ("exceptions", "TEXT NOT NULL DEFAULT '[]'"),
                ("scope_list", "TEXT NOT NULL DEFAULT '[]'"),
                ("valid_from", "TEXT"),
                ("valid_until", "TEXT"),
                ("version", "INTEGER NOT NULL DEFAULT 1"),
            ]
            for col_name, col_def in migrations:
                if col_name not in col_names:
                    conn.execute(f"ALTER TABLE cognition_items ADD COLUMN {col_name} {col_def}")
            # 迁移旧状态值：active → observing, paused → paused
            conn.execute("UPDATE cognition_items SET status='observing' WHERE status='active'")
        except Exception:
            pass

        # 证据表
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cognition_evidence (
                id TEXT PRIMARY KEY,
                dimension TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'observed',
                source_id TEXT,
                content TEXT NOT NULL DEFAULT '',
                weight REAL NOT NULL DEFAULT 1.0,
                timestamp TEXT NOT NULL,
                metadata TEXT NOT NULL DEFAULT '{}'
            )
        """)

        # 认知修正记录
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cognition_corrections (
                id TEXT PRIMARY KEY,
                dimension TEXT NOT NULL,
                correction_type TEXT NOT NULL,
                note TEXT,
                old_sentence TEXT,
                new_sentence TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # V2 新增：认知维度间关系表
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cognition_relations (
                id TEXT PRIMARY KEY,
                source_dimension TEXT NOT NULL,
                target_dimension TEXT NOT NULL,
                label TEXT NOT NULL DEFAULT '',
                confidence REAL NOT NULL DEFAULT 0.0,
                created_at TEXT NOT NULL
            )
        """)

        # 沟通画像（单行，id=1）
        conn.execute("""
            CREATE TABLE IF NOT EXISTS communication_profile (
                id INTEGER PRIMARY KEY DEFAULT 1,
                default_tone TEXT NOT NULL DEFAULT 'warm_direct',
                reminder_style TEXT NOT NULL DEFAULT 'gentle_nudge',
                interruption_tolerance TEXT NOT NULL DEFAULT 'low',
                avoid_styles TEXT NOT NULL DEFAULT '["命令式","说教式","频繁打断"]',
                effective_styles TEXT NOT NULL DEFAULT '["具体建议","轻量提醒","给出下一步动作"]',
                updated_at TEXT NOT NULL
            )
        """)

        # 用户模型快照（单行，id=1）— update_user_model 的输出持久化
        # 迁移：如果旧表有 values 列（SQLite保留字），重命名为 user_values
        try:
            cols = conn.execute("PRAGMA table_info(user_model_snapshot)").fetchall()
            col_names = [c["name"] for c in cols]
            if "values" in col_names and "user_values" not in col_names:
                conn.execute("ALTER TABLE user_model_snapshot RENAME COLUMN \"values\" TO user_values")
        except Exception:
            pass

        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_model_snapshot (
                id INTEGER PRIMARY KEY DEFAULT 1,
                goals TEXT NOT NULL DEFAULT '[]',
                user_values TEXT NOT NULL DEFAULT '[]',
                big_five TEXT NOT NULL DEFAULT '{}',
                energy_pattern TEXT NOT NULL DEFAULT '{}',
                work_style TEXT NOT NULL DEFAULT '',
                lifestyle TEXT NOT NULL DEFAULT '',
                patterns TEXT NOT NULL DEFAULT '[]',
                summary TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            )
        """)

        # V2 新增：Onboarding 草稿存储（单行，id=1）
        conn.execute("""
            CREATE TABLE IF NOT EXISTS onboarding_draft (
                id INTEGER PRIMARY KEY DEFAULT 1,
                draft_data TEXT NOT NULL DEFAULT '{}',
                completed INTEGER NOT NULL DEFAULT 0,
                user_model_v2 TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # UCM-8 认知模型存储（单行，id=1）
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ucm8_profile (
                id INTEGER PRIMARY KEY DEFAULT 1,
                draft_data TEXT NOT NULL DEFAULT '{}',
                profile_data TEXT NOT NULL DEFAULT '{}',
                user_model_v2 TEXT NOT NULL DEFAULT '{}',
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # 初始化默认行
        conn.execute("INSERT OR IGNORE INTO communication_profile (id, updated_at) VALUES (1, ?)", (_now_iso(),))
        conn.execute("INSERT OR IGNORE INTO user_model_snapshot (id, updated_at) VALUES (1, ?)", (_now_iso(),))
        conn.execute("INSERT OR IGNORE INTO onboarding_draft (id, created_at, updated_at) VALUES (1, ?, ?)",
                       (_now_iso(), _now_iso()))
        conn.execute("INSERT OR IGNORE INTO ucm8_profile (id, created_at, updated_at) VALUES (1, ?, ?)",
                       (_now_iso(), _now_iso()))

        # 初始化8个维度默认行
        for dim in COGNITION_DIMENSIONS:
            conn.execute(
                "INSERT OR IGNORE INTO cognition_items (dimension, cognition_sentence, last_updated) VALUES (?, '', ?)",
                (dim["id"], _now_iso())
            )

        conn.commit()

    # ============================================================
    # 认知条目 CRUD
    # ============================================================

    def get_item(self, dimension: str) -> Optional[CognitionItem]:
        conn = self.db._conn()
        row = conn.execute(
            "SELECT * FROM cognition_items WHERE dimension=?", (dimension,)
        ).fetchone()
        if not row:
            return None
        return CognitionItem(
            dimension=row["dimension"],
            cognition_sentence=row["cognition_sentence"],
            value=json.loads(row["value"]),
            confidence=row["confidence"],
            scope=row["scope"],
            status=row["status"],
            perspective=row["perspective"] if "perspective" in row.keys() else "ai_hypothesis",
            effects=json.loads(row["effects"]) if "effects" in row.keys() else [],
            exceptions=json.loads(row["exceptions"]) if "exceptions" in row.keys() else [],
            scope_list=json.loads(row["scope_list"]) if "scope_list" in row.keys() else [],
            valid_from=row["valid_from"] if "valid_from" in row.keys() else None,
            valid_until=row["valid_until"] if "valid_until" in row.keys() else None,
            version=row["version"] if "version" in row.keys() else 1,
            evidence_ids=json.loads(row["evidence_ids"]),
            last_updated=row["last_updated"],
            correction_count=row["correction_count"],
        )

    def get_all_items(self) -> list:
        return [self.get_item(d["id"]) for d in COGNITION_DIMENSIONS if self.get_item(d["id"])]

    def update_item(self, dimension: str, sentence: str = None, value: dict = None,
                    confidence: float = None, scope: str = None, status: str = None,
                    perspective: str = None, effects: list = None,
                    exceptions: list = None, scope_list: list = None) -> CognitionItem:
        item = self.get_item(dimension)
        if not item:
            item = CognitionItem(dimension=dimension)

        if sentence is not None:
            item.cognition_sentence = sentence
        if value is not None:
            item.value = value
        if confidence is not None:
            item.confidence = confidence
        if scope is not None:
            item.scope = scope
        if status is not None:
            item.status = status
        if perspective is not None:
            item.perspective = perspective
        if effects is not None:
            item.effects = effects
        if exceptions is not None:
            item.exceptions = exceptions
        if scope_list is not None:
            item.scope_list = scope_list
        item.last_updated = _now_iso()
        item.version += 1

        conn = self.db._conn()
        conn.execute("""
            INSERT OR REPLACE INTO cognition_items
                (dimension, cognition_sentence, value, confidence, scope, status,
                 perspective, effects, exceptions, scope_list, valid_from, valid_until, version,
                 evidence_ids, last_updated, correction_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item.dimension, item.cognition_sentence,
            json.dumps(item.value, ensure_ascii=False),
            item.confidence, item.scope, item.status,
            item.perspective,
            json.dumps(item.effects, ensure_ascii=False),
            json.dumps(item.exceptions, ensure_ascii=False),
            json.dumps(item.scope_list, ensure_ascii=False),
            item.valid_from, item.valid_until, item.version,
            json.dumps(item.evidence_ids, ensure_ascii=False),
            item.last_updated, item.correction_count,
        ))
        conn.commit()
        return item

    # ============================================================
    # 证据管理
    # ============================================================

    def add_evidence(self, dimension: str, source: str, content: str,
                     source_id: str = None, weight: float = 1.0,
                     metadata: dict = None) -> Evidence:
        import uuid
        ev = Evidence(
            id=str(uuid.uuid4()),
            dimension=dimension,
            source=source,
            source_id=source_id,
            content=content,
            weight=weight,
            metadata=metadata or {},
        )
        conn = self.db._conn()
        conn.execute("""
            INSERT INTO cognition_evidence
                (id, dimension, source, source_id, content, weight, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ev.id, ev.dimension, ev.source, ev.source_id,
            ev.content, ev.weight, ev.timestamp,
            json.dumps(ev.metadata, ensure_ascii=False),
        ))
        # 将证据ID添加到对应维度的 evidence_ids
        item = self.get_item(dimension)
        if item and ev.id not in item.evidence_ids:
            item.evidence_ids.append(ev.id)
            conn.execute(
                "UPDATE cognition_items SET evidence_ids=? WHERE dimension=?",
                (json.dumps(item.evidence_ids, ensure_ascii=False), dimension)
            )
        conn.commit()
        return ev

    def get_evidence(self, dimension: str = None, limit: int = 50) -> list:
        conn = self.db._conn()
        if dimension:
            rows = conn.execute(
                "SELECT * FROM cognition_evidence WHERE dimension=? ORDER BY timestamp DESC LIMIT ?",
                (dimension, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM cognition_evidence ORDER BY timestamp DESC LIMIT ?", (limit,)
            ).fetchall()
        return [Evidence(
            id=r["id"], dimension=r["dimension"], source=r["source"],
            source_id=r["source_id"], content=r["content"], weight=r["weight"],
            timestamp=r["timestamp"], metadata=json.loads(r["metadata"]),
        ) for r in rows]

    # ============================================================
    # 用户修正
    # ============================================================

    def correct_item(self, dimension: str, correction_type: str,
                     note: str = None, new_sentence: str = None) -> dict:
        """
        用户修正认知项 — 对应认知层文档 5.3
        correction_type: accurate / work_only / recent_only / inaccurate / pause
        """
        item = self.get_item(dimension)
        if not item:
            return {"error": "dimension not found"}

        old_sentence = item.cognition_sentence
        import uuid

        conn = self.db._conn()

        if correction_type == "accurate":
            # 加强置信度，状态变为 confirmed
            item.confidence = min(item.confidence + 0.1, 1.0)
            item.status = "confirmed"
        elif correction_type == "work_only":
            item.scope = "work_only"
            item.scope_list = ["工作项目"]
            item.status = "modified"
        elif correction_type == "recent_only":
            item.scope = "recent_only"
            item.status = "modified"
        elif correction_type == "inaccurate":
            # 降低置信度，状态变为 modified，如果有新句子则替换
            item.confidence = max(item.confidence - 0.3, 0.0)
            item.status = "modified"
            if new_sentence:
                item.cognition_sentence = new_sentence
        elif correction_type == "pause":
            item.status = "paused"

        item.correction_count += 1
        item.last_updated = _now_iso()

        # 记录修正历史
        conn.execute("""
            INSERT INTO cognition_corrections
                (id, dimension, correction_type, note, old_sentence, new_sentence, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), dimension, correction_type, note,
            old_sentence, item.cognition_sentence, _now_iso(),
        ))

        # 更新条目
        conn.execute("""
            UPDATE cognition_items SET
                cognition_sentence=?, value=?, confidence=?, scope=?, status=?,
                evidence_ids=?, last_updated=?, correction_count=?
            WHERE dimension=?
        """, (
            item.cognition_sentence,
            json.dumps(item.value, ensure_ascii=False),
            item.confidence, item.scope, item.status,
            json.dumps(item.evidence_ids, ensure_ascii=False),
            item.last_updated, item.correction_count, dimension,
        ))
        conn.commit()

        return {"ok": True, "item": item.to_dict()}

    def get_corrections(self, dimension: str = None, limit: int = 20) -> list:
        conn = self.db._conn()
        if dimension:
            rows = conn.execute(
                "SELECT * FROM cognition_corrections WHERE dimension=? ORDER BY created_at DESC LIMIT ?",
                (dimension, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM cognition_corrections ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(r) for r in rows]

    # ============================================================
    # 沟通画像
    # ============================================================

    def get_communication_profile(self) -> CommunicationProfile:
        conn = self.db._conn()
        row = conn.execute("SELECT * FROM communication_profile WHERE id=1").fetchone()
        if not row:
            return CommunicationProfile()
        return CommunicationProfile(
            default_tone=row["default_tone"],
            reminder_style=row["reminder_style"],
            interruption_tolerance=row["interruption_tolerance"],
            avoid_styles=json.loads(row["avoid_styles"]),
            effective_styles=json.loads(row["effective_styles"]),
            updated_at=row["updated_at"],
        )

    def update_communication_profile(self, patch: dict) -> CommunicationProfile:
        profile = self.get_communication_profile()
        if "default_tone" in patch:
            profile.default_tone = patch["default_tone"]
        if "reminder_style" in patch:
            profile.reminder_style = patch["reminder_style"]
        if "interruption_tolerance" in patch:
            profile.interruption_tolerance = patch["interruption_tolerance"]
        if "avoid_styles" in patch:
            profile.avoid_styles = patch["avoid_styles"]
        if "effective_styles" in patch:
            profile.effective_styles = patch["effective_styles"]
        profile.updated_at = _now_iso()

        conn = self.db._conn()
        conn.execute("""
            UPDATE communication_profile SET
                default_tone=?, reminder_style=?, interruption_tolerance=?,
                avoid_styles=?, effective_styles=?, updated_at=?
            WHERE id=1
        """, (
            profile.default_tone, profile.reminder_style, profile.interruption_tolerance,
            json.dumps(profile.avoid_styles, ensure_ascii=False),
            json.dumps(profile.effective_styles, ensure_ascii=False),
            profile.updated_at,
        ))
        conn.commit()
        return profile

    # ============================================================
    # 用户模型快照
    # ============================================================

    def get_user_model(self) -> dict:
        conn = self.db._conn()
        row = conn.execute("SELECT * FROM user_model_snapshot WHERE id=1").fetchone()
        if not row:
            return {"goals": [], "values": [], "big_five": {}, "energy_pattern": {},
                    "work_style": "", "lifestyle": "", "patterns": [], "summary": ""}
        return {
            "goals": json.loads(row["goals"]),
            "values": json.loads(row["user_values"]),
            "big_five": json.loads(row["big_five"]),
            "energy_pattern": json.loads(row["energy_pattern"]),
            "work_style": row["work_style"],
            "lifestyle": row["lifestyle"],
            "patterns": json.loads(row["patterns"]),
            "summary": row["summary"],
            "updated_at": row["updated_at"],
        }

    def update_user_model(self, updates: dict) -> dict:
        """保存 update_user_model AI方法的输出"""
        current = self.get_user_model()
        for key in ["goals", "values", "big_five", "energy_pattern",
                     "work_style", "lifestyle", "patterns", "summary"]:
            if key in updates:
                current[key] = updates[key]
        current["updated_at"] = _now_iso()

        conn = self.db._conn()
        conn.execute("""
            UPDATE user_model_snapshot SET
                goals=?, user_values=?, big_five=?, energy_pattern=?,
                work_style=?, lifestyle=?, patterns=?, summary=?, updated_at=?
            WHERE id=1
        """, (
            json.dumps(current["goals"], ensure_ascii=False),
            json.dumps(current["values"], ensure_ascii=False),
            json.dumps(current["big_five"], ensure_ascii=False),
            json.dumps(current["energy_pattern"], ensure_ascii=False),
            current["work_style"], current["lifestyle"],
            json.dumps(current["patterns"], ensure_ascii=False),
            current["summary"], current["updated_at"],
        ))
        conn.commit()
        return current

    # ============================================================
    # 上下文摘要 — 对应认知层文档 6.1 /api/cognition/context-summary
    # ============================================================

    def get_context_summary(self) -> dict:
        """返回S0常驻态所需的最小摘要"""
        items = self.get_all_items()
        # V2: 活跃状态 = 非 paused 且非 expired
        active = [i for i in items if i.status not in ("paused", "expired")]
        high_conf = [i for i in active if i.confidence >= 0.7]
        low_conf = [i for i in active if i.confidence < 0.4]
        confirmed = [i for i in active if i.status == "confirmed"]

        # 拼接核心认知句
        sentences = [i.cognition_sentence for i in high_conf if i.cognition_sentence]

        return {
            "cognitionSentence": "；".join(sentences[:3]) if sentences else "我还在了解你",
            "dimensionCount": len(active),
            "highConfidenceCount": len(high_conf),
            "lowConfidenceCount": len(low_conf),
            "confirmedCount": len(confirmed),
            "pausedCount": len([i for i in items if i.status == "paused"]),
            "lastUpdated": max((i.last_updated for i in items), default=""),
        }

    # ============================================================
    # 认知地图 — 对应认知层文档 6.2 /api/cognition/map
    # ============================================================

    def get_map(self) -> dict:
        """返回S2完整态所需的八维认知图谱"""
        items = self.get_all_items()
        return {
            "dimensions": [d["id"] for d in COGNITION_DIMENSIONS],
            "items": {item.dimension: item.to_dict() for item in items},
            "relations": self.get_relations(),
            "totalEvidence": len(self.get_evidence(limit=1000)),
            "communicationProfile": self.get_communication_profile().to_dict(),
            "userModel": self.get_user_model(),
            "userModelV2": self.get_user_model_v2(),
        }

    # ============================================================
    # 批量更新（AI分析结果写入）
    # ============================================================

    def apply_ai_updates(self, updates: list) -> list:
        """
        批量应用AI分析结果
        updates: [{dimension, sentence, value, confidence, evidence, perspective, effects, exceptions}]
        """
        results = []
        for u in updates:
            dim = u.get("dimension", "")
            if dim not in DIMENSION_MAP:
                continue

            # 添加证据
            for ev in u.get("evidence", []):
                self.add_evidence(
                    dimension=dim,
                    source=ev.get("source", "ai_inference"),
                    content=ev.get("content", ""),
                    weight=ev.get("weight", 0.8),
                )

            # 更新条目（含 V2 字段）
            item = self.update_item(
                dimension=dim,
                sentence=u.get("sentence"),
                value=u.get("value"),
                confidence=u.get("confidence"),
                perspective=u.get("perspective"),
                effects=u.get("effects"),
                exceptions=u.get("exceptions"),
            )
            results.append(item.to_dict())

        return results

    # ============================================================
    # V2 新增：认知维度间关系管理
    # ============================================================

    def add_relation(self, source_dimension: str, target_dimension: str,
                     label: str, confidence: float = 0.0) -> dict:
        """添加维度间关系（特点→行为→结果→策略）"""
        import uuid
        rel_id = str(uuid.uuid4())
        conn = self.db._conn()
        conn.execute("""
            INSERT INTO cognition_relations
                (id, source_dimension, target_dimension, label, confidence, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (rel_id, source_dimension, target_dimension, label, confidence, _now_iso()))
        conn.commit()
        return {
            "id": rel_id,
            "sourceDimension": source_dimension,
            "targetDimension": target_dimension,
            "label": label,
            "confidence": confidence,
        }

    def get_relations(self) -> list:
        """获取所有维度间关系"""
        conn = self.db._conn()
        rows = conn.execute("SELECT * FROM cognition_relations ORDER BY created_at").fetchall()
        return [{
            "id": r["id"],
            "sourceDimension": r["source_dimension"],
            "targetDimension": r["target_dimension"],
            "label": r["label"],
            "confidence": r["confidence"],
        } for r in rows]

    def clear_relations(self):
        """清空所有关系（用于 AI 重建）"""
        conn = self.db._conn()
        conn.execute("DELETE FROM cognition_relations")
        conn.commit()

    # ============================================================
    # V2 新增：Onboarding 草稿持久化
    # ============================================================

    def save_onboarding_draft(self, draft_data: dict) -> dict:
        """保存 Onboarding 草稿（自动保存）"""
        conn = self.db._conn()
        conn.execute("""
            UPDATE onboarding_draft SET draft_data=?, updated_at=? WHERE id=1
        """, (json.dumps(draft_data, ensure_ascii=False), _now_iso()))
        conn.commit()
        return {"ok": True, "draft": draft_data}

    def get_onboarding_draft(self) -> dict:
        """获取已保存的 Onboarding 草稿"""
        conn = self.db._conn()
        row = conn.execute("SELECT * FROM onboarding_draft WHERE id=1").fetchone()
        if not row:
            return {"draft": {}, "completed": False}
        return {
            "draft": json.loads(row["draft_data"]),
            "completed": bool(row["completed"]),
            "userModelV2": json.loads(row["user_model_v2"]) if row["user_model_v2"] != "{}" else None,
        }

    def complete_onboarding(self, draft_data: dict, user_model_v2: dict) -> dict:
        """完成 Onboarding，保存用户模型 V2"""
        conn = self.db._conn()
        conn.execute("""
            UPDATE onboarding_draft SET
                draft_data=?, completed=1, user_model_v2=?, updated_at=?
            WHERE id=1
        """, (
            json.dumps(draft_data, ensure_ascii=False),
            json.dumps(user_model_v2, ensure_ascii=False),
            _now_iso(),
        ))
        conn.commit()
        return {"ok": True, "userModelV2": user_model_v2}

    def get_user_model_v2(self) -> Optional[dict]:
        """获取 Onboarding 产出的 V2 用户模型"""
        conn = self.db._conn()
        row = conn.execute("SELECT user_model_v2 FROM onboarding_draft WHERE id=1").fetchone()
        if not row or row["user_model_v2"] == "{}":
            return None
        return json.loads(row["user_model_v2"])

    def is_onboarding_completed(self) -> bool:
        """检查 Onboarding 是否已完成"""
        conn = self.db._conn()
        row = conn.execute("SELECT completed FROM onboarding_draft WHERE id=1").fetchone()
        return bool(row and row["completed"])

    # ============================================================
    # UCM-8 认知模型存储
    # ============================================================

    def save_ucm8_draft(self, draft_data: dict) -> dict:
        """保存 UCM-8 onboarding 草稿"""
        conn = self.db._conn()
        conn.execute("""
            UPDATE ucm8_profile SET draft_data=?, updated_at=? WHERE id=1
        """, (json.dumps(draft_data, ensure_ascii=False), _now_iso()))
        conn.commit()
        return {"ok": True, "draft": draft_data}

    def get_ucm8_draft(self) -> dict:
        """获取 UCM-8 onboarding 草稿"""
        conn = self.db._conn()
        row = conn.execute("SELECT * FROM ucm8_profile WHERE id=1").fetchone()
        if not row:
            return {"draft": {}, "completed": False, "profile": None}
        profile = json.loads(row["profile_data"]) if row["profile_data"] != "{}" else None
        return {
            "draft": json.loads(row["draft_data"]),
            "completed": bool(row["completed"]),
            "profile": profile,
            "userModelV2": json.loads(row["user_model_v2"]) if row["user_model_v2"] != "{}" else None,
        }

    def complete_ucm8_onboarding(self, draft_data: dict, profile_data: dict, user_model_v2: dict) -> dict:
        """完成 UCM-8 onboarding，保存 profile 和 user_model"""
        conn = self.db._conn()
        conn.execute("""
            UPDATE ucm8_profile SET
                draft_data=?, profile_data=?, user_model_v2=?,
                completed=1, updated_at=?
            WHERE id=1
        """, (
            json.dumps(draft_data, ensure_ascii=False),
            json.dumps(profile_data, ensure_ascii=False),
            json.dumps(user_model_v2, ensure_ascii=False),
            _now_iso(),
        ))
        conn.commit()
        return {"ok": True, "profile": profile_data, "userModelV2": user_model_v2}

    def get_ucm8_profile(self) -> Optional[dict]:
        """获取 UCM-8 完整 profile"""
        conn = self.db._conn()
        row = conn.execute("SELECT profile_data FROM ucm8_profile WHERE id=1").fetchone()
        if not row or row["profile_data"] == "{}":
            return None
        return json.loads(row["profile_data"])

    def is_ucm8_completed(self) -> bool:
        """检查 UCM-8 onboarding 是否已完成"""
        conn = self.db._conn()
        row = conn.execute("SELECT completed FROM ucm8_profile WHERE id=1").fetchone()
        return bool(row and row["completed"])
