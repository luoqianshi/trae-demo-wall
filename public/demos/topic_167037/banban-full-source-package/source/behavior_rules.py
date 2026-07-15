"""
behavior_rules.py — 规则引擎（骨架）

规则引擎是纯函数：输入 FeatureSet，输出 RuleResult。
所有规则可配置，可测试，可热更新。

四大规则集：
1. 工作连续性 — 判断"是不是在做同一项工作"
2. 多任务检测 — 判断"是专注还是多任务"
3. 休息判断   — 判断"是不是在休息，是什么休息"
4. 离开判断   — 判断"是不是不在电脑前"

核心原则：不确定就说不确定，宁可不判断，也不要乱判断。
"""

from typing import Dict, List, Optional
from behavior_config import THRESHOLDS, classify_app, classify_keywords


# ============================================================
# 特征集类型（简化版，实际由 behavior_engine 构建）
# ============================================================

class FeatureSet:
    """从原始数据中提取的特征集"""

    def __init__(self, data: Dict):
        self.current_app = data.get("current_app", "")
        self.current_app_duration = data.get("current_app_duration", 0)  # 秒
        self.app_sequence = data.get("app_sequence", [])
        self.switch_count_10min = data.get("switch_count_10min", 0)
        self.switch_frequency = data.get("switch_frequency", 0.0)
        self.dominant_app = data.get("dominant_app", "")
        self.dominant_app_ratio = data.get("dominant_app_ratio", 0.0)
        self.category_sequence = data.get("category_sequence", [])
        self.category_streak = data.get("category_streak", 0)  # 分钟

        self.title_keywords = data.get("title_keywords", [])
        self.ocr_keywords = data.get("ocr_keywords", [])
        self.prev_keywords = data.get("prev_keywords", [])
        self.title_similarity = data.get("title_similarity", 0.0)
        self.topic_consistency = data.get("topic_consistency", 0.0)
        self.context_stability = data.get("context_stability", 0.0)

        self.mouse_clicks = data.get("mouse_clicks", 0)
        self.key_strokes = data.get("key_strokes", 0)
        self.idle_seconds = data.get("idle_seconds", 0)
        self.is_locked = data.get("is_locked", False)
        self.screen_on = data.get("screen_on", True)
        self.activity_level = data.get("activity_level", "medium")
        self.focus_intensity = data.get("focus_intensity", 0.5)

        self.timestamp = data.get("timestamp", 0)

    @property
    def all_keywords(self) -> List[str]:
        return list(set(self.title_keywords + self.ocr_keywords))

    @property
    def current_category(self) -> str:
        return classify_app(self.current_app)

    def keyword_overlap(self, other_keywords: List[str]) -> float:
        """计算与另一组关键词的 Jaccard 相似度"""
        if not self.all_keywords or not other_keywords:
            return 0.0
        s1 = set(k.lower() for k in self.all_keywords)
        s2 = set(k.lower() for k in other_keywords)
        intersection = s1 & s2
        union = s1 | s2
        return len(intersection) / len(union) if union else 0.0


# ============================================================
# 1. 工作连续性判断
# ============================================================

