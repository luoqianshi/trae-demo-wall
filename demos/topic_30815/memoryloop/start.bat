@echo off
REM Memory Loop - Windows startup script
REM Launches the local server and opens the dashboard

setlocal
set SCRIPT_DIR=%~dp0

echo.
echo  Starting Memory Loop...
echo.

start "Memory Loop Server" /D "%SCRIPT_DIR%" node server/server.js

REM Wait for server to start
timeout /t 2 /nobreak >nul

REM Open browser
start http://localhost:3721

echo  Dashboard opened at http://localhost:3721
echo  Press Ctrl+C in the server window to stop.
echo.
endlocal
