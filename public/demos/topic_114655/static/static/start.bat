@echo off
chcp 65001 >nul
title 族迹 · 电子族谱 Demo

echo ========================================
echo   族迹 · 电子族谱 Demo
echo   正在启动服务...
echo ========================================
echo.

REM 尝试 Node.js 的 npx serve
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo 启动成功！请在浏览器中访问：
    echo   http://localhost:8088
    echo.
    echo 预设账号：admin / admin123
    echo.
    echo 按 Ctrl+C 停止服务
    echo ========================================
    echo.
    npx serve . -p 8088 --no-clipboard
    if %errorlevel% equ 0 exit /b
)

REM 尝试 Python 内置 HTTP 服务器
where python >nul 2>nul
if %errorlevel% equ 0 (
    start "" "http://localhost:8088/login.html"
    python -m http.server 8088
    if %errorlevel% equ 0 exit /b
)

REM 都不可用则提示
echo 错误：未检测到 Node.js 或 Python。
echo 请安装 Node.js 后重试，或使用其他 HTTP 服务器工具。
echo.
pause
