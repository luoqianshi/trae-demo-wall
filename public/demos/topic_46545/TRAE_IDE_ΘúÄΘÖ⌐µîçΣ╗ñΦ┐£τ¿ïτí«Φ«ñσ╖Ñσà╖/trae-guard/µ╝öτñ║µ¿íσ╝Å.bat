@echo off
chcp 65001 >nul
title TRAE Guard - 演示模式
color 0B

set NODE_TLS_REJECT_UNAUTHORIZED=0
set NODE_OPTIONS=--use-system-ca

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║       🎭 TRAE Guard - 演示模式（无需TRAE IDE）          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  此模式会模拟两个审批请求，让你体验界面和邮件通知效果
echo.

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo  [错误] 未检测到 Node.js！请先安装 Node.js。
    echo  下载地址: https://nodejs.org/
    pause
    exit /b 1
)

if not exist node_modules (
    echo  [i] 首次运行，正在安装依赖...
    call npm install --production
    if errorlevel 1 (
        echo  [错误] 依赖安装失败！
        pause
        exit /b 1
    )
)

echo.
echo  ══════════════════════════════════════════════════════════
echo  启动演示服务...
echo.
echo  审批面板:  http://127.0.0.1:19224/
echo  邮件预览:  http://127.0.0.1:19225/
echo.
echo  按 Ctrl+C 停止演示
echo  ══════════════════════════════════════════════════════════
echo.

node demo.js

pause
