@echo off
chcp 65001 >nul
title AI智股 - 智能股票预测与可视化平台
color 0B

echo ==========================================================
echo   AI智股 - 智能股票预测与可视化平台
echo   一键启动脚本
echo ==========================================================
echo.

REM 切换到脚本所在目录（项目根目录）
cd /d "%~dp0"

REM ===== 第 1 步：检查 Python =====
echo [1/4] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [错误] 未检测到 Python！
    echo.
    echo   请先安装 Python 3.8 以上版本：
    echo   下载地址：https://www.python.org/downloads/
    echo   安装时务必勾选 "Add Python to PATH"
    echo.
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYVER=%%i
echo       已安装 Python %PYVER%

REM ===== 第 2 步：检查后端文件 =====
echo.
echo [2/4] 检查项目文件...
if not exist "backend\app.py" (
    echo [错误] 找不到 backend\app.py，项目结构不完整。
    pause
    exit /b 1
)
echo       项目文件就绪

REM ===== 第 3 步：检查依赖是否已安装 =====
echo.
echo [3/4] 检查依赖包...
python -c "import flask, pandas, numpy, sklearn, tensorflow" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ==========================================================
    echo   ⚠️  检测到缺少必要的 Python 依赖包！
    echo.
    echo   平台运行需要以下库：
    echo     Flask, pandas, numpy, scikit-learn, TensorFlow,
    echo     SQLAlchemy, PyMySQL, openpyxl 等
    echo.
    echo   请先下载安装依赖，命令如下：
    echo     pip install -r backend\requirements.txt
    echo.
    echo   是否现在自动下载安装？（需要联网，约 500MB）
    echo ==========================================================
    echo.
    set /p CHOICE=请输入 Y 自动安装 / N 退出 (Y/N):
    if /i "%CHOICE%"=="Y" (
        echo.
        echo 正在下载安装依赖包，请耐心等待...
        pip install -r backend\requirements.txt
        if errorlevel 1 (
            echo.
            echo [错误] 依赖安装失败！请检查网络连接后重试。
            echo   或手动执行：pip install -r backend\requirements.txt
            pause
            exit /b 1
        )
        echo.
        echo 依赖安装完成！
    ) else (
        echo.
        echo 请手动执行以下命令安装依赖后再启动：
        echo   pip install -r backend\requirements.txt
        echo.
        pause
        exit /b 0
    )
) else (
    echo       所有依赖包已就绪
)

REM ===== 第 4 步：启动后端服务 =====
echo.
echo [4/4] 准备启动后端服务...

REM 检查端口 5000 是否被占用，若占用则先终止
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo       端口 5000 已被占用，正在释放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 " ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

echo.
echo ==========================================================
echo   后端服务正在启动...
echo.
echo   访问地址：http://127.0.0.1:5000
echo   浏览器将自动打开，请勿关闭此窗口
echo   如需停止服务，请按 Ctrl+C 或关闭此窗口
echo.
echo   ⚠️ 免责声明：本项目仅面向金融类、大数据技术等专业
echo   学生用于学习使用，预测结果仅为模拟参考，不构成投资
echo   建议，请慎重考虑。
echo ==========================================================
echo.

REM 延迟 3 秒后打开浏览器
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://127.0.0.1:5000/"

REM 启动后端服务（前台运行，关闭窗口即停止服务）
cd backend
python app.py

REM 如果服务异常退出
echo.
echo [提示] 后端服务已停止。
echo.
pause
