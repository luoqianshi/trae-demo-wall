@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动 泡泡PCOS管理App H5 本地预览服务...
echo 请稍候，浏览器将自动打开 http://localhost:8080
timeout /t 1 >nul
start http://localhost:8080
node start-server.js
