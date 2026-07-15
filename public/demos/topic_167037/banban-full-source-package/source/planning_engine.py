"""
Planning Engine - Ported from TypeScript planning-engine.ts

Handles time conflict detection and buffer calculation for daily schedule planning.
"""

from datetime import datetime, timedelta
from typing import Any


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _to_datetime(time_str: str) -> datetime:
    """
    Convert an ISO datetime string or 'HH:MM' time string to a datetime object.

    For time-only strings (e.g. "09:30"), a base date of 2000-01-01 is used so
    that comparisons remain consistent.

    Args:
        time_str: ISO datetime string (e.g. "2024-01-15T09:30:00") or
                  time-only string (e.g. "09:30" or "09:30:00").

    Returns:
        A datetime object representing the given time.
    """
    time_str = time_str.strip()

    # ISO date / datetime strings contain '-'
    if '-' in time_str:
        return datetime.fromisoformat(time_str)

    # Time-only format: HH:MM or HH:MM:SS
    parts = time_str.split(':')
    hour = int(parts[0])
    minute = int(parts[1])
    second = int(parts[2]) if len(parts) >= 3 else 0
    base = datetime(2000, 1, 1)
    return base.replace(hour=hour, minute=minute, second=second)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def overlaps(a_start: str, a_end: str, b_start: str, b_end: str) -> bool:
    """
    Check whether two half-open time ranges [a_start, a_end) and
    [b_start, b_end) overlap.

    Two ranges overlap if and only if:  a_start < b_end  AND  b_start < a_end

    Args:
        a_start: Start of range A (ISO datetime string or "HH:MM").
        a_end:   End of range A (ISO datetime string or "HH:MM").
        b_start: Start of range B (ISO datetime string or "HH:MM").
        b_end:   End of range B (ISO datetime string or "HH:MM").

    Returns:
        True if the two ranges overlap, False otherwise.
    """
    a_start_dt = _to_datetime(a_start)
    a_end_dt = _to_datetime(a_end)
    b_start_dt = _to_datetime(b_start)
    b_end_dt = _to_datetime(b_end)

    return a_start_dt < b_end_dt and b_start_dt < a_end_dt


def parse_time_to_minutes(time_str: str) -> int:
    """
    Parse a time string to minutes since midnight.

    Accepts both "HH:MM" (or "HH:MM:SS") time-only strings and full ISO
    datetime strings (in which case the time portion is extracted).

    Args:
        time_str: "HH:MM" format string or ISO datetime string.

    Returns:
        Minutes since midnight as an int (e.g. "09:30" -> 570).
    """
    time_str = time_str.strip()

    # ISO datetime strings contain '-' or 'T'
    if '-' in time_str or 'T' in time_str:
        dt = datetime.fromisoformat(time_str)
        return dt.hour * 60 + dt.minute

    # Time-only format: HH:MM or HH:MM:SS
    parts = time_str.split(':')
    hour = int(parts[0])
    minute = int(parts[1])
    return hour * 60 + minute


def calculate_block_duration(start_time: str, end_time: str) -> int:
    """
    Calculate the duration (in minutes) of a time block.

    Supports both "HH:MM" and ISO datetime formats.  When the end time is
    earlier than the start time the block is assumed to span midnight and
    24 * 60 minutes are added to the duration.

    Args:
        start_time: Start of the block ("HH:MM" or ISO datetime).
        end_time:   End of the block ("HH:MM" or ISO datetime).

    Returns:
        Duration in minutes as an int.
    """
    start_min = parse_time_to_minutes(start_time)
    end_min = parse_time_to_minutes(end_time)

    duration = end_min - start_min
    if duration < 0:
        # Overnight block – end falls on the following day
        duration += 24 * 60

    return duration


