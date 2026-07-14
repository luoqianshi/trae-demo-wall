@echo off
chcp 65001 >nul
echo ========================================
echo    Sales BI Dashboard - Startup Script
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    echo OK - Dependencies installed.
) else (
    echo OK - Dependencies already exist.
)
echo.

echo [2/3] Checking database...
if not exist "data\sales.db" (
    echo Database not found, initializing...
    node init-db.js
    if %errorlevel% neq 0 (
        echo [ERROR] Database init failed.
        pause
        exit /b 1
    )
    echo OK - Database initialized.
) else (
    echo OK - Database already exists.
)
echo.

echo [3/3] Starting server...
echo.
echo ========================================
echo   Server starting...
echo   HTTP API:    http://localhost:3000
echo   WebSocket:   ws://localhost:8080
echo   Dashboard:   http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C to stop the server.
echo.

REM Auto-open browser after 2 seconds
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

REM Start server
node server.js

pause
