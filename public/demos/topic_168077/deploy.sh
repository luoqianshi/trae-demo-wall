#!/bin/bash
# ============================================
# Coin Kids 一键部署脚本 (Linux/macOS)
# 用法: chmod +x deploy.sh && ./deploy.sh
# ============================================

set -e

echo "=== Coin Kids 部署脚本 ==="

# 1. 安装前端依赖并构建
echo "[1/3] 安装前端依赖..."
cd "$(dirname "$0")/frontend"
pnpm install

echo "[2/3] 构建前端静态文件..."
pnpm build

# 2. 启动后端（生产模式）
echo "[3/3] 启动后端服务..."
cd "$(dirname "$0")/backend"
export APP_MODE=production
go run cmd/server/main.go