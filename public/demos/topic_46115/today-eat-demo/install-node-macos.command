#!/bin/bash
set -e

echo "正在检查 Node.js 和 npm..."

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  echo "Node.js 已安装：$(node -v)"
  echo "npm 已安装：$(npm -v)"
  echo "无需重复安装。"
  exit 0
fi

if ! command -v brew >/dev/null 2>&1; then
  echo "未检测到 Homebrew。"
  echo "请先安装 Homebrew，安装完成后重新运行本脚本："
  echo
  echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo
  echo "如果安装完成后 brew 仍不可用，请根据 Homebrew 终端提示执行 PATH 配置命令。"
  exit 1
fi

echo "正在通过 Homebrew 安装 Node.js..."
brew install node

echo
echo "安装完成。"
echo "Node.js 版本：$(node -v)"
echo "npm 版本：$(npm -v)"
echo
echo "现在可以运行 ./start-demo.command 启动 Demo。"