def evaluate_work_continuity(f: FeatureSet) -> Dict:
    """
    判断"是不是在做同一项工作"

    R1  同一应用持续 > 10min + 关键词重合 > 60% → +0.8
    R2  主题一致多应用（关键词重合 > 50%）→ +0.6
    R3  短切换忽略（< 2min 返回）→ +0.3
    R4  上下文稳定（> 0.7）→ +0.4
    R5  工作中沟通穿插（< 5min）→ +0.2
    R6  完全切换（不同主题 > 5min）→ -0.7
    R7  低活动（键鼠低 > 2min）→ -0.5
    R8  娱乐应用（> 3min）→ -1.0
    R9  查资料不打断（浏览器+关键词相关）→ +0.4
    R10 找文件不打断（资源管理器+快速返回）→ +0.2
    """
    t = THRESHOLDS["work_continuity"]
    score = 0.5
    evidence: List[str] = []
    current_cat = f.current_category

    # R1: 同一应用持续
    if f.current_app_duration > t["same_app_min_duration"]:
        overlap = f.keyword_overlap(f.prev_keywords)
        if overlap > t["keyword_overlap_high"]:
            score += 0.8
            evidence.append(f"R1: {f.current_app} 持续 {f.current_app_duration//60} 分钟，关键词重合 {overlap:.0%}")
        elif overlap > t["keyword_overlap_medium"]:
            score += 0.4
            evidence.append(f"R1(部分): {f.current_app} 持续 {f.current_app_duration//60} 分钟，关键词重合 {overlap:.0%}")

    # R2: 主题一致多应用
    if f.switch_count_10min > 0 and f.topic_consistency > 0.5:
        score += 0.6
        evidence.append(f"R2: 切换了应用但主题一致（{f.topic_consistency:.0%}）")

    # R3: 短切换忽略
    if f.switch_count_10min > 0 and f.current_app_duration < t["short_switch_threshold"]:
        # 可能是短切换后返回
        if len(f.app_sequence) >= 3 and f.app_sequence[-1] == f.app_sequence[-3]:
            score += 0.3
            evidence.append("R3: 短切换后返回原应用，不打断")

    # R4: 上下文稳定
    if f.context_stability > 0.7:
        score += 0.4
        evidence.append(f"R4: 上下文稳定性 {f.context_stability:.0%}")

    # R5: 工作中沟通穿插
    if current_cat == "communication" and f.current_app_duration < t["communication_interruption_max"]:
        # 检查是否穿插在工作中
        recent_cats = [classify_app(a) for a in f.app_sequence[-5:]]
        if any(c in ("deep_work", "light_work") for c in recent_cats):
            score += 0.2
            evidence.append(f"R5: {f.current_app} 穿插在工作中（{f.current_app_duration//60} 分钟）")

    # R6: 完全切换
    if f.switch_count_10min > 0 and f.topic_consistency < 0.3:
        if f.current_app_duration > 300:  # 5 分钟
            score -= 0.7
            evidence.append("R6: 切换到不同主题应用超过 5 分钟")

    # R7: 低活动
    if f.idle_seconds > 120 and f.mouse_clicks < 5 and f.key_strokes < 10:
        score -= 0.5
        evidence.append(f"R7: 键鼠活动持续低（空闲 {f.idle_seconds} 秒）")

    # R8: 娱乐应用
    if current_cat in ("entertainment_active", "entertainment_passive"):
        if f.current_app_duration > 180:  # 3 分钟
            score -= 1.0
            evidence.append(f"R8: 娱乐应用 {f.current_app} 超过 3 分钟")

    # R9: 查资料不打断
    if current_cat == "unknown" and f.current_app:  # 浏览器类
        overlap = f.keyword_overlap(f.prev_keywords)
        if overlap > t["keyword_overlap_medium"]:
            score += 0.4
            evidence.append(f"R9: 浏览器但关键词与当前主题相关（{overlap:.0%}）")

    # R10: 找文件不打断
    if current_cat == "light_work" and f.current_app_duration < 180:
        if "资源管理器" in f.current_app or "Explorer" in f.current_app or "Finder" in f.current_app:
            score += 0.2
            evidence.append("R10: 资源管理器快速查找")

    # clamp
    score = max(0.0, min(1.0, score))

    # 分级
    if score > t["high"]:
        level = "high"
    elif score > t["medium"]:
        level = "medium_high"
    elif score > t["low"]:
        level = "uncertain"
    else:
        level = "switched"

    return {
        "is_continuous": score > t["medium"],
        "score": round(score, 2),
        "level": level,
        "evidence": evidence,
    }


# ============================================================
# 2. 多任务检测
# ============================================================

