@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   身份证核对工具 v2.5
echo   便携式 Python 设置 (完整教程版)
echo ========================================
echo.
echo 请按下面步骤一步一步操作！
echo.

REM Step 1: Check for zip
if not exist "python-3.10.11-embed-amd64.zip" (
    echo [错误] 找不到 zip 文件！
    echo 请确保 python-3.10.11-embed-amd64.zip 在本文件夹
    pause
    exit /b 1
)

REM Cleanup
echo [步骤 1/7] 清理旧文件...
if exist "python" rmdir /s /q "python"
echo [OK] 清理完成
echo.

REM Extract
echo [步骤 2/7] 解压 Python...
powershell -Command "Expand-Archive -Path 'python-3.10.11-embed-amd64.zip' -DestinationPath 'python' -Force"
if errorlevel 1 (
    echo [错误] 解压失败！
    pause
    exit /b 1
)
echo [OK] 解压完成
echo.

REM Create site-packages
echo [步骤 3/7] 创建 site-packages 目录...
mkdir "python\Lib" 2>nul
mkdir "python\Lib\site-packages" 2>nul
echo [OK] 完成
echo.

REM Configure _pth - 关键！
echo [步骤 4/7] 配置 Python...
(
echo python310.zip
echo .
echo Lib
echo Lib\site-packages
echo.
echo import site
) > python\python310._pth

echo [OK] 配置完成
echo.

REM Download get-pip
echo [步骤 5/7] 下载 get-pip.py...
powershell -Command "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile 'python\get-pip.py'"
if not exist "python\get-pip.py" (
    echo [错误] 下载失败！
    pause
    exit /b 1
)
echo [OK] 下载完成
echo.

REM Install pip
echo [步骤 6/7] 安装 pip...
cd /d python
echo 正在运行: python get-pip.py
python.exe get-pip.py
cd /d ..

if not exist "python\Scripts\pip.exe" (
    echo [错误] pip 安装失败！
    echo.
    echo 请手动检查:
    echo   - python 文件夹里的内容
    echo   - python\get-pip.py 是否存在
    echo.
    pause
    exit /b 1
)
echo [OK] pip 安装完成！
echo.

REM Install dependencies
echo [步骤 7/7] 安装依赖...
echo 这可能需要 5-10 分钟，请耐心等待...
echo.

python\Scripts\pip.exe install -r requirements.txt

echo.
if errorlevel 1 (
    echo [警告] 部分依赖可能安装失败，但我们继续...
) else (
    echo [OK] 全部依赖安装成功！
)

echo.
echo ========================================
echo   完成！
echo ========================================
echo.
echo 现在请运行:
echo   1. download_models.bat    (下载 OCR 模型)
echo   2. start.bat              (启动程序)
echo.
pause
