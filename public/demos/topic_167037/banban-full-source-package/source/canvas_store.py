"""
伴伴 Canvas 画布数据层

严格按照《伴伴 Canvas 画板：完整产品与工程实现规范 V3.0》第14章数据结构实现。
包含 CanvasNode、CanvasRelation、CanvasCandidate、CanvasGroup 四个核心数据类型，
以及它们的 CRUD 操作和批量变更接口。

所有数据持久化到 companion_db.Database 的 SQLite 中。
"""

import json
import uuid
import sqlite3
from datetime import datetime
from dataclasses import dataclass, field, asdict
from typing import Optional
from companion_db import Database

# ============================================================
# 枚举常量 — P0 重构：6 类节点 + 三套独立状态
# ============================================================

# 节点类型（6 类，替代旧 8 类）
# 旧→新映射：inspiration→record, desire→record, goal→project,
#            resource→record, constraint→record
NODE_KINDS = [
    'domain',    # 领域：工作/健康/学习/生活（容器型，无完成条件）
    'project',   # 项目：有明确结束状态的一组行动
    'outcome',   # 成果：项目需要完成的结果或里程碑
    'action',    # 行动：一次可执行的具体任务
    'habit',     # 习惯：按周期重复的行为
    'record',    # 记录：想法/观察/信息，暂不能行动
]

# 旧节点类型（向后兼容，用于迁移）
LEGACY_KINDS = ['inspiration', 'desire', 'goal', 'resource', 'constraint']
LEGACY_KIND_MAP = {
    'inspiration': 'record',
    'desire': 'record',
    'goal': 'project',
    'resource': 'record',
    'constraint': 'record',
}

# 用户意愿度（保留，表示用户对节点的意愿强度）
COMMITMENT_LEVELS = [
    'observed', 'interested', 'intended',
    'committed', 'scheduled', 'active',
]

# === 状态维度 1：信息确认状态 ===
# AI 对用户信息的理解是否得到认可
CONFIRMATION_STATUSES = ['pending', 'confirmed', 'ignored']
# pending: 待确认（AI 来源默认）
# confirmed: 已确认（用户认可）
# ignored: 已忽略（用户不认可）

# === 状态维度 2：执行状态 ===
# 事情当前做到哪里
EXECUTION_STATUSES = [
    'unplanned',   # 未规划
    'scheduled',   # 已安排
    'in_progress', # 进行中
    'blocked',     # 阻塞
    'done',        # 已完成
    'archived',    # 已归档
]

# 执行状态转换约束
EXECUTION_TRANSITIONS = {
    'unplanned':   ['scheduled', 'archived'],
    'scheduled':   ['in_progress', 'unplanned', 'archived'],
    'in_progress': ['blocked', 'done', 'scheduled'],
    'blocked':     ['in_progress', 'archived'],
    'done':        ['archived'],
    'archived':    [],
}

# === 状态维度 3：画布布局状态 ===
# 仅 is_pinned 字段，已在 CanvasNode 中

# 旧 phase 值（向后兼容）
NODE_PHASES = [
    'candidate', 'clarifying', 'confirmed',
    'planned', 'active', 'completed', 'paused', 'archived',
]
# 旧 phase → 新状态映射
PHASE_TO_CONFIRMATION = {
    'candidate': 'pending', 'clarifying': 'pending',
    'confirmed': 'confirmed', 'planned': 'confirmed',
    'active': 'confirmed', 'completed': 'confirmed',
    'paused': 'confirmed', 'archived': 'confirmed',
}
PHASE_TO_EXECUTION = {
    'candidate': 'unplanned', 'clarifying': 'unplanned',
    'confirmed': 'unplanned', 'planned': 'scheduled',
    'active': 'in_progress', 'completed': 'done',
    'paused': 'blocked', 'archived': 'archived',
}

NODE_SOURCES = [
    'onboarding', 'night_review', 'chat', 'manual', 'ai_suggestion',
]

# 关系类型（6 种，有明确方向）
# 方向：source → target
RELATION_TYPES = [
    'belongs_to',      # A 属于 B（A 是 B 的子项）  A→B
    'decomposes_to',   # A 拆解为 B（B 是 A 的子任务）A→B
    'depends_on',      # A 依赖 B（B 必须先完成）    A→B
    'supports',        # A 支持 B（A 有助于 B）      A→B
    'conflicts_with',  # A 冲突于 B（互斥）          A→B（双向语义）
    'duplicates',      # A 重复为 B（同一件事）      A→B（双向语义）
]
# 注意：移除了 inspired_by（语义模糊）和 replaces（用 merged 替代）

# 旧关系类型映射
LEGACY_RELATION_MAP = {
    'inspired_by': 'supports',
    'replaces': 'duplicates',
}

# 承诺度排序（用于比较）
COMMITMENT_ORDER = {c: i for i, c in enumerate(COMMITMENT_LEVELS)}

# === 候选完整性门槛 ===
# 每种节点类型成为正式节点的最低信息要求
COMPLETENESS_RULES = {
    'domain':   [],  # 领域无要求
    'project':  ['title'],  # 项目只需标题
    'outcome':  ['title', 'target_result'],  # 成果需要完成标准
    'action':   ['title', 'estimated_minutes'],  # 行动需要预估时间
    'habit':    ['title', 'frequency'],  # 习惯需要频率
    'record':   [],  # 记录无要求
}

# === 重复检测 ===
DUPLICATE_THRESHOLD = 0.6  # Jaccard 相似度阈值


def _now_iso() -> str:
    return datetime.now().isoformat()


def _uuid() -> str:
    return str(uuid.uuid4())


# ============================================================
# 数据模型（对应设计文档第14章）
# ============================================================

@dataclass
class NodeOrigin:
    """节点来源证据"""
    id: str = field(default_factory=_uuid)
    source: str = "manual"           # onboarding|night_review|chat|manual|ai_suggestion
    source_id: Optional[str] = None   # 来源ID（如聊天消息ID、复盘记录ID）
    original_text: str = ""           # 原始文本
    created_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(d: dict) -> 'NodeOrigin':
        return NodeOrigin(
            id=d.get('id', _uuid()),
            source=d.get('source', 'manual'),
            source_id=d.get('source_id'),
            original_text=d.get('original_text', ''),
            created_at=d.get('created_at', _now_iso()),
        )


