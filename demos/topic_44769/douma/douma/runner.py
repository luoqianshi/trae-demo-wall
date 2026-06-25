"""并发竞技编排：多模型同场并发跑完整题库。

并发只用于加速总流程，不参与任何指标计算（耗时各自独立计量）。
"""
from __future__ import annotations

import statistics
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Optional

from .adapters import get_adapter
from .config import AppConfig
from .engine import evaluate
from .executor import get_executor
from .models import EvalMode, EvalResult, ModelScorecard, Task

# 进度回调：(model_name, result) -> None，用于实时观赛
ProgressCallback = Optional[Callable[[str, EvalResult], None]]

# token 回调：(model_name, task_id, round, delta) -> None，用于实时观赛逐字流式
TokenCallback = Optional[Callable[[str, str, int, str], None]]


def _make_token_sink(on_token: TokenCallback, model_name: str, task_id: str):
    """为单个 (模型×题) job 绑定标识，返回 engine 所需的 (round, delta) 形式 sink。"""
    if on_token is None:
        return None
    return lambda rnd, delta: on_token(model_name, task_id, rnd, delta)


def backfill_speed_pass(cards: list[ModelScorecard]) -> None:
    """整轮跑完后按题回填神行：每题在「全场修对者」中，耗时≤中位数者点亮。

    神行用相对中位数判定（而非绝对秒数），天然约 50% 区分度，且对不同模型/题目的
    绝对耗时差异鲁棒。未修对者一律不点亮（先修对再论快）。
    """
    # 收集每题所有修对者的耗时
    correct_times: dict[str, list[float]] = defaultdict(list)
    for card in cards:
        for r in card.results:
            if r.passed:
                correct_times[r.task_id].append(r.elapsed)
    # 每题修对者耗时中位数
    median_by_task = {tid: statistics.median(ts) for tid, ts in correct_times.items()}
    # 回填：修对且耗时≤本题中位数则点亮神行
    for card in cards:
        for r in card.results:
            r.speed_pass = bool(r.passed and r.elapsed <= median_by_task[r.task_id])


def run_tournament(
    tasks: list[Task],
    config: AppConfig,
    mode: EvalMode,
    on_progress: ProgressCallback = None,
    on_token: TokenCallback = None,
) -> list[ModelScorecard]:
    """让所有模型并发跑完整题库，返回各模型战力卡。

    并发粒度为 (模型 × 题目)，统一受 max_concurrency 限流。
    """
    scorecards = {m.name: ModelScorecard(model_name=m.name) for m in config.models}

    # 预创建每个模型的适配器（一次创建复用）
    adapters = {m.name: get_adapter(m) for m in config.models}

    # 组装所有 (模型配置, 题目) 评测单元
    jobs = [(m, task) for m in config.models for task in tasks]

    with ThreadPoolExecutor(max_workers=config.max_concurrency) as pool:
        future_map = {
            pool.submit(
                evaluate,
                task,
                m.name,
                adapters[m.name],
                get_executor(task.language),
                mode,
                config.agentic_max_rounds,
                _make_token_sink(on_token, m.name, task.id),
            ): m.name
            for m, task in jobs
        }

        for future in as_completed(future_map):
            model_name = future_map[future]
            result = future.result()
            scorecards[model_name].results.append(result)
            if on_progress:
                on_progress(model_name, result)

    # 神行：整轮跑完后按题中位数统一回填（需全场耗时分布，无法在单题即时判定）
    backfill_speed_pass(list(scorecards.values()))

    # 保持各模型结果按段位/题目稳定排序，便于展示
    for card in scorecards.values():
        card.results.sort(key=lambda r: (r.rank.order, r.task_id))

    return list(scorecards.values())
