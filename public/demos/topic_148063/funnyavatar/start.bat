@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

REM ============================================================
REM 一句话头像灵感站 - 启动脚本 (Windows)
REM 1. 检测 Python
REM 2. 没有虚拟环境则创建
REM 3. 没有依赖则安装
REM 4. 启动后端
REM ============================================================

title 一句话头像灵感站

echo.
echo ============================================
echo   一句话头像灵感站 - 启动脚本 (Windows)
echo ============================================
echo.

REM ---- 1. 检测 Python ----
echo [1/4] 检测 Python ...
where py >nul 2>&1
if %errorlevel%==0 (
    set "PY_CMD=py -3"
    goto :python_found
)
where python >nul 2>&1
if %errorlevel%==0 (
    set "PY_CMD=python"
    goto :python_found
)
echo.
echo [错误] 未检测到 Python，请先安装 Python 3.8+ 并加入 PATH。
echo        下载地址: https://www.python.org/downloads/
echo.
pause
exit /b 1

:python_found
%PY_CMD% --version
echo        Python 路径: %PY_CMD%
echo.

REM ---- 2. 检测/创建虚拟环境 ----
echo [2/4] 检测虚拟环境 ...
set "VENV_DIR=%~dp0.venv"
set "VENV_PY=%VENV_DIR%\Scripts\python.exe"
if exist "%VENV_PY%" (
    echo        虚拟环境已存在: %VENV_DIR%
) else (
    echo        未检测到虚拟环境，正在创建 ...
    %PY_CMD% -m venv "%VENV_DIR%"
    if not exist "%VENV_PY%" (
        echo.
        echo [错误] 虚拟环境创建失败。
        pause
        exit /b 1
    )
    echo        虚拟环境已创建: %VENV_DIR%
)
echo.

REM ---- 3. 检测/安装依赖 ----
echo [3/4] 检测依赖 ...
REM 用 fastapi 是否可导入来判断依赖是否已装
"%VENV_PY%" -c "import fastapi" >nul 2>&1
if %errorlevel%==0 (
    echo        依赖已安装，跳过安装。
) else (
    echo        依赖未安装，正在安装 requirements.txt ...
    set "REQ_FILE=%~dp0backend\requirements.txt"
    if not exist "!REQ_FILE!" (
        echo.
        echo [错误] 未找到 backend\requirements.txt
        pause
        exit /b 1
    )
    "%VENV_PY%" -m pip install --upgrade pip -q
    "%VENV_PY%" -m pip install -r "!REQ_FILE!"
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败，请检查网络或手动安装。
        pause
        exit /b 1
    )
    echo        依赖安装完成。
)
echo.

REM ---- 4. 启动后端 ----
echo [4/4] 启动后端服务 ...
echo        工作目录: %~dp0backend
echo        访问地址: http://localhost:8000/
echo        按 Ctrl+C 停止服务
echo --------------------------------------------
echo.

cd /d "%~dp0backend"
"%VENV_PY%" main.py

endlocal
