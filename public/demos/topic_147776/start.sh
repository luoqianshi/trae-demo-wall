#!/bin/bash

echo "========================================"
echo "   销售数据智能分析大屏 - 启动脚本"
echo "========================================"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到Node.js，请先安装Node.js"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "[1/3] 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        exit 1
    fi
    echo "✓ 依赖安装完成"
else
    echo "✓ 依赖已存在"
fi
echo ""

echo "[2/3] 检查数据库..."
if [ ! -f "data/sales.db" ]; then
    echo "数据库不存在，正在初始化..."
    node init-db.js
    if [ $? -ne 0 ]; then
        echo "[错误] 数据库初始化失败"
        exit 1
    fi
    echo "✓ 数据库初始化完成"
else
    echo "✓ 数据库已存在"
fi
echo ""

echo "[3/3] 启动服务器..."
echo ""
echo "========================================"
echo "  服务器即将启动"
echo "  HTTP API:    http://localhost:3000"
echo "  WebSocket:   ws://localhost:8080"
echo "  前端页面:    http://localhost:3000"
echo "========================================"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 延迟2秒后自动打开浏览器
(sleep 2 && open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null) &

# 启动服务器
node server.js
