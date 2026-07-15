"""
behavior_engine.py — 行为认知引擎主模块

四层双轨架构：
L1 原始数据层 — 截图 + OCR + 窗口信息 + 键鼠活动
L2 特征提取层 — 应用序列 / 内容相似 / 活跃度 / 时间模式
L3 判断层    — 规则引擎(骨架) ↔ AI引擎(灵魂)
L4 认知输出层 — 状态结论 + 置信度 + 证据 + AI解释 + 建议动作

核心原则：
1. AI 高于规则 — 规则只是骨架，AI 有最终判断权
2. 时间是生活的骨架 — 不是只有几点几分，还有饭点、下班、睡前
"""

import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable

from behavior_config import (
    classify_app, classify_keywords, THRESHOLDS,
    CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS,
)
from behavior_rules import FeatureSet, evaluate_all
from time_sense import TimeSenseSystem, get_current_time_context


# ============================================================
# L4 认知输出结构
# ============================================================

class CognitionResult:
    """最终认知输出 — 给 UI 用的完整结果"""

    def __init__(self, data: Dict):
        self.primary_state = data.get("primary_state", "unknown")
        self.state_label = data.get("state_label", CATEGORY_LABELS.get(self.primary_state, "未知"))
        self.confidence = data.get("confidence", 0.0)
        self.current_app = data.get("current_app", "")  # 当前应用名（供时间线展示）

        self.work_continuity = data.get("work_continuity", {})
        self.multi_task_level = data.get("multi_task_level", 1)
        self.rest = data.get("rest", {})
        self.away = data.get("away", {})

        self.time_context = data.get("time_context", {})
        self.ai_reasoning = data.get("ai_reasoning")
        self.suggested_action = data.get("suggested_action")
        self.suggested_action_reason = data.get("suggested_action_reason")

        self.source = data.get("source", "rules_only")  # rules_only / ai_with_rules
        self.ai_overrode_rules = data.get("ai_overrode_rules", False)
        self.timestamp = data.get("timestamp", time.time())
        self.evidence = data.get("evidence", [])

    @property
    def color(self) -> str:
        return CATEGORY_COLORS.get(self.primary_state, "#E0E0E0")

    @property
    def icon(self) -> str:
        return CATEGORY_ICONS.get(self.primary_state, "\u2753")

    def to_dict(self) -> Dict:
        return {
            "primary_state": self.primary_state,
            "state_label": self.state_label,
            "confidence": self.confidence,
            "current_app": self.current_app,
            "color": self.color,
            "icon": self.icon,
            "work_continuity": self.work_continuity,
            "multi_task_level": self.multi_task_level,
            "rest": self.rest,
            "away": self.away,
            "time_context": self.time_context,
            "ai_reasoning": self.ai_reasoning,
            "suggested_action": self.suggested_action,
            "suggested_action_reason": self.suggested_action_reason,
            "source": self.source,
            "ai_overrode_rules": self.ai_overrode_rules,
            "timestamp": self.timestamp,
            "evidence": self.evidence,
        }


# ============================================================
# L2 特征提取器
# ============================================================

