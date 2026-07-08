@echo off
cd /d "%~dp0"

echo.
echo   ============================================
echo     TRPG Desk v2.4.50
echo   ============================================
echo.

REM 1) Check node
where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found!
  echo Please install Node.js first: https://nodejs.org/
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo [OK] node %%v

REM 2) Check npm
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found!
  pause
  exit /b 1
)

REM 3) Install dependencies
if not exist "node_modules" (
  echo [..] First run, installing dependencies...
  call npm install --omit=dev
  if errorlevel 1 (
    echo [ERROR] npm install failed. Check your network.
    pause
    exit /b 1
  )
  echo [OK] Dependencies installed
) else (
  echo [OK] Dependencies ready
)

REM 4) Free port 3000 if occupied
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
  echo [WARN] Port 3000 is in use, freeing it...
  for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%P >nul 2>&1
  )
  timeout /t 1 /nobreak >nul
)

REM 5) Auto open browser after 3 seconds
echo [INFO] Browser will open http://localhost:3000 in 3 seconds...
start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

REM 6) Start server
echo.
echo [START] Starting server... (Press Ctrl+C to stop)
echo ------------------------------------------
node server.js
echo.
echo [INFO] Server stopped.
pause
