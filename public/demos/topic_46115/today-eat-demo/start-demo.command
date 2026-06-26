#!/bin/bash
cd "$(dirname "$0")"
echo "正在启动“今天吃什么！”Demo..."
echo
if ! command -v npm >/dev/null 2>&1; then
  echo "没有检测到 npm。请先安装 Node.js："
  echo
  echo "方式 1：运行项目里的 ./install-node-macos.command"
  echo "方式 2：去 https://nodejs.org 下载 LTS 版本安装包"
  echo
  exit 1
fi
if [ ! -d "node_modules" ]; then
  echo "首次启动，正在安装依赖..."
  npm install
fi
echo
echo "启动成功后，请在浏览器打开：http://localhost:3000"
echo "按 Control + C 可以停止服务。"
echo
npm start
