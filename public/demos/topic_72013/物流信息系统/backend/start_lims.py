#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
物流信息管理系统 - 启动器
"""

import subprocess
import threading
import time
import webbrowser
import os
import sys

def start_flask_server():
    """启动Flask后端服务"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    subprocess.run([sys.executable, 'run.py'], check=True)

def open_browser():
    """等待服务启动后打开浏览器"""
    time.sleep(3)  # 等待服务启动
    try:
        webbrowser.open('http://localhost:5000')
        print("浏览器已打开")
    except Exception as e:
        print(f"打开浏览器失败: {e}")

def main():
    print("=" * 50)
    print("    物流信息管理系统 (LIMS)")
    print("=" * 50)
    print("\n正在启动服务...")
    
    # 在后台启动Flask服务
    server_thread = threading.Thread(target=start_flask_server)
    server_thread.daemon = True
    server_thread.start()
    
    # 启动浏览器
    browser_thread = threading.Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    print("\n服务已启动，端口: 5000")
    print("默认账号: admin / 123456")
    print("\n按 Ctrl+C 停止服务")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n服务正在停止...")
        sys.exit(0)

if __name__ == '__main__':
    main()
