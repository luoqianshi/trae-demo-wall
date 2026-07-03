@echo off
echo ==================== 未来学堂 Demo ====================
echo.
echo 正在启动后端服务...
cd backend
start cmd /k "npm install && node server.js"
echo 后端服务已启动，请等待几秒...
timeout /t 3 /nobreak >nul
echo.
echo 正在启动前端服务...
cd ../frontend
start cmd /k "npm install && npm run dev"
echo.
echo 服务已启动！
echo 前端地址：http://localhost:3001
echo 后端地址：http://localhost:3003
echo.
pause
