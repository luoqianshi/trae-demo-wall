"""
time_sense.py — 时间感知系统

核心理念：时间是生活的骨架，不是刻度。

四层时间模型：
1. 物理时间 — 几点几分（客观）
2. 生理时间 — 饿了、困了、累了（身体节律）
3. 社会时间 — 上班、下班、饭点、周末（社会节律）
4. 个人时间 — 晨型/夜猫子、高效时段、个人习惯（个人节律）

四层叠加，才是"这个人的现在"。
"""

from datetime import datetime, timedelta
from typing import Dict, Optional
from behavior_config import THRESHOLDS


# ============================================================
# 1. 物理时间 — 时段划分
# ============================================================

TimeOfDay = str  # dawn / morning / forenoon / noon / afternoon / evening / night / late_night

TIME_OF_DAY_LABELS: Dict[str, str] = {
    "dawn": "黎明",
    "morning": "清晨",
    "forenoon": "上午",
    "noon": "中午",
    "afternoon": "下午",
    "evening": "傍晚",
    "night": "晚上",
    "late_night": "深夜",
}

def get_time_of_day(dt: datetime) -> TimeOfDay:
    """根据时间返回时段标识"""
    h = dt.hour
    if 5 <= h < 7:
        return "dawn"
    elif 7 <= h < 9:
        return "morning"
    elif 9 <= h < 12:
        return "forenoon"
    elif 12 <= h < 13.5:
        return "noon"
    elif 13.5 <= h < 17.5:
        return "afternoon"
    elif 17.5 <= h < 20:
        return "evening"
    elif 20 <= h < 23:
        return "night"
    else:
        return "late_night"


# ============================================================
# 2. 工作时段阶段
# ============================================================

WorkHoursPhase = str  # before_work / work_start / morning_peak / lunch_break / afternoon_peak / evening_slump / after_work / before_sleep

WORK_PHASE_LABELS: Dict[str, str] = {
    "before_work": "上班前",
    "work_start": "刚开工",
    "morning_peak": "上午高效",
    "lunch_break": "午休时间",
    "afternoon_peak": "下午工作",
    "evening_slump": "傍晚低谷",
    "after_work": "下班后",
    "before_sleep": "睡前",
}

def get_work_hours_phase(dt: datetime) -> WorkHoursPhase:
    """根据时间返回工作时段阶段"""
    h = dt.hour + dt.minute / 60.0
    t = THRESHOLDS["time"]

    if h < t["work_start"]:
        return "before_work"
    elif h < 10:
        return "work_start"
    elif h < t["lunch_start"]:
        return "morning_peak"
    elif h < t["lunch_end"] + 1:
        return "lunch_break"
    elif h < t["dinner_start"]:
        return "afternoon_peak"
    elif h < t["work_end"] + 1:
        return "evening_slump"
    elif h < t["sleep_start"]:
        return "after_work"
    else:
        return "before_sleep"


# ============================================================
# 3. 社会节律
# ============================================================

def get_day_of_week_type(dt: datetime) -> str:
    """返回日期类型：workday / weekend / holiday"""
    # 简单判断周末（holiday 需要外部日历数据）
    if dt.weekday() >= 5:
        return "weekend"
    return "workday"


def get_meal_time(dt: datetime) -> Optional[str]:
    """返回饭点标识：breakfast / lunch / dinner / None"""
    h = dt.hour + dt.minute / 60.0
    t = THRESHOLDS["time"]

    if t["breakfast_start"] <= h < t["breakfast_end"]:
        return "breakfast"
    elif t["lunch_start"] <= h < t["lunch_end"]:
        return "lunch"
    elif t["dinner_start"] <= h < t["dinner_end"]:
        return "dinner"
    return None


def is_typical_work_time(dt: datetime) -> bool:
    """是否是典型工作时间"""
    h = dt.hour + dt.minute / 60.0
    t = THRESHOLDS["time"]
    if get_day_of_week_type(dt) == "weekend":
        return False
    return t["work_start"] <= h < t["work_end"]


def is_typical_sleep_time(dt: datetime) -> bool:
    """是否是典型睡眠时间"""
    h = dt.hour + dt.minute / 60.0
    t = THRESHOLDS["time"]
    return h >= t["sleep_start"] or h < t["sleep_end"]


# ============================================================
# 4. 生理节律估计（启发式）
# ============================================================

