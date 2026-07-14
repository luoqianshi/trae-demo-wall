@echo off
cd /d "%~dp0"
echo.
echo ==========================================
echo   AIGCer Demo 正在启动...
echo ==========================================
echo.
echo 服务器地址: http://localhost:8080
echo 关闭此窗口即可停止服务器
echo.
start http://localhost:8080
python -m http.server 8080
