@echo off
REM ============================================================
REM 墨问 · 古籍智慧对话引擎 —— Windows 启动脚本
REM 启动 FastAPI 开发服务器，端口 8000，开启热重载
REM ============================================================

cd /d "%~dp0"
echo ========================================
echo   墨问 · 古籍智慧对话引擎
echo   正在启动 FastAPI 服务...
echo   访问地址: http://localhost:8000
echo   API 文档: http://localhost:8000/docs
echo ========================================

python -m uvicorn main:app --reload --port 8000

pause
