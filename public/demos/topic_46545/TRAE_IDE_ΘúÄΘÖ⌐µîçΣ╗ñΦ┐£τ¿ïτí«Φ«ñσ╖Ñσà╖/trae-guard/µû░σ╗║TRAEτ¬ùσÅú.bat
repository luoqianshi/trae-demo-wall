@echo off
chcp 65001 >nul
title 新建TRAE IDE窗口

set NODE_TLS_REJECT_UNAUTHORIZED=0
set NODE_OPTIONS=--use-system-ca

cd /d "%~dp0"

echo.
echo  🚀 正在启动新的 TRAE IDE 窗口...
echo.

if not exist node_modules (
    echo  [i] 首次运行，正在安装依赖...
    call npm install --production
)

node src/index.js new
echo.
pause
