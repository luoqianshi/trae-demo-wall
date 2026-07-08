@echo off
setlocal
cd /d "%~dp0"
title Yuecai Assistant Installer
echo ========================================
echo   Yuecai Assistant Installer
echo ========================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python was not found. Please install Python 3.10+
    echo Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/4] Creating virtual environment...
if not exist .venv (
    python -m venv .venv
) else (
    echo       Virtual environment already exists, skipping
)

echo [2/4] Installing dependencies...
.venv\Scripts\python.exe -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt -q

echo [3/4] Initializing dish database...
.venv\Scripts\python.exe init_db.py

echo [4/4] Checking static assets...
if not exist static\images mkdir static\images
if not exist miniprogram\static\images mkdir miniprogram\static\images

echo.
echo ========================================
echo   Install complete!
echo ========================================
echo.
echo Start service: start.bat
echo Mini program folder: miniprogram\
echo Backend URL: http://localhost:8001
echo.
pause
