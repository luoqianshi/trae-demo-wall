#!/usr/bin/env python3
"""从源码自动生成「一键搬运.py」单文件版本。"""

import base64
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE_FILES = [
    # (包名, 文件相对路径)
    ("app.utils.bin", "app/utils/bin.py"),
    ("app.models.video", "app/models/video.py"),
    ("app.core.config", "app/core/config.py"),
    ("app.core.logger", "app/core/logger.py"),
    ("app.services.dedup_filters", "app/services/dedup_filters.py"),
    ("app.services.downloader", "app/services/downloader.py"),
    ("app.services.deduplicator", "app/services/deduplicator.py"),
    ("app.services.task_manager", "app/services/task_manager.py"),
    ("app.services.task_queue", "app/services/task_queue.py"),
    ("app.services.subtitle_processor", "app/services/subtitle_processor.py"),
    ("app.services.browser_publisher", "app/services/browser_publisher.py"),
    ("app.api.schemas", "app/api/schemas.py"),
    ("app.api.routes", "app/api/routes.py"),
    ("app.api.browser_routes", "app/api/browser_routes.py"),
    ("app.main", "app/main.py"),
]

OUTPUT = REPO_ROOT / "一键搬运.py"

# ── 读取文件内容 ──
encoded = {}
for mod_name, rel_path in SOURCE_FILES:
    src = (REPO_ROOT / rel_path).read_text(encoding="utf-8")
    encoded[mod_name] = base64.b64encode(src.encode()).decode()

html_path = REPO_ROOT / "static" / "index.html"
html_b64 = base64.b64encode(html_path.read_bytes()).decode()

# ── 生成输出 ──
lines = []
lines.append('#!/usr/bin/env python3')
lines.append('# -*- coding: utf-8 -*-')
lines.append('"""')
lines.append('一键搬运 — 短视频管理工具 (单文件版)')
lines.append('双击运行即可启动，浏览器自动打开 http://127.0.0.1:8000')
lines.append('')
lines.append('使用方法：')
lines.append('  1. 确保已安装 Python 3.10+ 和 FFmpeg')
lines.append('  2. 双击运行本文件，或命令行执行: python 一键搬运.py')
lines.append('  3. 首次运行会自动安装依赖，请耐心等待')
lines.append('"""')
lines.append('')
lines.append('import sys')
lines.append('import os')
lines.append('import subprocess')
lines.append('import types')
lines.append('import base64')
lines.append('')
lines.append('# ---- 自动安装依赖 ----')
lines.append('REQUIRED_PACKAGES = [')
lines.append('    ("fastapi", "fastapi>=0.100.0"),')
lines.append('    ("uvicorn", "uvicorn[standard]>=0.23.0"),')
lines.append('    ("httpx", "httpx>=0.24.0"),')
lines.append('    ("pydantic", "pydantic>=2.0.0"),')
lines.append('    ("pydantic_settings", "pydantic-settings>=2.0.0"),')
lines.append('    ("loguru", "loguru>=0.7.0"),')
lines.append('    ("multipart", "python-multipart>=0.0.5"),')
lines.append('    ("cv2", "opencv-python-headless>=4.8.0"),')
lines.append('    ("numpy", "numpy>=1.24.0"),')
lines.append('    ("moviepy", "moviepy>=1.0.3"),')
lines.append('    ("PIL", "Pillow>=10.0.0"),')
lines.append('    ("playwright", "playwright"),')
lines.append(']')
lines.append('')
lines.append('')
lines.append('def _ensure_deps():')
lines.append('    missing = []')
lines.append('    for mod_name, pip_name in REQUIRED_PACKAGES:')
lines.append('        try:')
lines.append('            __import__(mod_name)')
lines.append('        except ImportError:')
lines.append('            missing.append(pip_name)')
lines.append('    if missing:')
lines.append('        print(f"  📦 首次运行，正在安装 {len(missing)} 个依赖...")')
lines.append('        subprocess.check_call(')
lines.append('            [sys.executable, "-m", "pip", "install", "--quiet"] + missing')
lines.append('        )')
lines.append('        print("  ✅ 依赖安装完成")')
lines.append('')
lines.append('')
lines.append('_ensure_deps()')
lines.append('')
lines.append('# ---- 建立虚拟包结构 ----')
lines.append('_CWD = os.getcwd()')
pkg_names = sorted(set(".".join(m.split(".")[:-1]) for m, _ in SOURCE_FILES if "." in m))
lines.append('for _pkg in ' + repr(pkg_names) + ':')
lines.append('    _mod = types.ModuleType(_pkg)')
lines.append('    _mod.__path__ = [os.path.join(_CWD, *_pkg.split("."))]')
lines.append('    _mod.__package__ = _pkg')
lines.append('    sys.modules[_pkg] = _mod')
lines.append('')
lines.append('')
lines.append('def _load_module(mod_name, filepath, b64_code):')
lines.append('    """从 base64 编码的源码加载模块到 sys.modules。"""')
lines.append('    code = base64.b64decode(b64_code).decode("utf-8")')
lines.append('    mod = types.ModuleType(mod_name)')
lines.append('    actual_path = os.path.join(_CWD, filepath)')
lines.append('    mod.__file__ = actual_path')
lines.append('    mod.__package__ = mod_name.rsplit(".", 1)[0] if "." in mod_name else mod_name')
lines.append('    sys.modules[mod_name] = mod')
lines.append('    exec(compile(code, actual_path, "exec"), mod.__dict__)')
lines.append('')
lines.append('')
lines.append('# ---- 嵌入的前端 HTML ----')
lines.append(f'_EMBEDDED_HTML = base64.b64decode({html_b64!r})')
lines.append('')
lines.append('')
lines.append('# ---- 加载嵌入模块 ----')
for mod_name, rel_path in SOURCE_FILES:
    var_name = '_MOD_' + mod_name.replace('.', '_')
    lines.append(f'{var_name} = {encoded[mod_name]!r}')
    lines.append(f'_load_module({mod_name!r}, {rel_path!r}, {var_name})')
    lines.append('')
