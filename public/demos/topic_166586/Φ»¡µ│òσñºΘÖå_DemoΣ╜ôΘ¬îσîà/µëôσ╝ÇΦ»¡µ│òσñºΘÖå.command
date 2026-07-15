#!/bin/bash
# 语法大陆 GrammarQuest - 启动脚本
# 双击此文件即可在浏览器中打开

DIR="$(cd "$(dirname "$0")" && pwd)"

# 检查 Python3 是否可用（macOS 自带）
if command -v python3 &> /dev/null; then
  echo "正在启动语法大陆..."
  echo "浏览器将自动打开 http://localhost:8765"
  echo "按 Ctrl+C 停止服务"
  open http://localhost:8765
  python3 -m http.server 8765 --directory "$DIR"
else
  # 直接用 open 打开 HTML
  open "$DIR/index.html"
fi
