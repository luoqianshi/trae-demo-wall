@echo off
chcp 65001 >nul
echo Starting GuardianAngel...
echo.

set "HTML_FILE=%~dp0index.html"
set "BROWSER="

for %%b in (chrome.exe msedge.exe firefox.exe opera.exe brave.exe) do (
    where.exe "%%b" >nul 2>&1
    if not errorlevel 1 (
        set "BROWSER=%%b"
        goto :open
    )
)

:open
if defined BROWSER (
    echo Found browser: %BROWSER%
    start "" "%BROWSER%" "%HTML_FILE%"
) else (
    echo No common browser found, trying default...
    start "" "%HTML_FILE%"
)

echo.
echo GuardianAngel has started. Please use it in your browser.
echo If the browser doesn't open automatically, open index.html manually.
echo.
pause