@echo off
chcp 65001 >nul
title 非遗合香集 - 网站启动器
echo ========================================
echo    非遗合香集 - 网站启动中...
echo ========================================
echo.
echo 正在启动本地服务器，请稍候...
echo.

start "" http://localhost:8000/index.html

python -m http.server 8000

pause
