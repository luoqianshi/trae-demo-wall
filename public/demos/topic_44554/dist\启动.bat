@echo off
chcp 65001 >nul
echo ==========================================
echo   UI 组件提示词库 - 本地服务器
echo ==========================================
echo.
echo 正在启动本地服务器...
echo 访问地址: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.
python -m http.server 3000
pause
