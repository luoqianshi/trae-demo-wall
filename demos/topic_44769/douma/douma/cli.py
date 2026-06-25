"""DouMa 命令行入口。

用法：
  python -m douma.cli run --config config.yaml --tasks tasks --mode one_shot
"""
from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

from rich.console import Console

from .calibration import calibrate
from .config import load_config
from .loader import load_tasks
from .models import EvalMode, EvalResult
from .report import render_leaderboard, render_scorecards, render_task_discrimination
from .runner import run_tournament

console = Console()

# 固定服务端口：每次启动都用同一端口，配合启动前清理旧进程，
# 保证同一时刻只有一个 DouMa 服务实例，避免多进程并存导致前端连到旧代码而错乱。
DEFAULT_SERVE_PORT = 8010


def _progress_printer(model_name: str, result: EvalResult) -> None:
    """实时观赛：每完成一道题打印一行。"""
    mark = "[green]✅PASS[/green]" if result.passed else "[red]❌FAIL[/red]"
    extra = f" rounds={result.rounds}" if result.mode == EvalMode.AGENTIC else ""
    err = f" [red]({result.error[:40]})[/red]" if result.error else ""
    console.print(
        f"  {result.rank.icon} [bold]{model_name}[/bold] · {result.task_id} "
        f"{mark} {result.elapsed:.1f}s{extra}{err}"
    )


def cmd_run(args: argparse.Namespace) -> int:
    """执行一轮评测。"""
    config = load_config(Path(args.config))
    tasks = load_tasks(Path(args.tasks))
    mode = EvalMode(args.mode)

    console.print(
        f"[bold]DouMa[/bold] 启动 · 模式={mode.value} · "
        f"题目={len(tasks)} · 选手={len(config.models)} · 并发={config.max_concurrency}\n"
    )
    console.print("[dim]—— 实时观赛 ——[/dim]")

    cards = run_tournament(tasks, config, mode, on_progress=_progress_printer)

    # 结果展示
    render_scorecards(cards)
    render_leaderboard(cards)
    render_task_discrimination(cards)

    # 难度校准回填
    if not args.no_calibrate:
        tasks_dir_by_id = {t.id: t.directory for t in tasks}
        calibrate(tasks_dir_by_id, cards)
        console.print("\n[dim]✓ 已按实测通过率回填各题 calibration[/dim]")

    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    """启动本地 Web GUI。

    固定端口启动：先清理占用该端口的旧 DouMa 进程，确保同一时刻只有一个实例，
    避免浏览器连到残留的旧代码进程导致行为错乱。
    """
    import uvicorn

    from .web.server import create_app

    _free_port_for_douma(args.port)

    root_dir = Path.cwd()
    _load_dotenv(root_dir / ".env")
    app = create_app(tasks_dir=Path(args.tasks), root_dir=root_dir)
    # 监听 0.0.0.0 时展示回环地址供本机点击；容器/远程部署用宿主机 IP 访问
    display_host = "127.0.0.1" if args.host == "0.0.0.0" else args.host
    url = f"http://{display_host}:{args.port}"
    console.print(f"[bold]DouMa GUI[/bold] 已启动 · 在浏览器打开 [cyan]{url}[/cyan]")
    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")
    return 0


def _free_port_for_douma(port: int) -> None:
    """启动前清理占用固定端口的旧 DouMa 进程。

    仅终止确为 DouMa 服务（命令行含 douma serve）的进程；若端口被其他程序占用，
    则直接报错退出，避免误杀无关进程。
    """
    pids = _pids_listening_on(port)
    if not pids:
        return
    for pid in pids:
        if pid == os.getpid():
            continue
        cmdline = _process_cmdline(pid)
        is_douma = "douma" in cmdline and "serve" in cmdline
        if not is_douma:
            console.print(
                f"[red]端口 {port} 被非 DouMa 进程占用（pid={pid}）：{cmdline}[/red]\n"
                f"[yellow]请手动处理后重试，或换用其他端口。[/yellow]"
            )
            sys.exit(1)
        console.print(f"[yellow]清理占用端口 {port} 的旧 DouMa 进程 pid={pid}[/yellow]")
        _terminate(pid)


def _pids_listening_on(port: int) -> list[int]:
    """返回监听指定端口的进程 pid 列表（无则空列表）。"""
    try:
        out = subprocess.run(
            ["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN", "-t"],
            capture_output=True, text=True, timeout=5,
        ).stdout
    except (OSError, subprocess.SubprocessError):
        return []
    return [int(line) for line in out.split() if line.strip().isdigit()]


def _process_cmdline(pid: int) -> str:
    """读取进程完整命令行（失败返回空串）。"""
    try:
        return subprocess.run(
            ["ps", "-o", "command=", "-p", str(pid)],
            capture_output=True, text=True, timeout=5,
        ).stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def _terminate(pid: int) -> None:
    """优雅终止进程：先 SIGTERM，最多等 3 秒，仍存活则 SIGKILL。"""
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    except OSError:
        return
    for _ in range(30):
        time.sleep(0.1)
        try:
            os.kill(pid, 0)  # 探测存活
        except ProcessLookupError:
            return
    try:
        os.kill(pid, signal.SIGKILL)
    except OSError:
        pass


def _load_dotenv(env_path: Path) -> None:
    """启动时加载项目根 .env，让真实模型的 API key 就绪（已存在的环境变量不覆盖）。"""
    if not env_path.exists():
        return
    try:
        from dotenv import load_dotenv

        load_dotenv(env_path, override=False)
    except ImportError:
        console.print(f"[yellow]未安装 python-dotenv，跳过加载 {env_path}[/yellow]")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="douma", description="LLM 代码修复能力评测框架")
    sub = parser.add_subparsers(dest="command", required=True)

    run_p = sub.add_parser("run", help="执行一轮评测")
    run_p.add_argument("--config", required=True, help="模型配置 YAML 路径")
    run_p.add_argument("--tasks", default="tasks", help="题库目录（默认 tasks）")
    run_p.add_argument(
        "--mode",
        default="one_shot",
        choices=[m.value for m in EvalMode],
        help="评测模式：one_shot / agentic",
    )
    run_p.add_argument("--no-calibrate", action="store_true", help="不回填校准数据")
    run_p.set_defaults(func=cmd_run)

    serve_p = sub.add_parser("serve", help="启动本地 Web GUI")
    serve_p.add_argument("--host", default="127.0.0.1",
                         help="监听地址（默认 127.0.0.1；容器/远程部署用 0.0.0.0）")
    serve_p.add_argument("--port", type=int, default=DEFAULT_SERVE_PORT,
                         help=f"监听端口（默认固定 {DEFAULT_SERVE_PORT}）")
    serve_p.add_argument("--tasks", default="tasks", help="题库目录（默认 tasks）")
    serve_p.set_defaults(func=cmd_serve)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
