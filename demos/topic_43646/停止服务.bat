@echo off
chcp 65001 >nul
echo ================================
echo   停止服务中...
echo ================================
taskkill /f /im node.exe 2>nul
echo 服务已停止
pause