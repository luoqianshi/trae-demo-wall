#!/bin/bash
# AI 自助接待系统 - 本地预览启动器

echo ""
echo "========================================"
echo "  AI 自助接待系统 - 本地预览"
echo "========================================"
echo ""

PORT=8080

if command -v python3 &> /dev/null; then
    echo "[OK] 找到 Python3"
    echo ""
    echo "  启动后请访问: http://localhost:${PORT}/demo.html"
    echo "  按 Ctrl+C 停止服务"
    echo ""
    python3 -m http.server $PORT
    exit 0
elif command -v python &> /dev/null; then
    echo "[OK] 找到 Python"
    echo ""
    echo "  启动后请访问: http://localhost:${PORT}/demo.html"
    echo "  按 Ctrl+C 停止服务"
    echo ""
    python -m http.server $PORT
    exit 0
elif command -v npx &> /dev/null; then
    echo "[OK] 找到 Node.js"
    echo ""
    echo "  启动后请访问: http://localhost:${PORT}/demo.html"
    echo "  按 Ctrl+C 停止服务"
    echo ""
    npx serve -l $PORT
    exit 0
else
    echo "[ERROR] 未找到可用的服务器工具"
    echo ""
    echo "  需要安装以下任一工具:"
    echo "  1. Python3 (推荐)"
    echo "  2. Node.js"
    echo ""
    echo "  安装后再次运行本脚本即可。"
fi
