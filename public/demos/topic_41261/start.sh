#!/bin/bash
# 童心智伴 Demo 启动脚本
# 使用方法: 双击此文件 或 在终端中运行 bash start.sh

cd "$(dirname "$0")"

echo ""
echo "  童心智伴 Demo 启动中..."
echo ""

# 检查 Node.js
if command -v node &> /dev/null; then
    node server.js
elif command -v python3 &> /dev/null; then
    echo "  未检测到 Node.js，使用 Python 启动..."
    echo ""
    echo "  请在浏览器中打开: http://localhost:3000"
    echo ""
    python3 -m http.server 3000
elif command -v python &> /dev/null; then
    echo "  未检测到 Node.js，使用 Python 启动..."
    echo ""
    echo "  请在浏览器中打开: http://localhost:3000"
    echo ""
    python -m SimpleHTTPServer 3000
else
    echo "  错误: 需要安装 Node.js 或 Python 才能运行此 Demo"
    echo ""
    echo "  安装 Node.js: https://nodejs.org/"
    echo "  安装 Python:  https://www.python.org/"
    echo ""
    read -p "按回车键退出..."
fi
