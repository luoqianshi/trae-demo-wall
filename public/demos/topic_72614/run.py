#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PVZ游戏独立运行版主程序入口
启动命令: python run.py

访问地址:
    http://127.0.0.1:5000/                (自动跳转到游戏页)
    http://127.0.0.1:5000/pvz/pvz_game    (游戏页面)

可选参数:
    --port=端口号         指定端口（默认5000）
    --host=0.0.0.0        允许外部访问（默认仅本机）
    --no-browser          不自动打开浏览器
    --debug               调试模式
"""

import sys
import os
import argparse

# 添加项目根目录到路径
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)


def parse_args():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description='PVZ游戏独立运行版')
    parser.add_argument('--host', default='127.0.0.1',
                        help='监听地址（默认 127.0.0.1，外部访问请用 0.0.0.0）')
    parser.add_argument('--port', type=int, default=5000,
                        help='监听端口（默认 5000）')
    parser.add_argument('--no-browser', action='store_true',
                        help='不自动打开浏览器')
    parser.add_argument('--debug', action='store_true',
                        help='调试模式（启用热重载）')
    return parser.parse_args()


def main():
    args = parse_args()

    # 延迟导入，确保 sys.path 已设置
    from backend.app import run_server

    run_server(
        host=args.host,
        port=args.port,
        debug=args.debug,
        open_browser=not args.no_browser
    )


if __name__ == '__main__':
    main()
