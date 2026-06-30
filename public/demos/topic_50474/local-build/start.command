#!/bin/bash
# 夸夸社区App 本地启动脚本
# 双击此文件即可在浏览器中打开

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "正在启动夸夸社区App..."
echo "请在浏览器中打开: http://localhost:8080"
echo "按 Ctrl+C 停止服务"
echo ""

# 尝试打开浏览器
open "http://localhost:8080/index.html" 2>/dev/null &

# 启动本地服务器
python3 -m http.server 8080