def validate_plan_block(block: dict, reality_blocks: list) -> dict:
    """
    Validate a single plan block against a list of reality blocks.

    Only reality blocks whose ``block_type`` equals ``"fixed"`` are checked
    for conflicts.

    Args:
        block: Plan block dict with keys ``start_time``, ``end_time``,
               ``title``.
        reality_blocks: List of reality block dicts with keys
                        ``start_time``, ``end_time``, ``block_type``
                        (one of "fixed", "flexible", "rest", "sleep").

    Returns:
        ``{"valid": bool, "conflicts": list, "reason": str}``

        * If a conflict is found: ``valid=False``,
          ``conflicts`` = list of conflicting reality block dicts,
          ``reason="FIXED_TIME_CONFLICT"``.
        * If no conflicts: ``valid=True``, ``conflicts=[]``,
          ``reason="OK"``.
    """
    conflicts = []

    for reality in reality_blocks:
        if reality.get('block_type') != 'fixed':
            continue
        if overlaps(
            block['start_time'], block['end_time'],
            reality['start_time'], reality['end_time'],
        ):
            conflicts.append(reality)

    if conflicts:
        return {
            'valid': False,
            'conflicts': conflicts,
            'reason': 'FIXED_TIME_CONFLICT',
        }

    return {
        'valid': True,
        'conflicts': [],
        'reason': 'OK',
    }


def buffer_ratio(plan_blocks: list, available_minutes: int | float) -> float:
    """
    Calculate the buffer ratio for a collection of plan blocks.

    The buffer ratio represents the fraction of available time that remains
    unplanned:

        ratio = (available_minutes - planned_minutes) / available_minutes

    The result is clamped to a minimum of 0.  If ``available_minutes`` is 0
    the function returns 0.

    Args:
        plan_blocks: List of dicts each with ``start_time`` and ``end_time``
                     in "HH:MM" format.
        available_minutes: Total available time in minutes for the day.

    Returns:
        The buffer ratio as a float (0 <= ratio).
    """
    if available_minutes == 0:
        return 0.0

    planned_minutes = 0
    for block in plan_blocks:
        planned_minutes += calculate_block_duration(
            block['start_time'], block['end_time'],
        )

    ratio = (available_minutes - planned_minutes) / available_minutes
    return max(0.0, ratio)


def suggest_buffer_blocks(
    plan_blocks: list,
    available_minutes: int | float,
    min_buffer: int = 30,
) -> dict:
    """
    Suggest whether buffer blocks should be added to the plan.

    If the current buffer ratio falls below 20 % (0.2) the function
    recommends adding a buffer block.  The suggested buffer size is:

        max(min_buffer, int(available_minutes * 0.2))

    Args:
        plan_blocks: List of dicts with ``start_time`` and ``end_time``.
        available_minutes: Total available time in minutes for the day.
        min_buffer: Minimum buffer minutes to suggest (default 30).

    Returns:
        ``{
            "needs_buffer": bool,
            "current_ratio": float,
            "suggested_buffer_minutes": int,
            "reason": str,
        }``

        When buffer is needed ``reason`` is ``"LOW_BUFFER"`` and
        ``suggested_buffer_minutes`` holds the recommended value; otherwise
        ``reason`` is ``"OK"`` and ``suggested_buffer_minutes`` is 0.
    """
    ratio = buffer_ratio(plan_blocks, available_minutes)
    suggested_buffer = max(min_buffer, int(available_minutes * 0.2))

    if ratio < 0.2:
        return {
            'needs_buffer': True,
            'current_ratio': ratio,
            'suggested_buffer_minutes': suggested_buffer,
            'reason': 'LOW_BUFFER',
        }

    return {
        'needs_buffer': False,
        'current_ratio': ratio,
        'suggested_buffer_minutes': 0,
        'reason': 'OK',
    }


