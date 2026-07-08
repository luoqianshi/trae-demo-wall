@echo off
setlocal
cd /d "%~dp0"
title Yuecai Assistant Service
echo ========================================
echo   Yuecai Assistant
echo   Starting service...
echo ========================================
echo.
echo API URL: http://localhost:8001
echo Health check: http://localhost:8001/api/health
echo Press Ctrl+C to stop the service
echo.
.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001
pause
