"""
进化镜 一键冒烟测试入口
用法: python tests/run_all.py
流程:
  1. 前端静态检查 (test_frontend.py)
  2. 后端 API 冒烟测试 (test_api.py) - 需要后端已启动
"""

import subprocess
import sys
from pathlib import Path

TESTS_DIR = Path(__file__).parent


def run_script(name):
    """运行单个测试脚本"""
    script = TESTS_DIR / name
    print(f"\n{'='*60}")
    print(f"运行: {name}")
    print("="*60)
    result = subprocess.run([sys.executable, str(script)], cwd=TESTS_DIR.parent)
    return result.returncode == 0


def main():
    print("=" * 60)
    print("进化镜 冒烟测试套件 (Evolution Mirror Smoke Test Suite)")
    print("=" * 60)

    results = []

    # 1. 前端静态检查（不需要后端）
    results.append(run_script("test_frontend.py"))

    # 2. 后端 API 测试
    results.append(run_script("test_api.py"))

    print("\n" + "=" * 60)
    if all(results):
        print("全部通过，代码变更安全")
    else:
        print("存在失败项，请修复后再继续")
    print("=" * 60)
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
