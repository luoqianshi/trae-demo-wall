#!/bin/bash
# 衡舟 — 一键启动（Linux / macOS）
cd "$(dirname "$0")"

echo "╔══════════════════════════════════════════╗"
echo "║  衡舟 — 一键启动（满血版）              ║"
echo "║  自动安装依赖 + 启动后端 + 启动前端     ║"
echo "╚══════════════════════════════════════════╝"
echo

# === [1/6] 检查 Node.js ===
echo "[1/6] 检查运行环境..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 18+"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"
echo

# === [2/6] 安装依赖 ===
echo "[2/6] 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "  node_modules 不存在，开始安装依赖（首次约需 1-3 分钟）..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "[错误] 依赖安装失败，请检查网络连接后重试"
        echo "提示: 可尝试使用国内镜像: npm config set registry https://registry.npmmirror.com"
        exit 1
    fi
    echo "  依赖安装完成"
else
    echo "  node_modules 已存在，跳过安装"
fi
echo

# === [3/6] 检查 .env 配置 ===
echo "[3/6] 检查配置文件..."
if [ ! -f ".env" ]; then
    echo "  .env 不存在，从 .env.example 创建..."
    cp .env.example .env
    echo ""
    echo "  ┌──────────────────────────────────────────────────┐"
    echo "  │  重要：请编辑 .env 文件填入 API Key             │"
    echo "  │                                                  │"
    echo "  │  DOUBAO_API_KEY=你的豆包密钥（必填）            │"
    echo "  │  DEEPSEEK_API_KEY=你的DeepSeek密钥（可选）     │"
    echo "  │                                                  │"
    echo "  │  获取地址:                                       │"
    echo "  │  豆包: https://console.volcengine.com/ark/       │"
    echo "  │  DeepSeek: https://platform.deepseek.com/        │"
    echo "  └──────────────────────────────────────────────────┘"
    echo ""
    read -p "  按回车键用默认编辑器打开 .env 文件进行编辑..." </dev/tty
    ${EDITOR:-nano} .env
else
    echo "  .env 已存在"
fi
echo

# === [4/6] 清理旧进程 ===
echo "[4/6] 清理旧进程..."
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "  端口 3001 已清理" || echo "  端口 3001 空闲"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "  端口 5173 已清理" || echo "  端口 5173 空闲"
sleep 1
echo

# === [5/6] 启动后端 ===
echo "[5/6] 启动后端代理服务（端口 3001）..."
osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'\" && npm run dev:server"' 2>/dev/null || \
    gnome-terminal -- bash -c "cd \"$(pwd)\" && npm run dev:server" 2>/dev/null || \
    (echo "  请在新终端窗口运行: npm run dev:server" && npm run dev:server &)
echo "  等待后端启动..."
sleep 3
echo

# === [6/6] 启动前端 ===
echo "[6/6] 启动前端开发服务器（端口 5173）..."
osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'\" && npx vite --port 5173"' 2>/dev/null || \
    gnome-terminal -- bash -c "cd \"$(pwd)\" && npx vite --port 5173" 2>/dev/null || \
    (echo "  请在新终端窗口运行: npx vite --port 5173" && npx vite --port 5173 &)
echo "  等待前端启动..."
sleep 3

# === 打开浏览器 ===
echo ""
echo "  正在打开浏览器..."
uname | grep -q "Darwin" && open http://localhost:5173 || xdg-open http://localhost:5173 2>/dev/null

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  启动完成！                               ║"
echo "║                                          ║"
echo "║  前端地址: http://localhost:5173        ║"
echo "║  后端地址: http://localhost:3001        ║"
echo "║                                          ║"
echo "║  关闭服务: 关闭弹出的终端窗口           ║"
echo "║  重新启动: 再次运行 ./start.sh           ║"
echo "╚══════════════════════════════════════════╝"
echo ""
