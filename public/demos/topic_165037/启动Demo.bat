@echo off
title Yuezhi AI - Demo Launcher

echo ========================================
echo    Yuezhi AI Demo - Quick Start
echo ========================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [Step 1/5] Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed.
    echo Please install Node.js v18 or higher from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo OK: Node.js installed
node -v
echo.

echo [Step 2/5] Checking backend dependencies...
cd /d "%SCRIPT_DIR%backend"
if not exist "node_modules" (
    echo Installing backend dependencies, please wait...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Failed to install backend dependencies
        echo.
        pause
        exit /b 1
    )
) else (
    echo OK: Backend dependencies ready
)
cd /d "%SCRIPT_DIR%"
echo.

echo [Step 3/5] Checking frontend dependencies...
cd /d "%SCRIPT_DIR%frontend"
if not exist "node_modules" (
    echo Installing frontend dependencies, please wait...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Failed to install frontend dependencies
        echo.
        pause
        exit /b 1
    )
) else (
    echo OK: Frontend dependencies ready
)
cd /d "%SCRIPT_DIR%"
echo.

echo [Step 4/5] Setting up demo data...
cd /d "%SCRIPT_DIR%backend"
call npx tsx src/setup-demo.ts
cd /d "%SCRIPT_DIR%"
echo.

echo [Step 5/5] Starting services...
echo.
echo ========================================
echo    Starting services...
echo ========================================
echo.

cd /d "%SCRIPT_DIR%backend"
start "" cmd /k "npx tsx src/index.ts"

echo Waiting for backend (3s)...
timeout /t 3 /nobreak >nul

cd /d "%SCRIPT_DIR%frontend"
start "" cmd /k "npm run dev"

echo Waiting for frontend (8s)...
timeout /t 8 /nobreak >nul

cd /d "%SCRIPT_DIR%"

echo.
echo ========================================
echo    Startup Complete!
echo ========================================
echo.
echo Frontend URL: http://localhost:5173/
echo Backend URL:  http://localhost:3000/
echo.
echo Demo Account:
echo   Email: demo@yuezhi.ai
echo   Pass:  demo123456
echo.
echo Tips:
echo   - Browser will open automatically
echo   - Closing this window will NOT stop services
echo   - To stop services, close the two new cmd windows
echo.

start "" "http://localhost:5173/"

echo Press any key to close this window (services keep running)...
pause >nul
