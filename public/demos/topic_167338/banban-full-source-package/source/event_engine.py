"""
event_engine.py

事件状态机实现，将 TypeScript 的 event-engine.ts 移植到 Python。
管理 EventNode 的状态转换。

状态流转概览：
    floating -> clarified -> goal -> planned -> active -> repeated -> habit -> archived
    任意状态均可归档 (archived)，归档后可恢复至任意状态。
"""

from typing import Dict, List, Set, Tuple


# ===========================================================================
# 1. 状态常量
# ===========================================================================

# 尝试从 banban_models 导入 EVENT_STATES，若不可用则本地定义
try:
    from banban_models import EVENT_STATES  # type: ignore
except ImportError:
    EVENT_STATES: List[str] = [
        "floating",
        "clarified",
        "goal",
        "planned",
        "active",
        "repeated",
        "habit",
        "archived",
    ]

# 单独定义每个状态常量，便于直接引用
FLOATING = "floating"
CLARIFIED = "clarified"
GOAL = "goal"
PLANNED = "planned"
ACTIVE = "active"
REPEATED = "repeated"
HABIT = "habit"
ARCHIVED = "archived"


# ===========================================================================
# 2. 合法状态转换表
# ===========================================================================

# 定义每个状态可以合法转换到的目标状态集合
TRANSITIONS: Dict[str, Set[str]] = {
    "floating":  {"clarified", "archived"},
    "clarified": {"goal", "planned", "archived"},
    "goal":      {"planned", "archived"},
    "planned":   {"active", "archived"},
    "active":    {"repeated", "archived"},
    "repeated":  {"habit", "active", "archived"},
    "habit":     {"archived"},
    "archived":  {
        "floating", "clarified", "goal",
        "planned", "active", "repeated", "habit",
    },
}


# ===========================================================================
# 3. 需要用户确认的转换
# ===========================================================================

# 基础需要确认的转换：
#   ("floating", "goal")  —— 将想法提升为目标
#   ("goal", "planned")   —— 将目标变为计划
_CONFIRMATION_BASE: Set[Tuple[str, str]] = {
    ("floating", "goal"),
    ("goal", "planned"),
}

# 任何转到 "habit" 的转换都需要确认 —— 形成习惯需要用户确认
_CONFIRMATION_TO_HABIT: Set[Tuple[str, str]] = {
    (s, "habit") for s in EVENT_STATES if s != "habit"
}

CONFIRMATION_REQUIRED: Set[Tuple[str, str]] = _CONFIRMATION_BASE | _CONFIRMATION_TO_HABIT


# ===========================================================================
# 4. 状态中文标签
# ===========================================================================

STATE_LABELS: Dict[str, str] = {
    "floating":  "漂浮想法",
    "clarified": "已澄清",
    "goal":      "目标",
    "planned":   "已计划",
    "active":    "进行中",
    "repeated":  "重复出现",
    "habit":     "习惯",
    "archived":  "已归档",
}


# ===========================================================================
# 5. 核心函数
# ===========================================================================

def can_transition(from_state: str, to_state: str) -> bool:
    """
    检查从 from_state 到 to_state 的状态转换是否合法。

    Args:
        from_state: 起始状态
        to_state:   目标状态

    Returns:
        True 如果转换合法，False 否则
    """
    if from_state in TRANSITIONS:
        return to_state in TRANSITIONS[from_state]
    return False


def transition_needs_confirmation(from_state: str, to_state: str) -> bool:
    """
    检查从 from_state 到 to_state 的转换是否需要用户确认。

    Args:
        from_state: 起始状态
        to_state:   目标状态

    Returns:
        True 如果需要用户确认，False 否则
    """
    return (from_state, to_state) in CONFIRMATION_REQUIRED


def get_available_transitions(current_state: str) -> List[str]:
    """
    返回从 current_state 可以合法转换到的状态列表。

    Args:
        current_state: 当前状态

    Returns:
        可转换到的状态列表；若 current_state 无效则返回空列表
    """
    if current_state in TRANSITIONS:
        return list(TRANSITIONS[current_state])
    return []


