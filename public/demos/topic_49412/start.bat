@echo off
chcp 65001 >nul
title Kindchat Server

echo ========================================
echo   Kindchat - 一键部署启动
echo ========================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js 已就绪

:: 切换到脚本所在目录
cd /d "%~dp0"

:: 安装依赖（首次运行）
if not exist "server\node_modules" (
    echo.
    echo [*] 首次运行，正在安装依赖...
    cd server
    call npm install --omit=dev
    cd ..
    echo [OK] 依赖安装完成
)

:: 添加防火墙规则（允许局域网访问）
echo.
echo [*] 配置防火墙...
netsh advfirewall firewall add rule name="Kindchat" dir=in action=allow protocol=TCP localport=12345 >nul 2>&1
echo [OK] 防火墙已放行端口 12345

:: 启动服务器（服务器控制台会显示所有可用IP地址）
echo.
echo [*] 正在启动 Kindchat 服务器...
echo ========================================
echo.
node server\dist\index.js

pause