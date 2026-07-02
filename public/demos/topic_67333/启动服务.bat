@echo off
title AI Study Tutor

echo ========================================
echo   AI Study Tutor - Starting...
echo ========================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

if not exist "node_modules" (
    echo [INFO] First run: installing dependencies...
    echo This may take 1-2 minutes.
    echo.
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo Please check your network connection.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [DONE] Dependencies installed successfully!
    echo.
)

echo [INFO] Chrome / Edge / Firefox recommended
echo.
echo Starting server...
echo.
echo If browser doesn't open, visit: http://localhost:5173
echo.
echo Press Ctrl+C to stop server
echo.

call npm.cmd run dev

pause
