@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo   Smart RSS Reader - Local Launcher
echo ============================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    echo Python detected, starting http.server ...
    echo Open browser at: http://localhost:8000/
    echo Press Ctrl+C to stop
    echo.
    python -m http.server 8000
    goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo Python launcher detected, starting http.server ...
    echo Open browser at: http://localhost:8000/
    echo Press Ctrl+C to stop
    echo.
    py -m http.server 8000
    goto :end
)

echo Python not found, opening index.html directly ...
echo Note: Some browsers restrict IndexedDB/fetch for file:// URLs.
echo It is recommended to install Python for best experience.
echo.

if exist "index.html" (
    start "" "index.html"
) else (
    echo Error: index.html not found
)

:end
pause