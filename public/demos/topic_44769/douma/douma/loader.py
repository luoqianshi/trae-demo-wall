"""题库加载器：把磁盘上的纯数据题目目录加载为 Task 对象。

设计哲学「题库即数据」：加题 = 加目录，引擎零改动。
"""
from __future__ import annotations

from pathlib import Path

import yaml

from .models import Rank, Task


class TaskLoadError(Exception):
    """题目加载失败。"""


def _load_single(task_dir: Path) -> Task:
    """加载单个题目目录为 Task。"""
    meta_path = task_dir / "meta.yaml"
    if not meta_path.exists():
        raise TaskLoadError(f"缺少 meta.yaml：{task_dir}")

    meta = yaml.safe_load(meta_path.read_text(encoding="utf-8")) or {}

    # 校验必需字段，缺失即明确报错（fail fast）
    required = ["id", "rank", "language", "title", "entry_file"]
    missing = [k for k in required if k not in meta]
    if missing:
        raise TaskLoadError(f"{meta_path} 缺少字段：{missing}")

    entry_file = meta["entry_file"]
    buggy_path = task_dir / entry_file
    if not buggy_path.exists():
        raise TaskLoadError(f"entry_file 不存在：{buggy_path}")

    prompt_path = task_dir / "prompt.md"
    if not prompt_path.exists():
        raise TaskLoadError(f"缺少 prompt.md：{task_dir}")

    try:
        rank = Rank(meta["rank"])
    except ValueError as exc:
        raise TaskLoadError(f"非法 rank '{meta['rank']}'：{task_dir}") from exc

    # 扫描 buggy/ 根下除 entry_file 外的其它 .py，作为只读支撑文件（跨文件题）
    buggy_root = task_dir / "buggy"
    support_files = _collect_support_files(buggy_root, exclude=buggy_path)

    return Task(
        id=meta["id"],
        rank=rank,
        language=meta["language"],
        title=meta["title"],
        tags=meta.get("tags", []),
        entry_file=entry_file,
        test_command=meta.get("test_command", "pytest -q"),
        prompt=prompt_path.read_text(encoding="utf-8"),
        buggy_code=buggy_path.read_text(encoding="utf-8"),
        directory=task_dir.resolve(),
        support_files=support_files,
        calibration=meta.get("calibration", {}),
    )


def _collect_support_files(buggy_dir: Path, exclude: Path) -> dict[str, str]:
    """收集 buggy 目录下除 entry_file 外的所有 .py 文件（相对 buggy_dir 的路径 -> 内容）。"""
    support: dict[str, str] = {}
    exclude = exclude.resolve()
    for path in sorted(buggy_dir.rglob("*.py")):
        if path.resolve() == exclude:
            continue
        rel = path.relative_to(buggy_dir).as_posix()
        support[rel] = path.read_text(encoding="utf-8")
    return support


def load_tasks(tasks_root: Path) -> list[Task]:
    """加载题库根目录下的所有题目，按段位与 id 排序。"""
    tasks_root = Path(tasks_root)
    if not tasks_root.is_dir():
        raise TaskLoadError(f"题库目录不存在：{tasks_root}")

    tasks: list[Task] = []
    for entry in sorted(tasks_root.iterdir()):
        if entry.is_dir() and (entry / "meta.yaml").exists():
            tasks.append(_load_single(entry))

    if not tasks:
        raise TaskLoadError(f"题库为空：{tasks_root}")

    tasks.sort(key=lambda t: (t.rank.order, t.id))
    return tasks
