#!/bin/bash
# 心晴日记一键启动脚本 (macOS / Linux)

cd "$(dirname "$0")"

echo ""
echo "  ============================================"
echo "    心晴日记 - 青少年心理疗愈日记"
echo "    Mind Diary - Healing Journal for Teens"
echo "  ============================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "  [错误] 未检测到 Node.js，请先安装："
    echo "         https://nodejs.org/"
    echo "         或 macOS: brew install node"
    echo ""
    exit 1
fi

# 检查 config.json
if [ ! -f "config.json" ]; then
    if [ -f "config.example.json" ]; then
        echo "  [提示] 首次启动，正在创建配置文件..."
        cp config.example.json config.json
        echo "  [提示] 已创建 config.json，请编辑填入 Agnes API Key"
        echo "         或设置环境变量: export AGNES_API_KEY=你的key"
        echo ""
    fi
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "  [提示] 首次启动，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "  [错误] 依赖安装失败，请检查网络后重试"
        exit 1
    fi
    echo "  [提示] 依赖安装完成"
    echo ""
fi

echo "  [启动] 服务正在启动..."
echo "  [访问] 浏览器打开以下地址："
echo "         http://localhost:3001"
echo ""
echo "  [提示] 按 Ctrl+C 可停止服务"
echo ""

# 尝试打开浏览器
if command -v open &> /dev/null; then
    (sleep 2 && open "http://localhost:3001") &
elif command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open "http://localhost:3001") &
fi

node server.js
