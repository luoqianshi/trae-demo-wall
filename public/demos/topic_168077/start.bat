@echo off
REM ============================================
REM Coin Kids 一键部署脚本 (Windows)
REM 用法: 双击运行 或 在终端中执行 start.bat
REM ============================================

echo === Coin Kids 部署脚本 ===
echo.

REM 1. 安装前端依赖并构建
echo [1/3] 安装前端依赖...
cd /d "%~dp0frontend"
call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo 安装依赖失败，请确保已安装 pnpm
    pause
    exit /b 1
)

echo [2/3] 构建前端静态文件...
call pnpm build
if %ERRORLEVEL% NEQ 0 (
    echo 构建失败
    pause
    exit /b 1
)

REM 2. 启动后端（生产模式）
echo [3/3] 启动后端服务...
cd /d "%~dp0backend"
set APP_MODE=production
go run cmd/server/main.go

pause