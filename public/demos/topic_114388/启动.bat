@echo off
chcp 65001 >nul
title 期末复习规划助手 - 本地服务器

echo ========================================
echo   期末复习规划助手 - 本地服务器
echo ========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [信息] 已检测到 Node.js
node -v
echo.
echo [信息] 正在启动本地服务器 (端口 8765)...
echo [提示] 浏览器会自动打开 http://localhost:8765
echo [提示] 按 Ctrl+C 可关闭服务器
echo.

start "" "http://localhost:8765"
npx --yes http-server . -p 8765 -c-1 -o
pause
