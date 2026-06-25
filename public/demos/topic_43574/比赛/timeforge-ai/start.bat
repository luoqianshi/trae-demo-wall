@echo off
chcp 65001 >nul
title TimeForge X — AI人生规划指挥中心
cd /d "%~dp0"
python start.py
pause