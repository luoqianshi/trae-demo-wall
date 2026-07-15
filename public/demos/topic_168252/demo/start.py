#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""自动启动 Web 服务 + 打开浏览器"""

import http.server
import socketserver
import webbrowser
import os
import sys
import threading

PORT = 8080
DIR = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def log_message(self, format, *args):
        print(f"  {args[0]}")

def open_browser():
    url = f"http://localhost:{PORT}/index.html"
    webbrowser.open(url)

def main():
    os.chdir(DIR)
    print(f"\n  服务目录: {DIR}")
    print(f"  启动地址: http://localhost:{PORT}/index.html\n")

    # 延迟打开浏览器，确保服务已就绪
    threading.Timer(0.8, open_browser).start()

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"  服务已启动，按 Ctrl+C 停止\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  服务已停止")
            httpd.server_close()
            sys.exit(0)

if __name__ == "__main__":
    main()
