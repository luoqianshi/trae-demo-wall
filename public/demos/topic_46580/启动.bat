@echo off
chcp 65001 >nul 2>&1
title FeiHua Persona Lab
cd /d "%~dp0"
for %%f in (*.ps1) do powershell -NoProfile -ExecutionPolicy Bypass -File "%%f"
pause
