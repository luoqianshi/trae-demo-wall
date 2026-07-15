@echo off
chcp 65001 >nul
echo 正在启动银发守护者后端服务...
cd env
start cmd /k node server.js
timeout /t 4 /nobreak >nul
start http://127.0.0.1:3001
exit
