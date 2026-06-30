@echo off
chcp 65001 >nul
title 拾光 · 小确幸手账

REM 拾光：本地启动脚本
REM 在当前目录启动 HTTP 服务并自动打开浏览器

cd /d "%~dp0"

echo.
echo  ====================================
echo    拾光 · 小确幸手账  本地启动中...
echo  ====================================
echo.
echo  访问地址: http://localhost:5000/
echo  按 Ctrl+C 可停止服务
echo.

start "" http://localhost:5000/
python -m http.server 5000

pause
