#!/bin/bash
set -e

APP_DIR="/var/www/wisdomflow"
DOMAIN="your-domain.com"
DB_NAME="wisdomflow"
DB_USER="wisdomflow"
DB_PASS="your-db-password"

echo "=== 部署智萃 WisdomFlow ==="

echo "1. 创建目录结构..."
mkdir -p $APP_DIR/{frontend,backend}

echo "2. 上传代码..."
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' ./frontend/ $APP_DIR/frontend/
rsync -avz --exclude='node_modules' --exclude='.git' ./backend/ $APP_DIR/backend/

echo "3. 安装依赖..."
cd $APP_DIR/backend
npm install --production
cd $APP_DIR/frontend
npm install --production

echo "4. 配置数据库..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -u root -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

echo "5. 配置后端环境变量..."
cat > $APP_DIR/backend/.env << EOF
PORT=3000
DB_HOST=localhost
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
JWT_SECRET=your-jwt-secret-key-change-in-production
NODE_ENV=production
EOF

echo "6. 构建前端..."
cd $APP_DIR/frontend
npm run build

echo "7. 配置 Nginx..."
cat > /etc/nginx/sites-available/wisdomflow << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $APP_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF
ln -sf /etc/nginx/sites-available/wisdomflow /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo "8. 启动后端服务..."
cd $APP_DIR/backend
pm2 start server.js --name wisdomflow-backend
pm2 save
pm2 startup

echo "=== 部署完成！==="
echo "访问地址: http://$DOMAIN"
echo "管理命令:"
echo "  pm2 status          # 查看服务状态"
echo "  pm2 logs wisdomflow-backend  # 查看日志"
echo "  pm2 restart wisdomflow-backend  # 重启服务"