@dataclass
class CanvasNode:
    """
    画布节点 — P0 重构后的核心实体
    
    三套独立状态：
    1. confirmation_status: 信息确认状态（AI 理解是否得到认可）
    2. execution_status: 执行状态（事情做到哪里）
    3. is_pinned: 布局状态（画布上的固定位置）
    """
    id: str = field(default_factory=_uuid)
    user_id: str = "default"
    title: str = ""
    description: Optional[str] = None

    # 维度一：Kind（6 类）
    kind: str = "record"
    
    # 维度二：用户意愿度（保留概念）
    commitment: str = "observed"
    
    # === 新状态字段 ===
    # 状态维度 1：信息确认状态
    confirmation_status: str = "confirmed"  # pending|confirmed|ignored
    # 状态维度 2：执行状态
    execution_status: str = "unplanned"  # unplanned|scheduled|in_progress|blocked|done|archived
    
    # 旧字段（向后兼容，由新字段派生）
    phase: str = "confirmed"  # 保留但不再作为主要状态

    # 维度四：Source
    source: str = "manual"
    origins: list = field(default_factory=list)  # List[NodeOrigin]

    # AI 判断
    confidence: float = 1.0
    needs_confirmation: bool = False

    # 分维评分（不使用统一 priority）
    idea_relevance: Optional[float] = None
    goal_priority: Optional[float] = None
    action_priority: Optional[float] = None
    manual_importance: Optional[str] = None  # low|medium|high

    # 行动属性
    target_result: Optional[str] = None
    estimated_minutes: Optional[int] = None
    energy_cost: Optional[str] = None  # low|medium|high
    cognitive_load: Optional[str] = None  # deep|medium|light — 认知负荷（用于计划排程）
    frequency: Optional[str] = None

    # 维度五：Layout
    x: float = 0.0
    y: float = 0.0
    is_pinned: bool = False
    pinned_at: Optional[str] = None
    pin_reason: Optional[str] = None  # important|keep_position|manual
    group_id: Optional[str] = None
    z_index: int = 1
    # 分类视图坐标（不覆盖自由视图坐标）
    taxonomy_x: Optional[float] = None
    taxonomy_y: Optional[float] = None

    # 执行追踪
    accumulated_minutes: int = 0
    last_progress_at: Optional[str] = None

    # 元数据
    created_by: str = "user"  # user|ai|system
    created_at: str = field(default_factory=_now_iso)
    updated_at: str = field(default_factory=_now_iso)
    deleted_at: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'userId': self.user_id,
            'title': self.title,
            'description': self.description,
            'kind': self.kind,
            'commitment': self.commitment,
            'confirmationStatus': self.confirmation_status,
            'executionStatus': self.execution_status,
            'phase': self.phase,  # 向后兼容
            'source': self.source,
            'origins': [o.to_dict() if isinstance(o, NodeOrigin) else o for o in self.origins],
            'confidence': self.confidence,
            'needsConfirmation': self.needs_confirmation,
            'ideaRelevance': self.idea_relevance,
            'goalPriority': self.goal_priority,
            'actionPriority': self.action_priority,
            'manualImportance': self.manual_importance,
            'targetResult': self.target_result,
            'estimatedMinutes': self.estimated_minutes,
            'energyCost': self.energy_cost,
            'cognitiveLoad': self.cognitive_load,
            'frequency': self.frequency,
            'layout': {
                'x': self.x,
                'y': self.y,
                'isPinned': self.is_pinned,
                'pinnedAt': self.pinned_at,
                'pinReason': self.pin_reason,
                'groupId': self.group_id,
                'zIndex': self.z_index,
            },
            'taxonomyPosition': {
                'x': self.taxonomy_x,
                'y': self.taxonomy_y,
            } if self.taxonomy_x is not None else None,
            'accumulatedMinutes': self.accumulated_minutes,
            'lastProgressAt': self.last_progress_at,
            'createdBy': self.created_by,
            'createdAt': self.created_at,
            'updatedAt': self.updated_at,
            'deletedAt': self.deleted_at,
        }

    @staticmethod
    def from_dict(d: dict) -> 'CanvasNode':
        layout = d.get('layout', {})
        origins = d.get('origins', [])
        kind = d.get('kind', 'record')
        # 迁移旧类型
        if kind in LEGACY_KIND_MAP:
            kind = LEGACY_KIND_MAP[kind]
        
        # 确定新状态字段
        phase = d.get('phase', 'confirmed')
        confirmation_status = d.get('confirmationStatus') or PHASE_TO_CONFIRMATION.get(phase, 'confirmed')
        execution_status = d.get('executionStatus') or PHASE_TO_EXECUTION.get(phase, 'unplanned')
        
        return CanvasNode(
            id=d.get('id', _uuid()),
            user_id=d.get('userId', 'default'),
            title=d.get('title', ''),
            description=d.get('description'),
            kind=kind,
            commitment=d.get('commitment', 'observed'),
            confirmation_status=confirmation_status,
            execution_status=execution_status,
            phase=phase,
            source=d.get('source', 'manual'),
            origins=[NodeOrigin.from_dict(o) if isinstance(o, dict) else o for o in origins],
            confidence=d.get('confidence', 1.0),
            needs_confirmation=d.get('needsConfirmation', False),
            idea_relevance=d.get('ideaRelevance'),
            goal_priority=d.get('goalPriority'),
            action_priority=d.get('actionPriority'),
            manual_importance=d.get('manualImportance'),
            target_result=d.get('targetResult'),
            estimated_minutes=d.get('estimatedMinutes'),
            energy_cost=d.get('energyCost'),
            cognitive_load=d.get('cognitiveLoad'),
            frequency=d.get('frequency'),
            x=layout.get('x', 0.0) if isinstance(layout, dict) else d.get('x', 0.0),
            y=layout.get('y', 0.0) if isinstance(layout, dict) else d.get('y', 0.0),
            is_pinned=layout.get('isPinned', False) if isinstance(layout, dict) else d.get('is_pinned', False),
            pinned_at=layout.get('pinnedAt') if isinstance(layout, dict) else d.get('pinned_at'),
            pin_reason=layout.get('pinReason') if isinstance(layout, dict) else d.get('pin_reason'),
            group_id=layout.get('groupId') if isinstance(layout, dict) else d.get('group_id'),
            z_index=layout.get('zIndex', 1) if isinstance(layout, dict) else d.get('z_index', 1),
            taxonomy_x=d.get('taxonomyPosition', {}).get('x') if d.get('taxonomyPosition') else None,
            taxonomy_y=d.get('taxonomyPosition', {}).get('y') if d.get('taxonomyPosition') else None,
            accumulated_minutes=d.get('accumulatedMinutes', 0),
            last_progress_at=d.get('lastProgressAt'),
            created_by=d.get('createdBy', 'user'),
            created_at=d.get('createdAt', _now_iso()),
            updated_at=d.get('updatedAt', _now_iso()),
            deleted_at=d.get('deletedAt'),
        )


@dataclass
class CanvasRelation:
    """节点关系 — 对应设计文档 14.CanvasRelation"""
    id: str = field(default_factory=_uuid)
    source_node_id: str = ""
    target_node_id: str = ""
    relation: str = "supports"
    created_by: str = "user"  # user|ai
    confidence: Optional[float] = None
    confirmed_at: Optional[str] = None
    created_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'sourceNodeId': self.source_node_id,
            'targetNodeId': self.target_node_id,
            'relation': self.relation,
            'createdBy': self.created_by,
            'confidence': self.confidence,
            'confirmedAt': self.confirmed_at,
            'createdAt': self.created_at,
        }

    @staticmethod
    def from_dict(d: dict) -> 'CanvasRelation':
        return CanvasRelation(
            id=d.get('id', _uuid()),
            source_node_id=d.get('sourceNodeId', d.get('source_node_id', '')),
            target_node_id=d.get('targetNodeId', d.get('target_node_id', '')),
            relation=d.get('relation', 'supports'),
            created_by=d.get('createdBy', d.get('created_by', 'user')),
            confidence=d.get('confidence'),
            confirmed_at=d.get('confirmedAt', d.get('confirmed_at')),
            created_at=d.get('createdAt', d.get('created_at', _now_iso())),
        )


