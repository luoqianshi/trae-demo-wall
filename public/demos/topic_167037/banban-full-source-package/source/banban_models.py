"""
伴伴 - 数据模型定义（V2 整合版）

整合 PRODUCT_LOGIC.md 产品逻辑 + schemas.ts 领域 Schema，
定义系统核心数据结构。

三类数据的本质区分：
- InputRecord: 用户说的（愿望）——用户主动表达的意图、想法、计划、情绪
- ActivityLog: 用户做的（事实）——用户实际发生的行为，系统静默记录
- EventNode: 事情的意义（判断）——把"说的"和"做的"关联起来

V2 新增（对齐 New project schemas.ts）：
- Hypothesis: 泛型假设模式（value + confidence + evidence + status）
- ActionProfile: 行动画像（6 维 Hypothesis）
- WorkProfile: 工作画像（行业/方向/任务/工具/卡点）
- EnhancedCommunicationProfile: 增强沟通画像（0-100 量表 + 角色枚举）
- ReminderPolicy: 提醒策略（4 种场景模式）
- EnergyPattern: 能量规律（24 小时逐时数据）
- CognitionItem 增强: 6 视角 + 6 状态 + 影响范围 + 例外
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Generic, TypeVar, Any
import uuid


T = TypeVar("T")


def _now_iso() -> str:
    return datetime.now().isoformat()


def _generate_id() -> str:
    return uuid.uuid4().hex


# ============================================================
# EventNode - 事件节点（最核心）
# ============================================================
EVENT_STATES = [
    "floating", "clarified", "goal", "planned",
    "active", "repeated", "habit", "archived",
]

EVENT_TYPES = [
    "idea", "task", "goal", "habit",
    "note", "observation", "feeling",
]


@dataclass
class EventNode:
    """事件节点 - 可被追踪、推进、关联、复盘的意义单元"""

    id: Optional[int] = None
    title: str = ""
    description: str = ""
    node_type: str = "idea"
    state: str = "floating"
    parent_id: Optional[int] = None
    related_goal_ids: list = field(default_factory=list)
    energy_cost: int = 0
    estimated_time: Optional[int] = None
    preferred_time: Optional[str] = None
    importance: int = 3
    confidence: float = 0.5
    evidence: list = field(default_factory=list)
    needs_confirmation: bool = False
    created_at: str = field(default_factory=_now_iso)
    updated_at: str = field(default_factory=_now_iso)
    completed_at: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id, "title": self.title, "description": self.description,
            "node_type": self.node_type, "state": self.state,
            "parent_id": self.parent_id,
            "related_goal_ids": self.related_goal_ids,
            "energy_cost": self.energy_cost,
            "estimated_time": self.estimated_time,
            "preferred_time": self.preferred_time,
            "importance": self.importance, "confidence": self.confidence,
            "evidence": self.evidence,
            "needs_confirmation": self.needs_confirmation,
            "created_at": self.created_at, "updated_at": self.updated_at,
            "completed_at": self.completed_at,
        }


# ============================================================
# InputRecord - 用户说的（愿望）
# ============================================================
@dataclass
class InputRecord:
    """用户或系统产生的原始输入"""

    id: str = field(default_factory=_generate_id)
    source: str = "text"  # voice/text/screenshot/system/canvas
    raw_text: str = ""
    created_at: str = field(default_factory=_now_iso)
    processed: bool = False

    # AI 处理各阶段结果
    classification: dict = field(default_factory=dict)
    parsed: dict = field(default_factory=dict)
    event_definition: dict = field(default_factory=dict)
    event_id: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id, "source": self.source,
            "raw_text": self.raw_text, "created_at": self.created_at,
            "processed": self.processed,
            "classification": self.classification,
            "parsed": self.parsed,
            "event_definition": self.event_definition,
            "event_id": self.event_id,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "InputRecord":
        return cls(
            id=data.get("id", _generate_id()),
            source=data.get("source", "text"),
            raw_text=data.get("raw_text", data.get("input_text", "")),
            created_at=data.get("created_at", _now_iso()),
            processed=data.get("processed", False),
            classification=data.get("classification", {}),
            parsed=data.get("parsed", {}),
            event_definition=data.get("event_definition", {}),
            event_id=data.get("event_id"),
        )


# ============================================================
# ActivityLog - 用户做的（事实）
# ============================================================
@dataclass
class ActivityLog:
    """用户实际行为记录"""

    id: str = field(default_factory=_generate_id)
    timestamp: str = field(default_factory=_now_iso)
    app_name: str = ""
    window_title: str = ""
    behavior_description: str = ""
    behavior_type: str = "idle"  # work/social/entertainment/rest/study/routine/idle
    duration_seconds: int = 0
    related_event_id: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id, "timestamp": self.timestamp,
            "app_name": self.app_name, "window_title": self.window_title,
            "behavior_description": self.behavior_description,
            "behavior_type": self.behavior_type,
            "duration_seconds": self.duration_seconds,
            "related_event_id": self.related_event_id,
        }


# ============================================================
# UserModel - AI对用户的长期理解（人格模型的数据基础）
# ============================================================
@dataclass
class UserModel:
    """AI 对用户的长期理解"""

    goals: list = field(default_factory=list)
    values: list = field(default_factory=list)
    big_five: dict = field(default_factory=lambda: {
        "openness": 0.5, "conscientiousness": 0.5,
        "extraversion": 0.5, "agreeableness": 0.5, "neuroticism": 0.5,
    })
    energy_pattern: dict = field(default_factory=lambda: {
        "morning": 0.7, "afternoon": 0.5, "evening": 0.4, "night": 0.2,
    })
    work_style: str = ""
    lifestyle: str = ""
    patterns: list = field(default_factory=list)  # [{description, confidence, evidence}]
    summary: str = ""
    updated_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "goals": self.goals, "values": self.values,
            "big_five": self.big_five, "energy_pattern": self.energy_pattern,
            "work_style": self.work_style, "lifestyle": self.lifestyle,
            "patterns": self.patterns, "summary": self.summary,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "UserModel":
        return cls(
            goals=data.get("goals", []),
            values=data.get("values", []),
            big_five=data.get("big_five", {}),
            energy_pattern=data.get("energy_pattern", {}),
            work_style=data.get("work_style", ""),
            lifestyle=data.get("lifestyle", ""),
            patterns=data.get("patterns", []),
            summary=data.get("summary", ""),
            updated_at=data.get("updated_at", _now_iso()),
        )


# ============================================================
# CommunicationProfile - 用户喜欢的提醒语气
# ============================================================
@dataclass
class CommunicationProfile:
    """用户沟通偏好"""

    default_tone: str = "warm_direct"
    reminder_style: str = "gentle_nudge"
    interruption_tolerance: str = "low"
    avoid_styles: list = field(default_factory=lambda: ["命令式", "说教式", "频繁打断"])
    effective_styles: list = field(default_factory=lambda: ["具体建议", "轻量提醒", "给出下一步动作"])
    updated_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "default_tone": self.default_tone,
            "reminder_style": self.reminder_style,
            "interruption_tolerance": self.interruption_tolerance,
            "avoid_styles": self.avoid_styles,
            "effective_styles": self.effective_styles,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "CommunicationProfile":
        return cls(
            default_tone=data.get("default_tone", "warm_direct"),
            reminder_style=data.get("reminder_style", "gentle_nudge"),
            interruption_tolerance=data.get("interruption_tolerance", "low"),
            avoid_styles=data.get("avoid_styles", ["命令式", "说教式", "频繁打断"]),
            effective_styles=data.get("effective_styles", ["具体建议", "轻量提醒", "给出下一步动作"]),
            updated_at=data.get("updated_at", _now_iso()),
        )


# ============================================================
# TimeBlock - 时间段
# ============================================================
@dataclass
class TimeBlock:
    """一天里的时间段"""

    id: str = field(default_factory=_generate_id)
    start_time: str = "09:00"
    end_time: str = "10:00"
    block_type: str = "flexible"  # fixed/flexible/rest
    label: str = ""
    energy_level: str = "medium"  # high/medium/low

    def to_dict(self) -> dict:
        return {
            "id": self.id, "start_time": self.start_time,
            "end_time": self.end_time, "block_type": self.block_type,
            "label": self.label, "energy_level": self.energy_level,
        }


# ============================================================
# PlanBlock - AI生成的执行路径块
# ============================================================
@dataclass
class PlanBlock:
    """今日执行路径中的一个块"""

    id: str = field(default_factory=_generate_id)
    event_id: Optional[int] = None
    start_time: str = ""
    end_time: str = ""
    title: str = ""
    reason: str = ""
    status: str = "planned"  # planned/active/done/skipped

    def to_dict(self) -> dict:
        return {
            "id": self.id, "event_id": self.event_id,
            "start_time": self.start_time, "end_time": self.end_time,
            "title": self.title, "reason": self.reason, "status": self.status,
        }


# ============================================================
# DailyReview - 复盘记录
# ============================================================
@dataclass
class DailyReview:
    """早间启动 / 晚间复盘"""

    id: str = field(default_factory=_generate_id)
    date: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    review_type: str = "evening"  # morning/evening
    feeling: str = ""
    pattern: str = ""
    encouragement: str = ""
    completion_rate: float = 0.0
    created_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "date": self.date, "review_type": self.review_type,
            "feeling": self.feeling, "pattern": self.pattern,
            "encouragement": self.encouragement,
            "completion_rate": self.completion_rate,
            "created_at": self.created_at,
        }


# ============================================================
# InterventionEvent - AI主动提醒记录
# ============================================================
@dataclass
class InterventionEvent:
    """AI 主动提醒与用户反馈"""

    id: str = field(default_factory=_generate_id)
    timestamp: str = field(default_factory=_now_iso)
    reminder_level: int = 0  # 0-4
    channel: str = "assistant_card"  # assistant_card/notification/voice
    tone: str = ""
    message: str = ""
    related_event_id: Optional[int] = None
    user_response: str = ""  # accepted/dismissed/ignored/""
    created_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "timestamp": self.timestamp,
            "reminder_level": self.reminder_level, "channel": self.channel,
            "tone": self.tone, "message": self.message,
            "related_event_id": self.related_event_id,
            "user_response": self.user_response, "created_at": self.created_at,
        }


# ============================================================
# ContextPack - 每次调用AI时构造的上下文包
# ============================================================
@dataclass
class ContextPack:
    """AI 调用上下文包"""

    task: str = ""
    source_page: str = ""
    input_record: Optional[dict] = None
    user_model: Optional[dict] = None
    communication_profile: Optional[dict] = None
    existing_goals: list = field(default_factory=list)
    existing_event_nodes: list = field(default_factory=list)
    recent_activity_logs: list = field(default_factory=list)
    today_plan: list = field(default_factory=list)
    current_state: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "task": self.task, "source_page": self.source_page,
            "input_record": self.input_record,
            "user_model": self.user_model,
            "communication_profile": self.communication_profile,
            "existing_goals": self.existing_goals,
            "existing_event_nodes": self.existing_event_nodes,
            "recent_activity_logs": self.recent_activity_logs,
            "today_plan": self.today_plan,
            "current_state": self.current_state,
        }


# ============================================================
# V2 新增数据结构 — 对齐 New project schemas.ts
# ============================================================

# ---- 常量枚举 ----

# 事件语义类型（8 种，对齐 canvas nodeKind）
NODE_KINDS = [
    "inspiration", "desire", "goal", "project",
    "action", "habit", "resource", "constraint",
]

# 承诺级别（6 级）
COMMITMENT_LEVELS = [
    "observed", "interested", "intended",
    "committed", "scheduled", "active",
]

# 节点阶段（8 阶段）
NODE_PHASES = [
    "candidate", "clarifying", "confirmed", "planned",
    "active", "completed", "paused", "archived",
]

# 节点来源（5 种）
NODE_SOURCES = [
    "onboarding", "night_review", "chat", "manual", "ai_suggestion",
]

# 认知维度（8 维）
COGNITION_DIMENSIONS_V2 = [
    "personality", "action", "work", "time_energy",
    "emotion_stress", "goals_values", "constraints", "communication",
]

# 认知视角（6 种）
COGNITION_PERSPECTIVES = [
    "long_term",      # 长期的你
    "current_state",  # 最近的你
    "behavior",       # 实际行为
    "self_description",  # 你说的自己
    "ai_hypothesis",  # 伴伴推测
    "conflict_unknown",  # 未知与矛盾
]

# 认知状态（6 种）
COGNITION_STATUSES = [
    "observing",  # 观察中
    "supported",  # 有证据支持
    "confirmed",  # 用户已确认
    "modified",   # 用户已修正
    "paused",     # 暂停使用
    "expired",    # 已过期
]

# 认知影响模块（5 种）
COGNITION_EFFECT_MODULES = [
    "conversation",      # 对话风格
    "planning",          # 计划生成
    "reminder",          # 提醒策略
    "today",             # 今日安排
    "proactive_contact",  # 主动联系
]

# 沟通角色（5 种）
COMMUNICATION_ROLES = [
    "quiet_observer",    # 安静记录者
    "gentle_companion",  # 温和陪伴者
    "analyst",           # 冷静分析师
    "action_coach",      # 项目推进教练
    "idea_organizer",    # 灵感整理师
]

# 打断容忍度（4 级）
INTERRUPTION_TOLERANCES = [
    "none",          # 完全不打断
    "silent_only",   # 仅静默卡片
    "important_only",  # 仅重要事项
    "normal",        # 正常打断
]

# 活动分类（9 种）— 与 behavior_config.py 保持一致
ACTIVITY_CATEGORIES = [
    "deep_work", "light_work", "communication", "learning",
    "entertainment_active", "entertainment_passive", "rest",
    "away", "unknown",
]

# 证据来源类型（5 种）
EVIDENCE_SOURCE_TYPES = [
    "onboarding",  # Onboarding 问卷
    "activity",    # 行为观察
    "review",      # 复盘
    "feedback",    # 用户反馈
    "manual",      # 手动添加
]

# 假设状态（3 种）
HYPOTHESIS_STATUSES = ["unconfirmed", "confirmed", "rejected"]


# ---- 核心泛型 ----

@dataclass
class Hypothesis:
    """
    泛型假设模式 — 整个系统的认知建模基础。
    所有人格判断都以"假设"形式存储，附带置信度和证据链，可被确认、拒绝或修正。

    对应 schemas.ts 的 hypothesisSchema<T>
    """
    value: Any = None  # 可以是 string, list, dict 等
    confidence: float = 0.0  # 0-1
    evidence: list = field(default_factory=list)  # Evidence 列表
    status: str = "unconfirmed"  # unconfirmed / confirmed / rejected
    updated_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "value": self.value,
            "confidence": self.confidence,
            "evidence": self.evidence,
            "status": self.status,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Hypothesis":
        return cls(
            value=data.get("value"),
            confidence=data.get("confidence", 0.0),
            evidence=data.get("evidence", []),
            status=data.get("status", "unconfirmed"),
            updated_at=data.get("updated_at", _now_iso()),
        )


@dataclass
class Evidence:
    """证据 — 所有 AI 判断和模型更新的基石"""
    id: str = field(default_factory=_generate_id)
    source_type: str = "manual"  # onboarding/activity/review/feedback/manual
    source_id: str = ""
    summary: str = ""  # 1-500 字
    observed_at: str = field(default_factory=_now_iso)
    weight: float = 0.5  # 0-1

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "sourceType": self.source_type,
            "sourceId": self.source_id,
            "summary": self.summary,
            "observedAt": self.observed_at,
            "weight": self.weight,
        }


# ---- 行动画像 ----

@dataclass
class ActionProfile:
    """
    行动画像 — 6 维假设，描述用户如何思考和行动。
    每个维度都是 Hypothesis，附带置信度和证据。

    对应 schemas.ts 的 actionProfileSchema
    """
    thinking_style: Hypothesis = field(default_factory=lambda: Hypothesis(value=[]))
    execution_style: Hypothesis = field(default_factory=lambda: Hypothesis(value=[]))
    start_pattern: Hypothesis = field(default_factory=lambda: Hypothesis(value=[]))
    motivation_drivers: Hypothesis = field(default_factory=lambda: Hypothesis(value=[]))
    risk_patterns: Hypothesis = field(default_factory=lambda: Hypothesis(value=[]))
    support_needs: Hypothesis = field(default_factory=lambda: Hypothesis(value=[]))

    def to_dict(self) -> dict:
        return {
            "thinkingStyle": self.thinking_style.to_dict(),
            "executionStyle": self.execution_style.to_dict(),
            "startPattern": self.start_pattern.to_dict(),
            "motivationDrivers": self.motivation_drivers.to_dict(),
            "riskPatterns": self.risk_patterns.to_dict(),
            "supportNeeds": self.support_needs.to_dict(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "ActionProfile":
        h = Hypothesis.from_dict
        return cls(
            thinking_style=h(data.get("thinkingStyle", {})),
            execution_style=h(data.get("executionStyle", {})),
            start_pattern=h(data.get("startPattern", {})),
            motivation_drivers=h(data.get("motivationDrivers", {})),
            risk_patterns=h(data.get("riskPatterns", {})),
            support_needs=h(data.get("supportNeeds", {})),
        )


# ---- 工作画像 ----

@dataclass
class WorkProfile:
    """
    工作画像 — 用户的行业、方向、任务、工具和卡点。
    对应 schemas.ts 的 workProfileSchema
    """
    industry_id: str = ""
    specialization_ids: list = field(default_factory=list)
    task_type_ids: list = field(default_factory=list)
    tool_ids: list = field(default_factory=list)
    workflow_stages: list = field(default_factory=list)
    blocking_point_ids: list = field(default_factory=list)
    ai_support_need_ids: list = field(default_factory=list)
    custom_terms: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "industryId": self.industry_id,
            "specializationIds": self.specialization_ids,
            "taskTypeIds": self.task_type_ids,
            "toolIds": self.tool_ids,
            "workflowStages": self.workflow_stages,
            "blockingPointIds": self.blocking_point_ids,
            "aiSupportNeedIds": self.ai_support_need_ids,
            "customTerms": self.custom_terms,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "WorkProfile":
        return cls(
            industry_id=data.get("industryId", ""),
            specialization_ids=data.get("specializationIds", []),
            task_type_ids=data.get("taskTypeIds", []),
            tool_ids=data.get("toolIds", []),
            workflow_stages=data.get("workflowStages", []),
            blocking_point_ids=data.get("blockingPointIds", []),
            ai_support_need_ids=data.get("aiSupportNeedIds", []),
            custom_terms=data.get("customTerms", []),
        )


# ---- 增强沟通画像 ----

@dataclass
class EnhancedCommunicationProfile:
    """
    增强沟通画像 — 0-100 量表 + 角色枚举 + 提醒渠道偏好。
    对应 schemas.ts 的 communicationProfileSchema

    比原有 CommunicationProfile 更丰富：
    - role: 5 种角色枚举
    - warmth/directness/detail/initiative/rationality: 0-100 数值
    - interruption_tolerance: 4 级枚举
    - preferred_channels: 渠道列表
    - avoid_styles: 避免的风格
    """
    role: str = "gentle_companion"
    warmth: int = 62      # 温柔度 0-100
    directness: int = 42   # 直接度 0-100
    detail: int = 48       # 详细度 0-100
    initiative: int = 50   # 主动性 0-100
    rationality: int = 60  # 理性度 0-100
    interruption_tolerance: str = "silent_only"
    preferred_channels: list = field(default_factory=lambda: ["side_panel", "daily_review"])
    avoid_styles: list = field(default_factory=lambda: ["commanding", "anxiety", "frequent_popup"])
    updated_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "role": self.role,
            "warmth": self.warmth,
            "directness": self.directness,
            "detail": self.detail,
            "initiative": self.initiative,
            "rationality": self.rationality,
            "interruptionTolerance": self.interruption_tolerance,
            "preferredChannels": self.preferred_channels,
            "avoidStyles": self.avoid_styles,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "EnhancedCommunicationProfile":
        return cls(
            role=data.get("role", "gentle_companion"),
            warmth=data.get("warmth", 62),
            directness=data.get("directness", 42),
            detail=data.get("detail", 48),
            initiative=data.get("initiative", 50),
            rationality=data.get("rationality", 60),
            interruption_tolerance=data.get("interruptionTolerance", "silent_only"),
            preferred_channels=data.get("preferredChannels", ["side_panel", "daily_review"]),
            avoid_styles=data.get("avoidStyles", ["commanding", "anxiety", "frequent_popup"]),
            updated_at=data.get("updated_at", _now_iso()),
        )


# ---- 提醒策略 ----

@dataclass
class ReminderRule:
    """单条提醒规则"""
    level: int = 1  # 0-4
    channel: str = "silent_card"  # none/silent_card/assistant_card/toast/voice/confirm_dialog
    delay_minutes: Optional[int] = None
    allow_interrupt: bool = False

    def to_dict(self) -> dict:
        return {
            "level": self.level,
            "channel": self.channel,
            "delayMinutes": self.delay_minutes,
            "allowInterrupt": self.allow_interrupt,
        }


@dataclass
class ReminderPolicy:
    """
    提醒策略 — 4 种场景模式。
    对应 schemas.ts 的 reminderPolicySchema
    """
    focus_mode: ReminderRule = field(default_factory=ReminderRule)
    deviation_mode: ReminderRule = field(default_factory=lambda: ReminderRule(level=2, channel="assistant_card"))
    low_energy_mode: ReminderRule = field(default_factory=lambda: ReminderRule(level=1, channel="silent_card"))
    night_mode: ReminderRule = field(default_factory=lambda: ReminderRule(level=0, channel="none"))

    def to_dict(self) -> dict:
        return {
            "focusMode": self.focus_mode.to_dict(),
            "deviationMode": self.deviation_mode.to_dict(),
            "lowEnergyMode": self.low_energy_mode.to_dict(),
            "nightMode": self.night_mode.to_dict(),
        }


# ---- 能量规律 ----

@dataclass
class EnergyHour:
    """单小时的能量数据"""
    hour: int = 0   # 0-23
    energy: float = 0.5   # 0-1
    focus: float = 0.5    # 0-1
    confidence: float = 0.0  # 0-1

    def to_dict(self) -> dict:
        return {
            "hour": self.hour,
            "energy": self.energy,
            "focus": self.focus,
            "confidence": self.confidence,
        }


@dataclass
class EnergyPattern:
    """
    24 小时能量规律。
    对应 schemas.ts 的 energyPatternSchema
    """
    timezone: str = "Asia/Shanghai"
    hourly: list = field(default_factory=lambda: [
        EnergyHour(hour=h).to_dict() for h in range(24)
    ])

    def to_dict(self) -> dict:
        return {
            "timezone": self.timezone,
            "hourly": self.hourly,
        }


# ---- 认知条目增强 ----

@dataclass
class CognitionEffect:
    """认知影响范围 — 这条认知影响哪些模块"""
    module: str = "conversation"  # conversation/planning/reminder/today/proactive_contact
    description: str = ""

    def to_dict(self) -> dict:
        return {"module": self.module, "description": self.description}


@dataclass
class CognitionRelation:
    """认知维度间关系 — 特点→行为→结果→策略 因果链"""
    source_dimension: str = ""
    target_dimension: str = ""
    label: str = ""  # 特点/行为/结果/策略
    confidence: float = 0.0

    def to_dict(self) -> dict:
        return {
            "sourceDimension": self.source_dimension,
            "targetDimension": self.target_dimension,
            "label": self.label,
            "confidence": self.confidence,
        }


@dataclass
class CognitionItemV2:
    """
    增强认知条目 — 6 视角 + 6 状态 + 影响范围 + 例外。
    对应 schemas.ts 的 cognitionItemSchema

    比原有 cognition_store.py 的 CognitionItem 更丰富：
    - perspective: 6 种视角（long_term/current_state/behavior/self_description/ai_hypothesis/conflict_unknown）
    - status: 6 种状态（observing/supported/confirmed/modified/paused/expired）
    - effects: 影响哪些模块
    - exceptions: 例外情况
    - scope: 适用范围（如"工作项目"）
    - valid_from/valid_until: 时间有效期
    - version: 版本号
    """
    id: str = field(default_factory=_generate_id)
    dimension: str = ""  # 8 维之一
    statement: str = ""  # 一句话认知
    perspective: str = "ai_hypothesis"  # 6 视角之一
    status: str = "observing"  # 6 状态之一
    confidence: float = 0.0  # 0-1
    scope: list = field(default_factory=list)  # 适用范围，如 ["工作项目"]
    exceptions: list = field(default_factory=list)  # 例外情况
    sources: list = field(default_factory=list)  # Evidence 列表
    effects: list = field(default_factory=list)  # CognitionEffect 列表
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    version: int = 1
    updated_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "dimension": self.dimension,
            "statement": self.statement,
            "perspective": self.perspective,
            "status": self.status,
            "confidence": self.confidence,
            "scope": self.scope,
            "exceptions": self.exceptions,
            "sources": self.sources,
            "effects": self.effects,
            "validFrom": self.valid_from,
            "validUntil": self.valid_until,
            "version": self.version,
            "updatedAt": self.updated_at,
        }


# ---- 增强用户模型 ----

@dataclass
class DesiredSelf:
    """理想自我描述"""
    description: str = ""
    keywords: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"description": self.description, "keywords": self.keywords}


@dataclass
class UserModelV2:
    """
    增强用户模型 — 整合所有 V2 数据结构。
    对应 schemas.ts 的 userModelSchema

    这是人格模型的完整实现：
    - desired_self: 理想自我
    - action_profile: 行动画像（6 维 Hypothesis）
    - work_profile: 工作画像
    - communication_profile: 增强沟通画像
    - reminder_policy: 提醒策略
    - energy_pattern: 能量规律
    - behavior_patterns: 行为模式假设列表
    - version: 版本号（支持乐观更新和冲突解决）
    """
    id: str = field(default_factory=lambda: "user_onboarding_demo")
    desired_self: DesiredSelf = field(default_factory=DesiredSelf)
    current_focus_event_id: Optional[str] = None
    action_profile: ActionProfile = field(default_factory=ActionProfile)
    work_profile: WorkProfile = field(default_factory=WorkProfile)
    communication_profile: EnhancedCommunicationProfile = field(default_factory=EnhancedCommunicationProfile)
    reminder_policy: ReminderPolicy = field(default_factory=ReminderPolicy)
    energy_pattern: EnergyPattern = field(default_factory=EnergyPattern)
    behavior_patterns: list = field(default_factory=list)  # Hypothesis<string> 列表
    version: int = 1
    updated_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "desiredSelf": self.desired_self.to_dict(),
            "currentFocusEventId": self.current_focus_event_id,
            "actionProfile": self.action_profile.to_dict(),
            "workProfile": self.work_profile.to_dict(),
            "communicationProfile": self.communication_profile.to_dict(),
            "reminderPolicy": self.reminder_policy.to_dict(),
            "energyPattern": self.energy_pattern.to_dict(),
            "behaviorPatterns": self.behavior_patterns,
            "version": self.version,
            "updatedAt": self.updated_at,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "UserModelV2":
        return cls(
            id=data.get("id", "user_onboarding_demo"),
            desired_self=DesiredSelf(
                description=data.get("desiredSelf", {}).get("description", ""),
                keywords=data.get("desiredSelf", {}).get("keywords", []),
            ),
            current_focus_event_id=data.get("currentFocusEventId"),
            action_profile=ActionProfile.from_dict(data.get("actionProfile", {})),
            work_profile=WorkProfile.from_dict(data.get("workProfile", {})),
            communication_profile=EnhancedCommunicationProfile.from_dict(
                data.get("communicationProfile", {})),
            reminder_policy=ReminderPolicy(
                focus_mode=ReminderRule(**data.get("reminderPolicy", {}).get("focusMode", {})),
                deviation_mode=ReminderRule(**data.get("reminderPolicy", {}).get("deviationMode", {})),
                low_energy_mode=ReminderRule(**data.get("reminderPolicy", {}).get("lowEnergyMode", {})),
                night_mode=ReminderRule(**data.get("reminderPolicy", {}).get("nightMode", {})),
            ),
            energy_pattern=EnergyPattern(
                timezone=data.get("energyPattern", {}).get("timezone", "Asia/Shanghai"),
                hourly=data.get("energyPattern", {}).get("hourly", []),
            ),
            behavior_patterns=data.get("behaviorPatterns", []),
            version=data.get("version", 1),
            updated_at=data.get("updatedAt", _now_iso()),
        )


# ---- UCM-8 用户认知模型 ----

@dataclass
class UCMMetric:
    """UCM-8 单项指标 — 带置信度和证据的量化评分"""
    score: float = 50.0          # 0-100 评分
    confidence: float = 0.0      # 0-1 置信度
    evidence: list = field(default_factory=list)  # 证据列表 [{source, detail, weight}]
    source: str = "onboarding"   # 数据来源：onboarding/behavior/feedback/ai_inference
    valid_until: Optional[str] = None  # 有效期（状态类指标）
    scope: str = "global"        # 适用范围：global/work/study/current_task

    def to_dict(self) -> dict:
        return {
            "score": self.score,
            "confidence": self.confidence,
            "evidence": self.evidence,
            "source": self.source,
            "validUntil": self.valid_until,
            "scope": self.scope,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "UCMMetric":
        return cls(
            score=data.get("score", 50.0),
            confidence=data.get("confidence", 0.0),
            evidence=data.get("evidence", []),
            source=data.get("source", "onboarding"),
            valid_until=data.get("validUntil"),
            scope=data.get("scope", "global"),
        )


@dataclass
class UCMDimension:
    """UCM-8 单个维度 — 包含多个子指标"""
    dimension_id: str = ""        # 维度ID：cognitive_style/motivation_system/...
    label: str = ""               # 维度中文名
    icon: str = ""                # 图标
    core_question: str = ""       # 核心问题
    submetrics: dict = field(default_factory=dict)  # {submetric_id: UCMMetric}
    overall_score: float = 50.0   # 维度综合评分 0-100
    confidence: float = 0.0       # 整体置信度
    interaction_effects: list = field(default_factory=list)  # 影响的交互策略

    def to_dict(self) -> dict:
        return {
            "dimensionId": self.dimension_id,
            "label": self.label,
            "icon": self.icon,
            "coreQuestion": self.core_question,
            "submetrics": {k: v.to_dict() if isinstance(v, UCMMetric) else v for k, v in self.submetrics.items()},
            "overallScore": self.overall_score,
            "confidence": self.confidence,
            "interactionEffects": self.interaction_effects,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "UCMDimension":
        submetrics = {}
        for k, v in data.get("submetrics", {}).items():
            submetrics[k] = UCMMetric.from_dict(v) if isinstance(v, dict) else v
        return cls(
            dimension_id=data.get("dimensionId", ""),
            label=data.get("label", ""),
            icon=data.get("icon", ""),
            core_question=data.get("coreQuestion", ""),
            submetrics=submetrics,
            overall_score=data.get("overallScore", 50.0),
            confidence=data.get("confidence", 0.0),
            interaction_effects=data.get("interactionEffects", []),
        )


@dataclass
class InteractionStrategy:
    """交互策略 — UCM-8 推断出的 AI 交互调节参数"""
    response_structure: str = "balanced"      # 回答结构：structured/exploratory/action_oriented/analytical
    initiative: str = "important_only"        # 主动程度：passive/important_only/risk_aware/proactive
    explanation_depth: str = "brief"          # 解释深度：conclusion/brief/balanced/full_transparency
    planning_granularity: str = "flexible"    # 规划粒度：strict_schedule/flexible_path/minimum_done/energy_match
    notification_policy: str = "daily_digest" # 通知策略：none/daily_digest/suggestive/risk_based/urgent_only
    automation_authority: str = "draft_only"  # 自动权限：manual/draft_only/low_risk_auto/rule_based_auto
    stress_adjustment: str = "normal"         # 压力调节：normal/reduced_load/supportive/challenge
    tone_style: str = "balanced"              # 语气风格：direct/balanced/warm/analytical

    def to_dict(self) -> dict:
        return {
            "responseStructure": self.response_structure,
            "initiative": self.initiative,
            "explanationDepth": self.explanation_depth,
            "planningGranularity": self.planning_granularity,
            "notificationPolicy": self.notification_policy,
            "automationAuthority": self.automation_authority,
            "stressAdjustment": self.stress_adjustment,
            "toneStyle": self.tone_style,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "InteractionStrategy":
        return cls(
            response_structure=data.get("responseStructure", "balanced"),
            initiative=data.get("initiative", "important_only"),
            explanation_depth=data.get("explanationDepth", "brief"),
            planning_granularity=data.get("planningGranularity", "flexible"),
            notification_policy=data.get("notificationPolicy", "daily_digest"),
            automation_authority=data.get("automationAuthority", "draft_only"),
            stress_adjustment=data.get("stressAdjustment", "normal"),
            tone_style=data.get("toneStyle", "balanced"),
        )


@dataclass
class UCM8Profile:
    """
    UCM-8 用户认知与行为操作模型 — 完整的八维用户画像。

    对应 UCM-8 规范的完整数据结构：
    - 8 个维度，每个维度包含多个子指标
    - 推断出的交互策略
    - 证据链和置信度系统
    - 动态更新权重配置
    """
    version: str = "1.0"
    dimensions: dict = field(default_factory=dict)  # {dimension_id: UCMDimension}
    interaction_strategy: InteractionStrategy = field(default_factory=InteractionStrategy)
    last_updated: str = field(default_factory=_now_iso)
    data_sources: dict = field(default_factory=lambda: {  # 各数据源权重
        "questionnaire": 0.65,
        "behavior": 0.25,
        "explicit_feedback": 0.10,
    })
    user_overrides: dict = field(default_factory=dict)  # 用户显式覆盖的设置

    def to_dict(self) -> dict:
        return {
            "version": self.version,
            "dimensions": {k: v.to_dict() if isinstance(v, UCMDimension) else v for k, v in self.dimensions.items()},
            "interactionStrategy": self.interaction_strategy.to_dict(),
            "lastUpdated": self.last_updated,
            "dataSources": self.data_sources,
            "userOverrides": self.user_overrides,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "UCM8Profile":
        dimensions = {}
        for k, v in data.get("dimensions", {}).items():
            dimensions[k] = UCMDimension.from_dict(v) if isinstance(v, dict) else v
        return cls(
            version=data.get("version", "1.0"),
            dimensions=dimensions,
            interaction_strategy=InteractionStrategy.from_dict(data.get("interactionStrategy", {})),
            last_updated=data.get("lastUpdated", _now_iso()),
            data_sources=data.get("dataSources", {"questionnaire": 0.65, "behavior": 0.25, "explicit_feedback": 0.10}),
            user_overrides=data.get("userOverrides", {}),
        )


# ---- 增强活动日志 ----

@dataclass
class ActivityLogV2:
    """
    增强活动日志 — 含 AI 判断和用户反馈。
    对应 schemas.ts 的 activityLogSchema
    """
    id: str = field(default_factory=_generate_id)
    start_at: str = field(default_factory=_now_iso)
    end_at: str = field(default_factory=_now_iso)
    apps: list = field(default_factory=list)  # [{name, title}]
    source: str = "screenshot"  # mock/manual/screenshot/desktop_collector
    detected_behavior: str = ""
    category: str = "unknown"  # 9 种分类
    related_event_id: Optional[str] = None
    focus_level: Optional[float] = None  # 0-1
    energy_level: Optional[float] = None  # 0-1
    interruption_count: Optional[int] = None
    action_density: Optional[float] = None  # 0-1
    confidence: float = 0.0
    evidence_summary: str = ""
    ai_judgement: Optional[dict] = None  # {summary, evidence[], confidence}
    user_feedback: Optional[dict] = None  # {status, correctedCategory?, correctedEventId?, note?}
    version: int = 1

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "startAt": self.start_at,
            "endAt": self.end_at,
            "apps": self.apps,
            "source": self.source,
            "detectedBehavior": self.detected_behavior,
            "category": self.category,
            "relatedEventId": self.related_event_id,
            "focusLevel": self.focus_level,
            "energyLevel": self.energy_level,
            "interruptionCount": self.interruption_count,
            "actionDensity": self.action_density,
            "confidence": self.confidence,
            "evidenceSummary": self.evidence_summary,
            "aiJudgement": self.ai_judgement,
            "userFeedback": self.user_feedback,
            "version": self.version,
        }


# ---- UIAction 规范 ----

@dataclass
class UIAction:
    """
    统一用户操作记录 — 所有影响业务模型的动作。
    对应 schemas.ts 的 uiActionSchema
    """
    id: str = field(default_factory=_generate_id)
    type: str = ""  # 动作类型，如 ONBOARDING_ANSWER, COMPLETE_ONBOARDING 等
    source_page: str = ""  # 以 / 开头
    source_component: str = ""
    payload: Any = None
    timestamp: str = field(default_factory=_now_iso)
    session_id: str = ""
    client_version: str = "0.2.0"
    optimistic: bool = False

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type,
            "sourcePage": self.source_page,
            "sourceComponent": self.source_component,
            "payload": self.payload,
            "timestamp": self.timestamp,
            "sessionId": self.session_id,
            "clientVersion": self.client_version,
            "optimistic": self.optimistic,
        }


# ---- 画布系统增强类型 ----

@dataclass
class CanvasNodeOrigin:
    """节点来源追溯"""
    id: str = field(default_factory=_generate_id)
    source: str = "manual"  # onboarding/night_review/chat/manual/ai_suggestion
    source_id: Optional[str] = None
    original_text: str = ""
    created_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "source": self.source,
            "sourceId": self.source_id,
            "originalText": self.original_text,
            "createdAt": self.created_at,
        }


@dataclass
class CanvasNodeLayout:
    """画布布局"""
    x: float = 0.0
    y: float = 0.0
    is_pinned: bool = False
    group_id: Optional[str] = None
    z_index: int = 0

    def to_dict(self) -> dict:
        return {
            "x": self.x,
            "y": self.y,
            "isPinned": self.is_pinned,
            "groupId": self.group_id,
            "zIndex": self.z_index,
        }


# ============================================================
# 三时间世界：画布 → 规划 → 执行 → 偏差
# 对应 canvas-to-plan-deep-guide.md
# ============================================================


@dataclass
class FixedItem:
    """固定项 — 日常作息、会议等不可移动的时间块

    归属：规划世界
    """
    id: str = field(default_factory=_generate_id)
    title: str = ""
    start_time: float = 0.0     # 毫秒时间戳
    end_time: float = 0.0
    type: str = "routine"       # routine / meal / meeting / commute / rest / sleep
    flexibility: str = "semi_fixed"  # fixed / semi_fixed
    notes: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id, "title": self.title,
            "startTime": self.start_time, "endTime": self.end_time,
            "type": self.type, "flexibility": self.flexibility,
            "notes": self.notes,
        }


@dataclass
class PlannedAction:
    """计划行动 — 一个排入时间轴的任务块

    归属：规划世界
    这是「意图」到「时间」的映射：一个画布节点被放在了今天的某个时段。
    """
    id: str = field(default_factory=_generate_id)
    origin_node_id: str = ""    # 来源画布节点 ID
    title: str = ""
    start_time: float = 0.0     # 毫秒时间戳
    duration: int = 45          # 分钟
    type: str = "light_work"    # deep_work / light_work / meeting / rest / exercise / meal / routine / learning
    flexibility: str = "flexible"  # flexible / semi_fixed / fixed
    cognitive_load: str = "medium"  # deep / medium / light
    priority: str = "medium"    # high / medium / low
    status: str = "draft"       # draft / confirmed / in_progress / done / skipped / paused / postponed
    reason: str = ""            # 为什么排在这里（模板生成）
    generated_from: str = "ai_suggested"  # ai_suggested / user_manual
    order: int = 0
    created_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "originNodeId": self.origin_node_id,
            "title": self.title,
            "startTime": self.start_time, "duration": self.duration,
            "type": self.type, "flexibility": self.flexibility,
            "cognitiveLoad": self.cognitive_load, "priority": self.priority,
            "status": self.status, "reason": self.reason,
            "generatedFrom": self.generated_from, "order": self.order,
            "createdAt": self.created_at,
        }


@dataclass
class DailyCommitment:
    """每日承诺 — 确认后的计划项

    归属：规划世界 → 执行世界
    承诺和计划的区别：计划是「草案」，承诺是「我答应自己今天做的事」。
    承诺有状态机：scheduled → in_progress → done / paused / skipped / postponed
    """
    id: str = field(default_factory=_generate_id)
    plan_id: str = ""
    origin_node_id: str = ""
    title: str = ""
    scheduled_start: float = 0.0
    scheduled_duration: int = 45
    type: str = "light_work"
    cognitive_load: str = "medium"
    priority: str = "medium"
    status: str = "scheduled"   # scheduled / in_progress / paused / done / skipped / postponed
    reason: str = ""

    # 执行追踪
    actual_start_time: Optional[float] = None
    actual_end_time: Optional[float] = None
    actual_duration: Optional[int] = None
    pause_count: int = 0
    total_pause_minutes: int = 0

    # 顺延
    postpone_count: int = 0
    last_postponed_from: Optional[str] = None

    created_at: str = field(default_factory=_now_iso)
    updated_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "planId": self.plan_id,
            "originNodeId": self.origin_node_id, "title": self.title,
            "scheduledStart": self.scheduled_start,
            "scheduledDuration": self.scheduled_duration,
            "type": self.type, "cognitiveLoad": self.cognitive_load,
            "priority": self.priority, "status": self.status,
            "reason": self.reason,
            "actualStartTime": self.actual_start_time,
            "actualEndTime": self.actual_end_time,
            "actualDuration": self.actual_duration,
            "pauseCount": self.pause_count,
            "totalPauseMinutes": self.total_pause_minutes,
            "postponeCount": self.postpone_count,
            "lastPostponedFrom": self.last_postponed_from,
            "createdAt": self.created_at, "updatedAt": self.updated_at,
        }


@dataclass
class UnplacedTask:
    """未排入计划的任务 — 放不下的任务"""
    id: str = field(default_factory=_generate_id)
    origin_node_id: str = ""
    title: str = ""
    estimated_duration: int = 45
    priority: str = "medium"
    cognitive_load: str = "medium"
    type: str = "deep_work"
    splittable: bool = True
    min_duration: int = 25

    def to_dict(self) -> dict:
        return {
            "id": self.id, "originNodeId": self.origin_node_id,
            "title": self.title,
            "estimatedDuration": self.estimated_duration,
            "priority": self.priority, "cognitiveLoad": self.cognitive_load,
            "type": self.type, "splittable": self.splittable,
            "minDuration": self.min_duration,
        }


@dataclass
class DailyPlan:
    """每日计划 — 一天的完整计划

    归属：规划世界
    包含：固定项 + AI 排程任务 + 放不下的任务 + 留白比例 + 建议列表
    """
    id: str = field(default_factory=_generate_id)
    date: str = ""              # YYYY-MM-DD
    tasks: list = field(default_factory=list)         # List[PlannedAction]
    unplaced_tasks: list = field(default_factory=list)  # List[UnplacedTask]
    fixed_items: list = field(default_factory=list)   # List[FixedItem]
    white_space_ratio: float = 0.0  # 留白比例 0-1
    total_work_minutes: int = 0
    suggestions: list = field(default_factory=list)   # List[str]
    status: str = "draft"       # draft / confirmed
    algorithm_version: str = "v1.0"
    created_at: str = field(default_factory=_now_iso)
    confirmed_at: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id, "date": self.date,
            "tasks": [t.to_dict() if hasattr(t, 'to_dict') else t for t in self.tasks],
            "unplacedTasks": [t.to_dict() if hasattr(t, 'to_dict') else t for t in self.unplaced_tasks],
            "fixedItems": [f.to_dict() if hasattr(f, 'to_dict') else f for f in self.fixed_items],
            "whiteSpaceRatio": self.white_space_ratio,
            "totalWorkMinutes": self.total_work_minutes,
            "suggestions": self.suggestions,
            "status": self.status,
            "algorithmVersion": self.algorithm_version,
            "createdAt": self.created_at,
            "confirmedAt": self.confirmed_at,
        }


@dataclass
class ActivitySegment:
    """活动段 — 实际检测到的活动

    归属：执行世界
    与计划的关联：related_commitment_id 指向对应的 DailyCommitment
    """
    id: str = field(default_factory=_generate_id)
    start: float = 0.0          # 毫秒时间戳
    end: float = 0.0
    activity_type: str = "unknown"  # deep_work / light_work / meeting / rest / meal / etc
    confidence: float = 0.5
    source: str = "auto_detected"   # manual / auto_detected / commitment_derived / calendar_import
    title: str = ""
    related_commitment_id: Optional[str] = None
    tags: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "start": self.start, "end": self.end,
            "activityType": self.activity_type, "confidence": self.confidence,
            "source": self.source, "title": self.title,
            "relatedCommitmentId": self.related_commitment_id,
            "tags": self.tags,
        }


@dataclass
class DeviationItem:
    """单个承诺的偏差记录"""
    commitment_id: str = ""
    has_deviation: bool = False
    types: list = field(default_factory=list)  # [start_time, duration, not_executed, replacement, order]
    max_severity: str = "none"  # none / mild / moderate / significant / severe
    start_deviation_minutes: int = 0   # 正=晚开始，负=早开始
    duration_deviation_minutes: int = 0
    duration_deviation_ratio: float = 0.0
    completion_status: str = "pending"  # pending / completed / skipped / postponed

    def to_dict(self) -> dict:
        return {
            "commitmentId": self.commitment_id,
            "hasDeviation": self.has_deviation,
            "types": self.types,
            "maxSeverity": self.max_severity,
            "startDeviationMinutes": self.start_deviation_minutes,
            "durationDeviationMinutes": self.duration_deviation_minutes,
            "durationDeviationRatio": self.duration_deviation_ratio,
            "completionStatus": self.completion_status,
        }


@dataclass
class DailyDeviationReport:
    """每日偏差报告 — 计划 vs 实际

    归属：偏差反馈世界
    一天结束后，对比今天的计划和实际执行，生成结构化偏差分析。
    """
    date: str = ""
    total_planned: int = 0
    completed: int = 0
    skipped: int = 0
    postponed: int = 0
    completion_rate: float = 0.0
    avg_start_deviation: float = 0.0      # 平均开始时间偏差（分钟）
    avg_duration_deviation: float = 0.0   # 平均时长偏差（分钟）
    avg_duration_deviation_ratio: float = 0.0
    total_planned_minutes: int = 0
    total_actual_minutes: int = 0
    deviations: list = field(default_factory=list)  # List[DeviationItem]
    summary: str = ""  # AI 生成的一句话总结（温暖、不评判）

    def to_dict(self) -> dict:
        return {
            "date": self.date,
            "totalPlanned": self.total_planned,
            "completed": self.completed,
            "skipped": self.skipped,
            "postponed": self.postponed,
            "completionRate": self.completion_rate,
            "avgStartDeviation": self.avg_start_deviation,
            "avgDurationDeviation": self.avg_duration_deviation,
            "avgDurationDeviationRatio": self.avg_duration_deviation_ratio,
            "totalPlannedMinutes": self.total_planned_minutes,
            "totalActualMinutes": self.total_actual_minutes,
            "deviations": [d.to_dict() if hasattr(d, 'to_dict') else d for d in self.deviations],
            "summary": self.summary,
        }


# 承诺状态机
COMMITMENT_STATES = ["scheduled", "in_progress", "paused", "done", "skipped", "postponed"]

COMMITMENT_TRANSITIONS = {
    "scheduled": ["in_progress", "skipped", "postponed"],
    "in_progress": ["paused", "done", "skipped"],
    "paused": ["in_progress", "done", "skipped", "postponed"],
    "done": [],          # 终态
    "skipped": [],       # 终态
    "postponed": ["scheduled"],  # 顺延后重新排入
}
