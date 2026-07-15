@echo off
title Sports Tactics Analysis Platform

echo ==================================================
echo    Sports Tactics Analysis Platform - Launcher
echo ==================================================
echo.

cd /d "%~dp0"

:: Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [Warning] Python not found. Opening frontend demo page directly.
    echo.
    echo To use full backend features, install Python 3.10+:
    echo https://www.python.org/downloads/
    echo.
    start "" "frontend\dist\index.html"
    timeout /t 3 >nul
    exit /b 0
)

echo [1/4] Python detected. Installing backend dependencies...
pip install fastapi uvicorn python-multipart websockets --quiet 2>nul
echo      Backend dependencies installed.
echo.

echo [2/4] Starting backend server (port 8000)...
start "Backend Server" cmd /k "cd /d "%~dp0backend" && python main.py"
timeout /t 2 >nul

echo [3/4] Starting frontend server (port 5173)...
start "Frontend Server" cmd /k "cd /d "%~dp0frontend\dist" && python -m http.server 5173"
timeout /t 2 >nul

echo [4/4] Opening browser...
start "" "http://localhost:5173"

echo.
echo ==================================================
echo  Started successfully!
echo.
echo  Frontend: http://localhost:5173
echo  Backend API: http://localhost:8000/docs
echo.
echo  To stop: close the two command windows that opened.
echo ==================================================
echo.
pause
