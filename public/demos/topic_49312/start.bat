@echo off
chcp 65001 >nul 2>&1
title HR人力资源管理系统 - 一键启动

echo ============================================
echo   企业人力资源管理系统 - 一键启动脚本
echo ============================================
echo.

:: 检查Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js (https://nodejs.org/)
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [信息] Node.js版本:
node -v
echo.

:: 进入项目目录
cd /d "%~dp0"

:: ====== 后端初始化 ======
echo [步骤1/4] 检查后端依赖...
if not exist "backend\node_modules" (
    echo [安装] 正在安装后端依赖，请稍候...
    cd backend
    call npm install
    cd ..
    echo [完成] 后端依赖安装完成
) else (
    echo [跳过] 后端依赖已安装
)

:: ====== 数据库初始化 ======
echo [步骤2/4] 检查数据库...
if not exist "backend\hr_system.db" (
    echo [初始化] 正在创建数据库和默认数据...
    cd backend
    call node init-db.js
    cd ..
    echo [完成] 数据库初始化完成（默认管理员: admin / admin123）
) else (
    echo [跳过] 数据库已存在
)

:: ====== 前端初始化 ======
echo [步骤3/4] 检查前端依赖...
if not exist "frontend\node_modules" (
    echo [安装] 正在安装前端依赖，请稍候...
    cd frontend
    call npm install
    cd ..
    echo [完成] 前端依赖安装完成
) else (
    echo [跳过] 前端依赖已安装
)

:: ====== 启动服务 ======
echo [步骤4/4] 启动服务...
echo.
echo ============================================
echo   后端API服务: http://localhost:3000
echo   前端页面:    http://localhost:5173
echo   默认账号:    admin / admin123
echo ============================================
echo.
echo 按 Ctrl+C 停止所有服务
echo.

:: 同时启动后端和前端（使用start /b在后台运行后端）
start "HR-Backend" /b cmd /c "cd backend && node src/app.js"
timeout /t 2 /nobreak >nul
start "HR-Frontend" cmd /c "cd frontend && npx vite"

:: 等待用户关闭
pause >nul
