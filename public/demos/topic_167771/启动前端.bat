@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 水电到家 - Web 前端

echo 正在启动 Web 前端，浏览器将自动打开...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8080

if errorlevel 1 (
  echo.
  echo [错误] Web 前端启动失败，请确认已将压缩包完整解压。
  pause
)

endlocal
