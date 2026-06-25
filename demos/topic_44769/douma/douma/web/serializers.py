"""把引擎数据结构序列化为前端 JSON，并集中排行榜/区分度派生计算。

派生规则与 douma/report.py 保持一致：
- 排行榜排序：加权积分(降) -> 通过率(降) -> 平均耗时(升)。
- 区分度标签：=100% 太简单 / =0% 太难 / 30%~70% 黄金 / 其余一般。
"""
from __future__ import annotations

from collections import defaultdict

from ..commentary import make_comment
from ..config import AppConfig
from ..models import EvalResult, ModelScorecard, Rank, Task


# 三类考察维度的展示名（与前端比试格三盏灯一致：克敌/守成/应变）
_PHASE_LABEL = {
    "functional": "克敌·功能正确",
    "regression": "守成·回归安全",
    "edge": "应变·边界处理",
}


def _extract_test_error(output: str) -> str:
    """从一段 pytest / 编译器原始输出里提炼最能说明问题的一行。

    优先级：编译/超时等固定前缀 > pytest 的 E 错误行 > assert 行 > FAILED 行 > 末行。
    """
    text = (output or "").strip()
    if not text:
        return ""
    # 执行器对编译/超时类失败已给出固定中文前缀，直接取首行即可
    for prefix in ("编译失败", "编译超时", "运行超时", "测试执行超时"):
        if text.startswith(prefix):
            return text.splitlines()[0].strip()
    lines = text.splitlines()
    # pytest 详细断言/异常行以 "E   " 起头，首条通常即根因（后续 E 行多为补充说明）
    e_lines = [ln.strip().lstrip("E").strip() for ln in lines if ln.lstrip().startswith("E ")]
    if e_lines:
        return e_lines[0]
    assert_lines = [ln.strip() for ln in lines if ln.strip().startswith("assert")]
    if assert_lines:
        return assert_lines[-1]
    failed_lines = [ln.strip() for ln in lines if "FAILED" in ln or "Error" in ln]
    if failed_lines:
        return failed_lines[-1]
    return lines[-1].strip()


def summarize_failure(r: EvalResult) -> str:
    """把一道落败题归纳为一句话原因（通过题返回空串）。

    口径：调用异常优先；否则按 功能->回归->边界 找首个失败关，标注是哪一关 +
    从该关原始输出提炼的关键报错。
    """
    if r.passed:
        return ""
    if r.error:
        return f"调用失败：{r.error[:100]}"
    for name, ok in (("functional", r.functional_pass),
                     ("regression", r.regression_pass),
                     ("edge", r.edge_pass)):
        if not ok:
            detail = _extract_test_error(r.phase_outputs.get(name, ""))
            label = _PHASE_LABEL[name]
            return f"{label}未过" + (f"：{detail[:120]}" if detail else "")
    return "未通过"


def serialize_result(model_name: str, r: EvalResult) -> dict:
    """单题评测结果 -> 前端 progress 负载。"""
    return {
        "task_id": r.task_id,
        "rank": r.rank.value,
        "icon": r.rank.icon,
        "label": r.rank.label,
        "difficulty_label": r.rank.difficulty_label,
        "model_name": model_name,
        "passed": r.passed,
        "functional_pass": r.functional_pass,
        "regression_pass": r.regression_pass,
        "edge_pass": r.edge_pass,
        "speed_pass": r.speed_pass,
        "elapsed": round(r.elapsed, 2),
        "rounds": r.rounds,
        "error": r.error,
        "fail_reason": summarize_failure(r),  # 落败一句话原因（通过题为空串）
    }


def serialize_detail(model_name: str, r: EvalResult) -> dict:
    """单题做题明细 -> Console JSON（题面/原始回复/生成代码/测试输出）。"""
    return {
        "model_name": model_name,
        "task_id": r.task_id,
        "rank": r.rank.value,
        "difficulty_label": r.rank.difficulty_label,
        "passed": r.passed,
        "functional_pass": r.functional_pass,
        "regression_pass": r.regression_pass,
        "edge_pass": r.edge_pass,
        "speed_pass": r.speed_pass,
        "elapsed": round(r.elapsed, 2),
        "error": r.error,
        "fail_reason": summarize_failure(r),  # 落败一句话原因（通过题为空串）
        "prompt": r.prompt,
        "raw_response": r.raw_response,
        "fixed_code": r.fixed_code,
        "phase_outputs": r.phase_outputs,
    }


def _lamps(card: ModelScorecard) -> list[dict]:
    """段位点亮明细（从低到高）。"""
    return [
        {"rank": rank.value, "icon": rank.icon, "label": rank.label, "lit": card.rank_lit(rank)}
        for rank in Rank.ascending()
    ]


def serialize_scorecard(card: ModelScorecard) -> dict:
    """模型战力卡 -> 前端 JSON。"""
    hr = card.highest_rank
    return {
        "model_name": card.model_name,
        "total": card.total,
        "passed_count": card.passed_count,
        "speed_count": card.speed_count,
        "pass_rate": card.pass_rate,
        "avg_elapsed": round(card.avg_elapsed, 2),
        "highest_rank": hr.value if hr else None,
        "highest_rank_label": hr.label if hr else None,
        "highest_rank_icon": hr.icon if hr else None,
        "lamps": _lamps(card),
        "weighted_score": card.weighted_score,
        "tier": card.tier,
        "comment": make_comment(card),
    }