def validate_plan_batch(plan_blocks: list, reality_blocks: list) -> dict:
    """
    Validate multiple plan blocks at once.

    Each plan block is checked:
      1. Against all *fixed* reality blocks (external conflicts).
      2. Against every other plan block (internal conflicts).

    Args:
        plan_blocks: List of plan block dicts with ``start_time``,
                     ``end_time``, ``title``.
        reality_blocks: List of reality block dicts with ``start_time``,
                        ``end_time``, ``block_type``.

    Returns:
        ``{
            "valid": bool,
            "conflicts": list,
            "internal_conflicts": list,
            "reason": str,
        }``

        * ``conflicts`` – list of dicts ``{"plan_block": ..., "reality_block": ...}``
          for every clash with a fixed reality block.
        * ``internal_conflicts`` – list of dicts ``{"block_a": ..., "block_b": ...}``
          for every clash between two plan blocks.
        * ``valid`` is True only when both lists are empty.
        * ``reason`` is ``"OK"`` when valid, ``"FIXED_TIME_CONFLICT"`` for
          external conflicts only, ``"INTERNAL_CONFLICT"`` for internal
          conflicts only, or ``"FIXED_TIME_CONFLICT_AND_INTERNAL_CONFLICT"``
          when both are present.
    """
    conflicts: list[dict] = []
    internal_conflicts: list[dict] = []

    # --- External: plan blocks vs fixed reality blocks -------------------
    for block in plan_blocks:
        for reality in reality_blocks:
            if reality.get('block_type') != 'fixed':
                continue
            if overlaps(
                block['start_time'], block['end_time'],
                reality['start_time'], reality['end_time'],
            ):
                conflicts.append({
                    'plan_block': block,
                    'reality_block': reality,
                })

    # --- Internal: plan blocks vs each other -----------------------------
    n = len(plan_blocks)
    for i in range(n):
        for j in range(i + 1, n):
            block_a = plan_blocks[i]
            block_b = plan_blocks[j]
            if overlaps(
                block_a['start_time'], block_a['end_time'],
                block_b['start_time'], block_b['end_time'],
            ):
                internal_conflicts.append({
                    'block_a': block_a,
                    'block_b': block_b,
                })

    valid = len(conflicts) == 0 and len(internal_conflicts) == 0

    if conflicts and internal_conflicts:
        reason = 'FIXED_TIME_CONFLICT_AND_INTERNAL_CONFLICT'
    elif conflicts:
        reason = 'FIXED_TIME_CONFLICT'
    elif internal_conflicts:
        reason = 'INTERNAL_CONFLICT'
    else:
        reason = 'OK'

    return {
        'valid': valid,
        'conflicts': conflicts,
        'internal_conflicts': internal_conflicts,
        'reason': reason,
    }


# ============================================================
# 计划生成器 — Canvas to Plan 核心算法
# 对应 canvas-to-plan-deep-guide.md
# ============================================================

from typing import List, Dict, Optional, Tuple
import json


# ---- 能量曲线 ----

ENERGY_CURVE = {
    6: 0.3, 7: 0.5, 8: 0.7, 9: 0.9, 10: 1.0, 11: 0.95,
    12: 0.6, 13: 0.4, 14: 0.5, 15: 0.7, 16: 0.8, 17: 0.75,
    18: 0.5, 19: 0.6, 20: 0.7, 21: 0.6, 22: 0.4, 23: 0.2,
}

COGNITIVE_LOAD_MATCH = {
    "deep": [0.8, 1.0],     # deep work needs high energy
    "medium": [0.5, 0.8],   # medium work needs medium energy
    "light": [0.0, 0.5],    # light work can be done anytime
}

PRIORITY_WEIGHT = {"high": 3, "medium": 2, "low": 1}
COGNITIVE_LOAD_WEIGHT = {"deep": 3, "medium": 2, "light": 1}


def get_energy_level(hour: int) -> float:
    """获取某小时的能量水平 0-1"""
    return ENERGY_CURVE.get(hour, 0.3)


def _to_minutes_since_midnight(val) -> float:
    """将时间值统一转换为当天自午夜以来的分钟数。
    
    支持：
    - 毫秒时间戳 (如 1720766400000) → 解析为 datetime 再取小时*60+分钟
    - 小时浮点数 (如 9.5) → 直接 *60
    - 分钟整数 (如 540) → 直接使用
    """
    if val is None or val == 0:
        return -1  # 无效值
    if isinstance(val, (int, float)):
        if val > 1000000:
            # 毫秒时间戳 → 转为当天分钟数
            try:
                dt = datetime.fromtimestamp(val / 1000)
                return dt.hour * 60 + dt.minute
            except (ValueError, OSError):
                return -1
        elif val > 24:
            # 已经是分钟数
            return val
        else:
            # 小时数
            return val * 60
    return -1


