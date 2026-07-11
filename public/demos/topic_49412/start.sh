#!/bin/bash

echo "========================================"
echo "  Kindchat - 一键部署启动"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js"
    echo "下载地址: https://nodejs.org"
    exit 1
fi
echo "[OK] Node.js 已就绪"

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 安装依赖（首次运行）
if [ ! -d "server/node_modules" ]; then
    echo ""
    echo "[*] 首次运行，正在安装依赖..."
    cd server
    npm install --omit=dev
    cd ..
    echo "[OK] 依赖安装完成"
fi

# 配置防火墙（如果存在）
if command -v ufw &> /dev/null; then
    sudo ufw allow 12345/tcp 2>/dev/null || echo "[提示] 请手动放行端口 12345: sudo ufw allow 12345/tcp"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --add-port=12345/tcp --permanent 2>/dev/null && sudo firewall-cmd --reload 2>/dev/null || echo "[提示] 请手动放行端口 12345"
fi

# 启动服务器（服务器控制台会显示所有可用IP地址）
echo ""
echo "[*] 正在启动 Kindchat 服务器..."
echo "========================================"
echo ""

node server/dist/index.js