class BiologicalRhythm:
    """生理节律估计器 — 这些是估计，不是事实。AI 会结合实际行为修正。"""

    @staticmethod
    def estimate(
        dt: datetime,
        consecutive_work_hours: float = 0,
        last_rest_hours_ago: float = 99,
        sleep_hours_last_night: float = 7,
    ) -> Dict:
        """
        估计当前生理状态。

        Args:
            dt: 当前时间
            consecutive_work_hours: 连续工作小时数
            last_rest_hours_ago: 距上次休息的小时数
            sleep_hours_last_night: 昨晚睡眠时长

        Returns:
            {
                "hunger_probability": 0-1,
                "sleepiness_probability": 0-1,
                "fatigue_level": 0-1,
                "need_break_probability": 0-1,
                "last_meal_estimate": 小时前,
                "last_rest_estimate": 小时前,
                "consecutive_work_hours": 小时,
            }
        """
        h = dt.hour + dt.minute / 60.0
        bio = THRESHOLDS["biological"]

        # ---- 饥饿概率 ----
        hunger = 0.2  # 基础
        meal = get_meal_time(dt)
        if meal:
            hunger = 0.7  # 饭点基础概率
        elif 9 < h < 11.5 and last_rest_hours_ago > 3:
            hunger = 0.4  # 早餐后 4 小时上升
        elif 14 < h < 17.5 and last_rest_hours_ago > 3:
            hunger = 0.4

        if consecutive_work_hours > bio["hunger_after_meal_hours"]:
            hunger = min(1.0, hunger + 0.2)

        # 估计上次进食
        last_meal = 99
        if meal == "lunch" and h > 12:
            last_meal = h - 12
        elif meal == "dinner" and h > 18:
            last_meal = h - 18
        elif h > 9:
            last_meal = h - 8  # 假设 8 点早餐

        # ---- 困倦概率 ----
        sleepiness = 0.15  # 基础
        if bio["afternoon_dip_start"] <= h < bio["afternoon_dip_end"]:
            sleepiness = 0.5  # 午后低谷
        if h >= bio["late_night_start"]:
            sleepiness = 0.8  # 深夜
        if sleep_hours_last_night < 7:
            sleepiness = min(1.0, sleepiness + 0.3)  # 睡眠不足
        if consecutive_work_hours > bio["max_consecutive_work_hours"]:
            sleepiness = min(1.0, sleepiness + 0.2)

        # ---- 疲劳程度 ----
        fatigue = consecutive_work_hours * bio["fatigue_per_hour"]
        if last_rest_hours_ago < 1:  # 最近休息过
            fatigue = max(0, fatigue - bio["rest_recovery"])
        if bio["afternoon_dip_start"] <= h < bio["afternoon_dip_end"]:
            fatigue = min(1.0, fatigue + 0.2)  # 午后自然上升
        fatigue = max(0, min(1.0, fatigue))

        # ---- 需要休息概率 ----
        need_break = fatigue * 0.5 + sleepiness * 0.3 + hunger * 0.2

        return {
            "hunger_probability": round(hunger, 2),
            "sleepiness_probability": round(sleepiness, 2),
            "fatigue_level": round(fatigue, 2),
            "need_break_probability": round(need_break, 2),
            "last_meal_estimate": round(last_meal, 1),
            "last_rest_estimate": round(last_rest_hours_ago, 1),
            "consecutive_work_hours": round(consecutive_work_hours, 1),
        }


# ============================================================
# 5. 时间感知系统 — 总接口
# ============================================================

