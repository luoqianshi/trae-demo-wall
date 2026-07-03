# 虚实一体仿真系统 - 安装说明文档

> 文档版本：v2.1.0  
> 适用系统版本：Virtual-Real Simulation System v2.x  
> 最后更新日期：2026-06-16  
> 文档作者：技术支持部

---

## 1. 系统概述与版本信息

### 1.1 系统概述

虚实一体仿真系统（Virtual-Real Simulation System，简称 VRSS）是一款面向工业自动化与智能制造领域的虚实联动仿真平台。系统深度融合数字孪生、工业通信协议、虚拟仿真与真实设备控制，支持机器人示教编程、工艺模拟、设备监控、教学管理与考核评估等全链条功能。

### 1.2 版本信息

| 属性 | 说明 |
|------|------|
| 系统名称 | 虚实一体仿真系统 |
| 英文名称 | Virtual-Real Simulation System (VRSS) |
| 当前版本 | v2.1.0 |
| 发布日期 | 2026-06-16 |
| 支持平台 | Windows 10/11 (64位)、Linux (Ubuntu 20.04+) |
| 部署模式 | 单机版 / 局域网版 / 集群版 |
| 许可证类型 | 永久授权 / 年度订阅 |

### 1.3 版本变更记录

| 版本 | 发布日期 | 主要变更 |
|------|----------|----------|
| v1.0.0 | 2024-03-15 | 初始版本，基础仿真功能 |
| v1.5.0 | 2024-09-20 | 新增虚实联动、协议配置 |
| v2.0.0 | 2025-04-10 | 重构架构，支持集群部署 |
| v2.1.0 | 2026-06-16 | 新增AI辅助编程、多协议支持 |

---

## 2. 系统需求

### 2.1 最低配置

| 组件 | 最低要求 |
|------|----------|
| 操作系统 | Windows 10 64位 (Build 19041+) 或 Ubuntu 20.04 LTS |
| 处理器 | Intel Core i5-8400 / AMD Ryzen 5 2600 或同等性能 |
| 内存 | 8 GB RAM |
| 存储 | 50 GB 可用空间 (SSD 推荐) |
| 显卡 | NVIDIA GTX 1060 6GB / AMD RX 580 8GB |
| 网络 | 100 Mbps 以太网 |
| 显示器 | 1920 x 1080 分辨率 |

### 2.2 推荐配置

| 组件 | 推荐配置 |
|------|----------|
| 操作系统 | Windows 11 64位 或 Ubuntu 22.04 LTS |
| 处理器 | Intel Core i7-12700 / AMD Ryzen 7 5800X 或更高 |
| 内存 | 32 GB RAM (64 GB 用于大型场景) |
| 存储 | 200 GB NVMe SSD |
| 显卡 | NVIDIA RTX 3060 12GB / RTX 4070 或更高 |
| 网络 | 1000 Mbps 以太网 |
| 显示器 | 2560 x 1440 双显示器 |

### 2.3 服务器配置（局域网/集群版）

| 角色 | CPU | 内存 | 存储 | 网络 |
|------|-----|------|------|------|
| 应用服务器 | 16核+ | 64 GB | 500 GB SSD | 千兆网卡 |
| 数据库服务器 | 8核+ | 32 GB | 1 TB SSD (RAID 1) | 千兆网卡 |
| 仿真计算节点 | 16核+ | 128 GB | 200 GB SSD | 万兆网卡 |
| 文件存储服务器 | 8核+ | 16 GB | 10 TB HDD (RAID 5) | 千兆网卡 |

---

## 3. 软件依赖清单

### 3.1 运行时依赖

| 软件 | 最低版本 | 推荐版本 | 用途说明 |
|------|----------|----------|----------|
| Node.js | 18.0.0 | 20.x LTS | 后端服务运行时 |
| npm | 9.0.0 | 10.x | 包管理器 |
| TypeScript | 5.0.0 | 5.4.x | 编译器 |
| Python | 3.10.0 | 3.12.x | 仿真引擎、脚本支持 |
| .NET Runtime | 6.0.0 | 8.0.x | OPC UA 网关服务 |
| Redis | 6.2.0 | 7.2.x | 缓存与会话存储 |
| MongoDB | 5.0.0 | 7.0.x | 主数据库 |
| Nginx | 1.20.0 | 1.24.x | 反向代理与静态资源 |

