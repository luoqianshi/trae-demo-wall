#!/bin/bash

# Hatter 服务器部署脚本
# 适用于 Ubuntu 24.04

set -e

echo "=== Hatter 服务器部署 ==="

# 1. 更新系统
echo "更新系统包..."
apt update && apt upgrade -y

# 2. 安装 Node.js 20.x
echo "安装 Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证安装
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"

# 3. 创建应用目录
APP_DIR="/opt/hatter"
DATA_DIR="$APP_DIR/data"

echo "创建应用目录: $APP_DIR"
mkdir -p $APP_DIR
mkdir -p $DATA_DIR

# 4. 复制文件（假设当前目录是项目根目录）
echo "复制应用文件..."
cp server.js $APP_DIR/
cp package.json $APP_DIR/

# 5. 安装依赖
echo "安装依赖..."
cd $APP_DIR
npm install --production

# 6. 生成随机 API Key
API_KEY=$(openssl rand -hex 32)
echo "生成 API Key: $API_KEY"

# 7. 创建 systemd 服务
echo "创建 systemd 服务..."
cat > /etc/systemd/system/hatter.service << EOF
[Unit]
Description=Hatter Conversation Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=PORT=3000
Environment=HATTER_API_KEY=$API_KEY
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 8. 启动服务
echo "启动服务..."
systemctl daemon-reload
systemctl enable hatter
systemctl start hatter

# 9. 配置防火墙
echo "配置防火墙..."
ufw allow 3000/tcp
ufw --force enable

# 10. 等待服务启动
sleep 3

# 11. 健康检查
echo "检查服务状态..."
if curl -s http://localhost:3000/health > /dev/null; then
  echo "✓ 服务启动成功"
else
  echo "✗ 服务启动失败，查看日志: journalctl -u hatter -n 50"
  exit 1
fi

# 12. 输出信息
echo ""
echo "=== 部署完成 ==="
echo "服务器地址: http://$(curl -s ifconfig.me):3000"
echo "API Key: $API_KEY"
echo ""
echo "重要：请保存 API Key，前端需要用到"
echo "查看日志: journalctl -u hatter -f"
echo "重启服务: systemctl restart hatter"
echo "停止服务: systemctl stop hatter"
