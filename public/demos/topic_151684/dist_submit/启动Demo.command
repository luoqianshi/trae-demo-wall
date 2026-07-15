#!/bin/bash
# HabitatEye · 生境监测平台 Demo 启动脚本 (macOS)

cd "$(dirname "$0")"

echo ""
echo "============================================"
echo "  HabitatEye | 生境监测平台 Demo"
echo "============================================"
echo ""

if command -v python3 &> /dev/null; then
    echo "  使用 Python3 启动服务器..."
    echo ""
    echo "  访问地址: http://localhost:5173"
    echo "  关闭此窗口即可停止服务"
    echo ""
    open "http://localhost:5173"
    python3 -m http.server 5173
    exit 0
fi

if command -v python &> /dev/null; then
    echo "  使用 Python 启动服务器..."
    echo ""
    echo "  访问地址: http://localhost:5173"
    echo "  关闭此窗口即可停止服务"
    echo ""
    open "http://localhost:5173"
    python -m http.server 5173
    exit 0
fi

if command -v php &> /dev/null; then
    echo "  使用 PHP 启动服务器..."
    echo ""
    echo "  访问地址: http://localhost:5173"
    echo "  关闭此窗口即可停止服务"
    echo ""
    open "http://localhost:5173"
    php -S localhost:5173
    exit 0
fi

echo "[错误] 未检测到可用的服务器环境。"
echo ""
echo "请先安装 Python 3："
echo "  官网下载: https://www.python.org/downloads/"
echo "  或使用 Homebrew: brew install python"
echo ""
echo "或者使用 VS Code Live Server 插件打开 index.html"
echo ""
read -p "按回车键退出..."
