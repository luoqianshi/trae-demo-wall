@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title HengZhou - One Click Start
cd /d "%~dp0"

echo ============================================
echo   HengZhou - One Click Start (Full Version)
echo   Single window mode - all logs in here
echo ============================================
echo.

REM === [1/5] Check Node.js ===
echo [1/5] Checking environment...
where node >nul 2>&1
if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Node.js not found. Please install Node.js 18+
    echo Download: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=1 delims=." %%v in ('node -v 2^>nul') do set "NODE_VERSION_RAW=%%v"
if not defined NODE_VERSION_RAW (
    echo.
    echo [ERROR] Cannot get Node.js version.
    echo.
    pause
    exit /b 1
)
set "NODE_MAJOR=!NODE_VERSION_RAW:v=!"
set "NODE_MAJOR=!NODE_MAJOR: =!"
if "!NODE_MAJOR!"=="" set "NODE_MAJOR=0"
if !NODE_MAJOR! lss 18 (
    echo [WARNING] Node.js version too old, recommend 18+
) else (
    echo   Node.js: !NODE_VERSION_RAW!
    for /f "delims=" %%n in ('npm -v 2^>nul') do echo   npm: %%n
)
echo.

REM === [2/5] Install dependencies ===
echo [2/5] Checking dependencies...
if not exist "node_modules" (
    echo   node_modules not found, installing... (1-3 min)
    call npm install
    if !errorlevel! neq 0 (
        echo.
        echo [ERROR] npm install failed. Check network.
        echo Tip: npm config set registry https://registry.npmmirror.com
        echo.
        pause
        exit /b 1
    )
    echo   Dependencies installed.
) else (
    echo   node_modules exists, skipping.
)
echo.

REM === [3/5] Check .env config ===
echo [3/5] Checking config...
set "NEED_ENV_EDIT=0"
if not exist ".env" (
    echo   .env not found, creating from .env.example...
    copy .env.example .env >nul 2>&1
    set "NEED_ENV_EDIT=1"
)
if "!NEED_ENV_EDIT!"=="1" (
    echo.
    echo   ----------------------------------------------
    echo   IMPORTANT: Edit .env to fill in API Key
    echo.
    echo   DOUBAO_API_KEY=your-doubao-key (required)
    echo   DEEPSEEK_API_KEY=your-deepseek-key (optional)
    echo.
    echo   Get keys:
    echo   Doubao: https://console.volcengine.com/ark/
    echo   DeepSeek: https://platform.deepseek.com/
    echo.
    echo   Edit .env manually after startup if needed.
    echo   Default keys are pre-configured for demo.
    echo   ----------------------------------------------
) else (
    echo   .env exists, continuing.
)
echo.

REM === [4/5] Kill old processes on ports ===
echo [4/5] Cleaning old processes...
call :killByPort 3001
call :killByPort 5173
call :killByPort 5174
call :killByPort 5175
timeout /t 1 /nobreak >nul 2>&1
echo.

REM === [5/5] Start backend + frontend in ONE window ===
echo [5/5] Starting backend + frontend (single window)...
echo.
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo   Browser will open automatically in 8 seconds...
echo   Press Ctrl+C to stop all services.
echo ============================================
echo.

REM Schedule browser to open after 8 seconds (non-blocking)
start /b cmd /c "timeout /t 8 /nobreak >nul 2>&1 & start "" http://localhost:5173"

REM Run both backend and frontend in this single window via concurrently
REM Output is color-coded: [SERVER] cyan, [CLIENT] magenta
REM Ctrl+C will kill both processes and clean up
call npm run dev:all

REM If we get here, the processes ended
echo.
echo ============================================
echo   Services stopped.
echo   To restart: run start.bat again
echo ============================================
pause
goto :end

:killByPort
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%~1 "') do (
    if "%%a" neq "0" (
        echo   - Killing port %~1 (PID: %%a)
        taskkill /F /PID %%a >nul 2>&1
    )
)
goto :eof

:end
endlocal
