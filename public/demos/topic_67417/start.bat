@echo off
chcp 65001 >nul
title ANDA FMEA 演示系统

echo ==============================================
echo          ANDA FMEA 智能质量工作台
echo ==============================================
echo.
echo 正在启动本地服务器...请稍候...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0start.ps1"

pause