@echo off
chcp 65001 >nul
title 知识星图 · 2D/3D 双模式知识星系
echo ============================================
echo   知识星图 · 2D/3D 双模式知识星系
echo   正在启动本地服务器...
echo ============================================
echo.

cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel% == 0 (
    echo 检测到 Python，启动 HTTP 服务器 (端口 8765)...
    echo.
    echo 请在浏览器中访问: http://localhost:8765/知识星图-双模式.html
    echo.
    echo 按 Ctrl+C 可停止服务器
    echo.
    start "" "http://localhost:8765/知识星图-双模式.html"
    python -m http.server 8765
    goto :eof
)

where py >nul 2>nul
if %errorlevel% == 0 (
    echo 检测到 Python Launcher，启动 HTTP 服务器 (端口 8765)...
    echo.
    echo 请在浏览器中访问: http://localhost:8765/知识星图-双模式.html
    echo.
    echo 按 Ctrl+C 可停止服务器
    echo.
    start "" "http://localhost:8765/知识星图-双模式.html"
    py -m http.server 8765
    goto :eof
)

echo 未检测到 Python，请先安装 Python 3.x
echo 下载地址: https://www.python.org/downloads/
echo.
echo 安装时请勾选 "Add Python to PATH"
echo.
pause
