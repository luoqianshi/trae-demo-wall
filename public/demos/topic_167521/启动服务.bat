@echo off
chcp 65001 >nul
title 评审厅 - 启动
cd /d "%~dp0"

echo ========================================
echo   评审厅 - 体验启动
echo ========================================
echo.
echo 正在为您启动评审厅体验环境
echo 首次启动需 1-3 分钟自动安装依赖，请勿关闭此窗口
echo.

REM 检查 Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js
  echo.
  echo 请先安装 Node.js LTS 版本：
  echo   https://nodejs.org
  echo.
  echo 安装完成后重新双击此文件即可。
  echo.
  pause
  exit /b 1
)

REM 首次运行自动装依赖
if not exist "node_modules" (
  echo [首次启动] 正在安装依赖，约 1-3 分钟...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [错误] 依赖安装失败
    echo.
    echo 常见原因：
    echo   1. 网络问题 - 检查网络连接或配置 npm 镜像
    echo   2. 代理设置 - 如使用代理，请配置 npm 代理
    echo.
    echo 可手动运行 npm install 排查问题
    echo.
    pause
    exit /b 1
  )
  echo.
  echo 依赖安装完成。
  echo.
)

echo 正在启动服务...
echo 浏览器即将自动打开，请勿关闭此窗口。
echo 关闭此窗口即停止服务。
echo.

REM 延迟 3 秒后打开浏览器
start "" /b cmd /c "timeout /t 3 >nul & start http://localhost:5173"

call npm run dev
pause
