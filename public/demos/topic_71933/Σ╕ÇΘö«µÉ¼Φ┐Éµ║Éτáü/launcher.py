"""一键搬运 — Windows 可执行版本启动器。

双击运行后自动：
1. 检查 FFmpeg 是否可用
2. 检查并安装 Playwright 浏览器
3. 启动 FastAPI 服务
4. 自动打开浏览器
"""

import os
import sys
import time
import signal
import subprocess
import threading
import webbrowser
from pathlib import Path

# 打包后的资源路径
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys._MEIPASS)
    APP_DIR = Path(os.path.dirname(sys.executable))
else:
    BASE_DIR = Path(__file__).parent
    APP_DIR = Path(__file__).parent

HOST = "127.0.0.1"
PORT = 8000
BANNER = r"""
  ╔══════════════════════════════════════╗
  ║     🎬 一键搬运 — 短视频管理工具      ║
  ║   解析 · 去重 · 发布 · 批量处理       ║
  ╚══════════════════════════════════════╝
"""


def check_ffmpeg():
    """检查 FFmpeg 是否可用。"""
    # 1. 检查系统 PATH
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0:
            return True
    except Exception:
        pass
    
    # 2. 检查同目录下的 ffmpeg
    if sys.platform == "win32":
        ffmpeg_path = APP_DIR / "ffmpeg.exe"
    else:
        ffmpeg_path = APP_DIR / "ffmpeg"
    
    if ffmpeg_path.exists():
        os.environ["PATH"] = str(APP_DIR) + os.pathsep + os.environ.get("PATH", "")
        return True
    
    return False


def check_playwright():
    """检查 Playwright 浏览器是否已安装。"""
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            browser.close()
        return True
    except Exception:
        return False


def install_playwright():
    """安装 Playwright 浏览器。"""
    print("  📥 正在安装 Playwright 浏览器（首次运行需要）...")
    try:
        subprocess.run(
            [sys.executable, "-m", "playwright", "install", "chromium"],
            check=True, timeout=300,
        )
        return True
    except Exception as e:
        print(f"  ⚠️ Playwright 安装失败: {e}")
        return False


def check_port(port):
    """检查端口是否被占用。"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0


def kill_port(port):
    """尝试释放被占用的端口。"""
    try:
        if sys.platform == "win32":
            result = subprocess.run(
                ["netstat", "-ano"], capture_output=True, text=True, timeout=10,
            )
            for line in result.stdout.splitlines():
                if f":{port}" in line and "LISTENING" in line:
                    pid = line.strip().split()[-1]
                    subprocess.run(["taskkill", "/F", "/PID", pid], timeout=5)
        else:
            result = subprocess.run(
                ["lsof", "-ti", f":{port}"], capture_output=True, text=True, timeout=10,
            )
            if result.stdout.strip():
                for pid in result.stdout.strip().split("\n"):
                    subprocess.run(["kill", "-9", pid.strip()], timeout=5)
        time.sleep(1)
        return not check_port(port)
    except Exception:
        return False


def start_server():
    """启动 FastAPI 服务。"""
    os.environ["PYTHONPATH"] = str(BASE_DIR)
    
    if getattr(sys, 'frozen', False):
        # 打包版本：直接导入运行
        from uvicorn import run
        from app.main import app
        run(app, host=HOST, port=PORT, log_level="info")
    else:
        # 开发模式
        cmd = [
            sys.executable, "-m", "uvicorn", "app.main:app",
            "--host", HOST, "--port", str(PORT),
        ]
        subprocess.run(cmd, cwd=str(BASE_DIR))


def open_browser():
    """延迟打开浏览器。"""
    for i in range(10):
        time.sleep(1)
        if check_port(PORT):
            break
    url = f"http://{HOST}:{PORT}"
    print(f"  🌐 打开浏览器: {url}")
    webbrowser.open(url)


def main():
    print(BANNER)
    
    # 1. 检查 FFmpeg
    print("  🔍 检查 FFmpeg...")
    if check_ffmpeg():
        print("  ✅ FFmpeg 可用")
    else:
        print("  ❌ FFmpeg 未找到！")
        print("  请安装 FFmpeg: https://ffmpeg.org/download.html")
        print("  或将 ffmpeg.exe 放到程序同目录下")
        input("\n  按回车键退出...")
        return
    
    # 2. 检查 Playwright
    print("  🔍 检查 Playwright 浏览器...")
    if check_playwright():
        print("  ✅ Playwright 浏览器可用")
    else:
        if not install_playwright():
            print("  ⚠️ Playwright 浏览器未安装，发布功能将不可用")
    
    # 3. 检查端口
    if check_port(PORT):
        print(f"  ⚠️ 端口 {PORT} 已被占用")
        choice = input("  是否释放端口并重启？(y/n): ").strip().lower()
        if choice == 'y':
            if kill_port(PORT):
                print(f"  ✅ 端口 {PORT} 已释放")
            else:
                print(f"  ❌ 无法释放端口，尝试打开已有服务...")
                webbrowser.open(f"http://{HOST}:{PORT}")
                input("\n  按回车键退出...")
                return
        else:
            webbrowser.open(f"http://{HOST}:{PORT}")
            input("\n  按回车键退出...")
            return
    
    # 4. 启动服务
    print(f"  🚀 启动服务: http://{HOST}:{PORT}")
    print(f"  📁 工作目录: {APP_DIR}")
    print()
    
    # 后台线程打开浏览器
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    # 主线程启动服务（阻塞）
    try:
        start_server()
    except KeyboardInterrupt:
        print("\n  👋 服务已停止")
    except Exception as e:
        print(f"\n  ❌ 启动失败: {e}")
        input("\n  按回车键退出...")


if __name__ == "__main__":
    main()
