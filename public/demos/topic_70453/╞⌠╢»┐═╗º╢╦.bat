@echo off
chcp 936 >nul
title Chat Platform - 客户端
cd /d "%~dp0frontend"
echo ========================================
echo   Chat Platform 桌面客户端
echo   请先启动"启动后端.bat"
echo ========================================
echo.
echo 正在启动 GUI...
python -m app.main
pause