def _is_slot_available(start_hour: float, duration_min: int,
                       fixed_items: list, placed: list) -> bool:
    """检查某个时间段是否可用（不与固定项和已排任务冲突）"""
    start_min = start_hour * 60
    end_min = start_min + duration_min

    # 检查固定项
    for fi in fixed_items:
        fi_start = fi.get("startTime", 0) if isinstance(fi, dict) else getattr(fi, 'start_time', 0)
        fi_end = fi.get("endTime", 0) if isinstance(fi, dict) else getattr(fi, 'end_time', 0)
        fi_start_min = _to_minutes_since_midnight(fi_start)
        fi_end_min = _to_minutes_since_midnight(fi_end)
        if fi_start_min < 0 or fi_end_min < 0:
            continue
        if start_min < fi_end_min and end_min > fi_start_min:
            return False

    # 检查已排任务
    for p in placed:
        p_start = p.get("startTime", 0) if isinstance(p, dict) else getattr(p, 'start_time', 0)
        p_dur = p.get("duration", 0) if isinstance(p, dict) else getattr(p, 'duration', 0)
        p_start_min = _to_minutes_since_midnight(p_start)
        if p_start_min < 0:
            continue
        p_end_min = p_start_min + p_dur
        if start_min < p_end_min and end_min > p_start_min:
            return False

    return True


def _score_slot(start_hour: float, cognitive_load: str, priority: str) -> float:
    """给时间段打分：能量匹配度 + 优先级权重"""
    energy = get_energy_level(int(start_hour))
    load_range = COGNITIVE_LOAD_MATCH.get(cognitive_load, [0.0, 1.0])
    if load_range[0] <= energy <= load_range[1]:
        energy_score = 1.0
    else:
        energy_score = max(0, 1.0 - abs(energy - sum(load_range) / 2) * 2)
    priority_score = PRIORITY_WEIGHT.get(priority, 2) / 3.0
    return energy_score * 0.7 + priority_score * 0.3


