@echo off
title Mind Diary

echo.
echo   ============================================
echo     Mind Diary - Healing Journal for Teens
echo   ============================================
echo.

cd /d "%~dp0"

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo   [ERROR] Node.js not found. Please install it first:
    echo          https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Create config.json on first run
if not exist "config.json" (
    if exist "config.example.json" (
        echo   [INFO] First run, creating config.json...
        copy config.example.json config.json >nul
        echo   [INFO] config.json created. Edit it to fill in your Agnes API Key
        echo          or set AGNES_API_KEY environment variable.
        echo.
    )
)

REM Install dependencies on first run
if not exist "node_modules" (
    echo   [INFO] First run, installing dependencies...
    call npm install
    if errorlevel 1 (
        echo   [ERROR] npm install failed. Check your network and retry.
        echo.
        pause
        exit /b 1
    )
    echo   [INFO] Dependencies installed.
    echo.
)

echo   [START] Starting server...
echo   [URL]   Open in browser:
echo          http://localhost:3001
echo.

REM Auto add firewall rule for LAN access (QR code scanning)
netsh advfirewall firewall add rule name="Mind Diary Port 3001" dir=in action=allow protocol=TCP localport=3001 >nul 2>nul

start "" http://localhost:3001

node server.js

echo.
echo   [INFO] Server stopped.
pause
