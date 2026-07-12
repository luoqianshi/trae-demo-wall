@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion
cd /d "%~dp0"

title StudyAgent - 本地后端启动

echo ============================================
echo   StudyAgent - 本地后端启动器
echo ============================================
echo.

:: ── 1. Check Python ──────────────────────────────────────
set "PYTHON_CMD="
where python >nul 2>&1
if not errorlevel 1 set "PYTHON_CMD=python"
if "!PYTHON_CMD!"=="" (
    where py >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=py"
)
if "!PYTHON_CMD!"=="" (
    where python3 >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=python3"
)

if "!PYTHON_CMD!"=="" (
    echo [错误] 未检测到 Python。
    echo.
    echo   比赛离线演示请双击「一键离线演示.bat」
    echo   （无需 Python / Node.js 等任何环境，解压即用）
    echo.
    pause
    exit /b 1
)

echo [OK] 检测到 Python：
!PYTHON_CMD! --version

:: ── 2. Check if server already running ────────────────────
:: Check port 8765-8774 for any existing StudyAgent instance
for /L %%P in (8765,1,8774) do (
    powershell -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %%P); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        echo.
        echo [信息] StudyAgent 本地服务已在端口 %%P 运行
        echo        正在打开浏览器...
        start "" "http://127.0.0.1:%%P"
        timeout /t 3 /nobreak >nul 2>&1
        exit /b 0
    )
)

:: Remove stale PID/log files
if exist "backend\server.pid" del "backend\server.pid" >nul 2>&1
if exist "backend\server.log" del "backend\server.log" >nul 2>&1

:: ── 3. Start backend as detached process ──────────────────
echo.
echo [信息] 正在启动 StudyAgent 本地后端...

:: Use PowerShell to start python detached (hidden window), redirect output to log
powershell -Command "Start-Process -FilePath '!PYTHON_CMD!' -ArgumentList 'backend\server.py' -WorkingDirectory '%cd%' -WindowStyle Hidden -RedirectStandardOutput 'backend\server.log' -RedirectStandardError 'backend\server.log'"

:: Wait briefly for process to start writing PID
timeout /t 3 /nobreak >nul 2>&1

:: ── 4. Poll for server readiness (check ports 8765-8774) ──
set "SERVER_PORT=0"
set "WAIT_COUNT=0"
set "MAX_WAIT=30"

echo [信息] 等待服务启动...
:poll_loop
timeout /t 1 /nobreak >nul 2>&1
set /a WAIT_COUNT+=1

:: Check each port
for /L %%P in (8765,1,8774) do (
    powershell -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', %%P); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
    if not errorlevel 1 (
        :: Verify it's our server by hitting /api/health
        powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:%%P/api/health' -TimeoutSec 2 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
        if not errorlevel 1 (
            set "SERVER_PORT=%%P"
            goto :server_ready
        )
    )
)

if !WAIT_COUNT! lss %MAX_WAIT% (
    goto poll_loop
)

:: Timeout - show log
echo.
echo [错误] 服务在 %MAX_WAIT% 秒内未能启动。
echo.
echo --- 服务日志 ---
if exist "backend\server.log" type "backend\server.log"
echo --- 日志结束 ---
echo.
pause
exit /b 1

:server_ready
echo [OK] 服务已启动：http://127.0.0.1:!SERVER_PORT!
echo.

:: ── 5. Open browser ──────────────────────────────────────
echo [信息] 正在打开浏览器...
start "" "http://127.0.0.1:!SERVER_PORT!"

echo.
echo ============================================
echo   服务已启动：http://127.0.0.1:!SERVER_PORT!
echo   停止服务：双击「停止服务.bat」
echo ============================================
echo.
echo 服务正在后台运行，可以安全关闭本窗口。
echo.
timeout /t 3 /nobreak >nul 2>&1
exit /b 0