def evaluate_multi_task(f: FeatureSet) -> Dict:
    """
    判断"是专注还是多任务"

    M1 高频切换: 10min 内 > 8 次 → +0.9
    M2 中频切换: 10min 内 4-8 次 → +0.6
    M3 低频切换: 10min 内 2-4 次 → +0.3
    M4 无持续专注: 没有应用 > 10min → +0.7
    M5 多主题跳跃: 3+ 个不相关主题 → +0.8
    M6 通讯穿插多: 通讯占比 > 30% → +0.5
    M7 长时段专注: 单应用 > 45min + 主题稳定 → -0.5
    M8 深度工作: 高活动 + 低切换 + 主题一致 → -0.3
    """
    t = THRESHOLDS["multi_task"]
    score = 0.2
    evidence: List[str] = []

    sc = f.switch_count_10min

    # M1-M3: 切换频率
    if sc > t["very_high_switch_rate"]:
        score += 0.9
        evidence.append(f"M1: 10 分钟内切换 {sc} 次（高频）")
    elif sc > t["high_switch_rate"]:
        score += 0.6
        evidence.append(f"M2: 10 分钟内切换 {sc} 次（中频）")
    elif sc > t["low_switch_rate"]:
        score += 0.3
        evidence.append(f"M3: 10 分钟内切换 {sc} 次（低频）")

    # M4: 无持续专注
    if f.current_app_duration < t["no_focus_duration"] and sc > 2:
        score += 0.7
        evidence.append("M4: 没有任何应用持续超过 10 分钟")

    # M5: 多主题跳跃
    unique_cats = set(f.category_sequence[-10:])
    non_work_cats = unique_cats - {"unknown"}
    if len(non_work_cats) >= 3:
        score += 0.8
        evidence.append(f"M5: {len(non_work_cats)} 个不相关主题交替")

    # M6: 通讯穿插多
    comm_count = sum(1 for c in f.category_sequence[-10:] if c == "communication")
    if len(f.category_sequence) >= 5 and comm_count / max(len(f.category_sequence[-10:]), 1) > 0.3:
        score += 0.5
        evidence.append("M6: 通讯类应用占比超过 30%")

    # M7: 长时段专注
    if f.current_app_duration > t["long_focus_duration"] and f.topic_consistency > 0.6:
        score -= 0.5
        evidence.append(f"M7: {f.current_app} 持续 {f.current_app_duration//60} 分钟 + 主题稳定")

    # M8: 深度工作
    if f.activity_level in ("high", "medium") and sc <= 2 and f.topic_consistency > 0.6:
        score -= 0.3
        evidence.append("M8: 高活动 + 低切换 + 主题一致")

    score = max(0.0, min(1.0, score))

    # 四级分类
    if score < t["l2"]:
        level = 1  # 专注
    elif score < t["l3"]:
        level = 2  # 轻度切换
    elif score < t["l4"]:
        level = 3  # 中度多任务
    else:
        level = 4  # 高度碎片化

    return {
        "level": level,
        "score": round(score, 2),
        "evidence": evidence,
    }


# ============================================================
# 3. 休息判断
# ============================================================

