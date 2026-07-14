@echo off
chcp 65001 >nul
title Auto-Decision Agent

echo =============================================
echo     Auto-Decision Agent - 一键启动
echo =============================================
echo.

:: 检查 Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未检测到 Python，请先安装 Python 3.8+
    echo 下载地址：https://www.python.org/downloads/
    echo 安装时请勾选 "Add Python to PATH"
    pause
    exit /b 1
)

echo [OK] Python 已检测

:: 检查是否为 Python 3.8+
python -c "import sys; sys.exit(0 if sys.version_info >= (3,8) else 1)" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 需要 Python 3.8+，当前版本过旧
    pause
    exit /b 1
)

:: 检查是否已有虚拟环境
if exist ".venv\Scripts\python.exe" (
    echo [OK] 检测到虚拟环境
    set PYTHON=.venv\Scripts\python.exe
) else (
    echo [INFO] 未检测到虚拟环境，使用系统 Python
    set PYTHON=python
)

:: 安装依赖
echo.
echo [INFO] 正在检查并安装依赖...
%PYTHON% -m pip install -r requirements.txt -q
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 依赖安装失败，请检查网络连接
    pause
    exit /b 1
)
echo [OK] 依赖安装完成

:: 检查 API Key 配置
%PYTHON% -c "
import yaml
with open('config/config.yaml', 'r', encoding='utf-8') as f:
    cfg = yaml.safe_load(f)
key = cfg.get('llm', {}).get('api_key', '')
if not key or key in ['your-api-key-here', '', 'sk-test']:
    print('[INFO] 未配置 LLM API Key，将使用 Mock 演示模式')
else:
    print('[OK] LLM API Key 已配置')
" 2>nul

:: 启动服务
echo.
echo =============================================
echo     服务启动中...
echo     请稍候，浏览器将自动打开
echo =============================================
echo.

:: 启动后端并等待
start "" http://localhost:8000
%PYTHON% start.py

pause