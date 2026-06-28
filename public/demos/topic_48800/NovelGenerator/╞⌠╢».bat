@echo off
chcp 65001 >nul
title 本地小说生成系统 - 启动器

echo ========================================
echo    本地小说生成系统 - 一键启动
echo ========================================
echo.

echo [1/3] 检查 Python 是否安装...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ 未检测到 Python！
    echo.
    echo 请先安装 Python，安装步骤：
    echo 1. 打开浏览器，访问：https://www.python.org/downloads/
    echo 2. 点击下载最新版 Python（黄色按钮）
    echo 3. 运行安装包，**一定要勾选** "Add Python to PATH"
    echo 4. 点击 Install Now 安装
    echo 5. 安装完成后，重新双击这个文件
    echo.
    pause
    exit /b 1
)
echo ✅ Python 已安装
python --version
echo.

echo [2/3] 检查并安装依赖...
python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo 首次启动，正在安装依赖，请稍候（约1-3分钟）...
    python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
    if errorlevel 1 (
        echo.
        echo ❌ 依赖安装失败，请检查网络连接
        echo.
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    python -c "import openai" >nul 2>&1
    if errorlevel 1 (
        echo 检测到缺少 openai 库，正在补充安装...
        python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
        if errorlevel 1 (
            echo.
            echo ❌ 依赖安装失败，请检查网络连接
            echo.
            pause
            exit /b 1
        )
        echo ✅ 依赖安装完成
    ) else (
        echo ✅ 依赖已安装
    )
)
echo.

echo [3/3] 启动应用...
echo.
echo 🚀 应用即将启动，浏览器会自动打开...
echo 如果没有自动打开，请手动访问：http://localhost:8501
echo.
echo 想关闭程序，直接关掉这个黑窗口即可
echo.
echo ========================================
echo.

python -m streamlit run app.py

pause