def generate_plan(
    selected_nodes: list,
    fixed_items: list = None,
    date_str: str = None,
    work_start: float = 9.0,
    work_end: float = 22.0,
    min_slot: int = 25,
    max_slot: int = 120,
    target_white_space: float = 0.2,
) -> dict:
    """
    确定性计划生成器。

    算法：
    1. 按优先级 + 认知负荷排序任务
    2. 对每个任务，找到能量曲线匹配的最佳空闲时段
    3. 大任务拆分（可选）
    4. 放不下的进入 unplacedTasks
    5. 计算留白比例

    Args:
        selected_nodes: 从画布选出的节点列表，每个节点有 title, estimated_minutes,
                        cognitive_load, priority, kind, id 等字段
        fixed_items: 固定项列表（餐/会/睡等）
        date_str: 日期 YYYY-MM-DD
        work_start: 工作开始时间（小时）
        work_end: 工作结束时间（小时）
        min_slot: 最小时间块（分钟）
        max_slot: 最大时间块（分钟）
        target_white_space: 目标留白比例

    Returns:
        DailyPlan 字典
    """
    from banban_models import (
        DailyPlan, PlannedAction, UnplacedTask, FixedItem,
    )

    fixed_items = fixed_items or []
    date_str = date_str or datetime.now().strftime("%Y-%m-%d")

    # ---- 排序：优先级高 + 认知负荷深的优先排 ----
    def sort_key(n):
        p = PRIORITY_WEIGHT.get(n.get("priority") or n.get("manual_importance") or "medium", 2)
        c = COGNITIVE_LOAD_WEIGHT.get(
            n.get("cognitive_load") or
            ("deep" if n.get("energy_cost") == "high" else
             "medium" if n.get("energy_cost") == "medium" else "light"), 2)
        return -(p * 10 + c)  # 降序

    sorted_nodes = sorted(selected_nodes, key=sort_key)

    placed_actions = []
    unplaced = []
    total_work_min = 0

    for node in sorted_nodes:
        title = node.get("title", node.get("label", "未命名任务"))
        duration = node.get("estimated_minutes") or node.get("estimatedMinutes") or 45
        cog_load = node.get("cognitive_load") or node.get("cognitiveLoad") or (
            "deep" if node.get("energy_cost") == "high" else
            "medium" if node.get("energy_cost") == "medium" else "light"
        )
        priority = node.get("priority") or node.get("manual_importance") or "medium"
        node_id = node.get("id", "")
        # ===== 新增：优先使用节点上的 type 字段，否则通过 kind 推断 =====
        node_type = node.get("type") or _kind_to_type(node.get("kind", "action"))

        # 拆分大任务
        if duration > max_slot:
            sub_actions = split_task(node, max_slot, min_slot)
            for i, sub in enumerate(sub_actions):
                slot = _find_best_slot(
                    sub["duration"], cog_load, priority,
                    work_start, work_end, fixed_items, placed_actions
                )
                if slot:
                    action = PlannedAction(
                        origin_node_id=node_id,
                        title=f"{title}（{i+1}/{len(sub_actions)}）",
                        start_time=slot["start_ts"],
                        duration=sub["duration"],
                        type=node_type,
                        cognitive_load=cog_load,
                        priority=priority,
                        reason=slot["reason"],
                        order=len(placed_actions),
                    )
                    placed_actions.append(action.to_dict())
                    total_work_min += sub["duration"]
                else:
                    unplaced.append(UnplacedTask(
                        origin_node_id=node_id,
                        title=f"{title}（{i+1}/{len(sub_actions)}）",
                        estimated_duration=sub["duration"],
                        priority=priority,
                        cognitive_load=cog_load,
                        type=node_type,
                    ).to_dict())
        else:
            duration = max(duration, min_slot)
            slot = _find_best_slot(
                duration, cog_load, priority,
                work_start, work_end, fixed_items, placed_actions
            )
            if slot:
                action = PlannedAction(
                    origin_node_id=node_id,
                    title=title,
                    start_time=slot["start_ts"],
                    duration=duration,
                    type=node_type,
                    cognitive_load=cog_load,
                    priority=priority,
                    reason=slot["reason"],
                    order=len(placed_actions),
                )
                placed_actions.append(action.to_dict())
                total_work_min += duration
            else:
                unplaced.append(UnplacedTask(
                    origin_node_id=node_id,
                    title=title,
                    estimated_duration=duration,
                    priority=priority,
                    cognitive_load=cog_load,
                    type=node_type,
                ).to_dict())

    # ---- 计算留白 ----
    total_available = (work_end - work_start) * 60
    total_fixed = 0
    for fi in fixed_items:
        if isinstance(fi, dict):
            fi_start = fi.get("startTime", 0)
            fi_end = fi.get("endTime", 0)
        else:
            fi_start = getattr(fi, 'start_time', 0)
            fi_end = getattr(fi, 'end_time', 0)
        start_min = _to_minutes_since_midnight(fi_start)
        end_min = _to_minutes_since_midnight(fi_end)
        if start_min >= 0 and end_min >= 0:
            total_fixed += max(0, end_min - start_min)
    white_space = max(0, (total_available - total_fixed - total_work_min) / total_available) if total_available > 0 else 0

    # ---- 生成建议 ----
    suggestions = []
    if white_space < target_white_space:
        suggestions.append(f"留白仅 {white_space:.0%}，建议减少任务或缩短时长")
    if unplaced:
        suggestions.append(f"{len(unplaced)} 个任务未排入，可考虑顺延或拆分")
    if white_space > 0.4:
        suggestions.append("留白较多，可以考虑安排一些轻松的任务或休息")
    if not suggestions:
        suggestions.append("今天的计划看起来刚刚好")

    # 按开始时间排序
    placed_actions.sort(key=lambda x: x.get("startTime", 0))

    plan = DailyPlan(
        date=date_str,
        tasks=placed_actions,
        unplaced_tasks=unplaced,
        fixed_items=[f.to_dict() if hasattr(f, 'to_dict') else f for f in fixed_items],
        white_space_ratio=round(white_space, 2),
        total_work_minutes=total_work_min,
        suggestions=suggestions,
    )
    return plan.to_dict()


