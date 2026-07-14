@echo off
chcp 65001 >nul
title 蓄能对决

echo ================================
echo    蓄能对决 - 启动中...
echo ================================
echo.

:: 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查依赖是否已安装
if not exist "node_modules" (
    echo [提示] 首次运行，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [完成] 依赖安装完成
    echo.
)

:: 启动游戏服务器（WebSocket，用于联机 PVP）
echo [启动] 游戏服务器 (端口 3001)...
start "蓄能对决-服务器" cmd /c "node server/server.mjs"

:: 等待一秒让服务器启动
timeout /t 2 /nobreak >nul

:: 启动前端开发服务器
echo [启动] 前端开发服务器 (端口 5173)...
echo.
echo ================================
echo    游戏已启动！请打开浏览器访问：
echo    http://localhost:5173/
echo ================================
echo.
echo 按 Ctrl+C 可停止所有服务
echo.

npm run dev