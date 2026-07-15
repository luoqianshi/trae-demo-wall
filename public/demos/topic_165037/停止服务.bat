@echo off
title Yuezhi AI - Stop Services

echo ========================================
echo    Yuezhi AI - Stop All Services
echo ========================================
echo.

echo Looking for Node.js processes...
echo.

tasklist /fi "imagename eq node.exe" /fo csv 2>nul | findstr /i "node.exe" >nul

if %errorlevel% neq 0 (
    echo No Node.js processes found.
    echo.
    pause
    exit /b 0
)

echo Found Node.js processes:
tasklist /fi "imagename eq node.exe"
echo.

set /p confirm=Stop all Node.js processes? (Y/N): 
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    echo.
    pause
    exit /b 0
)

echo.
echo Stopping services...
taskkill /f /im node.exe

echo.
echo ========================================
echo    All services stopped
echo ========================================
echo.
pause
