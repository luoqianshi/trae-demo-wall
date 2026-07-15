#!/usr/bin/env bash
# Smart RSS Reader - 本地启动脚本 (macOS / Linux)
set -e
cd "$(dirname "$0")"

echo "============================================"
echo "  Smart RSS Reader - 本地启动"
echo "============================================"
echo

if command -v python3 >/dev/null 2>&1; then
    PY=python3
elif command -v python >/dev/null 2>&1; then
    PY=python
else
    echo "未检测到 Python，直接用默认浏览器打开 index.html ..."
    echo "注意: 直接打开 file:// 部分浏览器会限制 IndexedDB / fetch，建议安装 Python 后使用本脚本。"
    echo
    if command -v open >/dev/null 2>&1; then
        open index.html
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open index.html
    else
        echo "错误: 无法找到浏览器打开工具，请手动打开 index.html"
        exit 1
    fi
    exit 0
fi

echo "检测到 $PY，启动 http.server ..."
echo "浏览器访问: http://localhost:8000/"
echo "按 Ctrl+C 停止服务"
echo
exec "$PY" -m http.server 8000
