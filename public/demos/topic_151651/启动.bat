@echo off
chcp 65001 >nul
title 镜灵 Mirror Spirit - 启动脚本

echo ========================================
echo    镜灵 Mirror Spirit 启动中...
echo ========================================
echo.

echo [1/3] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js 已安装
echo.

echo [2/3] 检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到 Python，请先安装 Python 3.10+
    echo 下载地址: https://www.python.org/
    pause
    exit /b 1
)
echo ✅ Python 已安装
echo.

echo [3/3] 启动服务...
echo.

echo ========================================
echo  正在安装前端依赖...
echo ========================================
cd mirror-spirit
if not exist node_modules (
    call npm install
)
echo ✅ 前端依赖就绪
cd ..

echo.
echo ========================================
echo  正在安装后端依赖...
echo ========================================
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt -q
echo ✅ 后端依赖就绪

echo.
echo ========================================
echo  启动后端服务 (端口 8000)...
echo ========================================
start "镜灵-后端" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo ========================================
echo  启动前端服务 (端口 3000)...
echo ========================================
cd ..\mirror-spirit
start "镜灵-前端" cmd /k "cd /d %~dp0mirror-spirit && node node_modules/next/dist/bin/next dev -p 3000"

echo.
echo ========================================
echo    🎉 启动完成！
echo ========================================
echo.
echo  前端地址: http://localhost:3000
echo  后端文档: http://localhost:8000/docs
echo.
echo  💡 提示:
echo     - 首次打开会自动弹出新手引导
echo     - 点击导航栏「快速体验」可体验7天成长
echo     - 如未配置API密钥，系统会使用Mock数据
echo.
echo  按任意键退出...
pause >nul