class FeatureExtractor:
    """从截图数据 + 窗口事件序列中提取特征"""

    def __init__(self, window_size: int = 15):
        """
        Args:
            window_size: 滑动窗口大小（分钟）
        """
        self.window_size = window_size
        self._history: List[Dict] = []  # 最近的数据点

    def add_data_point(self, data: Dict):
        """添加一个数据点到滑动窗口"""
        data["_ts"] = time.time()
        self._history.append(data)
        # 清理过期数据
        cutoff = time.time() - self.window_size * 60
        self._history = [d for d in self._history if d["_ts"] > cutoff]

    def extract(self, current: Dict) -> FeatureSet:
        """
        从当前数据 + 历史窗口提取特征集

        Args:
            current: 当前截图数据 {
                app_name, window_title, ocr_text, ocr_keywords,
                mouse_clicks, key_strokes, idle_seconds, is_locked, screen_on
            }
        """
        app_name = current.get("app_name", "")
        window_title = current.get("window_title", "")
        ocr_keywords = current.get("ocr_keywords", [])
        title_keywords = self._extract_keywords(window_title)

        # 应用序列特征
        app_sequence = [d.get("app_name", "") for d in self._history[-20:]]
        switch_count = self._count_switches(app_sequence)
        current_app_duration = self._get_app_duration(app_name)
        dominant_app, dominant_ratio = self._get_dominant(app_sequence)

        category_sequence = [classify_app(a) for a in app_sequence]
        category_streak = self._get_category_streak(category_sequence)

        # 内容相似性
        prev_keywords = []
        if self._history:
            prev_data = self._history[-1]
            prev_keywords = self._extract_keywords(prev_data.get("window_title", "")) + \
                            prev_data.get("ocr_keywords", [])

        title_similarity = self._jaccard(title_keywords, prev_keywords)
        topic_consistency = self._topic_consistency(app_sequence, title_keywords)
        context_stability = self._context_stability()

        # 活跃度
        mouse = current.get("mouse_clicks", 0)
        keys = current.get("key_strokes", 0)
        idle = current.get("idle_seconds", 0)

        if mouse + keys > 100:
            activity_level = "high"
        elif mouse + keys > 30:
            activity_level = "medium"
        elif mouse + keys > 5:
            activity_level = "low"
        else:
            activity_level = "none"

        focus_intensity = min(1.0, (mouse * 0.4 + keys * 0.6) / 100) * topic_consistency

        features = FeatureSet({
            "current_app": app_name,
            "current_app_duration": current_app_duration,
            "app_sequence": app_sequence,
            "switch_count_10min": switch_count,
            "switch_frequency": switch_count / max(self.window_size, 1),
            "dominant_app": dominant_app,
            "dominant_app_ratio": dominant_ratio,
            "category_sequence": category_sequence,
            "category_streak": category_streak,

            "title_keywords": title_keywords,
            "ocr_keywords": ocr_keywords,
            "prev_keywords": prev_keywords,
            "title_similarity": title_similarity,
            "topic_consistency": topic_consistency,
            "context_stability": context_stability,

            "mouse_clicks": mouse,
            "key_strokes": keys,
            "idle_seconds": idle,
            "is_locked": current.get("is_locked", False),
            "screen_on": current.get("screen_on", True),
            "activity_level": activity_level,
            "focus_intensity": round(focus_intensity, 2),
            "timestamp": time.time(),
        })

        # 添加到历史
        self.add_data_point(current)

        return features

    def _extract_keywords(self, text: str) -> List[str]:
        """从文本中提取关键词（简化版）"""
        if not text:
            return []
        # 简单分词：按空格、标点分割，过滤太短的
        import re
        words = re.split(r'[\s\-_·|—–/\[\](){}「」【】《》<>.,;:!?，。；：！？、]+', text)
        return [w for w in words if len(w) >= 2][:10]

    def _count_switches(self, sequence: List[str]) -> int:
        """计算应用切换次数"""
        if len(sequence) < 2:
            return 0
        count = 0
        for i in range(1, len(sequence)):
            if sequence[i] != sequence[i-1] and sequence[i] and sequence[i-1]:
                count += 1
        return count

    def _get_app_duration(self, app_name: str) -> int:
        """估算当前应用持续时间（秒）— 使用实际时间戳计算"""
        if not self._history:
            return 0
        duration = 0
        now = time.time()
        # 从最近的记录往回看，找到连续使用同一应用的时间段
        for d in reversed(self._history):
            if d.get("app_name") == app_name:
                continue  # 还在同一个应用
            else:
                # 找到切换点，计算从那以后到现在的时间
                switch_ts = d.get("_ts", now)
                duration = int(now - switch_ts)
                break
        else:
            # 全部历史都是同一个应用
            oldest_ts = self._history[0].get("_ts", now)
            duration = int(now - oldest_ts)
        return max(duration, 0)

    def _get_dominant(self, sequence: List[str]) -> tuple:
        """获取主导应用和占比"""
        if not sequence:
            return ("", 0.0)
        from collections import Counter
        counts = Counter(a for a in sequence if a)
        if not counts:
            return ("", 0.0)
        app, count = counts.most_common(1)[0]
        return (app, count / len(sequence))

    def _get_category_streak(self, cat_sequence: List[str]) -> int:
        """当前分类持续时长（分钟）— 使用实际时间戳计算"""
        if not self._history or not cat_sequence:
            return 0
        current_cat = cat_sequence[-1]
        now = time.time()
        # 从最近的记录往回看，找到分类变化的切换点
        for i in range(len(self._history) - 1, -1, -1):
            idx_in_seq = i  # cat_sequence 与 _history 的索引对齐
            if idx_in_seq < len(cat_sequence) and cat_sequence[idx_in_seq] != current_cat:
                switch_ts = self._history[i].get("_ts", now)
                return max(0, int((now - switch_ts) / 60))
        # 全部历史都是同一分类
        oldest_ts = self._history[0].get("_ts", now)
        return max(0, int((now - oldest_ts) / 60))

    def _jaccard(self, a: List[str], b: List[str]) -> float:
        """Jaccard 相似度"""
        if not a or not b:
            return 0.0
        s1 = set(x.lower() for x in a)
        s2 = set(x.lower() for x in b)
        intersection = s1 & s2
        union = s1 | s2
        return len(intersection) / len(union) if union else 0.0

    def _topic_consistency(self, sequence: List[str], keywords: List[str]) -> float:
        """主题一致性"""
        if not sequence or not keywords:
            return 0.5
        # 简化：检查最近应用分类是否一致
        cats = [classify_app(a) for a in sequence[-5:]]
        from collections import Counter
        counts = Counter(c for c in cats if c and c != "unknown")
        if not counts:
            return 0.5
        top_cat, top_count = counts.most_common(1)[0]
        return top_count / len(cats)

    def _context_stability(self) -> float:
        """上下文稳定性"""
        if len(self._history) < 3:
            return 0.5
        recent = self._history[-5:]
        all_kw = [set(self._extract_keywords(d.get("window_title", ""))) for d in recent]
        if not all_kw or not all(any(kw for kw in all_kw)):
            return 0.5
        similarities = []
        for i in range(1, len(all_kw)):
            if all_kw[i] and all_kw[i-1]:
                inter = len(all_kw[i] & all_kw[i-1])
                union = len(all_kw[i] | all_kw[i-1])
                similarities.append(inter / union if union else 0)
        return sum(similarities) / len(similarities) if similarities else 0.5


