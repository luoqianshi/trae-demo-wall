#!/usr/bin/env python
"""
电商商品价格自动化采集与对比工具 - 快速启动脚本

用法:
  python run.py web                 # 启动 Web 演示
  python run.py search "关键词"     # 命令行搜索
  python run.py platforms          # 列出支持的平台
"""

import sys
import os


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    cmd = sys.argv[1]

    if cmd == "web":
        from web.app import run_demo
        run_demo()
    elif cmd == "search":
        sys.argv = [sys.argv[0]] + sys.argv[2:]
        from price_compare.cli import main as cli_main
        cli_main()
    elif cmd == "platforms":
        from price_compare.spiders import available_platforms
        from price_compare.visualizer.charts import PLATFORM_NAMES
        print("支持的平台:")
        for p in available_platforms():
            print(f"  - {p} ({PLATFORM_NAMES.get(p, p)})")
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
