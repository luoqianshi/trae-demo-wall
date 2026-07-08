@echo off
chcp 936 >nul
title Chat Platform - 后端
cd /d "%~dp0backend"
echo ========================================
echo   Chat Platform 后端服务器
echo   地址: http://127.0.0.1:8000
echo   API文档: http://127.0.0.1:8000/docs
echo ========================================
echo.
echo 正在启动...
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
