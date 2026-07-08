@echo off
REM ============================================
REM clean_tia.bat - Kill residual TIA Portal processes
REM Run this BEFORE starting the MCP server
REM ============================================
setlocal enabledelayedexpansion

echo [TIA_CLEAN] Cleaning residual TIA Portal processes...

for /l %%i in (1,1,3) do (
    taskkill /f /im Portal.exe 2>nul
    taskkill /f /im FileStorage.Server.exe 2>nul
    if %%i lss 3 (
        timeout /t 5 /nobreak >nul
    )
)

echo [TIA_CLEAN] Waiting for processes to fully exit...
timeout /t 8 /nobreak >nul

REM Check if any remain
tasklist /nh /fi "IMAGENAME eq Portal.exe" 2>nul | find /i "Portal.exe" >nul
if !errorlevel! equ 0 (
    echo [TIA_CLEAN] Portal.exe still running! Trying WMIC fallback...
    wmic process where "name='Portal.exe'" delete 2>nul
    timeout /t 5 /nobreak >nul
)

tasklist /nh /fi "IMAGENAME eq FileStorage.Server.exe" 2>nul | find /i "FileStorage.Server.exe" >nul
if !errorlevel! equ 0 (
    echo [TIA_CLEAN] FileStorage.Server.exe still running! Trying WMIC...
    wmic process where "name='FileStorage.Server.exe'" delete 2>nul
    timeout /t 5 /nobreak >nul
)

REM Final verification
tasklist /nh /fi "IMAGENAME eq Portal.exe" 2>nul | find /i "Portal.exe" >nul
if !errorlevel! equ 0 (
    echo [TIA_CLEAN WARN] Portal.exe could not be terminated.
    echo [TIA_CLEAN WARN] Please close TIA Portal manually and try again.
    exit /b 1
) else (
    echo [TIA_CLEAN OK] All TIA Portal processes cleaned.
    exit /b 0
)
