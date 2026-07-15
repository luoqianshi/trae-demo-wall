#!/bin/bash
# 山河行旅图 - 一键启动（macOS / Linux 终端用）

set -e
PORT=5173
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "==================================="
echo "  山河行旅图 · 一键启动"
echo "==================================="

if command -v python3 >/dev/null 2>&1; then
    PY=python3
elif command -v python >/dev/null 2>&1; then
    PY=python
else
    echo "[错误] 未检测到 Python，请先安装 Python 3.x 后重试。"
    echo "        下载地址：https://www.python.org/downloads/"
    exit 1
fi

if lsof -i :$PORT >/dev/null 2>&1; then
    echo "[提示] 端口 $PORT 已被占用，尝试直接打开现有服务..."
else
    echo "[启动] 正在 $PORT 端口启动本地服务器..."
    nohup $PY -m http.server $PORT >/tmp/shanhe-xinglutu.log 2>&1 &
    sleep 1
fi

URL="http://localhost:$PORT/"
echo "[完成] 访问地址：$URL"

if command -v open >/dev/null 2>&1; then
    open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
fi

echo ""
echo "提示：本终端窗口可最小化，不要关闭。"
echo "      如需手动停止服务，在终端执行：lsof -ti :$PORT | xargs kill"
read -p "按回车键结束..."