def _find_best_slot(
    duration: int, cognitive_load: str, priority: str,
    work_start: float, work_end: float,
    fixed_items: list, placed: list,
) -> Optional[dict]:
    """在空闲时段中找到最佳时间块"""
    from datetime import datetime, timedelta

    today = datetime.now().strftime("%Y-%m-%d")
    best_slot = None
    best_score = -1

    # 从 work_start 到 work_end，每 15 分钟尝试一次
    current = work_start
    while current + duration / 60 <= work_end:
        if _is_slot_available(current, duration, fixed_items, placed):
            score = _score_slot(current, cognitive_load, priority)
            if score > best_score:
                best_score = score
                hour = int(current)
                minute = int((current - hour) * 60)
                start_ts = datetime.strptime(
                    f"{today} {hour:02d}:{minute:02d}", "%Y-%m-%d %H:%M"
                ).timestamp() * 1000
                energy = get_energy_level(hour)
                reason = f"能量值 {energy:.1f}，匹配{cognitive_load}任务"
                best_slot = {"start_ts": start_ts, "score": score, "reason": reason}
        current += 0.25  # 15 分钟步进

    return best_slot


def _kind_to_type(kind: str) -> str:
    """画布节点 kind → 计划任务 type

    映射对齐 canvas_store.py NODE_KINDS:
    inspiration, desire, goal, project, action, habit, resource, constraint
    """
    mapping = {
        "inspiration": "light_work",
        "desire": "light_work",
        "action": "deep_work",
        "goal": "deep_work",
        "project": "deep_work",
        "habit": "routine",
        "resource": "learning",
        "constraint": "routine",
    }
    return mapping.get(kind, "light_work")


def split_task(node: dict, max_slot: int = 120, min_slot: int = 25) -> list:
    """拆分大任务为多个子块

    策略：
    - 深度认知任务：45min 块 + 15min 间隔
    - 中度任务：60min 块
    - 轻度任务：90min 块
    """
    duration = node.get("estimated_minutes") or node.get("estimatedMinutes") or 120
    cog_load = node.get("cognitive_load") or node.get("cognitiveLoad") or (
        "deep" if node.get("energy_cost") == "high" else
        "medium" if node.get("energy_cost") == "medium" else "light"
    )

    if cog_load == "deep":
        block_size = min(45, max_slot)
    elif cog_load == "medium":
        block_size = min(60, max_slot)
    else:
        block_size = min(90, max_slot)

    block_size = max(block_size, min_slot)
    parts = []
    remaining = duration
    while remaining > 0:
        part = min(remaining, block_size)
        if part >= min_slot:
            parts.append({"duration": part})
        remaining -= part

    return parts if parts else [{"duration": min_slot}]


def _to_timestamp_ms(val) -> float:
    """将时间值统一转换为毫秒时间戳。支持 ISO 字符串和数值。"""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        try:
            dt = datetime.fromisoformat(val)
            return dt.timestamp() * 1000
        except (ValueError, TypeError):
            try:
                return float(val)
            except (ValueError, TypeError):
                return 0.0
    return 0.0


