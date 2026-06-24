# -*- coding: utf-8 -*-
"""
TimeForge X — 一键启动程序
双击此文件即可启动 TimeForge X
"""
import os
import sys
import time
import webbrowser
import threading
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

# 确保依赖已安装
try:
    import flask
except ImportError:
    print("[TimeForge X] 正在安装依赖...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-q"])
    print("[TimeForge X] 依赖安装完成")

# 数据库初始化
db_path = os.path.join(BASE_DIR, "timeforge.db")
if not os.path.exists(db_path):
    print("[TimeForge X] 首次启动，正在初始化数据库...")
    import seed_data
    seed_data.seed_database()
    print("[TimeForge X] 数据库初始化完成")
else:
    print("[TimeForge X] 数据库已就绪")

# 启动 Flask 应用
from app import app

def open_browser():
    """等待服务器启动后自动打开浏览器"""
    time.sleep(1.5)
    url = "http://localhost:5000"
    print(f"\n[TimeForge X] 正在打开浏览器: {url}")
    webbrowser.open(url)

def main():
    print("=" * 60)
    print("  ████████╗██╗███╗   ███╗███████╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗")
    print("  ╚══██╔══╝██║████╗ ████║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝")
    print("     ██║   ██║██╔████╔██║█████╗  █████╗  ██║   ██║██████╔╝██║  ███╗█████╗  ")
    print("     ██║   ██║██║╚██╔╝██║██╔══╝  ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  ")
    print("     ██║   ██║██║ ╚═╝ ██║███████╗██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗")
    print("     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝")
    print("                         X  — AI人生规划指挥中心")
    print("=" * 60)
    print()
    print("  启动地址:   http://localhost:5000")
    print("  演示模式:   http://localhost:5000/demo")
    print("  测试账号:   demo_user / 123456")
    print()
    print("  按 Ctrl+C 停止服务器")
    print("=" * 60)
    print()

    # 自动打开浏览器
    threading.Thread(target=open_browser, daemon=True).start()

    # 启动 Flask
    app.run(debug=False, host="0.0.0.0", port=5000, use_reloader=False)

if __name__ == "__main__":
    main()