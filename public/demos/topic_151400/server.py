#!/usr/bin/env python3
"""
Mycelium — 菌丝词源
本地开发服务器

用法:
    python3 server.py          # 默认端口 8080
    python3 server.py 3000     # 自定义端口
"""

import http.server
import socketserver
import os
import sys
import webbrowser

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        # 静默日志，保持界面整洁
        pass

def find_port(start_port):
    """从 start_port 开始，自动寻找可用端口"""
    for p in range(start_port, start_port + 100):
        try:
            with socketserver.TCPServer(("", p), Handler):
                return p
        except OSError:
            continue
    raise RuntimeError("无法找到可用端口 (8080-8179 均被占用)")

PORT = find_port(PORT)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    url = f"http://localhost:{PORT}"
    print(f"\n  🍄 Mycelium 菌丝词源 已启动")
    print(f"  📍 本地地址: {url}")
    print(f"  📂 项目目录: {DIRECTORY}")
    print(f"\n  按 Ctrl+C 停止服务器\n")
    
    # 自动打开浏览器
    webbrowser.open(url)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  服务器已停止\n")
        httpd.shutdown()
