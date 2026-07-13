@echo off
cd /d "%~dp0"
echo Stopping Nginx gracefully...
nginx -s quit
timeout /t 2 /nobreak >nul
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I /N "nginx.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Graceful stop failed, force killing...
    taskkill /F /IM nginx.exe >nul
)
echo Nginx stopped.