#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "=========================================="
echo "  AIGCer Demo 正在启动..."
echo "=========================================="
echo ""
echo "服务器地址: http://localhost:8080"
echo "关闭终端窗口即可停止服务器"
echo ""
open "http://localhost:8080"
python3 -m http.server 8080
