"""结果渲染：rich 战力卡片、排行榜、题目区分度（数据/渲染分离）。

渲染层只消费 ModelScorecard / EvalResult，与评测逻辑解耦。
"""
from __future__ import annotations

from collections import defaultdict

from rich.console import Console, Group
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from .commentary import make_comment
from .models import EvalResult, ModelScorecard, Rank

console = Console()


def _rank_lamp_bar(card: ModelScorecard) -> Text:
    """段位点亮条：全过点亮 ✅，否则 ⬜。"""
    text = Text()
    for rank in Rank.ascending():
        lit = card.rank_lit(rank)
        mark = "✅" if lit else "⬜"
        style = "bold green" if lit else "dim"
        text.append(f"{rank.icon}{mark}  ", style=style)
    return text


def _progress_bar(rate: float, width: int = 10) -> str:
    """文本进度条。"""
    filled = round(rate * width)
    return "█" * filled + "░" * (width - filled) + f" {rate*100:.0f}%"


def render_scorecard(card: ModelScorecard) -> Panel:
    """渲染单个模型的战力卡片。"""
    highest = card.highest_rank
    highest_str = f"{highest.icon} {highest.label}" if highest else "无（未定级）"

    body = Group(
        _rank_lamp_bar(card),
        Text(""),
        Text(f"最高段位：{highest_str}", style="bold yellow"),
        Text(f"总通过：{card.passed_count}/{card.total}    平均耗时：{card.avg_elapsed:.1f}s"),
        Text(f"神行点亮：{sum(1 for r in card.results if r.speed_pass)}/{card.total}"),
        Text(_progress_bar(card.pass_rate), style="cyan"),
        Text(""),
        Text(f'"{make_comment(card)}"', style="italic magenta"),
    )
    return Panel(body, title=f"🤖 {card.model_name}", border_style="blue", width=50)


def render_scorecards(cards: list[ModelScorecard]) -> None:
    """打印所有模型战力卡片。"""
    console.print()
    for card in cards:
        console.print(render_scorecard(card))


def render_leaderboard(cards: list[ModelScorecard]) -> None:
    """渲染排行榜：横向对比段位、通过率、平均耗时。"""
    table = Table(title="🏆 排行榜", show_lines=True)
    table.add_column("排名", justify="center")
    table.add_column("模型", style="bold")
    table.add_column("最高段位", justify="center")
    table.add_column("段位点亮", justify="center")
    table.add_column("通过率", justify="right")
    table.add_column("平均耗时", justify="right")

    # 排序：先按最高段位序号，再按通过率，再按耗时（升序）
    def sort_key(c: ModelScorecard):
        hr = c.highest_rank
        return (-(hr.order if hr else -1), -c.pass_rate, c.avg_elapsed)

    ranked = sorted(cards, key=sort_key)
    for i, card in enumerate(ranked, 1):
        hr = card.highest_rank
        hr_str = f"{hr.icon}{hr.label}" if hr else "—"
        lamps = "".join(
            rank.icon if card.rank_lit(rank) else "·" for rank in Rank.ascending()
        )
        table.add_row(
            str(i),
            card.model_name,
            hr_str,
            lamps,
            f"{card.passed_count}/{card.total}",
            f"{card.avg_elapsed:.1f}s",
        )
    console.print()
    console.print(table)


def render_task_discrimination(cards: list[ModelScorecard]) -> None:
    """渲染每道题的通过率，直接体现题目区分度（呼应校准机制）。"""
    # 聚合每题在所有模型上的通过情况
    per_task: dict[str, list[EvalResult]] = defaultdict(list)
    for card in cards:
        for r in card.results:
            per_task[r.task_id].append(r)

    table = Table(title="🎯 题目区分度（通过率）", show_lines=False)
    table.add_column("段位", justify="center")
    table.add_column("题目", style="bold")
    table.add_column("通过率", justify="right")
    table.add_column("区分度", justify="left")

    # 按段位 + 题目排序
    ordered = sorted(per_task.items(), key=lambda kv: (kv[1][0].rank.order, kv[0]))
    for task_id, results in ordered:
        rank = results[0].rank
        passed = sum(1 for r in results if r.passed)
        total = len(results)
        rate = passed / total if total else 0.0
        table.add_row(
            f"{rank.icon}{rank.label}",
            task_id,
            f"{passed}/{total} ({rate*100:.0f}%)",
            _discrimination_tag(rate),
        )
    console.print()
    console.print(table)


def _discrimination_tag(rate: float) -> str:
    """区分度标签：30%-70% 为黄金区分度。"""
    if rate >= 0.999:
        return "[dim]太简单（建议降级/淘汰）[/dim]"
    if rate <= 0.001:
        return "[red]太难/可能有问题（建议复查）[/red]"
    if 0.3 <= rate <= 0.7:
        return "[bold green]★ 黄金区分度（重点保留）[/bold green]"
    return "[yellow]一般[/yellow]"
