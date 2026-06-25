@echo off
title Chuannan Travel Planner
color 0A
setlocal enabledelayedexpansion

echo.
echo  ================================================
echo       Chuannan Travel Planner - Launcher
echo  ================================================
echo.

:: Get current directory
set CURRENT_DIR=%~dp0
cd /d "%CURRENT_DIR%"

:: Step 1: Check Node.js
echo [Step 1/4] Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  ================================================
    echo   ERROR: Node.js not found, please install
    echo  ================================================
    echo   Download: https://nodejs.org/
    echo   Recommend: LTS version
    echo  ================================================
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo  OK: Node.js installed: %NODE_VERSION%
echo.

:: Step 2: Check dependencies
echo [Step 2/4] Checking dependencies...
if not exist "node_modules" (
    echo  INFO: Installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: Install failed, run manually: npm install
        pause
        exit /b 1
    )
    echo  OK: Dependencies installed
) else (
    echo  OK: Dependencies exist
)
echo.

:: Step 3: Configure API Key
echo [Step 3/4] Checking API configuration...
if not exist ".env" (
    echo.
    echo  ================================================
    echo   INFO: Amap API Key not configured
    echo  ================================================
    echo   Map and Weather need Amap API Key
    echo   Apply at: https://lbs.amap.com/
    echo  ================================================
    echo.
    echo  Configure now? (Y/N)
    set /p CONFIG_API=
    
    if /i "!CONFIG_API!"=="Y" (
        echo.
        echo  Enter your Amap Web Service API Key:
        set /p AMAP_KEY_INPUT=
        
        if "!AMAP_KEY_INPUT!" neq "" (
            echo AMAP_KEY=!AMAP_KEY_INPUT! > .env
            echo  OK: API Key saved to .env
        ) else (
            echo  INFO: Skipped
            echo  You can create .env file manually
            echo  Format: AMAP_KEY=your_key_here
        )
    ) else (
        echo  INFO: Skipped
        echo  Note: Map and Weather unavailable without API Key
        echo  But itinerary planning still works
    )
) else (
    echo  OK: API configured
)
echo.

:: Step 4: Start service
echo [Step 4/4] Starting service...
echo.

:: Kill existing processes
taskkill /F /IM node.exe >nul 2>nul

:: Start backend (minimized window)
start "Backend Service" /min node server.js

:: Wait for startup
echo  INFO: Waiting for server...
timeout /t 3 /nobreak >nul

:: Check if started
netstat -ano | findstr ":4000" >nul
if %errorlevel% equ 0 (
    echo  OK: Service started
) else (
    echo  WARN: Service may failed, check logs
)

:: Open browser
echo  INFO: Opening browser...
start http://localhost:4000

echo.
echo  ================================================
echo  SUCCESS!
echo.
echo  URL: http://localhost:4000
echo  Stop: Run stop-service.bat or close Node.js window
echo.
echo  Press any key to exit launcher...
pause >nul

exit /b 0