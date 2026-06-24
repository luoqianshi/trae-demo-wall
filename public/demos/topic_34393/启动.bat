@echo off
chcp 65001 >nul
title Life Simulator

cd /d "%~dp0website\server"

echo ========================================
echo   Third-Person Life Simulator
echo ========================================
echo.

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install --production
    echo.
)

echo Starting server...

start /B node dist/server/src/index.js

timeout /t 3 /nobreak >nul

start http://localhost:8787

echo.
echo Browser opened. Press any key to stop server...
pause >nul

taskkill /F /IM node.exe >nul 2>&1