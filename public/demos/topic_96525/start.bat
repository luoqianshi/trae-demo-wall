@echo off
chcp 65001 >nul
title 网页转PDF工具

echo.
echo ============================================
echo          网页转PDF工具 - 启动中...
echo ============================================
echo.

REM 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [信息] Node.js 版本:
node --version
echo.

REM 检查依赖
if not exist "node_modules" (
    echo [信息] 正在安装依赖，请稍候...
    echo.
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo.
    echo [完成] 依赖安装成功
)

echo [信息] 正在启动服务...
echo.
echo 服务启动后，请打开浏览器访问:
echo http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务
echo ============================================
echo.

npm start

pause