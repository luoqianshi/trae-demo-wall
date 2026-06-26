@echo off
chcp 65001 >nul 2>&1

REM Switch to script directory
cd /d "%~dp0"

echo.
echo  ========================================
echo   TongLu AA - Local Server
echo  ========================================
echo.

REM Check if port 8000 is already in use
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
  echo  Port 8000 is already in use.
  echo  Opening browser to existing server...
  start http://localhost:8000/index.html
  exit /b 0
)

REM Check for py launcher
where py >nul 2>&1
if %errorlevel%==0 goto :run_py

REM Check for python
where python >nul 2>&1
if %errorlevel%==0 goto :check_python_real

REM Check for python3
where python3 >nul 2>&1
if %errorlevel%==0 goto :run_python3

REM Check for node
where node >nul 2>&1
if %errorlevel%==0 goto :run_node

goto :notfound

:check_python_real
python -c "import sys; sys.exit(0)" >nul 2>&1
if not errorlevel 1 goto :run_python
goto :check_python3_fallback

:run_py
echo  Found Python via py launcher, starting server...
goto :start_server_py

:run_python
echo  Found Python, starting server...
goto :start_server_python

:run_python3
echo  Found Python3, starting server...
goto :start_server_python3

:run_node
echo  Found Node.js, starting server...
goto :start_server_node

:start_server_py
echo  Browser will open http://localhost:8000 in 2 seconds
echo  Press Ctrl+C to stop
echo.
start "" /b cmd /c "timeout /t 2 /nobreak >nul 2>&1 & start http://localhost:8000/index.html"
py -m http.server 8000
pause
exit /b 0

:start_server_python
echo  Browser will open http://localhost:8000 in 2 seconds
echo  Press Ctrl+C to stop
echo.
start "" /b cmd /c "timeout /t 2 /nobreak >nul 2>&1 & start http://localhost:8000/index.html"
python -m http.server 8000
pause
exit /b 0

:start_server_python3
echo  Browser will open http://localhost:8000 in 2 seconds
echo  Press Ctrl+C to stop
echo.
start "" /b cmd /c "timeout /t 2 /nobreak >nul 2>&1 & start http://localhost:8000/index.html"
python3 -m http.server 8000
pause
exit /b 0

:start_server_node
echo  Browser will open http://localhost:8000 in 2 seconds
echo  Press Ctrl+C to stop
echo.
start "" /b cmd /c "timeout /t 2 /nobreak >nul 2>&1 & start http://localhost:8000/index.html"
node server.js
pause
exit /b 0

:check_python3_fallback
where python3 >nul 2>&1
if %errorlevel%==0 goto :run_python3
where node >nul 2>&1
if %errorlevel%==0 goto :run_node

:notfound
echo  [ERROR] No Python or Node.js found
echo.
echo  Please install one of the following:
echo.
echo    Python:  https://www.python.org/downloads/
echo    Node.js: https://nodejs.org/
echo.
echo  After installation, double-click start.bat again.
echo.
pause
exit /b 1
