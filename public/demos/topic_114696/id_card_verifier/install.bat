@echo off
echo ========================================
echo   ID Card Verifier v2.5
echo   一键安装 (使用系统 Python)
echo ========================================
echo.
echo 请确保您已安装 Python 3.10 或 3.11！
echo 如果没有，请先安装: https://www.python.org/downloads/
echo.
pause

echo.
echo 检查 Python...
python --version
if errorlevel 1 (
    echo.
    echo [错误] 找不到 Python！
    echo 请先安装 Python，再重新运行本脚本。
    echo.
    pause
    exit /b 1
)

echo [OK] Python 已找到
echo.
echo ========================================
echo 安装依赖... (5-10分钟)
echo ========================================
echo.

pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo [警告] 部分依赖安装可能出错，但我们继续...
) else (
    echo.
    echo [OK] 所有依赖安装成功！
)

echo.
echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 接下来的步骤:
echo.
echo 1. 运行 download_models.bat (下载 OCR 模型，约 100MB)
echo 2. 运行 start.bat (启动程序)
echo.
pause
