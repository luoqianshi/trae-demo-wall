@echo off
chcp 65001 >nul
title EQagent - 人际关系修炼助手

echo.
echo ========================================
echo    EQagent - 人际关系修炼助手
echo ========================================
echo.

:: 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 环境
    echo.
    echo 请先安装 Node.js：
    echo    https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 检查是否已安装依赖
if not exist "node_modules" (
    echo [第1步] 正在安装依赖...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo [跳过] 依赖已安装
)

echo.
echo [第2步] 正在启动服务...
echo.
echo    请访问: http://localhost:5173
echo    按 Ctrl+C 可停止服务
echo.

:: 启动服务
call npm run dev

pause
