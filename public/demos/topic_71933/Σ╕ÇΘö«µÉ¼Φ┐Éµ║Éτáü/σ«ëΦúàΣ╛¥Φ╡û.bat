@echo off
chcp 65001 >nul
echo.
echo  📦 一键搬运 — 安装依赖
echo.

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  ❌ 未找到 Python！
    echo  请先安装 Python 3.10+: https://www.python.org/downloads/
    echo  安装时请勾选 "Add Python to PATH"
    pause
    exit /b 1
)

echo  ✅ Python 已安装
python --version

:: 安装依赖
echo.
echo  📦 安装 Python 依赖包...
pip install -r requirements.txt
if errorlevel 1 (
    echo  ❌ 依赖安装失败
    pause
    exit /b 1
)

:: 安装 Playwright
echo.
echo  🌐 安装 Playwright 浏览器...
playwright install chromium
if errorlevel 1 (
    echo  ❌ Playwright 安装失败
    pause
    exit /b 1
)

echo.
echo  ══════════════════════════════════════
echo  ✅ 全部安装完成！
echo.
echo  🚀 双击 "启动.bat" 即可运行
echo  ══════════════════════════════════════
echo.
pause
