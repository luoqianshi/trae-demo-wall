@echo off
chcp 65001 >nul
echo.
echo  🎬 一键搬运 启动中...
echo.
cd /d "%~dp0"
python launcher.py
if errorlevel 1 (
    echo.
    echo  启动失败，请检查 Python 和依赖是否安装
    pause
)
