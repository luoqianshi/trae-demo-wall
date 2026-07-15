#!/bin/bash
# 山河行旅图 - macOS 一键启动（双击即可）

set -e
PORT=5173
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if command -v python3 >/dev/null 2>&1; then
    PY=python3
elif command -v python >/dev/null 2>&1; then
    PY=python
else
    osascript -e 'display dialog "未检测到 Python，请先安装 Python 3.x。\nhttps://www.python.org/downloads/" buttons {"好"} default button "好"' >/dev/null
    exit 1
fi

if lsof -i :$PORT >/dev/null 2>&1; then
    :
else
    nohup $PY -m http.server $PORT >/tmp/shanhe-xinglutu.log 2>&1 &
    sleep 1
fi

open "http://localhost:$PORT/"

osascript -e 'display dialog "山河行旅图已启动。\n\n如需停止服务，请在终端执行：\n  lsof -ti :$PORT | xargs kill\n\n本窗口可关闭。" buttons {"好"} default button "好"' >/dev/null
