@echo off
chcp 65001 >nul
echo.
echo   ╔══════════════════════════════════════╗
echo   ║     AI 短剧无限画布 - 启动中...      ║
echo   ╚══════════════════════════════════════╝
echo.

cd /d "%~dp0backend"

echo   [1/3] 检查 Python 环境...
python --version 2>nul
if errorlevel 1 (
    echo.
    echo   ❌ 未找到 Python，请先安装 Python 3.10+
    echo   下载地址: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo.
echo   [2/3] 安装依赖包（首次启动需要 1-2 分钟）...
python -m pip install -r requirements.txt -q 2>nul
if errorlevel 1 (
    echo   ⚠️  部分依赖安装失败，尝试继续启动...
)

echo.
echo   [3/3] 启动服务...
echo.
echo   ╔══════════════════════════════════════╗
echo   ║  ✅ 服务地址: http://localhost:8000  ║
echo   ║  🌐 浏览器将自动打开...              ║
echo   ║  📌 按 Ctrl+C 停止服务              ║
echo   ╚══════════════════════════════════════╝
echo.

start "" http://localhost:8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