### 3.2 开发依赖（可选）

| 软件 | 版本 | 用途说明 |
|------|------|----------|
| Git | 2.40+ | 版本控制 |
| Docker | 24.0+ | 容器化部署 |
| Docker Compose | 2.20+ | 多容器编排 |
| Visual Studio Code | 最新版 | 代码编辑 |
| Postman | 最新版 | API 测试 |

### 3.3 客户端依赖

| 软件 | 版本 | 用途说明 |
|------|------|----------|
| Chrome / Edge | 最新版 | Web 客户端浏览器 |
| WebGL 2.0 | - | 3D 渲染支持 |
| WebSocket | - | 实时通信 |

---

## 4. 安装步骤

### 4.1 安装前准备

#### 4.1.1 检查系统环境

打开 PowerShell (Windows) 或 Terminal (Linux)，执行以下命令检查环境：

```powershell
# Windows
node --version
npm --version
python --version
redis-cli --version
mongod --version
```

```bash
# Linux
node --version
npm --version
python3 --version
redis-cli --version
mongod --version
```

#### 4.1.2 关闭防火墙或开放端口

系统需要以下端口：

| 端口 | 服务 | 说明 |
|------|------|------|
| 80/443 | Nginx | HTTP/HTTPS 服务 |
| 3000 | Node.js 应用 | API 服务 |
| 6379 | Redis | 缓存服务 |
| 27017 | MongoDB | 数据库服务 |
| 4840 | OPC UA | 工业协议网关 |
| 502 | Modbus TCP | 设备通信 (可选) |
| 8080 | WebSocket | 实时数据推送 |

Windows 防火墙开放端口命令：

```powershell
New-NetFirewallRule -DisplayName "VRSS-HTTP" -Direction Inbound -Protocol TCP -LocalPort 80,443,3000,8080 -Action Allow
New-NetFirewallRule -DisplayName "VRSS-DB" -Direction Inbound -Protocol TCP -LocalPort 27017,6379 -Action Allow
```

### 4.2 安装 Node.js 与 npm

#### Windows

1. 访问 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本安装包
2. 运行安装程序，选择 "Add to PATH"
3. 验证安装：

```powershell
node --version  # 应显示 v20.x.x
npm --version   # 应显示 10.x.x
```

#### Linux (Ubuntu)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 4.3 安装 Python

#### Windows

