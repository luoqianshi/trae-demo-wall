@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动《今天吃什么》HTML 演示包...
echo.
echo 打开浏览器访问：
echo http://127.0.0.1:5180/interactive-html/
echo.
python -m http.server 5180 --bind 127.0.0.1
pause