def build_leaderboard(cards: list[ModelScorecard]) -> list[dict]:
    """排行榜：按加权积分降序排序，其次通过率(降)、平均耗时(升)。

    段位称号由加权积分综合评定（与连续点亮解耦）。注意此排序与 CLI 报告
    report.render_leaderboard 当前仍按 highest_rank 序号排序的行为不同。
    """
    def sort_key(c: ModelScorecard):
        return (-c.weighted_score, -c.pass_rate, c.avg_elapsed)

    ranked = sorted(cards, key=sort_key)
    rows = []
    for i, card in enumerate(ranked, 1):
        hr = card.highest_rank
        rows.append({
            "place": i,
            "model_name": card.model_name,
            "rank_str": f"{hr.icon}{hr.label}" if hr else "—",
            "lamps": "".join(r.icon if card.rank_lit(r) else "·" for r in Rank.ascending()),
            "passed_count": card.passed_count,
            "total": card.total,
            "avg_elapsed": round(card.avg_elapsed, 2),
            "tier": card.tier,
            "weighted_score": card.weighted_score,
        })
    return rows


def _discrimination_tag(rate: float) -> str:
    """区分度标签：复刻 report._discrimination_tag（去除富文本标记）。"""
    if rate >= 0.999:
        return "太简单（建议降级/淘汰）"
    if rate <= 0.001:
        return "太难/可能有问题（建议复查）"
    if 0.3 <= rate <= 0.7:
        return "★ 黄金区分度（重点保留）"
    return "一般"


def build_discrimination(cards: list[ModelScorecard]) -> list[dict]:
    """逐题通过率与区分度标签，按段位+题目排序。"""
    per_task: dict[str, list[EvalResult]] = defaultdict(list)
    for card in cards:
        for r in card.results:
            per_task[r.task_id].append(r)

    ordered = sorted(per_task.items(), key=lambda kv: (kv[1][0].rank.order, kv[0]))
    rows = []
    for task_id, results in ordered:
        rank = results[0].rank
        passed = sum(1 for r in results if r.passed)
        total = len(results)
        rate = passed / total if total else 0.0
        rows.append({
            "task_id": task_id,
            "rank": rank.value,
            "icon": rank.icon,
            "label": rank.label,
            "difficulty_label": rank.difficulty_label,
            "passed": passed,
            "total": total,
            "rate": rate,
            "tag": _discrimination_tag(rate),
        })
    return rows


def build_summary(cards: list[ModelScorecard]) -> dict:
    """done 事件负载：四块结果一次性给齐。"""
    return {
        "scorecards": [serialize_scorecard(c) for c in cards],
        "leaderboard": build_leaderboard(cards),
        "discrimination": build_discrimination(cards),
    }


def serialize_tasks_grouped(tasks: list[Task]) -> dict:
    """题目按段位分组（从低到高）。"""
    by_rank: dict[Rank, list[Task]] = defaultdict(list)
    for t in tasks:
        by_rank[t.rank].append(t)
    groups = []
    for rank in Rank.ascending():
        items = by_rank.get(rank, [])
        if not items:
            continue
        groups.append({
            "rank": rank.value,
            "icon": rank.icon,
            "label": rank.label,
            "difficulty_label": rank.difficulty_label,
            "tasks": [
                {"id": t.id, "title": t.title, "language": t.language}
                for t in sorted(items, key=lambda x: x.id)
            ],
        })
    return {"ranks": groups}


def serialize_config(file_name: str, cfg: AppConfig) -> dict:
    """单个配置文件 -> 前端 JSON（绝不含 api_key）。

    mock 适配器仅用于 pytest 自测闭环，不在界面展示；选手一律用真实模型。
    """
    import os

    return {
        "file": file_name,
        "max_concurrency": cfg.max_concurrency,
        "agentic_max_rounds": cfg.agentic_max_rounds,
        "models": [
            {
                "name": m.name,
                "model": m.model,
                "adapter": m.adapter,
                "api_key_ready": bool(os.environ.get(m.api_key_env, "")),
            }
            for m in cfg.models
            if m.adapter != "mock"
        ],
    }


def serialize_player(player, store) -> dict:
    """单个选手 -> 前端 JSON（绝不含 api_key，仅给就绪布尔）。

    key_source 标记 key 来源：env=出厂环境变量 / set=界面已设置 / none=未配置。
    mock 适配器无需 API key，直接视为就绪。
    """
    if player.adapter == "mock":
        key_source = "mock"
        key_ready = True
    elif player.api_key_enc:
        key_source = "set"
        key_ready = True
    elif player.api_key_env:
        key_source = "env"
        import os as _os
        key_ready = bool(_os.environ.get(player.api_key_env, ""))
    else:
        key_source = "none"
        key_ready = False
    return {
        "name": player.name,
        "model": player.model,
        "adapter": player.adapter,
        "base_url": player.base_url,
        "api_key_ready": key_ready,
        "key_source": key_source,
        "editable": not bool(player.api_key_env) and player.adapter != "mock",  # 出厂 env / mock 选手不可改
    }