def evaluate_rest(f: FeatureSet, time_context: Optional[Dict] = None) -> Dict:
    """
    判断"是不是在休息，是什么休息"

    S1 娱乐应用 > 3min + 非工作 → +0.9 主动休息
    S2 低活动+屏幕亮+娱乐/社交 → +0.6 被动休息
    S3 短离开 1-3min → +0.4 微休息
    S4 工作中摸鱼 → +0.3 微休息
    S5 饭点离开 → +1.0 吃饭
    S6 睡前放松 23:00+ → +0.8 主动休息
    S7 查资料排除 → -0.6
    S8 工作消息排除 → -0.5
    S9 运动户外 → +0.9 深度休息
    """
    t = THRESHOLDS["rest"]
    score = 0.0
    rest_type = None
    rest_depth = None
    evidence: List[str] = []
    current_cat = f.current_category

    # S1: 娱乐应用
    if current_cat in ("entertainment_active", "entertainment_passive"):
        if f.current_app_duration > t["active_min_duration"]:
            score += 0.9
            rest_type = "active"
            evidence.append(f"S1: {f.current_app} 娱乐超过 {f.current_app_duration//60} 分钟")

    # S2: 低活动+屏幕亮
    if f.idle_seconds < 90 and f.activity_level == "low" and current_cat in ("entertainment_passive", "communication"):
        score += 0.6
        if not rest_type:
            rest_type = "passive"
        evidence.append("S2: 低活动 + 娱乐/社交应用")

    # S3: 短离开（空闲但不长）
    if 60 < f.idle_seconds < t["micro_max_duration"]:
        score += 0.4
        if not rest_type:
            rest_type = "micro"
        evidence.append(f"S3: 短暂离开（{f.idle_seconds} 秒）")

    # S4: 工作中摸鱼
    if current_cat in ("deep_work", "light_work") and f.idle_seconds > 60:
        if f.mouse_clicks < 3 and f.key_strokes < 5:
            score += 0.3
            if not rest_type:
                rest_type = "micro"
            evidence.append("S4: 工作应用但活动极低")

    # S5: 饭点离开
    if time_context:
        meal = time_context.get("social", {}).get("meal_time")
        if meal and f.idle_seconds > 300:
            score += 1.0
            rest_type = "meal"
            evidence.append(f"S5: {meal} 饭点 + 空闲 {f.idle_seconds//60} 分钟")

    # S6: 睡前放松
    if time_context:
        tod = time_context.get("physical", {}).get("time_of_day")
        if tod == "late_night" and current_cat in ("entertainment_active", "entertainment_passive"):
            score += 0.8
            rest_type = "active"
            evidence.append("S6: 深夜娱乐放松")

    # S7: 查资料排除
    if current_cat == "unknown" and f.all_keywords:
        overlap = f.keyword_overlap(f.prev_keywords)
        if overlap > 0.4:
            score -= 0.6
            evidence.append("S7: 浏览器但关键词工作相关，不是休息")

    # S8: 工作消息排除
    if current_cat == "communication" and f.all_keywords:
        kw_text = " ".join(f.all_keywords).lower()
        work_kw = ["项目", "需求", "会议", "报告", "代码", "设计", "任务", "deadline"]
        if any(k in kw_text for k in work_kw):
            score -= 0.5
            evidence.append("S8: 通讯但讨论工作内容，不是休息")

    # S9: 运动/户外（长时间离开）
    if f.idle_seconds > 1200 and time_context:
        tod = time_context.get("physical", {}).get("time_of_day")
        if tod in ("morning", "evening", "afternoon"):
            score += 0.9
            rest_type = "active"
            rest_depth = "deep"
            evidence.append("S9: 长时间离开 + 运动时段")

    # 休息深度
    if rest_type and not rest_depth:
        if rest_type == "meal":
            rest_depth = "medium"
        elif f.idle_seconds > 600:
            rest_depth = "deep"
        elif rest_type == "active" and current_cat in ("entertainment_passive",):
            rest_depth = "medium"
        elif rest_type in ("micro",):
            rest_depth = "light"
        else:
            rest_depth = "light"

    score = max(0.0, min(1.0, score))

    return {
        "is_resting": score > 0.5 and rest_type is not None,
        "type": rest_type,
        "depth": rest_depth,
        "score": round(score, 2),
        "evidence": evidence,
    }


# ============================================================
# 4. 离开判断
# ============================================================