def calculate_deviation(
    commitments: list,
    activity_segments: list,
) -> dict:
    """
    计算偏差报告。

    Args:
        commitments: DailyCommitment 列表
        activity_segments: ActivitySegment 列表（实际检测到的活动）

    Returns:
        DailyDeviationReport 字典
    """
    from banban_models import DailyDeviationReport, DeviationItem

    if not commitments:
        return DailyDeviationReport().to_dict()

    deviation_items = []
    completed = 0
    skipped = 0
    postponed = 0
    total_planned_min = 0
    total_actual_min = 0
    start_deviations = []
    duration_deviations = []
    duration_deviation_ratios = []

    for comm in commitments:
        comm_dict = comm if isinstance(comm, dict) else comm.to_dict()
        comm_id = comm_dict.get("id", "")
        status = comm_dict.get("status", "scheduled")
        sched_start = comm_dict.get("scheduledStart", 0)
        sched_dur = comm_dict.get("scheduledDuration", 0)
        actual_start = comm_dict.get("actualStartTime")
        actual_end = comm_dict.get("actualEndTime")
        actual_dur = comm_dict.get("actualDuration")

        total_planned_min += sched_dur

        dev_item = DeviationItem(commitment_id=comm_id)

        if status == "done":
            completed += 1
            dev_item.completion_status = "completed"
            if actual_dur:
                total_actual_min += actual_dur
            # 计算偏差
            if actual_start and sched_start:
                start_dev = (_to_timestamp_ms(actual_start) - _to_timestamp_ms(sched_start)) / 60000  # 转分钟
                dev_item.start_deviation_minutes = int(start_dev)
                start_deviations.append(abs(start_dev))
                if abs(start_dev) > 10:
                    dev_item.has_deviation = True
                    dev_item.types.append("start_time")

            if actual_dur and sched_dur:
                dur_dev = actual_dur - sched_dur
                dev_item.duration_deviation_minutes = dur_dev
                ratio = dur_dev / sched_dur if sched_dur > 0 else 0
                dev_item.duration_deviation_ratio = round(ratio, 2)
                duration_deviations.append(abs(dur_dev))
                duration_deviation_ratios.append(abs(ratio))
                if abs(ratio) > 0.3:
                    dev_item.has_deviation = True
                    dev_item.types.append("duration")

        elif status == "skipped":
            skipped += 1
            dev_item.completion_status = "skipped"
            dev_item.has_deviation = True
            dev_item.types.append("not_executed")
            dev_item.max_severity = "severe"  # 明确跳过 = 严重偏差

        elif status == "postponed":
            postponed += 1
            dev_item.completion_status = "postponed"
            dev_item.has_deviation = True
            dev_item.types.append("not_executed")
            dev_item.max_severity = "moderate"  # 顺延 = 中度偏差

        else:
            # scheduled / in_progress / paused 在日终仍未完成
            dev_item.completion_status = "pending"
            dev_item.has_deviation = True
            dev_item.types.append("not_executed")
            dev_item.max_severity = "moderate"

        # 严重度（仅对 done 状态用通用公式计算；skipped/postponed/pending 已在上面显式设定）
        if dev_item.has_deviation and status == "done":
            max_ratio = max(abs(dev_item.duration_deviation_ratio),
                           abs(dev_item.start_deviation_minutes) / 60)
            if max_ratio > 0.5:
                dev_item.max_severity = "severe"
            elif max_ratio > 0.3:
                dev_item.max_severity = "significant"
            elif max_ratio > 0.15:
                dev_item.max_severity = "moderate"
            else:
                dev_item.max_severity = "mild"

        deviation_items.append(dev_item.to_dict())

    total = len(commitments)
    completion_rate = completed / total if total > 0 else 0

    report = DailyDeviationReport(
        total_planned=total,
        completed=completed,
        skipped=skipped,
        postponed=postponed,
        completion_rate=round(completion_rate, 2),
        avg_start_deviation=round(sum(start_deviations) / len(start_deviations), 1) if start_deviations else 0,
        avg_duration_deviation=round(sum(duration_deviations) / len(duration_deviations), 1) if duration_deviations else 0,
        avg_duration_deviation_ratio=round(sum(duration_deviation_ratios) / len(duration_deviation_ratios), 2) if duration_deviation_ratios else 0,
        total_planned_minutes=total_planned_min,
        total_actual_minutes=total_actual_min,
        deviations=deviation_items,
    )
    return report.to_dict()
