@echo off
cd /d "%~dp0"

echo ========================================
echo   身份证号码核对工具 v2.5
echo ========================================
echo.

REM 首先检查是否有便携式 Python
if exist "python\python.exe" (
    echo [信息] 使用便携式 Python
    echo.
    
    if not exist "python\Scripts\pip.exe" (
        echo [警告] 看起来便携式 Python 还没有完全设置好！
        echo 请先运行 setup_portable_complete.bat
        echo.
        pause
        exit /b 1
    )
    
    REM 设置 Qt 插件路径 - 解决 PyQt5 平台插件找不到的问题
    for /d %%i in ("python\Lib\site-packages\PyQt5\Qt*") do (
        if exist "%%i\plugins\platforms" (
            set "QT_QPA_PLATFORM_PLUGIN_PATH=%%i\plugins\platforms"
        )
    )
    
    REM 设置 Qt 平台为 windows
    set "QT_QPA_PLATFORM=windows"
    
    python\python.exe main_v2.5.py
    goto checkerror
)

REM 如果没有，尝试用系统 Python
echo [信息] 使用系统 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [错误] 找不到 Python！
    echo.
    echo 选项 1: 使用便携式 Python（推荐）
    echo   - 运行 setup_portable_complete.bat
    echo.
    echo 选项 2: 安装系统 Python
    echo   - 下载: https://www.python.org/downloads/
    echo   - 安装后运行 install.bat
    echo.
    pause
    exit /b 1
)

echo.
python main_v2.5.py

:checkerror
if errorlevel 1 (
    echo.
    echo ========================================
    echo   [错误] 程序崩溃！
    echo ========================================
    echo.
    echo 请查看日志文件:
    echo   %%USERPROFILE%%\id_verifier_error.log
    echo.
    echo 或检查:
    echo   1. models 文件夹是否完整
    echo   2. 依赖是否正确安装
    echo.
    pause
    exit /b 1
)
