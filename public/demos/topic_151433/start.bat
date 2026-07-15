@echo off
chcp 65001 >nul
title 不突 NoBulge · 本地启动
cd /d "%~dp0"
set PORT=8765

echo ==============================
echo   不突 NoBulge ^| 本地启动
echo ==============================
echo.

where python >nul 2>&1
if %errorlevel%==0 (
    echo [√] 使用 python 启动服务
    echo [→] 浏览器打开: http://localhost:%PORT%
    echo [→] 按 Ctrl+C 关闭服务
    echo.
    start "" http://localhost:%PORT%
    python -m http.server %PORT%
    goto end
)

where python3 >nul 2>&1
if %errorlevel%==0 (
    echo [√] 使用 python3 启动服务
    echo [→] 浏览器打开: http://localhost:%PORT%
    echo [→] 按 Ctrl+C 关闭服务
    echo.
    start "" http://localhost:%PORT%
    python3 -m http.server %PORT%
    goto end
)

where py >nul 2>&1
if %errorlevel%==0 (
    echo [√] 使用 py 启动服务
    echo [→] 浏览器打开: http://localhost:%PORT%
    echo [→] 按 Ctrl+C 关闭服务
    echo.
    start "" http://localhost:%PORT%
    py -m http.server %PORT%
    goto end
)

where npx >nul 2>&1
if %errorlevel%==0 (
    echo [√] 使用 npx http-server 启动服务
    echo [→] 浏览器打开: http://localhost:%PORT%
    echo [→] 按 Ctrl+C 关闭服务
    echo.
    start "" http://localhost:%PORT%
    npx --yes http-server -p %PORT% -c-1 .
    goto end
)

echo [×] 未找到 python 或 npx
echo     请安装 Python 3: https://www.python.org/downloads/
echo     或安装 Node.js: https://nodejs.org/
pause

:end
