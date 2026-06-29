#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""通用端到端回归入口。

该脚本只复制调用方提供的匿名夹具并执行真实技能流程，不生成伪图片、
不复制历史 parts，也不覆写中间计划。需要 AI 的阶段必须真实阻断并输出任务。
"""

import argparse
import os
import shutil
import subprocess
import sys
import uuid


AI_MARKERS = {
    "content_block": "[AIIDE_CONTENT_FILLING_REQUIRED]",
    "image_block": "[AIIDE_IMAGE_GENERATION_REQUIRED]",
}


def _copy_fixture(source, destination):
    ignored = shutil.ignore_patterns(".scratch", "__pycache__", "*.pyc")
    shutil.copytree(source, destination, ignore=ignored)
    fixture_name = os.path.basename(os.path.normpath(source))
    for extension in (".md", ".html"):
        generated = os.path.join(destination, fixture_name + extension)
        if os.path.exists(generated):
            os.remove(generated)


def _run_engine(project_root, sandbox_dir):
    command = [
        sys.executable,
        "-B",
        os.path.join(project_root, "scripts", "pipeline_engine.py"),
        "--action",
        "smart-generate",
        "--target_dir",
        sandbox_dir,
        "--auto-continue",
    ]
    return subprocess.run(
        command,
        cwd=project_root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def main():
    parser = argparse.ArgumentParser(description="运行无商品硬编码的技能回归夹具")
    parser.add_argument("--fixture-dir", required=True, help="匿名商品夹具目录")
    parser.add_argument(
        "--expect",
        choices=["content_block", "image_block", "complete"],
        default="content_block",
        help="本次回归期望到达的真实流程状态",
    )
    parser.add_argument("--keep", action="store_true", help="保留回归沙箱用于排查")
    args = parser.parse_args()

    fixture_dir = os.path.abspath(args.fixture_dir)
    if not os.path.isdir(fixture_dir):
        print(f"[ERR] 回归夹具目录不存在: {fixture_dir}")
        return 1

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    sandbox_root = os.path.join(project_root, ".scratch", "test_tmp")
    run_root = os.path.join(sandbox_root, f"e2e_{uuid.uuid4().hex}")
    sandbox_dir = os.path.join(run_root, os.path.basename(os.path.normpath(fixture_dir)))
    os.makedirs(sandbox_root, exist_ok=True)

    try:
        _copy_fixture(fixture_dir, sandbox_dir)
        result = _run_engine(project_root, sandbox_dir)
        output = result.stdout + "\n" + result.stderr
        print(output)

        if args.expect in AI_MARKERS:
            marker = AI_MARKERS[args.expect]
            if marker not in output:
                print(f"[FAIL] 未到达预期 AI 阻断状态: {marker}")
                return 1
            if result.returncode == 0:
                print("[FAIL] AI 任务未完成时错误返回了成功退出码。")
                return 1
            print(f"[PASS] 真实流程正确停在 {args.expect}，且返回非零退出码。")
            return 0

        if result.returncode != 0:
            print(f"[FAIL] 完整交付回归失败，退出码: {result.returncode}")
            return 1
        expected_stem = os.path.basename(sandbox_dir)
        outputs = [
            os.path.join(sandbox_dir, expected_stem + ".md"),
            os.path.join(sandbox_dir, expected_stem + ".html"),
        ]
        if not all(os.path.exists(path) for path in outputs):
            print("[FAIL] 流程返回成功，但双端交付物不完整。")
            return 1
        print("[PASS] 真实完整交付回归通过。")
        return 0
    finally:
        if not args.keep:
            shutil.rmtree(run_root, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
