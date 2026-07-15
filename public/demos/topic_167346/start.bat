@echo off
echo ================================
echo DrinkPet Demo - 启动脚本
echo ================================
echo.
echo 正在启动本地服务器...
echo 服务器启动后，浏览器会自动打开。
echo 如果浏览器没有自动打开，请手动访问: http://localhost:8080/app/index.html
echo.
echo 按 Ctrl+C 停止服务器。
echo ================================
echo.

python -m http.server 8080