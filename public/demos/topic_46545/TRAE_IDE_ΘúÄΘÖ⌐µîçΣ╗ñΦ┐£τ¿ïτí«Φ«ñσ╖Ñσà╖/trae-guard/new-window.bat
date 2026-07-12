@echo off
chcp 65001 >nul
echo Launching new TRAE IDE window for trae-guard...
cd /d "%~dp0"
if not exist node_modules (
    echo Installing dependencies first...
    call npm install
)
node src/index.js new
pause
