#!/bin/bash
echo "============================================"
echo "  知识星图 · 2D/3D 双模式知识星系"
echo "  正在启动本地服务器..."
echo "============================================"
echo

cd "$(dirname "$0")"

if command -v python3 &> /dev/null; then
    echo "检测到 Python3，启动 HTTP 服务器 (端口 8765)..."
    echo
    echo "请在浏览器中访问: http://localhost:8765/知识星图-双模式.html"
    echo
    echo "按 Ctrl+C 可停止服务器"
    echo
    # 尝试自动打开浏览器
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8765/知识星图-双模式.html" &
    elif command -v open &> /dev/null; then
        open "http://localhost:8765/知识星图-双模式.html" &
    fi
    python3 -m http.server 8765
elif command -v python &> /dev/null; then
    echo "检测到 Python，启动 HTTP 服务器 (端口 8765)..."
    echo
    echo "请在浏览器中访问: http://localhost:8765/知识星图-双模式.html"
    echo
    echo "按 Ctrl+C 可停止服务器"
    echo
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8765/知识星图-双模式.html" &
    elif command -v open &> /dev/null; then
        open "http://localhost:8765/知识星图-双模式.html" &
    fi
    python -m http.server 8765
else
    echo "未检测到 Python，请先安装 Python 3.x"
    echo "下载地址: https://www.python.org/downloads/"
    exit 1
fi