# ============================================================
# L3 主引擎 — 双轨制
# ============================================================

class BehaviorCognitionEngine:
    """
    行为认知引擎主类

    工作流程：
    1. 接收截图数据 + 窗口事件
    2. L2 特征提取
    3. L3 规则引擎初判
    4. 高置信度直接输出，低置信度交 AI 复核
    5. L4 合并输出 CognitionResult
    """

    def __init__(
        self,
        ai_review_fn: Optional[Callable] = None,
        time_sense: Optional[TimeSenseSystem] = None,
        db=None,
    ):
        """
        Args:
            ai_review_fn: AI 复核函数 (features_dict, rule_result, time_context, user_model) → ai_result_dict
                          如果为 None，则纯规则模式
            time_sense: 时间感知系统实例
            db: 数据库实例（companion_db.Database），用于持久化结果和反馈
        """
        self.feature_extractor = FeatureExtractor()
        self.ai_review_fn = ai_review_fn
        self.time_sense = time_sense or TimeSenseSystem()
        self.db = db

        # 状态
        self._current_result: Optional[CognitionResult] = None
        self._result_history: List[Dict] = []
        self._low_confidence_streak = 0
        self._last_ai_call = 0
        self._ai_cache: Optional[Dict] = None
        self._ai_cache_time = 0

        # 用户模型（由外部设置，让 AI "懂这个人"）
        self._user_model: Optional[Dict] = None

        # 统计
        self._consecutive_work_start: Optional[float] = None  # 连续工作开始时间

    def set_user_model(self, user_model: Dict):
        """设置用户模型，让时间感知和 AI 都能"懂这个人" """
        self._user_model = user_model
        # 同步更新时间感知系统的个人节律
        self.time_sense.update_from_user_model(user_model)

    def analyze(self, screenshot_data: Dict) -> CognitionResult:
        """
        主入口：输入截图数据，输出认知结果。

        Args:
            screenshot_data: {
                app_name: str,
                window_title: str,
                ocr_text: str,
                ocr_keywords: list,
                mouse_clicks: int,
                key_strokes: int,
                idle_seconds: int,
                is_locked: bool,
                screen_on: bool,
            }

        Returns:
            CognitionResult
        """
        # ---- L2: 特征提取 ----
        features = self.feature_extractor.extract(screenshot_data)

        # ---- 时间上下文 ----
        now = datetime.now()
        consecutive_work_h = 0
        if self._consecutive_work_start:
            consecutive_work_h = (time.time() - self._consecutive_work_start) / 3600

        # 通过 TimeSenseSystem 统一获取时间上下文（包含生理节律）
        time_context = self.time_sense.get_time_context(
            now,
            consecutive_work_hours=consecutive_work_h,
        )

        # ---- L3-A: 规则引擎初判 ----
        rule_result = evaluate_all(features, time_context)

        # ---- 更新连续工作计时 ----
        if rule_result["primary_state"] in ("deep_work", "light_work"):
            if self._consecutive_work_start is None:
                self._consecutive_work_start = time.time()
        else:
            self._consecutive_work_start = None

        # ---- L3-B: AI 复核（低置信度时）----
        ai_result = None
        needs_ai = len(rule_result["needs_ai_review"]) > 0
        ai_threshold = THRESHOLDS["ai_review"]["confidence_threshold"]

        # 连续低置信度
        if rule_result["confidence"] < ai_threshold:
            self._low_confidence_streak += 1
        else:
            self._low_confidence_streak = 0

        # 触发 AI 的条件
        should_call_ai = (
            self.ai_review_fn is not None
            and needs_ai
            and self._can_call_ai()
        )

        if should_call_ai:
            try:
                ai_result = self.ai_review_fn(
                    self._features_to_dict(features),
                    rule_result,
                    time_context,
                    self._user_model,
                )
                self._last_ai_call = time.time()
                self._ai_cache = ai_result
                self._ai_cache_time = time.time()
            except Exception as e:
                print(f"[BehaviorEngine] AI 复核失败: {e}")
                ai_result = None

        # ---- L4: 合并输出 ----
        result = self._merge_results(rule_result, ai_result, time_context, features)

        # ---- 保存状态 ----
        self._current_result = result
        self._result_history.append(result.to_dict())
        # 限制历史长度
        if len(self._result_history) > 500:
            self._result_history = self._result_history[-500:]

        # ---- 持久化到数据库 ----
        if self.db:
            try:
                self.db.add_behavior_result(result.to_dict())
            except Exception as e:
                print(f"[BehaviorEngine] 结果持久化失败: {e}")

        return result

    def get_current_state(self) -> Optional[CognitionResult]:
        """获取当前状态"""
        return self._current_result

    def get_timeline(self, minutes: int = 60) -> List[Dict]:
        """获取最近 N 分钟的状态序列"""
        cutoff = time.time() - minutes * 60
        # 优先从内存获取
        mem_results = [r for r in self._result_history if r.get("timestamp", 0) > cutoff]
        # 如果内存不够，补充数据库数据
        if len(mem_results) < 3 and self.db:
            try:
                db_results = self.db.get_behavior_results(limit=100, since=cutoff)
                # 合并去重（按 timestamp）
                seen_ts = {r.get("timestamp") for r in mem_results}
                for r in db_results:
                    if r.get("timestamp") not in seen_ts:
                        mem_results.append(r)
                mem_results.sort(key=lambda x: x.get("timestamp", 0))
            except Exception:
                pass
        return mem_results

    def user_feedback(self, correct: bool, correction: str = ""):
        """用户反馈 — 用于学习和优化"""
        if not self._current_result:
            return
        feedback_entry = {
            "timestamp": self._current_result.timestamp,
            "result": self._current_result.to_dict(),
            "correct": correct,
            "correction": correction,
        }
        # 持久化到数据库
        if self.db:
            try:
                self.db.add_behavior_feedback(feedback_entry)
            except Exception as e:
                print(f"[BehaviorEngine] 反馈持久化失败: {e}")

    # ============================================================
    # 内部方法
    # ============================================================

    def _can_call_ai(self) -> bool:
        """检查是否可以调用 AI（节流）"""
        now = time.time()
        min_interval = 120  # 2 分钟
        if now - self._last_ai_call < min_interval:
            return False
        return True

    def _features_to_dict(self, f: FeatureSet) -> Dict:
        """将 FeatureSet 转为可序列化的 dict"""
        return {
            "current_app": f.current_app,
            "current_app_duration": f.current_app_duration,
            "current_category": f.current_category,
            "switch_count_10min": f.switch_count_10min,
            "activity_level": f.activity_level,
            "idle_seconds": f.idle_seconds,
            "is_locked": f.is_locked,
            "title_keywords": f.title_keywords,
            "ocr_keywords": f.ocr_keywords,
            "topic_consistency": f.topic_consistency,
            "context_stability": f.context_stability,
            "focus_intensity": f.focus_intensity,
            "category_sequence": f.category_sequence[-10:],
        }

    def _merge_results(
        self,
        rule: Dict,
        ai: Optional[Dict],
        time_context: Dict,
        features: FeatureSet,
    ) -> CognitionResult:
        """合并规则结果和 AI 结果 → 最终 CognitionResult"""

        all_evidence = []
        for key in ("work_continuity", "multi_task", "rest", "away"):
            ev = rule.get(key, {}).get("evidence", [])
            all_evidence.extend(ev)

        if ai is None:
            # 纯规则模式
            return CognitionResult({
                "primary_state": rule["primary_state"],
                "state_label": CATEGORY_LABELS.get(rule["primary_state"], "未知"),
                "confidence": rule["confidence"],
                "current_app": features.current_app,
                "work_continuity": rule.get("work_continuity", {}),
                "multi_task_level": rule.get("multi_task", {}).get("level", 1),
                "rest": rule.get("rest", {}),
                "away": rule.get("away", {}),
                "time_context": time_context,
                "ai_reasoning": None,
                "suggested_action": None,
                "suggested_action_reason": None,
                "source": "rules_only",
                "ai_overrode_rules": False,
                "timestamp": time.time(),
                "evidence": all_evidence,
            })

        # AI 有最终决定权
        ai_state = ai.get("primary_state", rule["primary_state"])
        ai_confidence = ai.get("confidence", rule["confidence"])

        # 检测 AI 是否推翻了规则
        ai_overrode = ai_state != rule["primary_state"]

        # 合并证据（防御性：AI 可能返回非列表类型）
        ai_evidence_raw = ai.get("workContinuity", {}).get("evidence", [])
        if isinstance(ai_evidence_raw, list):
            all_evidence.extend(ai_evidence_raw)
        elif isinstance(ai_evidence_raw, str):
            all_evidence.append(ai_evidence_raw)

        return CognitionResult({
            "primary_state": ai_state,
            "state_label": CATEGORY_LABELS.get(ai_state, ai.get("stateLabel", "未知")),
            "confidence": ai_confidence,
            "current_app": features.current_app,
            "work_continuity": {
                "is_continuous": ai.get("workContinuity", {}).get("isSameTask", rule.get("work_continuity", {}).get("is_continuous", False)),
                "confidence": ai.get("workContinuity", {}).get("confidence", rule.get("work_continuity", {}).get("score", 0.5)),
                "task_theme": ai.get("workContinuity", {}).get("taskTheme", ""),
                "evidence": ai.get("workContinuity", {}).get("evidence", []),
            },
            "multi_task_level": ai.get("multiTaskLevel", rule.get("multi_task", {}).get("level", 1)),
            "rest": {
                "is_resting": ai.get("restType") is not None,
                "type": ai.get("restType"),
                "depth": ai.get("restDepth"),
            },
            "away": {
                "is_away": ai.get("awayType") is not None,
                "duration": ai.get("awayType"),
            },
            "time_context": {
                **time_context,
                "biological_state": ai.get("timeContext", {}).get("biologicalState", ""),
                "social_rhythm": ai.get("timeContext", {}).get("socialRhythm", ""),
                "lifestyle_note": ai.get("timeContext", {}).get("lifestyleNote", time_context.get("lifestyle_note", "")),
            },
            "ai_reasoning": ai.get("reasoning"),
            "suggested_action": ai.get("suggestedAction"),
            "suggested_action_reason": ai.get("suggestedActionReason"),
            "source": "ai_with_rules",
            "ai_overrode_rules": ai_overrode,
            "timestamp": time.time(),
            "evidence": all_evidence,
        })


# ============================================================
# 单例管理
# ============================================================

_engine_instance: Optional[BehaviorCognitionEngine] = None

def get_behavior_engine(ai_review_fn: Optional[Callable] = None, db=None) -> BehaviorCognitionEngine:
    """获取行为认知引擎单例"""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = BehaviorCognitionEngine(ai_review_fn=ai_review_fn, db=db)
    elif ai_review_fn and not _engine_instance.ai_review_fn:
        _engine_instance.ai_review_fn = ai_review_fn
    if db and not _engine_instance.db:
        _engine_instance.db = db
    return _engine_instance