def validate_transition(from_state: str, to_state: str) -> Dict[str, object]:
    """
    验证状态转换，返回包含合法性、确认需求和原因说明的字典。

    Args:
        from_state: 起始状态
        to_state:   目标状态

    Returns:
        包含以下键的字典：
            - valid (bool):              转换是否合法
            - needs_confirmation (bool): 是否需要用户确认
            - reason (str):              中文说明
    """
    # 1. 检查转换是否合法
    if not can_transition(from_state, to_state):
        return {
            "valid": False,
            "needs_confirmation": False,
            "reason": f"非法状态转换：{from_state} 不能直接变为 {to_state}",
        }

    # 2. 检查是否需要用户确认
    if transition_needs_confirmation(from_state, to_state):
        return {
            "valid": True,
            "needs_confirmation": True,
            "reason": "此操作需要用户确认",
        }

    # 3. 合法且无需确认
    return {
        "valid": True,
        "needs_confirmation": False,
        "reason": "状态转换合法",
    }


# ===========================================================================
# 6. 生命周期描述
# ===========================================================================

def describe_state_journey() -> List[Dict[str, object]]:
    """
    返回事件典型生命周期的描述列表。

    覆盖完整路径：
        floating -> clarified -> goal -> planned
        -> active -> repeated -> habit -> archived

    Returns:
        字典列表，每个字典包含 from、to、label，
        若该步骤需要确认则额外包含 needs_confirmation: True
    """
    return [
        {"from": "floating",  "to": "clarified", "label": "澄清想法"},
        {"from": "clarified", "to": "goal",      "label": "确立目标", "needs_confirmation": True},
        {"from": "goal",      "to": "planned",   "label": "制定计划", "needs_confirmation": True},
        {"from": "planned",   "to": "active",    "label": "开始执行"},
        {"from": "active",    "to": "repeated",  "label": "重复出现"},
        {"from": "repeated",  "to": "habit",     "label": "形成习惯", "needs_confirmation": True},
        {"from": "habit",     "to": "archived",  "label": "归档"},
    ]


# ===========================================================================
# 兼容层：EventEngine 事件管理类
# 旧代码通过 get_event_engine() 获取引擎实例，调用 list/get/delete/transition 等
# 这里提供兼容实现，使用 companion_db.Database 访问 event_nodes 表
# ===========================================================================

_event_engine_instance = None


