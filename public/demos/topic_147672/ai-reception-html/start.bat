@echo off
chcp 65001 >nul 2>&1
title AI 自助接待系统

echo.
echo ========================================
echo   AI 自助接待系统 - 本地预览
echo ========================================
echo.

:: 尝试 Python
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 找到 Python
    echo.
    echo   即将启动本地服务器...
    echo   启动后请访问: http://localhost:8080/demo.html
    echo.
    echo   按 Ctrl+C 可停止服务
    echo.
    pause
    start http://localhost:8080/demo.html
    python -m http.server 8080
    goto :eof
)

where python3 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 找到 Python3
    echo.
    echo   即将启动本地服务器...
    echo   启动后请访问: http://localhost:8080/demo.html
    echo.
    echo   按 Ctrl+C 可停止服务
    echo.
    pause
    start http://localhost:8080/demo.html
    python3 -m http.server 8080
    goto :eof
)

:: 尝试 Node.js
where npx >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] 找到 Node.js
    echo.
    echo   即将启动本地服务器...
    echo   启动后请访问: http://localhost:8080/demo.html
    echo.
    echo   按 Ctrl+C 可停止服务
    echo.
    pause
    start http://localhost:8080/demo.html
    npx serve -l 8080
    goto :eof
)

echo [ERROR] 未找到可用的服务器工具
echo.
echo   本项目需要以下任一工具来启动本地服务器:
echo.
echo   1. Python (推荐, Windows 可从 https://www.python.org/ 下载)
echo   2. Node.js (可从 https://nodejs.org/ 下载)
echo.
echo   安装 Python 后, 再次双击本文件即可运行。
echo.
pause
