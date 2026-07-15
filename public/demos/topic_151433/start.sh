#!/bin/bash
# 不突 NoBulge 本地启动脚本 (Mac / Linux)
# 双击运行，或在终端执行：bash start.sh

cd "$(dirname "$0")"
PORT=8765

echo "=============================="
echo "  不突 NoBulge · 本地启动"
echo "=============================="
echo ""

# 依次尝试 python3 / python / npx
for CMD in python3 python; do
  if command -v $CMD >/dev/null 2>&1; then
    echo "✓ 使用 $CMD 启动服务"
    echo "→ 请在浏览器打开: http://localhost:$PORT"
    echo "→ 按 Ctrl+C 关闭服务"
    echo ""
    $CMD -m http.server $PORT
    exit 0
  fi
done

# 最后兜底：npx http-server
if command -v npx >/dev/null 2>&1; then
  echo "✓ 使用 npx http-server 启动服务"
  echo "→ 请在浏览器打开: http://localhost:$PORT"
  echo "→ 按 Ctrl+C 关闭服务"
  echo ""
  npx --yes http-server -p $PORT -c-1 .
  exit 0
fi

echo "✗ 未找到 python 或 npx，请先安装 Python 3 或 Node.js"
echo "  下载 Python: https://www.python.org/downloads/"
echo "  下载 Node.js: https://nodejs.org/"
read -p "按回车键退出..."
