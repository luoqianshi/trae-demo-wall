#!/bin/bash
# ============================================
#  伴伴 AI 生活伴侣 - 超简单一键部署脚本
#  用法: 复制下面这一行到服务器终端回车就行
#
#  curl -sSL https://你的地址/deploy-oneclick.sh | bash
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "============================================"
echo "  伴伴 AI 生活伴侣 - 一键部署"
echo "============================================"
echo -e "${NC}"
echo ""

# 检查是否为root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请用 root 用户运行此脚本${NC}"
    echo "运行: sudo su 切换到root"
    exit 1
fi

APP_DIR="/opt/banban"
ZIP_URL="${1:-https://github.com/your-repo/banban/archive/refs/heads/main.zip}"

# 1. 安装基础依赖
echo -e "${YELLOW}[1/5] 安装基础软件...${NC}"
apt-get update -qq
apt-get install -y -qq python3 python3-pip python3-venv nginx curl unzip supervisor
echo "  ✓ 安装完成"

# 2. 创建目录
echo -e "${YELLOW}[2/5] 准备应用目录...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/data
echo "  ✓ 目录创建完成"

# 3. 这里假设用户已经把文件上传了
# 如果是从本地上传的，跳过下载步骤
echo -e "${YELLOW}[3/5] 检查应用文件...${NC}"
if [ -f "$APP_DIR/web_ui.py" ]; then
    echo "  ✓ 文件已存在"
else
    echo "  ⚠️  未找到应用文件"
    echo ""
    echo "  请把 banban-cloud-deploy.zip 上传到 $APP_DIR 目录"
    echo "  然后执行: cd $APP_DIR && unzip banban-cloud-deploy.zip"
    echo "  再重新运行此脚本"
    exit 1
fi

# 4. 安装Python依赖
echo -e "${YELLOW}[4/5] 安装 Python 依赖（大约需要2-3分钟）...${NC}"
cd $APP_DIR

# 如果有云端依赖文件就用云端的，否则用完整的
if [ -f "requirements-cloud.txt" ]; then
    REQ_FILE="requirements-cloud.txt"
else
    REQ_FILE="requirements.txt"
fi

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install gunicorn -q
pip install -r $REQ_FILE -q 2>&1 | tail -1
echo "  ✓ 依赖安装完成"

# 5. 配置并启动服务
echo -e "${YELLOW}[5/5] 配置服务并启动...${NC}"

# 创建 supervisor 配置（比systemd简单）
cat > /etc/supervisor/conf.d/banban.conf << EOF
[program:banban]
command=$APP_DIR/venv/bin/gunicorn wsgi:app -b 127.0.0.1:8000 -w 2 --timeout 120
directory=$APP_DIR
user=www-data
autostart=true
autorestart=true
stderr_logfile=$APP_DIR/logs/error.log
stdout_logfile=$APP_DIR/logs/access.log
environment=HOME="$APP_DIR/data"
EOF

# 配置 Nginx
cat > /etc/nginx/sites-available/banban.conf << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }
}
EOF

ln -sf /etc/nginx/sites-available/banban.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 设置权限
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# 启动服务
supervisorctl reread
supervisorctl update
supervisorctl restart banban
nginx -t && systemctl restart nginx

# 等待启动
sleep 3

# 获取公网IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "你的服务器IP")

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ 部署完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "  🌐 访问地址: http://$PUBLIC_IP"
echo ""
echo "  常用命令:"
echo "    查看状态: supervisorctl status banban"
echo "    查看日志: tail -f $APP_DIR/logs/error.log"
echo "    重启服务: supervisorctl restart banban"
echo ""
echo "  数据目录: $APP_DIR/data/.banban/"
echo ""
