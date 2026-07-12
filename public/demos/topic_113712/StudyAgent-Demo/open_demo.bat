@echo off
chcp 65001 >nul 2>&1
title StudyAgent Demo
echo ============================================
echo   StudyAgent - 大学生作业多模态学习助手 Demo
echo ============================================
echo.
echo 正在启动...
echo.

cd /d "%~dp0"
start "" "index.html"

echo 已在默认浏览器中打开 Demo。
echo 如果没有自动打开，请手动双击 index.html 文件。
echo.
timeout /t 3 >nul
