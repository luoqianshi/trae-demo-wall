@echo off
chcp 65001 >nul
title SlideForge AI Demo Studio

echo ==================================================
echo   SlideForge AI Demo Studio 启动脚本
echo ==================================================
echo.

REM 激活 conda base 环境
echo [1/4] 激活 conda base 环境...
call conda activate base
if errorlevel 1 (
    echo [警告] conda activate 失败，尝试使用当前 Python 环境
)

REM 切换到脚本所在目录
cd /d "%~dp0"

REM 安装依赖
echo [2/4] 检查并安装 Python 依赖...
pip install -q flask python-pptx playwright 2>nul
if errorlevel 1 (
    echo [警告] 部分依赖安装失败，请手动运行：pip install flask python-pptx playwright
)

REM 检查 playwright chromium
echo [3/4] 检查 Playwright Chromium 浏览器...
python -c "from playwright.sync_api import sync_playwright; p=sync_playwright().start(); p.chromium.launch(); p.stop()" 2>nul
if errorlevel 1 (
    echo 正在安装 Chromium，请稍候（首次需要几分钟）...
    playwright install chromium
)

REM 启动后端并打开浏览器
echo [4/4] 启动服务...
echo.
echo ==================================================
echo   服务已启动！
echo   请在浏览器访问：http://localhost:5000
echo   （3 秒后自动打开浏览器）
echo   按 Ctrl+C 可停止服务
echo ==================================================
echo.

REM 延迟 3 秒后打开浏览器
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5000"

REM 启动 Flask
python app.py

pause
