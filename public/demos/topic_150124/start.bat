@echo off
chcp 65001 >nul
echo ========================================
echo   AI 速读助手 - 启动中...
echo ========================================

cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo 正在创建虚拟环境...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate
)

echo.
echo 启动服务...
echo 访问地址: http://localhost:5000
echo 按 Ctrl+C 停止服务
echo.
python server.py

pause