lines.append('')
lines.append('# ---- 注入内建 HTML ----')
lines.append('import app.main as _app_main')
lines.append('_app_main._EMBEDDED_HTML = _EMBEDDED_HTML')
lines.append('')
lines.append('# ---- 启动入口 ----')
lines.append('if __name__ == "__main__":')
lines.append('    import threading, webbrowser, time, socket')
lines.append('')
lines.append('    HOST = "127.0.0.1"')
lines.append('    PORT = 8000')
lines.append('')
lines.append('    print("""')
lines.append('  ╔══════════════════════════════════════╗')
lines.append('  ║     🎬 一键搬运 — 短视频管理工具      ║')
lines.append('  ║   解析 · 去重 · 发布 · 批量处理       ║')
lines.append('  ╚══════════════════════════════════════╝')
lines.append('    """)')
lines.append('')
lines.append('    # 检查 FFmpeg')
lines.append('    try:')
lines.append('        subprocess.run(["ffmpeg", "-version"], capture_output=True, timeout=5)')
lines.append('        print("  ✅ FFmpeg 可用")')
lines.append('    except Exception:')
lines.append('        print("  ❌ FFmpeg 未找到！请安装: https://ffmpeg.org/download.html")')
lines.append('        input("\\n  按回车键退出...")')
lines.append('        sys.exit(1)')
lines.append('')
lines.append('    # 检查端口')
lines.append('    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:')
lines.append('        if s.connect_ex((HOST, PORT)) == 0:')
lines.append('            print(f"  ⚠️ 端口 {PORT} 已被占用，尝试打开...")')
lines.append('            webbrowser.open(f"http://{HOST}:{PORT}")')
lines.append('            input("\\n  按回车键退出...")')
lines.append('            sys.exit(0)')
lines.append('')
lines.append('    def _open_browser():')
lines.append('        for _ in range(15):')
lines.append('            time.sleep(1)')
lines.append('            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:')
lines.append('                if s.connect_ex((HOST, PORT)) == 0:')
lines.append('                    break')
lines.append('        print(f"  🌐 打开浏览器: http://{HOST}:{PORT}")')
lines.append('        webbrowser.open(f"http://{HOST}:{PORT}")')
lines.append('')
lines.append('    threading.Thread(target=_open_browser, daemon=True).start()')
lines.append('    print(f"  🚀 启动服务: http://{HOST}:{PORT}")')
lines.append('    print()')
lines.append('')
lines.append('    from uvicorn import run')
lines.append('    from app.main import app')
lines.append('    run(app, host=HOST, port=PORT, log_level="info")')
lines.append('')

result = '\n'.join(lines)
OUTPUT.write_text(result, encoding="utf-8")
print(f"✅ 已生成: {OUTPUT}")
print(f"   {len(result)} 字节")
