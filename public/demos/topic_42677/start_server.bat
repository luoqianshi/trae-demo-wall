@echo off
echo 正在启动本地服务器...
echo 服务器地址: http://localhost:8080
echo 按 Ctrl+C 停止服务器

python -m http.server 8080