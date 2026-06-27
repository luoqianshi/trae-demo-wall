@echo off
echo ============================================
echo   医学病例练习系统 - 启动脚本
echo ============================================
echo.

echo [1/2] 启动后端服务 (端口 8877)...
start "Backend" cmd /c "cd /d %~dp0backend && conda run -n yiliao python app.py"

echo [2/2] 启动前端服务 (端口 7788)...
start "Frontend" cmd /c "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo 启动完成！请访问 http://localhost:7788
echo 按任意键关闭此窗口...
pause >nul