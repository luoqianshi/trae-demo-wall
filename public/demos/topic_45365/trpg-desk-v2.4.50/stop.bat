@echo off
cd /d "%~dp0"
echo Stopping TRPG Desk...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
  taskkill /F /PID %%P >nul 2>&1
  echo Stopped PID %%P
)
echo Done.
pause
