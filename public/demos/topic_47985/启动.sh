#!/bin/bash

# EQagent - 人际关系修炼助手 启动脚本

echo ""
echo "========================================"
echo "   EQagent - 人际关系修炼助手"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js 环境"
    echo ""
    echo "请先安装 Node.js："
    echo "   https://nodejs.org/"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "[第1步] 正在安装依赖..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "[错误] 依赖安装失败"
        read -p "按回车键退出..."
        exit 1
    fi
else
    echo "[跳过] 依赖已安装"
fi

echo ""
echo "[第2步] 正在启动服务..."
echo ""
echo "   请访问: http://localhost:5173"
echo "   按 Ctrl+C 可停止服务"
echo ""

# 启动服务
npm run dev
