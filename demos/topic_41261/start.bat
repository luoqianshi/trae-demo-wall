@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   童心智伴 Demo 启动中...
echo.

where node >nul 2>nul
if %errorlevel%==0 (
    node server.js
    goto end
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo   未检测到 Node.js，使用 Python 启动...
    echo.
    echo   请在浏览器中打开: http://localhost:3000
    echo.
    python -m http.server 3000
    goto end
)

echo   错误: 需要安装 Node.js 或 Python 才能运行此 Demo
echo.
echo   安装 Node.js: https://nodejs.org/
echo   安装 Python:  https://www.python.org/
echo.
pause

:end
