@echo off
title Bilingual Reader Demo

echo ==========================================
echo   Bilingual Reader Demo
echo ==========================================
echo.
echo Starting local server...
echo Browser will open automatically.
echo Do NOT close this window.
echo.

python -m http.server 8080 >nul 2>&1
if %errorlevel%==0 (
    start http://localhost:8080
    echo Server started: http://localhost:8080
    echo Do NOT close this window.
    pause
    exit
)

where npx >nul 2>&1
if %errorlevel%==0 (
    npx http-server -p 8080 -c-1 --cors -o
    pause
    exit
)

echo.
echo Error: Python or Node.js is required.
echo Install Python: https://python.org
echo Install Node.js: https://nodejs.org
echo.
pause
