#!/bin/bash
# 科学育儿助手 Demo 启动脚本

echo "=========================================="
echo "   科学育儿助手 App Demo"
echo "=========================================="
echo ""

# 检查Python是否安装
if command -v python3 &> /dev/null; then
    echo "正在启动本地服务器..."
    echo "请访问: http://localhost:8080"
    echo ""
    cd "$(dirname "$0")"
    python3 -m http.server 8080 --bind 0.0.0.0
elif command -v python &> /dev/null; then
    echo "正在启动本地服务器..."
    echo "请访问: http://localhost:8080"
    echo ""
    cd "$(dirname "$0")"
    python -m http.server 8080 --bind 0.0.0.0
else
    echo "错误: 未找到Python，无法启动服务器"
    echo "请直接用浏览器打开 index.html 文件"
fi