def evaluate_away(f: FeatureSet) -> Dict:
    """
    判断"是不是不在电脑前"

    A1 锁屏 → away 0.95
    A2 长时间空闲 > 90s → away 0.9
    B1 短离开 3-10min → away_short 0.75
    B2 中离开 10-20min → away_medium 0.8
    B3 长离开 > 20min → away_long 0.85
    C1 纯娱乐 > 20min + 零工作 → not_working 0.7
    D1 无目的切换 → confused 0.5
    E1 思考中 → thinking 0.4（不算离开）
    """
    t = THRESHOLDS["away"]
    is_away = False
    duration = None
    score = 0.0
    evidence: List[str] = []

    # A1: 锁屏
    if f.is_locked:
        is_away = True
        score = 0.95
        evidence.append("A1: 锁屏")
    # A2: 长时间空闲
    elif f.idle_seconds > t["afk_threshold"] and f.mouse_clicks == 0 and f.key_strokes == 0:
        is_away = True
        score = 0.9
        evidence.append(f"A2: 空闲 {f.idle_seconds} 秒 + 无活动")

    # B1-B3: 按时长分类
    if is_away:
        idle = f.idle_seconds
        if idle > t["long_away"]:
            duration = "long"
        elif idle > t["medium_away"]:
            duration = "medium"
        elif idle > t["short_away"]:
            duration = "short"
        else:
            duration = "short"

    # C1: 纯娱乐（不在工作但屏幕亮着）
    if not is_away:
        current_cat = f.current_category
        if current_cat in ("entertainment_active", "entertainment_passive"):
            if f.current_app_duration > 1200:  # 20 分钟
                # 检查最近是否有工作应用
                recent_cats = [classify_app(a) for a in f.app_sequence[-10:]]
                has_work = any(c in ("deep_work", "light_work") for c in recent_cats)
                if not has_work:
                    score = 0.7
                    evidence.append(f"C1: {f.current_app} 娱乐超过 20 分钟 + 零工作应用")

    # D1: 无目的切换
    if not is_away and f.switch_count_10min > 4:
        if f.topic_consistency < 0.3 and f.activity_level == "low":
            score = 0.5
            evidence.append("D1: 频繁切换 + 多主题 + 低活动")

    # E1: 思考中（不算离开）
    if not is_away and f.idle_seconds > 60 and f.idle_seconds < 300:
        if f.activity_level in ("low", "none"):
            current_cat = f.current_category
            if current_cat in ("deep_work", "light_work", "unknown"):
                # 可能是在思考
                score = 0.4
                evidence.append("E1: 单窗口 + 低活动 + 工作内容（可能在思考）")

    return {
        "is_away": is_away,
        "duration": duration,
        "score": round(score, 2),
        "evidence": evidence,
    }


# ============================================================
# 5. 规则引擎总入口
# ============================================================

def evaluate_all(features: FeatureSet, time_context: Optional[Dict] = None) -> Dict:
    """
    规则引擎总入口：输入 FeatureSet，输出 RuleResult。

    Returns:
        {
            "primary_state": str,
            "confidence": float,
            "work_continuity": {...},
            "multi_task": {...},
            "rest": {...},
            "away": {...},
            "needs_ai_review": [str],  # 需要AI复核的维度
        }
    """
    wc = evaluate_work_continuity(features)
    mt = evaluate_multi_task(features)
    rest = evaluate_rest(features, time_context)
    away = evaluate_away(features)

    # 确定主状态和置信度
    t_ai = THRESHOLDS["ai_review"]
    needs_review = []

    if away["is_away"]:
        primary = "away"
        confidence = away["score"]
        if confidence < t_ai["confidence_threshold"]:
            needs_review.append("away")
    elif rest["is_resting"]:
        primary = "rest"
        confidence = rest["score"]
        if confidence < t_ai["confidence_threshold"]:
            needs_review.append("rest")
    else:
        current_cat = features.current_category
        if current_cat == "deep_work":
            primary = "deep_work"
            confidence = wc["score"] if wc["is_continuous"] else 0.5
        elif current_cat == "light_work":
            primary = "light_work"
            confidence = 0.6
        elif current_cat == "communication":
            primary = "communication"
            confidence = 0.7
        elif current_cat == "learning":
            primary = "learning"
            confidence = 0.65
        elif current_cat in ("entertainment_active", "entertainment_passive"):
            primary = "rest"  # 娱乐归为休息
            confidence = rest["score"]
        else:
            primary = "unknown"
            confidence = 0.3

        # 低置信度交 AI
        if confidence < t_ai["confidence_threshold"]:
            needs_review.append("primary")
        if not wc["is_continuous"] and wc["score"] > 0.3:
            if wc["score"] < t_ai["confidence_threshold"]:
                needs_review.append("work_continuity")

    return {
        "primary_state": primary,
        "confidence": round(confidence, 2),
        "work_continuity": wc,
        "multi_task": mt,
        "rest": rest,
        "away": away,
        "needs_ai_review": needs_review,
    }
