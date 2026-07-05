@echo off
chcp 65001 >nul 2>&1
title GhostCall

echo.
echo  [*] Starting GhostCall...

:: --- 1. Kill old GhostCall processes ---
echo  [*] Cleaning up old processes...
taskkill /F /FI "WINDOWTITLE eq GhostCall Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq node server.js*" >nul 2>&1
taskkill /F /IM cloudflared-windows-amd64.exe >nul 2>&1
timeout /t 1 /nobreak >nul 2>&1

:: --- 2. Check Node.js ---
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Node.js not found
    echo      Please run ghostcall.exe instead
    echo.
    pause
    exit /b 1
)

:: --- 3. Go to script directory ---
cd /d "%~dp0"

:: --- 4. Install dependencies ---
if not exist "node_modules\ws" (
    echo  [*] Installing dependencies...
    call npm install --production >nul 2>&1
    if %errorlevel% neq 0 (
        echo  [!] Install failed
        pause
        exit /b 1
    )
    echo  [*] Done
)

:: --- 5. Start server in background ---
echo  [*] Starting server...
start "" /min node server.js

:: --- 6. Wait for server port to be ready ---
echo  [*] Waiting for server...
set /a retries=0
:waitloop
timeout /t 1 /nobreak >nul 2>&1
set /a retries+=1
:: Use PowerShell to reliably check if port 8080 is listening
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue" >nul 2>&1
if %errorlevel% neq 0 (
    if %retries% lss 15 goto :waitloop
    echo  [!] Server did not start in 15 seconds
    pause
    exit /b 1
)

:: --- 7. Open browser ---
start "" "http://localhost:8080"

echo.
echo  ========================================
echo   GhostCall started!
echo   Local:  http://localhost:8080
echo  ========================================
echo.

:: --- 8. Poll tunnel URL and display it ---
echo  [*] Waiting for Cloudflare Tunnel...
set /a tunnel_retries=0
:tunnelloop
if %tunnel_retries% geq 25 (
    echo.
    echo  [!] Cloudflare Tunnel not ready
    echo      LAN users: http://YOUR-LAN-IP:8080/?room=RoomName
    echo.
    goto :done
)
set /a tunnel_retries+=1
timeout /t 2 /nobreak >nul 2>&1
:: Use PowerShell to fetch tunnel URL from API
for /f "delims=" %%u in ('powershell -NoProfile -Command "(try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/api/tunnel-url' -UseBasicParsing -TimeoutSec 3; ($r.Content | ConvertFrom-Json).tunnelUrl } catch { $null })" 2^>nul') do (
    if not "%%u"=="" (
        echo.
        echo  ========================================
        echo   Public: %%u/?room=RoomName
        echo  ========================================
        echo.
        goto :done
    )
)
goto :tunnelloop

:done
pause
