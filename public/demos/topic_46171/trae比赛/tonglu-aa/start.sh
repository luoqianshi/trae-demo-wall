#!/bin/bash

echo ""
echo "  ========================================"
echo "   同路 AA - 启动本地服务器"
echo "  ========================================"
echo ""

# 检测可用的运行时
RUNTIME=""
RUNTIME_CMD=""

if command -v python3 &>/dev/null; then
    RUNTIME="Python3"
    RUNTIME_CMD="python3 -m http.server 8000"
elif command -v python &>/dev/null; then
    RUNTIME="Python"
    RUNTIME_CMD="python -m http.server 8000"
elif command -v node &>/dev/null; then
    RUNTIME="Node.js"
    RUNTIME_CMD="node server.js"
else
    echo "  [错误] 未检测到 Python 或 Node.js"
    echo ""
    echo "  请安装以下任一运行时后重试："
    echo ""
    echo "    Python:  https://www.python.org/downloads/"
    echo "    Node.js: https://nodejs.org/"
    echo ""
    echo "  安装完成后重新运行 ./start.sh 即可。"
    echo ""
    exit 1
fi

echo "  检测到 $RUNTIME，正在启动服务器..."
echo "  浏览器将在 2 秒后自动打开 http://localhost:8000"
echo ""
echo "  按 Ctrl+C 可停止服务器"
echo ""

# 延迟 2 秒后打开浏览器（后台执行，不阻塞服务器启动）
(sleep 2 && (open http://localhost:8000/index.html 2>/dev/null || xdg-open http://localhost:8000/index.html 2>/dev/null)) &

# 启动服务器（阻塞，直到用户按 Ctrl+C）
eval "$RUNTIME_CMD"