class EventEngine:
    """事件管理引擎 — 兼容旧代码的 EventEngine API

    结合状态机验证和数据库 CRUD，提供事件全生命周期管理。
    """

    def __init__(self, ai_router=None, db=None):
        self.ai_router = ai_router
        try:
            from companion_db import Database
            self.db = db or Database()
        except Exception:
            self.db = None

    def _row_to_event(self, row) -> "EventNode":
        from banban_models import EventNode
        import json
        return EventNode(
            id=row["id"],
            title=row["title"],
            description=row["description"] or "",
            node_type=row["node_type"] or "idea",
            state=row["state"] or "floating",
            parent_id=row["parent_id"],
            related_goal_ids=json.loads(row["related_goal_ids"] or "[]"),
            energy_cost=row["energy_cost"] or 0,
            estimated_time=row["estimated_time"],
            preferred_time=row["preferred_time"],
            importance=row["importance"] or 3,
            confidence=row["confidence"] or 0.5,
            evidence=json.loads(row["evidence"] or "[]"),
            needs_confirmation=bool(row["needs_confirmation"]),
            created_at=row["created_at"] or "",
            updated_at=row["updated_at"] or "",
            completed_at=row["completed_at"],
        )

    def list(self, limit: int = 100) -> list:
        if not self.db:
            return []
        conn = self.db._conn()
        rows = conn.execute(
            "SELECT * FROM event_nodes ORDER BY updated_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [self._row_to_event(r) for r in rows]

    def list_all(self) -> list:
        return self.list(limit=10000)

    def get(self, event_id: int):
        if not self.db:
            return None
        conn = self.db._conn()
        row = conn.execute("SELECT * FROM event_nodes WHERE id=?", (event_id,)).fetchone()
        if not row:
            raise KeyError(f"事件 {event_id} 不存在")
        return self._row_to_event(row)

    def get_by_state(self, state: str) -> list:
        if not self.db:
            return []
        conn = self.db._conn()
        rows = conn.execute(
            "SELECT * FROM event_nodes WHERE state=? ORDER BY updated_at DESC", (state,)
        ).fetchall()
        return [self._row_to_event(r) for r in rows]

    def delete(self, event_id: int) -> bool:
        if not self.db:
            return False
        conn = self.db._conn()
        conn.execute("DELETE FROM event_nodes WHERE id=?", (event_id,))
        conn.commit()
        return True

    def transition(self, event_id: int, to_state: str):
        """状态流转 — 使用状态机验证"""
        event = self.get(event_id)
        from_state = event.state

        result = validate_transition(from_state, to_state)
        if not result["valid"]:
            raise ValueError(result["reason"])

        if not self.db:
            return event
        conn = self.db._conn()
        from datetime import datetime
        conn.execute(
            "UPDATE event_nodes SET state=?, updated_at=? WHERE id=?",
            (to_state, datetime.now().isoformat(), event_id),
        )
        conn.commit()
        return self.get(event_id)

    def get_statistics(self) -> dict:
        if not self.db:
            return {}
        conn = self.db._conn()
        rows = conn.execute(
            "SELECT state, COUNT(*) as count FROM event_nodes GROUP BY state"
        ).fetchall()
        stats = {r["state"]: r["count"] for r in rows}
        total = sum(stats.values())
        stats["total"] = total
        return stats

    def process_input(self, text: str, source: str = "text") -> dict:
        """处理用户输入 — 简化版，创建一个 floating 事件"""
        if not self.db:
            return {"ok": False, "error": "数据库不可用"}
        from datetime import datetime
        conn = self.db._conn()
        now = datetime.now().isoformat()
        c = conn.execute(
            "INSERT INTO event_nodes (title, state, node_type, created_at, updated_at) VALUES (?, 'floating', 'idea', ?, ?)",
            (text[:200], now, now),
        )
        conn.commit()
        return {"ok": True, "event_id": c.lastrowid, "text": text}


def get_event_engine() -> EventEngine:
    """获取事件引擎单例（兼容旧代码）"""
    global _event_engine_instance
    if _event_engine_instance is None:
        _event_engine_instance = EventEngine()
    return _event_engine_instance


# ===========================================================================
# 主入口：演示与自测
# ===========================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("事件状态机 - 状态标签")
    print("=" * 60)
    for state, label in STATE_LABELS.items():
        print(f"  {state:12s} -> {label}")

    print()
    print("=" * 60)
    print("合法状态转换表")
    print("=" * 60)
    for from_s, to_set in TRANSITIONS.items():
        print(f"  {from_s:12s} -> {sorted(to_set)}")

    print()
    print("=" * 60)
    print("需要确认的转换")
    print("=" * 60)
    for pair in sorted(CONFIRMATION_REQUIRED):
        print(f"  {pair[0]:12s} -> {pair[1]}")

    print()
    print("=" * 60)
    print("转换验证示例")
    print("=" * 60)
    test_cases = [
        ("floating", "clarified"),
        ("floating", "active"),
        ("floating", "goal"),
        ("goal", "planned"),
        ("active", "repeated"),
        ("repeated", "habit"),
        ("archived", "floating"),
        ("habit", "active"),
    ]
    for from_s, to_s in test_cases:
        result = validate_transition(from_s, to_s)
        print(f"  {from_s:12s} -> {to_s:12s}  "
              f"valid={result['valid']!s:5s}  "
              f"confirm={result['needs_confirmation']!s:5s}  "
              f"| {result['reason']}")

    print()
    print("=" * 60)
    print("典型生命周期")
    print("=" * 60)
    for step in describe_state_journey():
        confirm_tag = " [需确认]" if step.get("needs_confirmation") else ""
        print(f"  {STATE_LABELS[step['from']]}({step['from']}) "
              f"-> {STATE_LABELS[step['to']]}({step['to']})  "
              f"{step['label']}{confirm_tag}")
