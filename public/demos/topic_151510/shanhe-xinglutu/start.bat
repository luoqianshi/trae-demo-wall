@echo off
chcp 65001 >nul
REM 山河行旅图 - 一键启动（Windows）

setlocal
set PORT=5173
set DIR=%~dp0
cd /d "%DIR%"

echo ===================================
echo   山河行旅图 · 一键启动
echo ===================================

where python >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.x 后重试。
    echo        下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

netstat -ano | findstr ":%PORT% " >nul 2>nul
if not errorlevel 1 (
    echo [提示] 端口 %PORT% 已被占用，尝试直接打开现有服务...
) else (
    echo [启动] 正在 %PORT% 端口启动本地服务器...
    start "shanhe-xinglutu" /min cmd /c "python -m http.server %PORT%"
    timeout /t 2 >nul
)

set URL=http://localhost:%PORT%/
echo [完成] 访问地址：%URL%

start "" "%URL%"

echo.
echo 提示：本启动器窗口可最小化，不要关闭。
echo      关闭后请在任务管理器结束 python.exe 进程。
pause
