@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   舌语 · 中医体质辨识 - 启动服务
echo ========================================
echo.

REM 尝试用 Python 启动
where python >nul 2>&1
if %errorlevel% equ 0 (
  echo [检测到 Python] 正在启动本地服务器...
  echo 请在浏览器打开: http://127.0.0.1:8000
  echo 按 Ctrl+C 停止服务
  echo.
  start "" "http://127.0.0.1:8000"
  python -m http.server 8000
  goto :end
)

where py >nul 2>&1
if %errorlevel% equ 0 (
  echo [检测到 Python Launcher] 正在启动本地服务器...
  echo 请在浏览器打开: http://127.0.0.1:8000
  start "" "http://127.0.0.1:8000"
  py -m http.server 8000
  goto :end
)

echo [未检测到 Python] 将直接打开 index.html
echo.
start "" "index.html"

:end
pause
