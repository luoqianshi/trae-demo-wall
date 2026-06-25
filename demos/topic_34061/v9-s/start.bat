@echo off
cd /d "%~dp0"
echo 正在启动漏洞哨兵...
start /B python3 server.py
start /B python server.py
ping -n 3 127.0.0.1 > nul
echo 服务已启动，正在打开浏览器...
start http://localhost:8000
pause
