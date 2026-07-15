@echo off
title 诡村迷局 - 游戏启动器
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 goto NO_NODE

node scripts\launcher.js
if errorlevel 1 goto LAUNCH_ERROR
exit /b 0

:NO_NODE
echo.
echo [ERROR] Node.js 18 or higher is required to run this game.
echo Please install Node.js and double-click this file again.
echo Download link: https://nodejs.org/
echo.
pause
exit /b 1

:LAUNCH_ERROR
echo.
pause
exit /b 1
