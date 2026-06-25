"""评测引擎：编排双模式评测、拼 prompt、调模型、驱动判分。

公平性：每次评测记录的是该模型那次 API 调用的真实响应时长，与并发无关。
"""
from __future__ import annotations

import difflib
from typing import Callable, Optional

from .adapters import ModelAdapter
from .executor import LanguageExecutor
from .models import Attempt, EvalMode, EvalResult, Task, TestPhaseResult

# 做题过程的 token 回调：(round, delta) -> None；round 区分 agentic 多轮（one_shot 恒 1）
TokenSink = Optional[Callable[[int, str], None]]

# 系统提示词：约束模型只修 bug、返回完整文件
SYSTEM_PROMPT = (
    "你是一名资深工程师，专注修复代码中的 bug。"
    "用户会给你一段有 bug 的源码和问题描述。"
    "请只修复 bug，保持其余逻辑不变，并返回**完整的修复后文件**，用 ```python 代码块包裹。"
    "不要解释，不要添加无关代码。"
)


def _build_context_block(task: Task) -> str:
    """拼接只读上下文文件（跨文件题的其它模块），帮助模型全局理解。"""
    if not task.support_files:
        return ""
    blocks = [
        f"## 只读文件：{rel}（不可修改，仅供理解）\n```python\n{content}\n```"
        for rel, content in task.support_files.items()
    ]
    return "# 相关上下文文件（只读）\n" + "\n\n".join(blocks) + "\n\n"


def _build_user_prompt(task: Task) -> str:
    """拼接题面 + 只读上下文 + buggy 源码（模型看不到 tests / reference）。"""
    entry_name = task.entry_file.split("/")[-1]
    return (
        f"# 问题描述\n{task.prompt}\n\n"
        f"{_build_context_block(task)}"
        f"# 待修复文件：{entry_name}\n"
        f"```python\n{task.buggy_code}\n```\n"
    )


def _build_retry_prompt(task: Task, last_code: str, phases: list[TestPhaseResult]) -> str:
    """Agentic 重试 prompt：把失败测试报错喂回模型。"""
    fails = [p for p in phases if not p.passed]
    err_blocks = "\n\n".join(f"## {p.name} 测试失败\n```\n{p.output[:2000]}\n```" for p in fails)
    return (
        f"你上次的修复仍未通过测试。\n\n"
        f"# 你上次提交的代码\n```python\n{last_code}\n```\n\n"
        f"# 测试报错\n{err_blocks}\n\n"
        f"请根据报错重新修复，返回**完整的修复后文件**，用 ```python 代码块包裹。"
    )


def _count_diff_lines(original: str, fixed: str) -> int:
    """统计修复 diff 的改动行数（增删行，越小越精准）。"""
    diff = difflib.unified_diff(
        original.splitlines(), fixed.splitlines(), lineterm=""
    )
    return sum(1 for line in diff if line.startswith(("+", "-")) and not line.startswith(("+++", "---")))


def _make_result(
    task: Task,
    model_name: str,
    mode: EvalMode,
    phases: list[TestPhaseResult],
    elapsed: float,
    rounds: int,
    diff_lines: int,
    error: str | None = None,
    raw_response: str = "",
    fixed_code: str = "",
) -> EvalResult:
    """根据三类测试结果组装 EvalResult。

    神行（speed_pass）不在此即时判定：它需要全场同题的耗时分布做相对比较，
    由 runner 在整轮跑完后统一回填。
    """
    by_name = {p.name: p.passed for p in phases}
    functional = by_name.get("functional", False)
    regression = by_name.get("regression", False)
    edge = by_name.get("edge", False)
    return EvalResult(
        task_id=task.id,
        rank=task.rank,
        model_name=model_name,
        mode=mode,
        functional_pass=functional,
        regression_pass=regression,
        edge_pass=edge,
        elapsed=elapsed,
        rounds=rounds,
        diff_lines=diff_lines,
        error=error,
        prompt=task.prompt,
        raw_response=raw_response,
        fixed_code=fixed_code,
        phase_outputs={p.name: p.output for p in phases},
    )


def evaluate_one_shot(
    task: Task, model_name: str, adapter: ModelAdapter, executor: LanguageExecutor,
    token_sink: TokenSink = None,
) -> EvalResult:
    """One-shot 模式：一次调用、一次判分，迭代轮次恒为 1。"""
    user = _build_user_prompt(task)
    on_token = (lambda delta: token_sink(1, delta)) if token_sink else None
    try:
        attempt: Attempt = adapter.complete(SYSTEM_PROMPT, user, task, on_token)
    except Exception as exc:  # 调用失败按未通过处理，但保留错误信息
        return _make_result(task, model_name, EvalMode.ONE_SHOT, [], 0.0, 1, 0, str(exc))

    phases = executor.run(task, attempt.fixed_code)
    diff = _count_diff_lines(task.buggy_code, attempt.fixed_code)
    return _make_result(
        task, model_name, EvalMode.ONE_SHOT, phases, attempt.elapsed, 1, diff,
        raw_response=attempt.raw_response, fixed_code=attempt.fixed_code,
    )


def evaluate_agentic(
    task: Task,
    model_name: str,
    adapter: ModelAdapter,
    executor: LanguageExecutor,
    max_rounds: int,
    token_sink: TokenSink = None,
) -> EvalResult:
    """Agentic 模式：失败则把报错喂回模型迭代，直到全过或达最大轮次。"""
    user = _build_user_prompt(task)
    total_elapsed = 0.0
    last_code = task.buggy_code
    phases: list[TestPhaseResult] = []

    for round_no in range(1, max_rounds + 1):
        prompt = user if round_no == 1 else _build_retry_prompt(task, last_code, phases)
        on_token = (lambda delta, rn=round_no: token_sink(rn, delta)) if token_sink else None
        try:
            attempt = adapter.complete(SYSTEM_PROMPT, prompt, task, on_token)
        except Exception as exc:
            return _make_result(
                task, model_name, EvalMode.AGENTIC, phases, total_elapsed, round_no, 0, str(exc)
            )

        total_elapsed += attempt.elapsed
        last_code = attempt.fixed_code
        phases = executor.run(task, last_code)

        if all(p.passed for p in phases):
            diff = _count_diff_lines(task.buggy_code, last_code)
            return _make_result(
                task, model_name, EvalMode.AGENTIC, phases, total_elapsed, round_no, diff,
                raw_response=attempt.raw_response, fixed_code=last_code,
            )

    # 达到最大轮次仍未全过
    diff = _count_diff_lines(task.buggy_code, last_code)
    return _make_result(
        task, model_name, EvalMode.AGENTIC, phases, total_elapsed, max_rounds, diff,
        raw_response=attempt.raw_response, fixed_code=last_code,
    )


def evaluate(
    task: Task,
    model_name: str,
    adapter: ModelAdapter,
    executor: LanguageExecutor,
    mode: EvalMode,
    max_rounds: int = 5,
    token_sink: TokenSink = None,
) -> EvalResult:
    """按模式分派评测。"""
    if mode == EvalMode.ONE_SHOT:
        return evaluate_one_shot(task, model_name, adapter, executor, token_sink)
    return evaluate_agentic(task, model_name, adapter, executor, max_rounds, token_sink)
