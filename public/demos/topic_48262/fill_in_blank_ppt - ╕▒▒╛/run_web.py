#!/usr/bin/env python3
"""Web 应用启动脚本

使用方法:
    python run_web.py              # 默认 127.0.0.1:5000
    python run_web.py --port 8080  # 指定端口
    python run_web.py --host 0.0.0.0 --port 8080  # 外部可访问
"""
import os
import sys

# 将项目根目录添加到 sys.path
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_DIR)
sys.path.insert(0, os.path.join(PROJECT_DIR, "web"))

from web.app import create_app

app = create_app()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="填空题PPT生成器 Web 服务")
    parser.add_argument("--host", default="127.0.0.1", help="监听地址（默认 127.0.0.1）")
    parser.add_argument("--port", type=int, default=5000, help="监听端口（默认 5000）")
    parser.add_argument("--debug", action="store_true", help="调试模式")

    args = parser.parse_args()

    print("=" * 60)
    print("  填空题PPT生成器 Web 服务")
    print("=" * 60)
    print(f"  地址: http://{args.host}:{args.port}")
    print(f"  调试: {'是' if args.debug else '否'}")
    print("=" * 60)

    app.run(host=args.host, port=args.port, debug=args.debug)