@dataclass
class CanvasCandidate:
    """候选节点 — 对应设计文档 14.CanvasCandidate"""
    id: str = field(default_factory=_uuid)
    source: str = "chat"
    source_id: Optional[str] = None
    original_text: str = ""
    proposal: dict = field(default_factory=dict)  # CanvasNode without id/userId/layout
    status: str = "pending"  # pending|accepted|modified|rejected|merged
    ai_reason: str = ""
    created_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'source': self.source,
            'sourceId': self.source_id,
            'originalText': self.original_text,
            'proposal': self.proposal,
            'status': self.status,
            'aiReason': self.ai_reason,
            'createdAt': self.created_at,
        }

    @staticmethod
    def from_dict(d: dict) -> 'CanvasCandidate':
        return CanvasCandidate(
            id=d.get('id', _uuid()),
            source=d.get('source', 'chat'),
            source_id=d.get('sourceId'),
            original_text=d.get('originalText', ''),
            proposal=d.get('proposal', {}),
            status=d.get('status', 'pending'),
            ai_reason=d.get('aiReason', ''),
            created_at=d.get('createdAt', _now_iso()),
        )


@dataclass
class CanvasGroup:
    """分组容器 — 对应设计文档 11.4.CanvasGroup"""
    id: str = field(default_factory=_uuid)
    title: str = ""
    description: Optional[str] = None
    x: float = 0.0
    y: float = 0.0
    width: float = 400.0
    height: float = 300.0
    is_collapsed: bool = False
    created_by: str = "user"  # user|ai
    created_at: str = field(default_factory=_now_iso)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'position': {'x': self.x, 'y': self.y},
            'size': {'width': self.width, 'height': self.height},
            'isCollapsed': self.is_collapsed,
            'createdBy': self.created_by,
            'createdAt': self.created_at,
        }

    @staticmethod
    def from_dict(d: dict) -> 'CanvasGroup':
        pos = d.get('position', {})
        size = d.get('size', {})
        return CanvasGroup(
            id=d.get('id', _uuid()),
            title=d.get('title', ''),
            description=d.get('description'),
            x=pos.get('x', 0.0),
            y=pos.get('y', 0.0),
            width=size.get('width', 400.0),
            height=size.get('height', 300.0),
            is_collapsed=d.get('isCollapsed', False),
            created_by=d.get('createdBy', 'user'),
            created_at=d.get('createdAt', _now_iso()),
        )


# ============================================================
# 变更记录（用于撤销/重做）
# ============================================================

@dataclass
class CanvasMutation:
    """一次画布变更操作"""
    type: str = ""        # MOVE_NODE|PIN_NODE|UPDATE_NODE|DELETE_NODE|CREATE_NODE|ADD_RELATION|REMOVE_RELATION|CREATE_GROUP|MOVE_TO_GROUP
    node_id: Optional[str] = None
    position: Optional[dict] = None
    is_pinned: Optional[bool] = None
    patch: Optional[dict] = None
    relation_id: Optional[str] = None
    relation: Optional[dict] = None
    group_id: Optional[str] = None
    node_ids: Optional[list] = None
    group: Optional[dict] = None
    before: Optional[dict] = None  # 撤销用
    after: Optional[dict] = None   # 重做用
    created_at: str = field(default_factory=_now_iso)


# ============================================================
# CanvasStore — 画布存储与操作
# ============================================================

