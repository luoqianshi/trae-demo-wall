@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   novel-writer demo 启动中...
echo ========================================
echo.
echo 浏览器即将打开 http://localhost:8765
echo 首次访问需配置 DeepSeek API Key
echo 按 Ctrl+C 可停止服务
echo.

start "" http://localhost:8765

python --version >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 python 启动服务器...
    python -m http.server 8765
    goto :eof
)

python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 python3 启动服务器...
    python3 -m http.server 8765
    goto :eof
)

py --version >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 py 启动服务器...
    py -m http.server 8765
    goto :eof
)

echo.
echo ❌ 错误：未找到 Python
echo    请安装 Python 并确保 python 命令在 PATH 中
echo    或激活你的 conda 环境后再运行此脚本：
echo    conda activate vibe-writing
echo.
pause