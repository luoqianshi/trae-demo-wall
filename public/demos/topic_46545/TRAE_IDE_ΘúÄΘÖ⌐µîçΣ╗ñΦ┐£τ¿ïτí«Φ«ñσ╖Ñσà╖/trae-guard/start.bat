@echo off
chcp 65001 >nul
echo ============================================
echo   TRAE Guard - Remote Approval Monitor
echo ============================================
echo.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)
node src/index.js start
if errorlevel 1 (
    echo.
    echo TRAE Guard exited with error.
    pause
)
