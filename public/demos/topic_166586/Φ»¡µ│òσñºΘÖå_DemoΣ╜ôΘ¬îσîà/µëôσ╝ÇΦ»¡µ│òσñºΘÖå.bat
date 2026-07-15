@echo off
chcp 65001 >nul
echo 正在启动语法大陆...
echo 浏览器将自动打开 http://localhost:8765
echo 按 Ctrl+C 停止服务
start http://localhost:8765
python -m http.server 8765 --directory "%~dp0"
pause