1. 访问 [Python 官网](https://www.python.org/downloads/) 下载 3.12.x
2. 安装时勾选 "Add Python to PATH"
3. 验证：

```powershell
python --version
pip --version
```

#### Linux

```bash
sudo apt update
sudo apt install -y python3.12 python3-pip
python3 --version
```

### 4.4 安装 MongoDB

#### Windows

1. 下载 MongoDB Community Server MSI 安装包
2. 选择 "Complete" 安装类型
3. 安装 MongoDB Compass (可选，图形化管理工具)
4. 将 `C:\Program Files\MongoDB\Server\7.0\bin` 添加到系统 PATH

```powershell
mongod --version
```

#### Linux

```bash
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
mongod --version
```

### 4.5 安装 Redis

#### Windows

下载并安装 [Redis for Windows](https://github.com/microsoftarchive/redis/releases) 或启用 WSL2 安装：

```powershell
wsl --install -d Ubuntu
wsl -d Ubuntu
sudo apt update && sudo apt install -y redis-server
redis-server --version
```

#### Linux

```bash
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis
redis-cli ping  # 应返回 PONG
```

### 4.6 安装 .NET Runtime

#### Windows

下载并安装 [.NET 8.0 Runtime](https://dotnet.microsoft.com/download/dotnet/8.0)

```powershell
dotnet --version
```

#### Linux

```bash
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install -y dotnet-runtime-8.0
dotnet --version
```

### 4.7 安装 Nginx

#### Windows

1. 下载 [Nginx for Windows](http://nginx.org/en/download.html)
2. 解压到 `C:\nginx`
3. 将 `C:\nginx` 添加到 PATH

#### Linux

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.8 部署虚实一体仿真系统

#### 4.8.1 获取安装包

从官方渠道获取安装包 `vrss-v2.1.0.zip`，解压到目标目录：

```powershell
# Windows
mkdir C:\vrss
cd C:\vrss
Expand-Archive -Path C:\Downloads\vrss-v2.1.0.zip -DestinationPath C:\vrss
```

```bash
# Linux
sudo mkdir -p /opt/vrss
sudo unzip vrss-v2.1.0.zip -d /opt/vrss
sudo chown -R $USER:$USER /opt/vrss
```

#### 4.8.2 安装后端依赖

```powershell
# Windows
cd C:\vrss\server
npm install
```

```bash
# Linux
cd /opt/vrss/server
npm install
```

#### 4.8.3 安装前端依赖

```powershell
# Windows
cd C:\vrss\client
npm install
npm run build
```

```bash
# Linux
cd /opt/vrss/client
npm install
npm run build
```

#### 4.8.4 安装 Python 仿真引擎依赖

```powershell
# Windows
cd C:\vrss\engine
pip install -r requirements.txt
```

```bash
# Linux
cd /opt/vrss/engine
pip3 install -r requirements.txt
```

#### 4.8.5 配置 Nginx

将 `C:\vrss\config\nginx.conf` (Windows) 或 `/opt/vrss/config/nginx.conf` (Linux) 复制到 Nginx 配置目录：

```powershell
# Windows
copy C:\vrss\config\nginx.conf C:\nginx\conf\nginx.conf
C:\nginx\nginx.exe -s reload
```

```bash
# Linux
sudo cp /opt/vrss/config/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. 数据库初始化

### 5.1 创建数据库与用户

```bash
mongosh
```

```javascript
use vrss_db

db.createUser({
  user: "vrss_admin",
  pwd: "YourSecurePassword123!",
  roles: [
    { role: "readWrite", db: "vrss_db" },
    { role: "dbAdmin", db: "vrss_db" }
  ]
})
```

### 5.2 导入初始数据

```powershell
# Windows
mongorestore --uri="mongodb://vrss_admin:YourSecurePassword123!@localhost:27017/vrss_db" C:\vrss\data\init_dump
```

```bash
# Linux
mongorestore --uri="mongodb://vrss_admin:YourSecurePassword123!@localhost:27017/vrss_db" /opt/vrss/data/init_dump
```

### 5.3 初始化索引

```javascript
// 在 mongosh 中执行
use vrss_db

db.devices.createIndex({ "device_id": 1 }, { unique: true })
db.users.createIndex({ "user_id": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.tasks.createIndex({ "task_id": 1 }, { unique: true })
db.protocols.createIndex({ "protocol_id": 1 }, { unique: true })
db.channels.createIndex({ "channel_id": 1 }, { unique: true })
db.logs.createIndex({ "timestamp": -1 })
db.assessments.createIndex({ "student_id": 1, "task_id": 1 })
```

### 5.4 Redis 初始化

```bash
redis-cli
```

```
AUTH your_redis_password
SET vrss:version "2.1.0"
SET vrss:install_date "2026-06-16"
```

---

## 6. 配置文件说明

### 6.1 主配置文件 `config.yaml`

位于 `server/config/config.yaml`：

```yaml
# 系统基础配置
system:
  name: "虚实一体仿真系统"
  version: "2.1.0"
  mode: "production"  # development / production
  port: 3000
  log_level: "info"

# 数据库配置
database:
  mongodb:
    uri: "mongodb://vrss_admin:YourSecurePassword123!@localhost:27017/vrss_db"
    options:
      maxPoolSize: 50
      minPoolSize: 10
  redis:
    host: "localhost"
    port: 6379
    password: "your_redis_password"
    db: 0

# 仿真引擎配置
engine:
  python_path: "/usr/bin/python3"  # Windows: "C:\Python312\python.exe"
  max_workers: 4
  timeout: 300

# 工业通信配置
industrial:
  opc_ua:
    enabled: true
    endpoint: "opc.tcp://localhost:4840"
    security_policy: "Basic256Sha256"
  modbus:
    enabled: true
    default_port: 502
    timeout: 5000
  profinet:
    enabled: false

# 安全配置
security:
  jwt_secret: "your-jwt-secret-key-change-this"
  jwt_expiry: "24h"
  bcrypt_rounds: 12
  cors_origin: ["http://localhost", "https://your-domain.com"]

# 文件存储
storage:
  upload_path: "./uploads"
  max_file_size: "100MB"
  allowed_types: [".pdf", ".doc", ".docx", ".mp4", ".zip", ".step", ".stl"]
```

### 6.2 Nginx 配置

```nginx
server {
    listen 80;
    server_name localhost;
    
    # 前端静态资源
    location / {
        root /opt/vrss/client/dist;  # Windows: C:/vrss/client/dist
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket 代理
    location /ws/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 上传文件
    location /uploads/ {
        alias /opt/vrss/uploads/;
        expires 30d;
    }
}
```

### 6.3 环境变量配置

创建 `.env` 文件：

```env
# 数据库
MONGODB_URI=mongodb://vrss_admin:YourSecurePassword123!@localhost:27017/vrss_db
REDIS_URL=redis://:your_redis_password@localhost:6379/0

# 安全
JWT_SECRET=your-jwt-secret-key-change-this
ENCRYPTION_KEY=your-32-char-encryption-key

# 邮件通知 (可选)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notify@example.com
SMTP_PASS=your-email-password

# 日志
LOG_LEVEL=info
LOG_FILE=./logs/vrss.log
```

---

## 7. 启动与停止服务

### 7.1 手动启动

#### 启动顺序

```powershell
# 1. 启动 MongoDB (如未作为服务运行)
net start MongoDB

# 2. 启动 Redis
redis-server

# 3. 启动后端服务
cd C:\vrss\server
npm start

# 4. 启动仿真引擎
cd C:\vrss\engine
python main.py

# 5. 启动 Nginx (如未作为服务运行)
C:\nginx\nginx.exe
```

#### Linux 启动脚本

```bash
#!/bin/bash
# /opt/vrss/scripts/start.sh

echo "Starting VRSS Services..."

# 启动 MongoDB
sudo systemctl start mongod

# 启动 Redis
sudo systemctl start redis

# 启动 Nginx
sudo systemctl start nginx

# 启动后端服务
cd /opt/vrss/server
nohup npm start > ../logs/server.log 2>&1 &

# 启动仿真引擎
cd /opt/vrss/engine
nohup python3 main.py > ../logs/engine.log 2>&1 &

echo "All services started."
```

### 7.2 停止服务

```powershell
# Windows
net stop MongoDB
redis-cli shutdown
C:\nginx\nginx.exe -s stop
# 终止 Node.js 和 Python 进程
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

```bash
# Linux
sudo systemctl stop mongod
sudo systemctl stop redis
sudo systemctl stop nginx
pkill -f "npm start"
pkill -f "python3 main.py"
```

### 7.3 使用 Docker Compose 启动（推荐）

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: vrss_admin
      MONGO_INITDB_ROOT_PASSWORD: YourSecurePassword123!

  redis:
    image: redis:7.2
    ports:
      - "6379:6379"
    command: redis-server --requirepass your_redis_password

  server:
    build: ./server
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
      - redis
    environment:
      - NODE_ENV=production

  nginx:
    image: nginx:1.24
    ports:
      - "80:80"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf
      - ./client/dist:/usr/share/nginx/html

volumes:
  mongo_data:
```

启动命令：

```bash
docker-compose up -d
```

---

## 8. 常见问题排查

### 8.1 安装问题

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| `node: command not found` | Node.js 未安装或未添加到 PATH | 重新安装 Node.js，勾选 "Add to PATH" |
| `npm install` 失败 | 网络问题或权限不足 | 使用 `npm install --registry=https://registry.npmmirror.com` 或管理员权限运行 |
| MongoDB 启动失败 | 数据目录权限问题 | 检查 `/data/db` 或 `C:\data\db` 权限，确保当前用户有读写权限 |
| Redis 连接失败 | 密码错误或端口被占用 | 检查 `redis.conf` 配置，确认端口 6379 未被占用 |
| Python 依赖安装失败 | pip 版本过旧或缺少编译工具 | 升级 pip：`pip install --upgrade pip`，安装 Visual C++ Build Tools (Windows) |

### 8.2 启动问题

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| 端口 3000 被占用 | 其他程序占用端口 | 查找并终止占用进程，或修改 `config.yaml` 中的端口 |
| WebSocket 连接失败 | Nginx 配置错误或防火墙拦截 | 检查 Nginx `proxy_set_header` 配置，开放 8080 端口 |
| 数据库连接超时 | MongoDB 未启动或 URI 错误 | 检查 MongoDB 服务状态，验证连接字符串 |
| 前端白屏 | 构建失败或资源路径错误 | 重新执行 `npm run build`，检查 Nginx `root` 路径 |
| 仿真引擎崩溃 | Python 环境缺失依赖 | 重新安装 `requirements.txt`，检查 Python 版本 |

### 8.3 性能问题

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| 3D 场景卡顿 | 显卡驱动过旧或 WebGL 不支持 | 更新显卡驱动，检查浏览器 WebGL 支持 |
| 大量用户并发卡顿 | 服务器资源不足 | 增加服务器内存/CPU，启用集群模式 |
| 数据库查询缓慢 | 缺少索引或数据量过大 | 执行数据库优化脚本，添加索引，考虑分片 |
| 文件上传失败 | 文件过大或存储空间不足 | 调整 `max_file_size` 配置，清理存储空间 |

### 8.4 日志查看

```powershell
# Windows - 查看后端日志
type C:\vrss\logs\server.log

# 查看仿真引擎日志
type C:\vrss\logs\engine.log

# 查看 Nginx 错误日志
type C:\nginx\logs\error.log
```

```bash
# Linux - 实时查看日志
tail -f /opt/vrss/logs/server.log
tail -f /opt/vrss/logs/engine.log
tail -f /var/log/nginx/error.log
```

---

## 9. 卸载说明

### 9.1 Windows 卸载

#### 9.1.1 停止所有服务

```powershell
net stop MongoDB
redis-cli shutdown
C:\nginx\nginx.exe -s stop
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

#### 9.1.2 删除程序文件

```powershell
# 删除主程序目录
Remove-Item -Recurse -Force C:\vrss

# 删除 Nginx (如不再需要)
Remove-Item -Recurse -Force C:\nginx

# 删除 Node.js (如不再需要)
# 通过 "控制面板 > 程序和功能" 卸载

# 删除 Python (如不再需要)
# 通过 "控制面板 > 程序和功能" 卸载
```

#### 9.1.3 删除数据库数据

```powershell
# 删除 MongoDB 数据目录
Remove-Item -Recurse -Force C:\data\db

# 删除 Redis 数据 (如使用持久化)
Remove-Item -Force C:\redis\dump.rdb
```

#### 9.1.4 清理环境变量

从系统 PATH 中移除以下路径：
- `C:\vrss`
- `C:\nginx`
- `C:\Program Files\MongoDB\Server\7.0\bin`

### 9.2 Linux 卸载

```bash
# 停止服务
sudo systemctl stop mongod
sudo systemctl stop redis
sudo systemctl stop nginx

# 删除程序目录
sudo rm -rf /opt/vrss

# 删除数据库数据
sudo rm -rf /var/lib/mongodb
sudo rm -rf /var/lib/redis

# 卸载软件包 (如不再需要)
sudo apt remove --purge -y mongodb-org redis-server nginx nodejs

# 清理残留配置
sudo apt autoremove -y
sudo apt autoclean
```

### 9.3 Docker 卸载

```bash
# 停止并删除容器
cd /opt/vrss
docker-compose down -v

# 删除镜像 (可选)
docker rmi vrss-server mongo:7.0 redis:7.2 nginx:1.24

# 删除数据卷
docker volume rm vrss_mongo_data
```

### 9.4 数据备份提醒

卸载前请务必备份以下数据：

| 数据类型 | 备份路径 | 备份命令 |
|----------|----------|----------|
| 数据库 | MongoDB 导出 | `mongodump --uri="..." --out=./backup` |
| 上传文件 | `./uploads/` | `tar -czvf uploads_backup.tar.gz ./uploads` |
| 配置文件 | `./config/` | `cp -r ./config ./config_backup` |
| 日志文件 | `./logs/` | `cp -r ./logs ./logs_backup` |

---

## 10. 技术支持

| 支持渠道 | 联系方式 |
|----------|----------|
| 技术支持热线 | 400-XXX-XXXX |
| 技术支持邮箱 | support@vrss-tech.com |
| 在线工单系统 | https://support.vrss-tech.com |
| 技术文档中心 | https://docs.vrss-tech.com |
| 社区论坛 | https://community.vrss-tech.com |

---

> 本文档由虚实一体仿真系统技术支持团队维护。如有疑问或建议，请联系技术支持部门。
