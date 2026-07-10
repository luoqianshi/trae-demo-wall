@echo off
chcp 65001 >nul
title 3D末日求生 - 启动服务器

cd /d "%~dp0"

echo ================================================
echo  正在启动本地服务器...
echo ================================================

python -m http.server 8080 --directory "%~dp0"
if errorlevel 1 goto try_node

echo.
echo 服务器已启动！
echo.
echo 请在浏览器中访问:
echo   http://localhost:8080/
echo.
echo 按 Ctrl+C 停止服务器
echo ================================================

:try_node
echo 尝试使用Node.js启动服务器...
node server.js
if errorlevel 1 goto failed

:failed
echo.
echo 无法启动服务器，请确保已安装Python或Node.js
echo.
pause