@echo off
cd /d "%~dp0"
title Chat Platform

echo ========================================
echo   Chat Platform - Yi Jian Qi Dong
echo ========================================
echo.

REM Step 1: check Python
echo Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)
echo Python OK.
echo.

REM Step 2: install backend dependencies if needed
echo Checking backend dependencies...
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo Installing backend dependencies...
    pip install -r "%~dp0backend\requirements.txt" -i https://pypi.tuna.tsinghua.edu.cn/simple
) else (
    echo Backend dependencies OK.
)
echo.

REM Step 3: install frontend dependencies if needed
echo Checking frontend dependencies...
python -c "import customtkinter" >nul 2>&1
if errorlevel 1 (
    echo Installing frontend dependencies...
    pip install -r "%~dp0frontend\requirements.txt" -i https://pypi.tuna.tsinghua.edu.cn/simple
) else (
    echo Frontend dependencies OK.
)
echo.

REM Step 4: start backend
echo [1/2] Starting backend server...
start "Chat-Backend" /min cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Step 5: wait for backend
echo Waiting for backend to be ready...
:wait_loop
ping 127.0.0.1 -n 3 >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo .
    goto wait_loop
)

echo Backend is ready! http://127.0.0.1:8000
echo.

REM Step 6: start GUI
echo [2/2] Starting desktop client...
cd /d "%~dp0frontend"
python -m app.main

echo.
echo Client closed.
pause
