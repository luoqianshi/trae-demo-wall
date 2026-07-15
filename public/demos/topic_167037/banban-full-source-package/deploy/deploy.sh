#!/bin/bash
# 伴伴 - 云端一键部署脚本
# 适用于: Ubuntu 20.04+ / Debian 11+
# 使用方法: bash deploy.sh

set -e

echo "=========================================="
echo "  伴伴 AI 生活伴侣 - 云端部署脚本"
echo "=========================================="
echo ""

# 检查是否为root
if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
else
    SUDO=""
fi

# 1. 安装系统依赖
echo "[1/7] 安装系统依赖..."
if command -v apt-get &> /dev/null; then
    $SUDO apt-get update -qq
    $SUDO apt-get install -y -qq python3 python3-pip python3-venv nginx curl
elif command -v yum &> /dev/null; then
    $SUDO yum install -y python3 python3-pip nginx curl
else
    echo "不支持的系统，请手动安装 Python3 和 Nginx"
    exit 1
fi

# 2. 部署应用文件
echo "[2/7] 部署应用文件..."
APP_DIR="/opt/banban"
$SUDO mkdir -p $APP_DIR
$SUDO mkdir -p $APP_DIR/logs
$SUDO mkdir -p $APP_DIR/data

# 复制当前目录的文件
$SUDO cp -r ./* $APP_DIR/ 2>/dev/null || true
$SUDO cp -r ./.* $APP_DIR/ 2>/dev/null || true

# 3. 创建虚拟环境并安装依赖
echo "[3/7] 安装 Python 依赖..."
cd $APP_DIR
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements-cloud.txt -q

# 4. 创建 systemd 服务
echo "[4/7] 配置系统服务..."
cat > /tmp/banban.service << EOF
[Unit]
Description=Banban AI Companion
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/gunicorn wsgi:app -c $APP_DIR/gunicorn_config.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

$SUDO mv /tmp/banban.service /etc/systemd/system/
$SUDO systemctl daemon-reload
$SUDO systemctl enable banban

# 设置目录权限
$SUDO chown -R www-data:www-data $APP_DIR
$SUDO chmod -R 755 $APP_DIR

# 5. 配置 Nginx 反向代理
echo "[5/7] 配置 Nginx..."
cat > /tmp/banban.conf << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_buffering off;
    }
}
EOF

if [ -d /etc/nginx/sites-available ]; then
    $SUDO mv /tmp/banban.conf /etc/nginx/sites-available/banban.conf
    $SUDO ln -sf /etc/nginx/sites-available/banban.conf /etc/nginx/sites-enabled/
    $SUDO rm -f /etc/nginx/sites-enabled/default
else
    $SUDO mv /tmp/banban.conf /etc/nginx/conf.d/banban.conf
fi

$SUDO nginx -t && $SUDO systemctl restart nginx

# 6. 启动应用
echo "[6/7] 启动应用..."
$SUDO systemctl start banban

# 等待启动
sleep 3

# 7. 验证
echo "[7/7] 验证部署..."
if curl -s http://127.0.0.1:8000/portal > /dev/null; then
    echo "✅ 应用启动成功"
else
    echo "⚠️  应用可能未正常启动，请检查日志"
fi

# 获取公网IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "你的服务器IP")

echo ""
echo "=========================================="
echo "  ✅ 部署完成！"
echo "=========================================="
echo ""
echo "  🌐 访问地址: http://$PUBLIC_IP"
echo ""
echo "  常用命令:"
echo "    查看状态: systemctl status banban"
echo "    查看日志: journalctl -u banban -f"
echo "    重启服务: systemctl restart banban"
echo "    停止服务: systemctl stop banban"
echo "    Nginx日志: tail -f /var/log/nginx/access.log"
echo ""
echo "  数据目录: $APP_DIR/data/.banban/"
echo "  日志目录: $APP_DIR/logs/"
echo ""
