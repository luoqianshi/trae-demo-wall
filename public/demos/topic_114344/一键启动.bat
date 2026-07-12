@echo off
chcp 65001 >nul 2>&1
title 财智毛利通 - 投资人演示

echo ========================================
echo   财智毛利通 - 投资人演示Demo
echo ========================================
echo.

cd /d "%~dp0"

REM 尝试使用 Python
where python >nul 2>&1
if %errorlevel%==0 (
    echo 正在使用 Python 启动本地服务器...
    echo.
    echo 浏览器将自动打开，请勿关闭此窗口。
    echo 演示结束后关闭此窗口即可。
    echo.
    start /b cmd /c "timeout /t 2 >nul && start http://localhost:8899/demo.html"
    python -m http.server 8899
    goto :end
)

REM 尝试使用 Python3
where python3 >nul 2>&1
if %errorlevel%==0 (
    echo 正在使用 Python3 启动本地服务器...
    echo.
    echo 浏览器将自动打开，请勿关闭此窗口。
    echo 演示结束后关闭此窗口即可。
    echo.
    start /b cmd /c "timeout /t 2 >nul && start http://localhost:8899/demo.html"
    python3 -m http.server 8899
    goto :end
)

REM 尝试使用 Node.js
where npx >nul 2>&1
if %errorlevel%==0 (
    echo 正在使用 Node.js 启动本地服务器...
    echo.
    echo 浏览器将自动打开，请勿关闭此窗口。
    echo 演示结束后关闭此窗口即可。
    echo.
    start /b cmd /c "timeout /t 3 >nul && start http://localhost:8899/demo.html"
    npx http-server -p 8899 --cors
    goto :end
)

echo ========================================
echo 未检测到 Python 或 Node.js 环境
echo ========================================
echo.
echo 请安装以下任一环境后重试：
echo.
echo 方法1：安装 Python（推荐）
echo   下载地址：https://www.python.org/downloads/
echo   安装时勾选 "Add Python to PATH"
echo   安装完成后双击此文件即可
echo.
echo 方法2：安装 Node.js
echo   下载地址：https://nodejs.org/
echo   安装完成后双击此文件即可
echo.
pause

:end