class CanvasStore:
    """
    画布存储层 — 所有画布数据的 CRUD 和批量操作

    使用 companion_db.Database 的 SQLite 进行持久化。
    对应设计文档第15章数据库结构、第20章自动保存、第21章API设计。
    """

    def __init__(self, db: Database = None):
        self.db = db or Database()
        self._ensure_tables()

    def _ensure_tables(self):
        """创建画布相关表（如果不存在）"""
        conn = self.db._conn()
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS canvas_nodes (
                id TEXT PRIMARY KEY,
                user_id TEXT DEFAULT 'default',
                title TEXT NOT NULL DEFAULT '',
                description TEXT,
                kind TEXT DEFAULT 'inspiration',
                commitment TEXT DEFAULT 'observed',
                phase TEXT DEFAULT 'confirmed',
                source TEXT DEFAULT 'manual',
                confidence REAL DEFAULT 1.0,
                needs_confirmation INTEGER DEFAULT 0,
                idea_relevance REAL,
                goal_priority REAL,
                action_priority REAL,
                manual_importance TEXT,
                target_result TEXT,
                estimated_minutes INTEGER,
                energy_cost TEXT,
                frequency TEXT,
                x REAL DEFAULT 0,
                y REAL DEFAULT 0,
                is_pinned INTEGER DEFAULT 0,
                pinned_at TEXT,
                pin_reason TEXT,
                group_id TEXT,
                z_index INTEGER DEFAULT 1,
                taxonomy_x REAL,
                taxonomy_y REAL,
                accumulated_minutes INTEGER DEFAULT 0,
                last_progress_at TEXT,
                created_by TEXT DEFAULT 'user',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                deleted_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_canvas_nodes_user_phase ON canvas_nodes(user_id, phase);
            CREATE INDEX IF NOT EXISTS idx_canvas_nodes_user_kind ON canvas_nodes(user_id, kind);
            CREATE INDEX IF NOT EXISTS idx_canvas_nodes_group ON canvas_nodes(group_id);

            CREATE TABLE IF NOT EXISTS canvas_origins (
                id TEXT PRIMARY KEY,
                node_id TEXT NOT NULL,
                source TEXT DEFAULT 'manual',
                source_id TEXT,
                original_text TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                FOREIGN KEY (node_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_canvas_origins_node ON canvas_origins(node_id);

            CREATE TABLE IF NOT EXISTS canvas_relations (
                id TEXT PRIMARY KEY,
                source_node_id TEXT NOT NULL,
                target_node_id TEXT NOT NULL,
                relation TEXT DEFAULT 'supports',
                created_by TEXT DEFAULT 'user',
                confidence REAL,
                confirmed_at TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(source_node_id, target_node_id, relation)
            );
            CREATE INDEX IF NOT EXISTS idx_canvas_relations_source ON canvas_relations(source_node_id);
            CREATE INDEX IF NOT EXISTS idx_canvas_relations_target ON canvas_relations(target_node_id);

            CREATE TABLE IF NOT EXISTS canvas_candidates (
                id TEXT PRIMARY KEY,
                source TEXT DEFAULT 'chat',
                source_id TEXT,
                original_text TEXT DEFAULT '',
                proposal TEXT DEFAULT '{}',
                status TEXT DEFAULT 'pending',
                ai_reason TEXT DEFAULT '',
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_canvas_candidates_status ON canvas_candidates(status);

            CREATE TABLE IF NOT EXISTS canvas_groups (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT '',
                description TEXT,
                x REAL DEFAULT 0,
                y REAL DEFAULT 0,
                width REAL DEFAULT 400,
                height REAL DEFAULT 300,
                is_collapsed INTEGER DEFAULT 0,
                created_by TEXT DEFAULT 'user',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS canvas_version (
                id INTEGER PRIMARY KEY DEFAULT 1,
                version INTEGER DEFAULT 0
            );
            INSERT OR IGNORE INTO canvas_version (id, version) VALUES (1, 0);

            CREATE TABLE IF NOT EXISTS canvas_classification_feedback (
                id TEXT PRIMARY KEY,
                candidate_id TEXT,
                original_text TEXT NOT NULL,
                ai_kind TEXT,
                ai_commitment TEXT,
                ai_confidence REAL,
                user_decision TEXT NOT NULL,
                user_corrected_kind TEXT,
                user_corrected_commitment TEXT,
                feedback_reason TEXT,
                source TEXT,
                created_at TEXT NOT NULL
            );
        """)
        # 迁移：为旧表添加新列
        for col_def in [
            "ALTER TABLE canvas_nodes ADD COLUMN pinned_at TEXT",
            "ALTER TABLE canvas_nodes ADD COLUMN pin_reason TEXT",
            "ALTER TABLE canvas_nodes ADD COLUMN cognitive_load TEXT",
            "ALTER TABLE canvas_nodes ADD COLUMN confirmation_status TEXT DEFAULT 'confirmed'",
            "ALTER TABLE canvas_nodes ADD COLUMN execution_status TEXT DEFAULT 'unplanned'",
        ]:
            try:
                conn.execute(col_def)
            except Exception:
                pass
        
        # 迁移旧 kind 值到新类型
        for old_kind, new_kind in LEGACY_KIND_MAP.items():
            conn.execute(f"UPDATE canvas_nodes SET kind=? WHERE kind=?", (new_kind, old_kind))
        
        # 迁移旧 phase 值到新状态字段
        for old_phase, new_conf in PHASE_TO_CONFIRMATION.items():
            conn.execute(
                f"UPDATE canvas_nodes SET confirmation_status=? WHERE phase=? AND (confirmation_status IS NULL OR confirmation_status='')",
                (new_conf, old_phase)
            )
        for old_phase, new_exec in PHASE_TO_EXECUTION.items():
            conn.execute(
                f"UPDATE canvas_nodes SET execution_status=? WHERE phase=? AND (execution_status IS NULL OR execution_status='')",
                (new_exec, old_phase)
            )
        
        # 迁移旧关系类型
        for old_rel, new_rel in LEGACY_RELATION_MAP.items():
            conn.execute(
                f"UPDATE canvas_relations SET relation=? WHERE relation=?",
                (new_rel, old_rel)
            )
        
        conn.commit()

    # ============================================================
    # 版本管理
    # ============================================================

    def get_version(self) -> int:
        conn = self.db._conn()
        row = conn.execute("SELECT version FROM canvas_version WHERE id=1").fetchone()
        return row["version"] if row else 0

    def _increment_version(self):
        conn = self.db._conn()
        conn.execute("UPDATE canvas_version SET version = version + 1 WHERE id=1")
        conn.commit()

    # ============================================================
    # 节点 CRUD
    # ============================================================

    def create_node(self, node: CanvasNode) -> CanvasNode:
        """创建节点"""
        conn = self.db._conn()
        node.updated_at = _now_iso()
        # 确保 kind 是新类型
        if node.kind in LEGACY_KIND_MAP:
            node.kind = LEGACY_KIND_MAP[node.kind]
        # 派生 phase（向后兼容）
        if node.confirmation_status == 'pending':
            node.phase = 'candidate'
        elif node.execution_status == 'done':
            node.phase = 'completed'
        elif node.execution_status == 'in_progress':
            node.phase = 'active'
        elif node.execution_status == 'scheduled':
            node.phase = 'planned'
        elif node.execution_status == 'blocked':
            node.phase = 'paused'
        elif node.execution_status == 'archived':
            node.phase = 'archived'
        else:
            node.phase = 'confirmed'
        
        conn.execute("""
            INSERT INTO canvas_nodes (id, user_id, title, description, kind, commitment, 
                confirmation_status, execution_status, phase, source,
                confidence, needs_confirmation, idea_relevance, goal_priority, action_priority,
                manual_importance, target_result, estimated_minutes, energy_cost, frequency,
                cognitive_load, x, y, is_pinned, pinned_at, pin_reason, group_id, z_index, 
                taxonomy_x, taxonomy_y, accumulated_minutes, last_progress_at, 
                created_by, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            node.id, node.user_id, node.title, node.description,
            node.kind, node.commitment,
            node.confirmation_status, node.execution_status, node.phase,
            node.source,
            node.confidence, int(node.needs_confirmation),
            node.idea_relevance, node.goal_priority, node.action_priority,
            node.manual_importance, node.target_result, node.estimated_minutes,
            node.energy_cost, node.frequency, node.cognitive_load,
            node.x, node.y, int(node.is_pinned), node.pinned_at, node.pin_reason,
            node.group_id, node.z_index,
            node.taxonomy_x, node.taxonomy_y,
            node.accumulated_minutes, node.last_progress_at,
            node.created_by, node.created_at, node.updated_at,
        ))
        # 插入来源
        for origin in node.origins:
            if isinstance(origin, dict):
                origin = NodeOrigin.from_dict(origin)
            conn.execute("""
                INSERT INTO canvas_origins (id, node_id, source, source_id, original_text, created_at)
                VALUES (?,?,?,?,?,?)
            """, (origin.id, node.id, origin.source, origin.source_id,
                  origin.original_text, origin.created_at))
        conn.commit()
        self._increment_version()
        return node

    def get_node(self, node_id: str) -> Optional[CanvasNode]:
        """获取单个节点"""
        conn = self.db._conn()
        row = conn.execute(
            "SELECT * FROM canvas_nodes WHERE id=? AND deleted_at IS NULL", (node_id,)
        ).fetchone()
        if not row:
            return None
        return self._row_to_node(row)

    def list_nodes(self, include_deleted: bool = False) -> list:
        """获取所有节点"""
        conn = self.db._conn()
        sql = "SELECT * FROM canvas_nodes"
        if not include_deleted:
            sql += " WHERE deleted_at IS NULL"
        sql += " ORDER BY z_index, created_at"
        rows = conn.execute(sql).fetchall()
        return [self._row_to_node(r) for r in rows]

    def update_node(self, node_id: str, patch: dict) -> Optional[CanvasNode]:
        """部分更新节点"""
        node = self.get_node(node_id)
        if not node:
            return None

        # 应用 patch
        field_map = {
            'title': 'title', 'description': 'description',
            'kind': 'kind', 'commitment': 'commitment',
            'confirmationStatus': 'confirmation_status',
            'executionStatus': 'execution_status',
            'phase': 'phase',
            'source': 'source', 'confidence': 'confidence',
            'needsConfirmation': 'needs_confirmation',
            'ideaRelevance': 'idea_relevance', 'goalPriority': 'goal_priority',
            'actionPriority': 'action_priority', 'manualImportance': 'manual_importance',
            'targetResult': 'target_result', 'estimatedMinutes': 'estimated_minutes',
            'energyCost': 'energy_cost', 'cognitiveLoad': 'cognitive_load', 'frequency': 'frequency',
            'isPinned': 'is_pinned', 'pinnedAt': 'pinned_at', 'pinReason': 'pin_reason',
            'groupId': 'group_id', 'zIndex': 'z_index',
            'accumulatedMinutes': 'accumulated_minutes', 'lastProgressAt': 'last_progress_at',
        }

        conn = self.db._conn()
        updates = []
        values = []
        seen_fields = set()  # 防止 layout.x 和直接 x 重复

        for json_key, db_key in field_map.items():
            if json_key in patch:
                val = patch[json_key]
                if db_key in ('is_pinned', 'needs_confirmation'):
                    val = int(val) if val else 0
                elif db_key in ('estimated_minutes', 'accumulated_minutes', 'z_index'):
                    val = int(val) if val is not None else None
                elif db_key in ('confidence', 'idea_relevance', 'goal_priority',
                                'action_priority', 'x', 'y', 'taxonomy_x', 'taxonomy_y'):
                    val = float(val) if val is not None else None
                updates.append(f"{db_key}=?")
                values.append(val)
                seen_fields.add(db_key)

        # 处理 layout 子对象
        if 'layout' in patch:
            layout = patch['layout']
            if 'x' in layout and 'x' not in seen_fields:
                updates.append("x=?")
                values.append(float(layout['x']))
                seen_fields.add('x')
            if 'y' in layout and 'y' not in seen_fields:
                updates.append("y=?")
                values.append(float(layout['y']))
                seen_fields.add('y')
            if 'isPinned' in layout and 'is_pinned' not in seen_fields:
                updates.append("is_pinned=?")
                values.append(int(layout['isPinned']))
                seen_fields.add('is_pinned')
            if 'groupId' in layout and 'group_id' not in seen_fields:
                updates.append("group_id=?")
                values.append(layout['groupId'])
                seen_fields.add('group_id')
            if 'zIndex' in layout and 'z_index' not in seen_fields:
                updates.append("z_index=?")
                values.append(int(layout['zIndex']))
                seen_fields.add('z_index')

        # 直接 x/y 也可以（仅当未被 layout 处理时）
        if 'x' in patch and 'x' not in seen_fields:
            updates.append("x=?")
            values.append(float(patch['x']))
            seen_fields.add('x')
        if 'y' in patch and 'y' not in seen_fields:
            updates.append("y=?")
            values.append(float(patch['y']))
            seen_fields.add('y')

        if not updates:
            return node

        updates.append("updated_at=?")
        values.append(_now_iso())
        values.append(node_id)

        conn.execute(f"UPDATE canvas_nodes SET {', '.join(updates)} WHERE id=?", values)
        conn.commit()
        self._increment_version()
        return self.get_node(node_id)

    def move_node(self, node_id: str, x: float, y: float) -> Optional[CanvasNode]:
        """移动节点位置"""
        return self.update_node(node_id, {'x': x, 'y': y})

    def toggle_pin(self, node_id: str) -> Optional[CanvasNode]:
        """切换固定状态（不自动提升 commitment，文档10）"""
        node = self.get_node(node_id)
        if not node:
            return None
        new_pinned = not node.is_pinned
        patch = {
            'isPinned': new_pinned,
            'manualImportance': 'high' if new_pinned else node.manual_importance,
        }
        if new_pinned:
            patch['pinnedAt'] = _now_iso()
            patch['pinReason'] = 'manual'
        else:
            patch['pinnedAt'] = None
            patch['pinReason'] = None
        return self.update_node(node_id, patch)

    def soft_delete_node(self, node_id: str) -> bool:
        """软删除节点"""
        conn = self.db._conn()
        conn.execute(
            "UPDATE canvas_nodes SET deleted_at=?, updated_at=? WHERE id=?",
            (_now_iso(), _now_iso(), node_id)
        )
        conn.commit()
        self._increment_version()
        return True

    def _row_to_node(self, row) -> CanvasNode:
        """数据库行转 CanvasNode"""
        conn = self.db._conn()
        # 加载来源
        origin_rows = conn.execute(
            "SELECT * FROM canvas_origins WHERE node_id=?", (row["id"],)
        ).fetchall()
        origins = [NodeOrigin(
            id=o["id"], source=o["source"], source_id=o["source_id"],
            original_text=o["original_text"], created_at=o["created_at"],
        ) for o in origin_rows]

        # 读取新状态字段，如果列不存在则从 phase 派生
        row_keys = row.keys()
        phase = row["phase"]
        confirmation_status = row["confirmation_status"] if "confirmation_status" in row_keys and row["confirmation_status"] else PHASE_TO_CONFIRMATION.get(phase, "confirmed")
        execution_status = row["execution_status"] if "execution_status" in row_keys and row["execution_status"] else PHASE_TO_EXECUTION.get(phase, "unplanned")
        cognitive_load = row["cognitive_load"] if "cognitive_load" in row_keys else None

        # 迁移旧 kind
        kind = row["kind"]
        if kind in LEGACY_KIND_MAP:
            kind = LEGACY_KIND_MAP[kind]

        return CanvasNode(
            id=row["id"], user_id=row["user_id"],
            title=row["title"], description=row["description"],
            kind=kind, commitment=row["commitment"],
            confirmation_status=confirmation_status,
            execution_status=execution_status,
            phase=phase,
            source=row["source"], origins=origins,
            confidence=row["confidence"],
            needs_confirmation=bool(row["needs_confirmation"]),
            idea_relevance=row["idea_relevance"],
            goal_priority=row["goal_priority"],
            action_priority=row["action_priority"],
            manual_importance=row["manual_importance"],
            target_result=row["target_result"],
            estimated_minutes=row["estimated_minutes"],
            energy_cost=row["energy_cost"], frequency=row["frequency"],
            cognitive_load=cognitive_load,
            x=row["x"], y=row["y"],
            is_pinned=bool(row["is_pinned"]),
            pinned_at=row["pinned_at"] if "pinned_at" in row_keys else None,
            pin_reason=row["pin_reason"] if "pin_reason" in row_keys else None,
            group_id=row["group_id"], z_index=row["z_index"],
            taxonomy_x=row["taxonomy_x"], taxonomy_y=row["taxonomy_y"],
            accumulated_minutes=row["accumulated_minutes"],
            last_progress_at=row["last_progress_at"],
            created_by=row["created_by"],
            created_at=row["created_at"], updated_at=row["updated_at"],
            deleted_at=row["deleted_at"],
        )

    # ============================================================
    # 重复检测
    # ============================================================

    @staticmethod
    def _tokenize(text: str) -> set:
        """中文分词（简单版：按字+关键词提取）"""
        import re
        # 提取中文字符和英文单词
        chars = set(re.findall(r'[\u4e00-\u9fff]', text))
        words = set(w.lower() for w in re.findall(r'[a-zA-Z]{2,}', text))
        return chars | words

    @staticmethod
    def _jaccard_similarity(set_a: set, set_b: set) -> float:
        """Jaccard 相似度"""
        if not set_a or not set_b:
            return 0.0
        intersection = set_a & set_b
        union = set_a | set_b
        return len(intersection) / len(union)

    def check_duplicate(self, text: str, kind: str = None, threshold: float = None) -> list:
        """
        检查文本是否与已有节点重复
        
        返回: [{"node": CanvasNode, "similarity": float, "fields_diff": {...}}]
        """
        threshold = threshold or DUPLICATE_THRESHOLD
        text_tokens = self._tokenize(text)
        if not text_tokens:
            return []

        results = []
        for node in self.list_nodes():
            # 如果指定了 kind，只检查同类型
            if kind and node.kind != kind:
                continue
            # 只检查未归档的节点
            if node.execution_status == 'archived':
                continue

            node_tokens = self._tokenize(node.title)
            sim = self._jaccard_similarity(text_tokens, node_tokens)

            if sim >= threshold:
                # 计算字段差异
                fields_diff = {}
                if kind and node.kind != kind:
                    fields_diff['kind'] = {'existing': node.kind, 'new': kind}
                if node.target_result:
                    fields_diff['target_result'] = {'existing': node.target_result}
                results.append({
                    'node': node,
                    'similarity': round(sim, 2),
                    'fields_diff': fields_diff,
                })

        # 按相似度降序
        results.sort(key=lambda x: -x['similarity'])
        return results

    # ============================================================
    # 候选完整性门槛
    # ============================================================

    @staticmethod
    def check_completeness(proposal: dict) -> dict:
        """
        检查候选提案是否满足成为正式节点的最低条件
        
        返回: {"complete": bool, "missing": [字段名], "suggestions": [建议]}
        """
        kind = proposal.get('kind', 'record')
        rules = COMPLETENESS_RULES.get(kind, [])
        missing = []

        for field in rules:
            val = proposal.get(field)
            if field == 'title':
                if not val or not str(val).strip():
                    missing.append('title')
            elif field == 'estimated_minutes':
                if not val or val <= 0:
                    missing.append('estimated_minutes')
            elif field == 'frequency':
                if not val:
                    missing.append('frequency')
            elif field == 'target_result':
                if not val or not str(val).strip():
                    missing.append('target_result')
            elif not val:
                missing.append(field)

        suggestions = []
        if 'title' in missing:
            suggestions.append("请为这个节点设置一个清晰的标题")
        if 'estimated_minutes' in missing:
            suggestions.append(f"行动节点需要预估时间，例如 30 分钟、1 小时")
        if 'frequency' in missing:
            suggestions.append("习惯节点需要设定频率，例如 每天、每周三次")
        if 'target_result' in missing:
            suggestions.append("成果节点需要定义完成标准，例如「完成首页 5 个模块设计」")

        return {
            'complete': len(missing) == 0,
            'missing': missing,
            'suggestions': suggestions,
        }

    # ============================================================
    # 状态机校验
    # ============================================================

    @staticmethod
    def validate_execution_transition(from_status: str, to_status: str) -> bool:
        """验证执行状态转换是否合法"""
        allowed = EXECUTION_TRANSITIONS.get(from_status, [])
        return to_status in allowed

    def transition_execution_status(self, node_id: str, new_status: str) -> Optional[CanvasNode]:
        """执行状态转换（带校验）"""
        node = self.get_node(node_id)
        if not node:
            return None
        
        if not self.validate_execution_transition(node.execution_status, new_status):
            return None

        return self.update_node(node_id, {
            'executionStatus': new_status,
            'confirmationStatus': 'confirmed',  # 执行转换意味着已确认
        })

    def confirm_node(self, node_id: str) -> Optional[CanvasNode]:
        """确认节点（信息确认状态：pending → confirmed）"""
        return self.update_node(node_id, {'confirmationStatus': 'confirmed'})

    def ignore_node(self, node_id: str) -> Optional[CanvasNode]:
        """忽略节点（信息确认状态：→ ignored）"""
        return self.update_node(node_id, {'confirmationStatus': 'ignored'})

    # ============================================================
    # 关系 CRUD
    # ============================================================

    def add_relation(self, rel: CanvasRelation) -> CanvasRelation:
        """添加关系"""
        conn = self.db._conn()
        try:
            conn.execute("""
                INSERT INTO canvas_relations (id, source_node_id, target_node_id, relation,
                    created_by, confidence, confirmed_at, created_at)
                VALUES (?,?,?,?,?,?,?,?)
            """, (
                rel.id, rel.source_node_id, rel.target_node_id, rel.relation,
                rel.created_by, rel.confidence, rel.confirmed_at, rel.created_at,
            ))
            conn.commit()
            self._increment_version()
        except sqlite3.IntegrityError:
            pass  # 已存在相同关系
        return rel

    def remove_relation(self, relation_id: str) -> bool:
        conn = self.db._conn()
        conn.execute("DELETE FROM canvas_relations WHERE id=?", (relation_id,))
        conn.commit()
        self._increment_version()
        return True

    def list_relations(self) -> list:
        conn = self.db._conn()
        rows = conn.execute("SELECT * FROM canvas_relations ORDER BY created_at").fetchall()
        return [CanvasRelation(
            id=r["id"], source_node_id=r["source_node_id"],
            target_node_id=r["target_node_id"], relation=r["relation"],
            created_by=r["created_by"], confidence=r["confidence"],
            confirmed_at=r["confirmed_at"], created_at=r["created_at"],
        ) for r in rows]

    def get_node_relations(self, node_id: str) -> list:
        """获取与某节点相关的所有关系"""
        conn = self.db._conn()
        rows = conn.execute(
            "SELECT * FROM canvas_relations WHERE source_node_id=? OR target_node_id=? ORDER BY created_at",
            (node_id, node_id)
        ).fetchall()
        return [CanvasRelation(
            id=r["id"], source_node_id=r["source_node_id"],
            target_node_id=r["target_node_id"], relation=r["relation"],
            created_by=r["created_by"], confidence=r["confidence"],
            confirmed_at=r["confirmed_at"], created_at=r["created_at"],
        ) for r in rows]

    # ============================================================
    # 候选节点 CRUD
    # ============================================================

    def add_candidate(self, candidate: CanvasCandidate) -> CanvasCandidate:
        """添加候选节点"""
        conn = self.db._conn()
        conn.execute("""
            INSERT INTO canvas_candidates (id, source, source_id, original_text, proposal, status, ai_reason, created_at)
            VALUES (?,?,?,?,?,?,?,?)
        """, (
            candidate.id, candidate.source, candidate.source_id,
            candidate.original_text,
            json.dumps(candidate.proposal, ensure_ascii=False),
            candidate.status, candidate.ai_reason, candidate.created_at,
        ))
        conn.commit()
        return candidate

    def list_candidates(self, status: str = None) -> list:
        """获取候选节点列表"""
        conn = self.db._conn()
        if status:
            rows = conn.execute(
                "SELECT * FROM canvas_candidates WHERE status=? ORDER BY created_at DESC", (status,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM canvas_candidates ORDER BY created_at DESC"
            ).fetchall()
        return [CanvasCandidate(
            id=r["id"], source=r["source"], source_id=r["source_id"],
            original_text=r["original_text"],
            proposal=json.loads(r["proposal"]) if r["proposal"] else {},
            status=r["status"], ai_reason=r["ai_reason"],
            created_at=r["created_at"],
        ) for r in rows]

    def decide_candidate(self, candidate_id: str, decision: str, patch: dict = None) -> Optional[CanvasNode]:
        """
        处理候选节点决策

        decision: accepted|modified|rejected|merged
        patch: 用户修改后的属性

        返回：accepted/modified 时返回新创建的 CanvasNode，否则返回 None
        """
        conn = self.db._conn()
        row = conn.execute(
            "SELECT * FROM canvas_candidates WHERE id=?", (candidate_id,)
        ).fetchone()
        if not row:
            return None

        candidate = CanvasCandidate(
            id=row["id"], source=row["source"], source_id=row["source_id"],
            original_text=row["original_text"],
            proposal=json.loads(row["proposal"]) if row["proposal"] else {},
            status=row["status"], ai_reason=row["ai_reason"],
            created_at=row["created_at"],
        )

        if decision == "rejected":
            conn.execute("UPDATE canvas_candidates SET status='rejected' WHERE id=?", (candidate_id,))
            conn.commit()
            # 记录拒绝反馈
            self.record_classification_feedback(
                candidate_id=candidate_id,
                original_text=candidate.original_text,
                ai_kind=candidate.proposal.get('kind'),
                ai_commitment=candidate.proposal.get('commitment'),
                ai_confidence=candidate.proposal.get('confidence'),
                user_decision='rejected',
                source=candidate.source,
            )
            return None

        # accepted、modified 或 merged 处理
        if decision == "merged":
            # 合并到已有节点：将候选的来源添加到目标节点
            target_node_id = (patch or {}).get("mergeTargetId")
            if not target_node_id:
                return None
            target_node = self.get_node(target_node_id)
            if not target_node:
                return None

            # 添加来源记录到目标节点
            import uuid
            conn.execute("""
                INSERT INTO canvas_origins (id, node_id, source, source_id, original_text, created_at)
                VALUES (?,?,?,?,?,?)
            """, (str(uuid.uuid4()), target_node_id, candidate.source,
                  candidate.source_id, candidate.original_text, _now_iso()))

            # 更新候选状态
            conn.execute("UPDATE canvas_candidates SET status='merged' WHERE id=?", (candidate_id,))
            conn.commit()
            self._increment_version()

            # 记录分类反馈
            self.record_classification_feedback(
                candidate_id=candidate_id,
                original_text=candidate.original_text,
                ai_kind=candidate.proposal.get('kind'),
                ai_commitment=candidate.proposal.get('commitment'),
                ai_confidence=candidate.proposal.get('confidence'),
                user_decision='merged',
                source=candidate.source,
            )
            return target_node

        # accepted 或 modified：创建正式节点
        proposal = candidate.proposal.copy()
        if patch:
            proposal.update(patch)

        # P0 变更：接受前检查完整性
        completeness = self.check_completeness(proposal)
        if not completeness["complete"]:
            # 如果不完整，返回 None 并在调用方处理
            # 但不阻止用户——只记录问题
            pass

        # 迁移旧 kind 值
        kind = proposal.get('kind', 'record')
        if kind in LEGACY_KIND_MAP:
            kind = LEGACY_KIND_MAP[kind]

        # 创建正式节点（使用新状态字段）
        node = CanvasNode(
            title=proposal.get('title', candidate.original_text),
            description=proposal.get('summary') or proposal.get('description'),
            kind=kind,
            commitment=proposal.get('commitment', 'observed'),
            confirmation_status='confirmed',  # 用户确认后
            execution_status='unplanned',      # 默认未规划
            phase='confirmed',  # 向后兼容
            source=candidate.source,
            origins=[NodeOrigin(
                source=candidate.source,
                source_id=candidate.source_id,
                original_text=candidate.original_text,
            )],
            confidence=proposal.get('confidence', 0.8),
            needs_confirmation=False,
            estimated_minutes=proposal.get('estimatedMinutes'),
            frequency=proposal.get('frequency'),
            target_result=proposal.get('targetResult'),
            energy_cost=proposal.get('energyCost'),
            cognitive_load=proposal.get('cognitiveLoad'),
            created_by='ai' if candidate.source != 'manual' else 'user',
        )

        # 设置默认位置（视口中心附近，带随机偏移）
        import random
        node.x = 400 + random.uniform(-100, 100)
        node.y = 300 + random.uniform(-80, 80)

        self.create_node(node)

        # 更新候选状态
        status = 'accepted' if decision == 'accepted' else 'modified'
        conn.execute("UPDATE canvas_candidates SET status=? WHERE id=?", (status, candidate_id))
        conn.commit()

        # 记录分类反馈（文档21.5）
        self.record_classification_feedback(
            candidate_id=candidate_id,
            original_text=candidate.original_text,
            ai_kind=proposal.get('kind'),
            ai_commitment=proposal.get('commitment'),
            ai_confidence=proposal.get('confidence'),
            user_decision=decision,
            user_corrected_kind=patch.get('kind') if patch else None,
            user_corrected_commitment=patch.get('commitment') if patch else None,
            source=candidate.source,
        )

        return node

    # ============================================================
    # 分类反馈（文档21.5）
    # ============================================================

    def record_classification_feedback(self, candidate_id: str = None, original_text: str = "",
                                       ai_kind: str = None, ai_commitment: str = None,
                                       ai_confidence: float = None, user_decision: str = "accepted",
                                       user_corrected_kind: str = None, user_corrected_commitment: str = None,
                                       feedback_reason: str = None, source: str = "chat") -> str:
        """记录用户对AI分类的反馈"""
        import uuid
        fb_id = str(uuid.uuid4())
        conn = self.db._conn()
        conn.execute("""
            INSERT INTO canvas_classification_feedback
            (id, candidate_id, original_text, ai_kind, ai_commitment, ai_confidence,
             user_decision, user_corrected_kind, user_corrected_commitment, feedback_reason, source, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, (fb_id, candidate_id, original_text, ai_kind, ai_commitment, ai_confidence,
              user_decision, user_corrected_kind, user_corrected_commitment, feedback_reason, source, _now_iso()))
        conn.commit()
        return fb_id

    def list_feedback(self, limit: int = 50) -> list:
        """获取反馈历史"""
        conn = self.db._conn()
        rows = conn.execute(
            "SELECT * FROM canvas_classification_feedback ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(row) for row in rows]

    # ============================================================
    # 分组 CRUD
    # ============================================================

    def create_group(self, group: CanvasGroup) -> CanvasGroup:
        conn = self.db._conn()
        conn.execute("""
            INSERT INTO canvas_groups (id, title, description, x, y, width, height, is_collapsed, created_by, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        """, (
            group.id, group.title, group.description,
            group.x, group.y, group.width, group.height,
            int(group.is_collapsed), group.created_by, group.created_at,
        ))
        conn.commit()
        self._increment_version()
        return group

    def list_groups(self) -> list:
        conn = self.db._conn()
        rows = conn.execute("SELECT * FROM canvas_groups ORDER BY created_at").fetchall()
        return [CanvasGroup(
            id=r["id"], title=r["title"], description=r["description"],
            x=r["x"], y=r["y"], width=r["width"], height=r["height"],
            is_collapsed=bool(r["is_collapsed"]),
            created_by=r["created_by"], created_at=r["created_at"],
        ) for r in rows]

    def move_nodes_to_group(self, node_ids: list, group_id: str):
        """批量将节点移入分组"""
        conn = self.db._conn()
        for nid in node_ids:
            conn.execute(
                "UPDATE canvas_nodes SET group_id=?, updated_at=? WHERE id=?",
                (group_id, _now_iso(), nid)
            )
        conn.commit()
        self._increment_version()

    def update_group(self, group_id: str, patch: dict) -> Optional[CanvasGroup]:
        conn = self.db._conn()
        updates = []
        values = []
        for k, v in patch.items():
            if k == 'title':
                updates.append("title=?")
                values.append(v)
            elif k == 'description':
                updates.append("description=?")
                values.append(v)
            elif k in ('x', 'y', 'width', 'height'):
                updates.append(f"{k}=?")
                values.append(float(v))
            elif k == 'isCollapsed':
                updates.append("is_collapsed=?")
                values.append(int(v))
        if not updates:
            return None
        values.append(group_id)
        conn.execute(f"UPDATE canvas_groups SET {', '.join(updates)} WHERE id=?", values)
        conn.commit()
        self._increment_version()
        groups = self.list_groups()
        for g in groups:
            if g.id == group_id:
                return g
        return None

    def delete_group(self, group_id: str):
        """删除分组（节点 groupId 置空）"""
        conn = self.db._conn()
        conn.execute("UPDATE canvas_nodes SET group_id=NULL WHERE group_id=?", (group_id,))
        conn.execute("DELETE FROM canvas_groups WHERE id=?", (group_id,))
        conn.commit()
        self._increment_version()

    # ============================================================
    # 批量变更（对应设计文档 21.2 POST /api/canvas/mutations）
    # ============================================================

    def apply_mutations(self, mutations: list) -> dict:
        """
        批量应用变更操作

        每个mutation格式：
        - {"type": "MOVE_NODE", "nodeId": "...", "position": {"x": 1, "y": 2}}
        - {"type": "PIN_NODE", "nodeId": "...", "isPinned": true}
        - {"type": "UPDATE_NODE", "nodeId": "...", "patch": {...}}
        - {"type": "DELETE_NODE", "nodeId": "..."}
        - {"type": "CREATE_NODE", "node": {...}}
        - {"type": "ADD_RELATION", "relation": {...}}
        - {"type": "REMOVE_RELATION", "relationId": "..."}
        - {"type": "CREATE_GROUP", "group": {...}}
        - {"type": "MOVE_TO_GROUP", "nodeIds": [...], "groupId": "..."}

        返回 {"ok": true, "version": N, "results": [...]}
        """
        results = []
        for m in mutations:
            mtype = m.get('type', '')
            try:
                if mtype == 'MOVE_NODE':
                    pos = m.get('position', {})
                    x = pos.get('x', m.get('x', 0))
                    y = pos.get('y', m.get('y', 0))
                    self.move_node(m['nodeId'], x, y)
                    results.append({"type": mtype, "ok": True})

                elif mtype == 'PIN_NODE':
                    node = self.get_node(m['nodeId'])
                    if node:
                        is_pinned = m.get('isPinned', True)
                        patch = {'isPinned': is_pinned}
                        if is_pinned:
                            patch['manualImportance'] = 'high'
                            patch['pinnedAt'] = _now_iso()
                            patch['pinReason'] = 'manual'
                        else:
                            patch['pinnedAt'] = None
                            patch['pinReason'] = None
                        self.update_node(m['nodeId'], patch)
                    results.append({"type": mtype, "ok": True})

                elif mtype == 'UPDATE_NODE':
                    self.update_node(m['nodeId'], m.get('patch', {}))
                    results.append({"type": mtype, "ok": True})

                elif mtype == 'DELETE_NODE':
                    self.soft_delete_node(m['nodeId'])
                    results.append({"type": mtype, "ok": True})

                elif mtype == 'CREATE_NODE':
                    node_data = m.get('node', {})
                    node = CanvasNode.from_dict(node_data)
                    self.create_node(node)
                    results.append({"type": mtype, "ok": True, "id": node.id})

                elif mtype == 'ADD_RELATION':
                    rel_data = m.get('relation', {})
                    rel = CanvasRelation.from_dict(rel_data)
                    self.add_relation(rel)
                    results.append({"type": mtype, "ok": True, "id": rel.id})

                elif mtype == 'REMOVE_RELATION':
                    self.remove_relation(m['relationId'])
                    results.append({"type": mtype, "ok": True})

                elif mtype == 'CREATE_GROUP':
                    group_data = m.get('group', {})
                    group = CanvasGroup.from_dict(group_data)
                    self.create_group(group)
                    results.append({"type": mtype, "ok": True, "id": group.id})

                elif mtype == 'MOVE_TO_GROUP':
                    self.move_nodes_to_group(m.get('nodeIds', []), m['groupId'])
                    results.append({"type": mtype, "ok": True})

                else:
                    results.append({"type": mtype, "ok": False, "error": "unknown_type"})

            except Exception as e:
                results.append({"type": mtype, "ok": False, "error": str(e)})

        return {"ok": True, "version": self.get_version(), "results": results}

    # ============================================================
    # 获取完整画布数据（对应设计文档 21.1 GET /api/canvas）
    # ============================================================

    def get_canvas_data(self) -> dict:
        """获取完整画布数据"""
        return {
            "nodes": [n.to_dict() for n in self.list_nodes()],
            "relations": [r.to_dict() for r in self.list_relations()],
            "groups": [g.to_dict() for g in self.list_groups()],
            "candidates": [c.to_dict() for c in self.list_candidates(status='pending')],
            "version": self.get_version(),
        }

    # ============================================================
    # 计算分类视图坐标（对应设计文档 8.2）
    # ============================================================

    def compute_taxonomy_positions(self) -> dict:
        """
        为所有节点计算分类视图坐标
        按 kind 分列排列，不覆盖自由视图坐标
        """
        nodes = self.list_nodes()
        kind_columns = {k: i for i, k in enumerate(NODE_KINDS)}
        col_width = 280
        row_height = 140
        start_x = 100
        start_y = 100

        # 按 kind 分组
        kind_groups = {}
        for node in nodes:
            kind_groups.setdefault(node.kind, []).append(node)

        positions = {}
        for kind, group_nodes in kind_groups.items():
            col = kind_columns.get(kind, 0)
            for i, node in enumerate(group_nodes):
                x = start_x + col * col_width
                y = start_y + i * row_height
                positions[node.id] = {"x": x, "y": y}
                # 持久化分类坐标
                self.update_node(node.id, {'taxonomy_x': x, 'taxonomy_y': y})

        return positions

    # ============================================================
    # 重点视图过滤（对应设计文档 8.3）
    # ============================================================

    def get_focus_nodes(self) -> list:
        """
        重点视图：只返回
        - 已固定节点
        - commitment >= committed 的目标和项目
        - 计划中和执行中的行为
        """
        nodes = self.list_nodes()
        focus = []
        focus_ids = set()

        for node in nodes:
            if node.is_pinned:
                focus.append(node)
                focus_ids.add(node.id)
            elif node.kind in ('goal', 'project') and COMMITMENT_ORDER.get(node.commitment, 0) >= COMMITMENT_ORDER['committed']:
                focus.append(node)
                focus_ids.add(node.id)
            elif node.kind == 'action' and node.phase in ('planned', 'active'):
                focus.append(node)
                focus_ids.add(node.id)

        return focus

    # ============================================================
    # 搜索与筛选
    # ============================================================

    def search_nodes(self, query: str = "", filters: dict = None) -> list:
        """搜索和筛选节点"""
        nodes = self.list_nodes()
        if query:
            q = query.lower()
            nodes = [n for n in nodes if q in n.title.lower() or
                     (n.description and q in n.description.lower())]

        if filters:
            if filters.get('kinds'):
                nodes = [n for n in nodes if n.kind in filters['kinds']]
            if filters.get('phases'):
                nodes = [n for n in nodes if n.phase in filters['phases']]
            if filters.get('sources'):
                nodes = [n for n in nodes if n.source in filters['sources']]
            if filters.get('onlyPinned'):
                nodes = [n for n in nodes if n.is_pinned]

        return nodes
