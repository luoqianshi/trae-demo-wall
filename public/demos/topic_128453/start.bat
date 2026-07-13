@echo off
chcp 65001 >nul
title 墨问 · 古籍智慧对话引擎

echo ============================================
echo   墨问 · 古籍智慧对话引擎 v2.0
echo   一键启动中...
echo ============================================
echo.

:: 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.9+
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)
echo [OK] Python 已检测到

:: 安装依赖
echo [..] 安装 Python 依赖...
cd /d "%~dp0backend"
pip install -r requirements.txt -q
if %errorlevel% neq 0 (
    echo [警告] 安装依赖失败，尝试重新安装...
    pip install -r requirements.txt
)
echo [OK] 依赖安装完成

:: 启动服务
echo.
echo [..] 启动后端服务...
echo.
echo ============================================
echo   墨问已启动！请访问：
echo   http://localhost:8000
echo.
echo   按 Ctrl+C 停止服务
echo ============================================
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause