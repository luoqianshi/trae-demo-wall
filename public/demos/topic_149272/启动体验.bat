@echo off
chcp 65001 >nul
title 云上重逢 - 浏览器体验版
echo ================================
echo   云上重逢 - 浏览器体验版启动
echo ================================
echo.

cd /d "%~dp0"

:: 尝试使用 Python 启动 HTTP 服务器
where python >nul 2>&1
if %errorlevel% == 0 (
    echo 正在启动本地服务器...
    echo 浏览器将自动打开 http://localhost:8080
    echo.
    echo 关闭此窗口即可停止服务
    start /b "" cmd /c "timeout /t 2 >nul && start http://localhost:8080"
    python -m http.server 8080
    goto :eof
)

:: 尝试使用 Python3
where python3 >nul 2>&1
if %errorlevel% == 0 (
    echo 正在启动本地服务器...
    echo 浏览器将自动打开 http://localhost:8080
    echo.
    echo 关闭此窗口即可停止服务
    start /b "" cmd /c "timeout /t 2 >nul && start http://localhost:8080"
    python3 -m http.server 8080
    goto :eof
)

:: 尝试使用 Node.js
where npx >nul 2>&1
if %errorlevel% == 0 (
    echo 正在启动本地服务器...
    echo 浏览器将自动打开 http://localhost:8080
    echo.
    echo 关闭此窗口即可停止服务
    start /b "" cmd /c "timeout /t 2 >nul && start http://localhost:8080"
    npx http-server -p 8080 -c-1
    goto :eof
)

echo 未检测到 Python 或 Node.js，请安装其中之一：
echo   Python: https://www.python.org/downloads/
echo   Node.js: https://nodejs.org/
echo.
pause
