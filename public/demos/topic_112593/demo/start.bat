@echo off

echo.
echo  ==========================================
echo    MingChen - Local Server Launcher
echo  ==========================================
echo.

echo  Checking Node.js...
node -v >nul 2>&1
if not errorlevel 1 (
    echo  [Node.js OK]
    echo  Starting server...
    echo.
    node server.js
    pause
    exit /b 0
)

echo  Checking Python...
python --version >nul 2>&1
if not errorlevel 1 (
    echo  [Python OK]
    echo  Starting server...
    echo.
    python -m http.server 3521
    pause
    exit /b 0
)

echo  Checking Python3...
python3 --version >nul 2>&1
if not errorlevel 1 (
    echo  [Python3 OK]
    echo  Starting server...
    echo.
    python3 -m http.server 3521
    pause
    exit /b 0
)

echo.
echo  [ERROR] Node.js or Python not found
echo.
echo  Please install Node.js first:
echo    https://nodejs.org/
echo  Download LTS version, install with default options
echo.
pause
exit /b 1