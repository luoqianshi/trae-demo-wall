@echo off
cd /d "%~dp0"
title ShengMai Backend Server

python -u backend.py
if errorlevel 1 (
    echo.
    echo ========================================
    echo   Server failed to start. Check:
    echo   1. Python is installed and in PATH
    echo   2. backend.py exists in this folder
    echo ========================================
    pause
)
