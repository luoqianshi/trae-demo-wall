"""核心数据结构与段位定义。

数据流：Task（题目）→ Attempt（一次修复尝试）→ EvalResult（判分结果）→ ModelScorecard（模型战力卡）。
渲染层只消费 EvalResult / ModelScorecard，与评测逻辑解耦。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional


class Rank(str, Enum):
    """段位定义：武侠三档，难度递增（初出茅庐 < 名震江湖 < 一代宗师）。

    内部值沿用题库目录前缀（gold/diamond/king），仅展示标签改为武侠风。
    """

    GOLD = "gold"
    DIAMOND = "diamond"
    KING = "king"

    @property
    def icon(self) -> str:
        """段位对应的 emoji 标识。"""
        return _RANK_ICONS[self]

    @property
    def label(self) -> str:
        """段位中文名。"""
        return _RANK_LABELS[self]

    @property
    def order(self) -> int:
        """段位序号（用于从低到高排序与连续点亮判定）。"""
        return _RANK_ORDER.index(self)

    @property
    def weight(self) -> int:
        """难度档加权分：金刚境=1 指玄境=2 天象境=3。"""
        return _RANK_WEIGHTS[self]

    @property
    def difficulty_label(self) -> str:
        """题目难度档展示词（与选手段位称号解耦）。"""
        return _RANK_DIFFICULTY_LABELS[self]

    @classmethod
    def ascending(cls) -> list["Rank"]:
        """从低到高返回所有段位。"""
        return list(_RANK_ORDER)


# 段位的固定顺序（从低到高），集中维护避免散落各处
_RANK_ORDER: list[Rank] = [Rank.GOLD, Rank.DIAMOND, Rank.KING]
_RANK_ICONS = {
    Rank.GOLD: "🗡️",
    Rank.DIAMOND: "⚔️",
    Rank.KING: "🏆",
}
_RANK_LABELS = {
    Rank.GOLD: "初出茅庐",
    Rank.DIAMOND: "名震江湖",
    Rank.KING: "一代宗师",
}
_RANK_WEIGHTS = {
    Rank.GOLD: 1,
    Rank.DIAMOND: 2,
    Rank.KING: 3,
}
# 题目难度档展示词（《雪中悍刀行》境界），与选手段位称号体系区分
_RANK_DIFFICULTY_LABELS = {
    Rank.GOLD: "金刚境",
    Rank.DIAMOND: "指玄境",
    Rank.KING: "天象境",
}


class EvalMode(str, Enum):
    """评测模式。"""

    ONE_SHOT = "one_shot"
    AGENTIC = "agentic"


@dataclass
class Task:
    """一道题目（题库中的纯数据，加载后的内存表示）。"""

    id: str
    rank: Rank
    language: str
    title: str
    tags: list[str]
    entry_file: str           # 模型要修的文件（相对题目目录）
    test_command: str         # 由语言执行器决定的测试命令
    prompt: str               # 给模型看的题面
    buggy_code: str           # entry_file 指向的 buggy 源码内容
    directory: Path           # 题目目录的绝对路径
    support_files: dict = field(default_factory=dict)  # 只读支撑文件：相对路径 -> 内容（跨文件题用）
    calibration: dict = field(default_factory=dict)


@dataclass
class TestPhaseResult:
    """单类测试（functional/regression/edge）的执行结果。"""

    name: str                 # functional / regression / edge
    passed: bool
    output: str = ""          # 测试输出（失败时喂回模型）


@dataclass
class Attempt:
    """模型对某题的一次修复尝试。"""

    fixed_code: str           # 模型产出的完整代码
    elapsed: float            # 本次 API 调用真实响应时长（秒）
    raw_response: str = ""    # 模型原始回复（调试用）


@dataclass
class EvalResult:
    """一道题评测完成后的多维判分结果。"""

    task_id: str
    rank: Rank
    model_name: str
    mode: EvalMode
    functional_pass: bool     # 功能正确性（硬指标）
    regression_pass: bool     # 回归安全性（硬指标）
    edge_pass: bool           # 边界正确性（硬指标）
    elapsed: float            # 耗时（软指标，秒）
    rounds: int               # 迭代轮次（One-shot 恒为 1）
    diff_lines: int           # 改动精准度：diff 行数（越小越精准）
    speed_pass: bool = False  # 神行：整题修对且耗时≤本题全场修对者中位数（整轮后回填，计入品级积分）
    error: Optional[str] = None  # 执行/调用异常信息
    prompt: str = ""              # 给模型看的题面（Console 展示）
    raw_response: str = ""        # 模型原始回复（Console 展示）
    fixed_code: str = ""          # 模型产出的完整代码（Console 展示）
    phase_outputs: dict = field(default_factory=dict)  # 阶段名 -> pytest 输出

    @property
    def passed(self) -> bool:
        """最终判定：三类测试全过才算 pass。"""
        return self.functional_pass and self.regression_pass and self.edge_pass


@dataclass
class ModelScorecard:
    """一个模型跑完一整轮后的战力卡数据（供渲染层消费）。"""

    model_name: str
    results: list[EvalResult] = field(default_factory=list)

    @property
    def total(self) -> int:
        return len(self.results)

    @property
    def passed_count(self) -> int:
        return sum(1 for r in self.results if r.passed)

    @property
    def speed_count(self) -> int:
        """神行点亮数：整轮回填后，修对且耗时≤本题中位数的题数。"""
        return sum(1 for r in self.results if r.speed_pass)

    @property
    def pass_rate(self) -> float:
        return self.passed_count / self.total if self.total else 0.0

    @property
    def avg_elapsed(self) -> float:
        if not self.results:
            return 0.0
        return sum(r.elapsed for r in self.results) / len(self.results)

    def rank_lit(self, rank: Rank) -> bool:
        """点灯规则：某段位的题全部 pass 才点亮（无该段位题目视为未点亮）。"""
        rank_results = [r for r in self.results if r.rank == rank]
        if not rank_results:
            return False
        return all(r.passed for r in rank_results)

    @property
    def highest_rank(self) -> Optional[Rank]:
        """模型定级：最高连续点亮的段位。"""
        highest: Optional[Rank] = None
        for rank in Rank.ascending():
            if self.rank_lit(rank):
                highest = rank
            else:
                break  # 连续点亮中断即停止
        return highest

    @property
    def weighted_score(self) -> int:
        """加权积分：每题 4 个考察点（功能/回归/边界/神行）各自通过得「难度权重」分。

        满分 = 4 类 × (GOLD1+DIAMOND2+KING3) = 24。
        """
        total = 0
        for r in self.results:
            w = r.rank.weight
            for ok in (r.functional_pass, r.regression_pass, r.edge_pass, r.speed_pass):
                if ok:
                    total += w
        return total

    @property
    def tier(self) -> str:
        """选手段位称号：由加权积分综合评定。"""
        return score_to_tier(self.weighted_score)


# 选手段位称号（《雪中悍刀行》天下九品），由加权积分综合评定，与题目难度档解耦。
# 加权积分区间 0~24（每题 4 个考察点：功能/回归/边界/神行，各 × 难度权重 1/2/3）。
# (下界, 上界, 称号)：闭区间，从高到低排列。
_TIER_BANDS = [
    (22, 24, "一品"),
    (20, 21, "二品"),
    (17, 19, "三品"),
    (14, 16, "四品"),
    (11, 13, "五品"),
    (8, 10, "六品"),
    (5, 7, "七品"),
    (3, 4, "八品"),
    (1, 2, "九品"),
    (0, 0, "不入流"),
]

_TIER_MAX_SCORE = 24


def score_to_tier(score: int) -> str:
    """加权积分 -> 段位称号；超出 0~24 时向最近边界截断。"""
    clamped = max(0, min(_TIER_MAX_SCORE, score))
    for low, high, name in _TIER_BANDS:
        if low <= clamped <= high:
            return name
    return "不入流"  # 理论不可达（_TIER_BANDS 已全覆盖 0~24）
