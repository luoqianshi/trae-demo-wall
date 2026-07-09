@echo off
chcp 65001 >nul
cd /d "%~dp0"

if /i "%1"=="html" goto :html
if /i "%1"=="web" goto :html

echo ===== RunOverlay Demo 启动（Python 版） =====
python demo.py %*
if errorlevel 1 (
    echo.
    echo Demo 运行失败，请检查依赖是否安装：pip install -r requirements.txt
    pause
)
goto :eof

:html
echo ===== RunOverlay Demo 启动（HTML 版） =====
start "" demo.html