class TimeSenseSystem:
    """时间感知系统 — 四层时间叠加，给出这个人的现在"""

    def __init__(self, user_baseline: Optional[Dict] = None):
        """
        Args:
            user_baseline: 用户个人基线数据，如：
                {
                    "wake_time": 7.5,        # 起床时间
                    "sleep_time": 23.5,      # 睡觉时间
                    "peak_hours": [9, 10, 11],  # 高效时段
                    "lunch_time": 12,        # 午饭时间
                    "chronotype": "morning",  # morning / evening / intermediate
                }
        """
        self.user_baseline = user_baseline or {}

    def update_from_user_model(self, user_model: Dict):
        """从 UserModelV2 更新个人节律基线

        让时间感知系统真正"懂这个人"——
        知道 TA 是晨型人还是夜猫子，知道 TA 的高效时段。
        """
        if not user_model:
            return
        energy = user_model.get("energy_pattern", {})
        if energy:
            self.user_baseline["chronotype"] = energy.get("chronotype", "intermediate")
            self.user_baseline["peak_hours"] = energy.get("high_energy_periods", [9, 10, 14, 15])
            self.user_baseline["wake_time"] = energy.get("wake_time", 7.5)
            self.user_baseline["sleep_time"] = energy.get("sleep_time", 23.5)

    def get_time_context(self, dt: Optional[datetime] = None,
                         consecutive_work_hours: float = 0,
                         last_rest_hours_ago: float = 99) -> Dict:
        """
        获取当前完整的时间上下文。

        Args:
            dt: 当前时间（默认 now）
            consecutive_work_hours: 连续工作小时数（由行为引擎传入）
            last_rest_hours_ago: 距上次休息的小时数

        Returns:
            {
                "physical": { "time_of_day": ..., "work_phase": ..., "is_work_time": ..., "is_sleep_time": ... },
                "biological": { "hunger": ..., "sleepiness": ..., "fatigue": ..., "need_break": ... },
                "social": { "day_type": ..., "meal_time": ..., "is_weekend": ... },
                "personal": { "chronotype": ..., "is_peak_hour": ..., ... },
                "lifestyle_note": "一句话生活感悟",
            }
        """
        dt = dt or datetime.now()
        tod = get_time_of_day(dt)
        phase = get_work_hours_phase(dt)
        meal = get_meal_time(dt)
        day_type = get_day_of_week_type(dt)

        # 生理估计 — 接收行为引擎传入的连续工作时长
        bio = BiologicalRhythm.estimate(
            dt,
            consecutive_work_hours=consecutive_work_hours,
            last_rest_hours_ago=last_rest_hours_ago,
        )

        # 个人节律
        chronotype = self.user_baseline.get("chronotype", "intermediate")
        peak_hours = self.user_baseline.get("peak_hours", [9, 10, 14, 15])
        is_peak_hour = dt.hour in peak_hours

        # 生活感悟
        note = self._lifestyle_note(tod, phase, meal, bio, day_type)

        return {
            "physical": {
                "time_of_day": tod,
                "time_of_day_label": TIME_OF_DAY_LABELS.get(tod, tod),
                "work_phase": phase,
                "work_phase_label": WORK_PHASE_LABELS.get(phase, phase),
                "is_work_time": is_typical_work_time(dt),
                "is_sleep_time": is_typical_sleep_time(dt),
                "datetime": dt.strftime("%Y-%m-%d %H:%M"),
                "hour": dt.hour,
            },
            "biological": bio,
            "social": {
                "day_type": day_type,
                "day_type_label": "工作日" if day_type == "workday" else "周末",
                "meal_time": meal,
                "meal_time_label": {"breakfast": "早餐", "lunch": "午餐", "dinner": "晚餐"}.get(meal, ""),
                "is_weekend": day_type == "weekend",
            },
            "personal": {
                "chronotype": chronotype,
                "chronotype_label": {"morning": "晨型人", "evening": "夜猫子", "intermediate": "中间型"}.get(chronotype, chronotype),
                "is_peak_hour": is_peak_hour,
                "peak_hours": peak_hours,
            },
            "lifestyle_note": note,
        }

    def _lifestyle_note(self, tod: str, phase: str, meal: Optional[str],
                        bio: Dict, day_type: str) -> str:
        """生成一句话生活感悟"""
        if meal == "lunch":
            return "午饭时间了，去吃点东西吧"
        if meal == "dinner":
            return "晚饭时间，今天辛苦了"
        if tod == "late_night":
            return "夜深了，该准备休息了"
        if phase == "before_sleep":
            return "快到睡觉时间了，慢慢放松下来"
        if bio.get("need_break_probability", 0) > 0.6:
            return "连续工作挺久了，该歇会儿了"
        if phase == "morning_peak":
            return "上午精力不错，适合做重要的事"
        if phase == "afternoon_peak" and bio.get("sleepiness_probability", 0) > 0.4:
            return "下午容易犯困，正常的事"
        if day_type == "weekend" and tod in ("morning", "dawn"):
            return "周末睡个好觉，不用着急起来"
        if phase == "after_work":
            return "下班了，放松一下吧"
        return ""


# ============================================================
# 便捷函数
# ============================================================

def get_current_time_context(user_baseline: Optional[Dict] = None) -> Dict:
    """获取当前时间上下文（便捷接口）"""
    return TimeSenseSystem(user_baseline).get_time_context()
