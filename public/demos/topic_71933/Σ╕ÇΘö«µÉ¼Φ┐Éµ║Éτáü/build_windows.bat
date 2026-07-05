@echo off
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   🎬 一键搬运 — Windows 打包工具      ║
echo  ╚══════════════════════════════════════╝
echo.

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  ❌ 未找到 Python，请先安装 Python 3.10+
    echo  下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo  ✅ Python 已安装

:: 检查 pip
pip --version >nul 2>&1
if errorlevel 1 (
    echo  ❌ 未找到 pip
    pause
    exit /b 1
)

:: 安装依赖
echo.
echo  📦 安装 Python 依赖...
pip install -r requirements.txt -q
pip install pyinstaller -q
echo  ✅ 依赖安装完成

:: 安装 Playwright 浏览器
echo.
echo  🌐 安装 Playwright 浏览器...
playwright install chromium
echo  ✅ Playwright 浏览器安装完成

:: 创建输出目录
if not exist dist mkdir dist
if not exist build mkdir build

:: 打包
echo.
echo  🔨 开始打包...
pyinstaller build_windows.spec --clean --noconfirm

:: 复制 FFmpeg 提示
echo.
echo  ══════════════════════════════════════
echo  📦 打包完成！输出目录: dist\一键搬运\
echo.
echo  ⚠️  请手动将以下文件复制到 dist\一键搬运\ 目录：
echo     1. ffmpeg.exe — 从 https://ffmpeg.org/download.html 下载
echo     2. storage\  — 运行时自动创建
echo.
echo  🚀 双击 dist\一键搬运\一键搬运.exe 即可运行
echo  ══════════════════════════════════════
echo.
pause
