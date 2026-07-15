@echo off
chcp 65001 >nul
title HabitatEye 生境监测平台

cd /d "%~dp0"

echo ============================================
echo   HabitatEye ^| 生境监测平台 Demo
echo ============================================
echo.
echo 正在启动本地服务器，请稍候...
echo.

REM 方案1: Python
where python >nul 2>nul
if %errorlevel% == 0 (
    echo [方案1/3] 使用 Python 启动...
    start "" "http://localhost:5173"
    echo.
    echo 访问地址: http://localhost:5173
    echo 关闭此窗口即可停止服务
    echo.
    python -m http.server 5173
    goto :eof
)

where python3 >nul 2>nul
if %errorlevel% == 0 (
    echo [方案1/3] 使用 Python 启动...
    start "" "http://localhost:5173"
    echo.
    echo 访问地址: http://localhost:5173
    echo 关闭此窗口即可停止服务
    echo.
    python3 -m http.server 5173
    goto :eof
)

REM 方案2: PowerShell (.NET HttpListener, Win10+ 自带)
echo [方案2/3] 使用 PowerShell 启动...
start "" "http://localhost:5173"
echo.
echo 访问地址: http://localhost:5173
echo 关闭此窗口即可停止服务
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [方案3/3] 启动失败，请尝试以下方法：
    echo.
    echo 1. 安装 Python: https://www.python.org/downloads/
    echo    安装时请勾选 "Add Python to PATH"
    echo.
    echo 2. 或使用 VS Code Live Server 插件打开 index.html
    echo.
    pause
)
