#!/bin/bash
cd "$(dirname "$0")"
echo "正在启动漏洞哨兵..."
python3 server.py &
sleep 2
echo "服务已启动，正在打开浏览器..."
if command -v open &> /dev/null; then
    open http://localhost:8000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8000
else
    echo "请手动打开浏览器访问 http://localhost:8000"
fi
