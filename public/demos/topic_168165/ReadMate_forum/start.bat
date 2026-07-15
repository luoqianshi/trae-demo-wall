@echo off
REM ============================================================
REM  ReadMate 一键启动脚本
REM  使用方法：双击本文件
REM  首次运行会自动创建 venv 并安装依赖（约 1-2 分钟）
REM ============================================================
chcp 65001 > nul
setlocal

echo.
echo ============================================
echo   ReadMate v1.1 - 一键启动
echo ============================================
echo.

REM 检查 Python
python --version > nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.9+
    echo 下载: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 创建 venv（如果不存在）
if not exist "venv\" (
    echo [1/3] 正在创建虚拟环境...
    python -m venv venv
)

REM 安装依赖
echo [2/3] 正在检查并安装依赖...
call venv\Scripts\activate.bat
pip install -q -r requirements.txt
if errorlevel 1 (
    echo [错误] 依赖安装失败，请检查网络
    pause
    exit /b 1
)

REM 启动
echo [3/3] 启动 ReadMate...
echo.
python run.py

pause
