@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion
cd /d "%~dp0"

title StudyAgent - Stop Server

echo ============================================
echo   StudyAgent - Stop Local Server
echo ============================================
echo.

set "FOUND=0"

:: ── Method 1: Kill by PID file ────────────────────────────
if exist "backend\server.pid" (
    set /p TARGET_PID=<"backend\server.pid"
    set "TARGET_PID=!TARGET_PID: =!"
    
    :: Verify the PID is actually our python server (check command line)
    powershell -Command "try { $p = Get-Process -Id !TARGET_PID! -ErrorAction Stop; if ($p.Path -and ($p.Path -like '*python*') -or $p.ProcessName -like 'python*') { exit 0 } else { exit 2 } } catch { exit 1 }" >nul 2>&1
    
    if not errorlevel 1 (
        echo [INFO] Stopping StudyAgent server (PID: !TARGET_PID!)...
        taskkill /PID !TARGET_PID! /F >nul 2>&1
        if not errorlevel 1 (
            echo [OK] Server stopped (by PID file).
            set "FOUND=1"
        )
    ) else if errorlevel 2 (
        echo [WARN] PID !TARGET_PID! exists but is not a Python process. Cleaning stale PID file.
    )
    del "backend\server.pid" >nul 2>&1
)

:: ── Method 2: Find python process listening on port 8765-8774 ──
if "!FOUND!"=="0" (
    for /L %%P in (8765,1,8774) do (
        :: Get PID listening on this port
        for /f "tokens=5" %%A in ('netstat -ano ^| findstr ":%%P " ^| findstr "LISTENING" 2^>nul') do (
            set "PORT_PID=%%A"
            :: Check if it's a python process
            powershell -Command "try { $p = Get-Process -Id !PORT_PID! -ErrorAction Stop; if ($p.ProcessName -like 'python*') { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
            if not errorlevel 1 (
                :: Double-check: does this python process have server.py in its command line?
                powershell -Command "try { $wmi = Get-WmiObject Win32_Process -Filter 'ProcessId=!PORT_PID!'; if ($wmi.CommandLine -like '*server.py*') { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
                if not errorlevel 1 (
                    echo [INFO] Found StudyAgent server on port %%P (PID: !PORT_PID!)...
                    taskkill /PID !PORT_PID! /F >nul 2>&1
                    if not errorlevel 1 (
                        echo [OK] Server stopped (port %%P).
                        set "FOUND=1"
                    )
                )
            )
        )
    )
)

:: ── Clean up PID file ─────────────────────────────────────
if exist "backend\server.pid" del "backend\server.pid" >nul 2>&1

echo.
if "!FOUND!"=="0" (
    echo [INFO] No running StudyAgent server found.
) else (
    echo [OK] StudyAgent local server has been stopped.
)

echo.
timeout /t 3 /nobreak >nul 2>&1
exit /b 0
