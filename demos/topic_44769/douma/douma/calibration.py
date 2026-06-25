"""难度校准：按实测通过率回填 meta.yaml 的 calibration 字段（数据驱动）。

题库越用越准：分级靠实测，而非主观拍板。

回填策略（A+B 结合，防止小样本污染已校准的准确值）：
- 下限闸（方案 A）：单次样本数 < MIN_RUNS_TO_RECORD 直接忽略，不写回。
- 加权合并（方案 B）：与 meta.yaml 历史值按各自样本数加权平均累加，
  样本越多权重越大，小样本被自然稀释，不会让通过率剧烈跳变。
"""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path

import yaml

from .models import ModelScorecard

# 单次回填的最小样本数：低于此值视为噪声样本，直接忽略不写回。
MIN_RUNS_TO_RECORD = 2


def calibrate(tasks_dir_by_id: dict[str, Path], cards: list[ModelScorecard]) -> dict[str, float]:
    """聚合各题通过率并加权合并回填到对应 meta.yaml。

    Args:
        tasks_dir_by_id: 题目 id -> 题目目录路径。
        cards: 各模型战力卡。
    Returns:
        题目 id -> 本次实测通过率 的映射（供日志/展示，非合并后的累积值）。
    """
    # 聚合：题目 id -> (通过数, 总次数)
    agg: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for card in cards:
        for r in card.results:
            agg[r.task_id][0] += 1 if r.passed else 0
            agg[r.task_id][1] += 1

    rates: dict[str, float] = {}
    for task_id, (passed, total) in agg.items():
        rate = passed / total if total else 0.0
        rates[task_id] = rate

        task_dir = tasks_dir_by_id.get(task_id)
        if task_dir is None:
            continue
        _write_back(task_dir / "meta.yaml", runs=total, pass_rate=rate)

    return rates


def _write_back(meta_path: Path, runs: int, pass_rate: float) -> None:
    """把本次校准数据与历史加权合并后写回 meta.yaml 的 calibration 字段。

    runs/pass_rate 为本次实测的样本数与通过率；与历史值按样本数加权累加。
    """
    if not meta_path.exists():
        return
    # 下限闸：本次样本太小视为噪声，直接跳过，保住历史已校准值。
    if runs < MIN_RUNS_TO_RECORD:
        return

    meta = yaml.safe_load(meta_path.read_text(encoding="utf-8")) or {}
    merged_runs, merged_rate = _merge_with_history(
        meta.get("calibration"), runs, pass_rate
    )
    meta["calibration"] = {"runs": merged_runs, "pass_rate": round(merged_rate, 4)}
    meta_path.write_text(
        yaml.safe_dump(meta, allow_unicode=True, sort_keys=False), encoding="utf-8"
    )


def _merge_with_history(
    history: object, new_runs: int, new_rate: float
) -> tuple[int, float]:
    """将本次样本与历史 calibration 按样本数加权合并，返回 (累积样本数, 累积通过率)。

    历史缺失或格式非法时退化为仅用本次数据。
    """
    if not isinstance(history, dict):
        return new_runs, new_rate
    hist_runs = history.get("runs")
    hist_rate = history.get("pass_rate")
    if not isinstance(hist_runs, int) or hist_runs <= 0:
        return new_runs, new_rate
    if not isinstance(hist_rate, (int, float)):
        return new_runs, new_rate

    total_runs = hist_runs + new_runs
    weighted_rate = (hist_rate * hist_runs + new_rate * new_runs) / total_runs
    return total_runs, weighted_rate
