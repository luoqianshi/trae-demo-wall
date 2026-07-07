# AI赋能微服务分布式秒杀抢票系统 - 部署指南

## 📁 项目文件清单

| 文件 | 说明 |
|------|------|
| `server.js` | 后端服务入口 |
| `package.json` | 项目依赖配置 |
| `README.md` | 项目说明文档 |
| `monitor-admin.html` | 管理员后台（商品、订单、数据监控） |
| `seckill-frontend.html` | 用户秒杀前台 |
| `test-huaniu-script.html` | 黄牛测试脚本 |
| `simulate-seckill.html` | 多人抢票模拟器 |
| `user-management.html` | 用户管理系统（新增） |

---

## 🚀 快速启动

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务
```bash
npm start
```

服务地址：`http://localhost:3000`

### 3. 访问页面
- **管理员后台**：`monitor-admin.html`
- **用户秒杀前台**：`seckill-frontend.html`
- **黄牛测试脚本**：`test-huaniu-script.html`
- **多人抢票模拟器**：`simulate-seckill.html`
- **用户管理**：`user-management.html`

---

## 🔐 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |

---

## 🌐 部署到在线网站（让全网可以访问）

### 方案一：使用 ngrok 内网穿透（推荐，无需服务器）

1. **下载 ngrok**：https://ngrok.com/download

2. **注册账号并获取 Authtoken**
   - 注册地址：https://ngrok.com
   - 登录后在 Dashboard 获取 Authtoken

3. **配置 ngrok**
   ```bash
   ngrok config add-authtoken <your-authtoken>
   ```

4. **启动服务并创建隧道**
   ```bash
   # 先启动后端服务
   npm start
   
   # 新开命令行窗口，启动 ngrok
   ngrok http 3000
   ```

5. **获得公网地址**
   - ngrok 会生成一个 `https://xxxx.ngrok.io` 的地址
   - 用这个地址 + HTML文件名即可访问所有页面

**示例**：
- 后端地址：`https://xxxx.ngrok.io`
- 管理员后台：`https://xxxx.ngrok.io/monitor-admin.html`
- 用户秒杀前台：`https://xxxx.ngrok.io/seckill-frontend.html`

---

### 方案二：部署到云服务器

#### 2.1 使用阿里云/腾讯云轻量应用服务器

1. **购买服务器**
   - 推荐配置：2核2G 内存
   - 操作系统：Ubuntu 22.04 或 CentOS 8

2. **安装 Node.js**
   ```bash
   # Ubuntu
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # CentOS
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   ```

3. **上传代码**
   ```bash
   # 使用 scp 上传
   scp -r ./project_folder root@your_server_ip:/var/www/
   ```

4. **安装依赖并启动**
   ```bash
   cd /var/www/project_folder
   npm install
   npm start
   ```

5. **使用 PM2 守护进程（生产环境推荐）**
   ```bash
   npm install -g pm2
   pm2 start server.js --name seckill-system
   pm2 save
   pm2 startup
   ```

6. **配置 Nginx 反向代理**
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

#### 2.2 使用 Railway（免费额度）

1. **注册 Railway**：https://railway.app

2. **连接 GitHub 仓库**
   - 将代码推送到 GitHub
   - 在 Railway 中选择仓库

3. **配置环境变量**
   - Railway 会自动识别 Node.js 项目

4. **部署**
   - Railway 会自动构建并部署
   - 获得公网地址

#### 2.3 使用 Render（免费额度）

1. **注册 Render**：https://render.com

2. **创建 Web Service**
   - 连接 GitHub 仓库
   - 设置构建命令：`npm install`
   - 设置启动命令：`npm start`

3. **部署完成**
   - 获得 `https://your-app.onrender.com` 地址

---

## 📊 功能模块说明

### 1. 用户管理 (`user-management.html`)
- ✅ 查看所有用户列表
- ✅ 查看用户黄牛行为记录
- ✅ 查看用户风险评分
- ✅ 查看用户在线状态
- ✅ 查看用户订单记录
- ✅ 封禁/解封用户账号

### 2. 管理员后台 (`monitor-admin.html`)
- ✅ 商品管理（新增、编辑、删除、上下架）
- ✅ 订单管理（查看、删除）
- ✅ 数据监控（在线人数、库存、订单、拦截）
- ✅ AI风控日志
- ✅ 数据统计图表

### 3. 用户秒杀前台 (`seckill-frontend.html`)
- ✅ 用户注册/登录
- ✅ 商品浏览和筛选
- ✅ 秒杀倒计时
- ✅ 真实抢购下单
- ✅ 订单查询

### 4. 黄牛测试脚本 (`test-huaniu-script.html`)
- ✅ 批量发起抢购请求
- ✅ 模拟黄牛脚本行为
- ✅ 实时显示拦截结果

### 5. 多人抢票模拟器 (`simulate-seckill.html`)
- ✅ 模拟多个用户同时抢购
- ✅ 区分正常用户和黄牛模式
- ✅ 实时统计拦截率

---

## 🎯 AI风控原理

### 风控检测机制

```
用户请求 → 记录操作 → 检测高频行为 → 风险评分 → 拦截判断
                          ↓
                    - 5秒内请求>3次 → +20分
                    - 1分钟内请求>10次 → +30分
                    - 请求间隔<2秒 → +20分
                          ↓
                    评分>=10 → 拦截！
```

### 风险评分阈值

| 阈值 | 状态 | 说明 |
|------|------|------|
| 0-10 | 正常 | 无限制，可正常抢购 |
| 10-30 | 关注 | 可能被拦截 |
| 30+ | 风险 | 已被拦截，可能被封号 |

---

## 🧪 测试指南

### 本地测试

1. **启动服务**
   ```bash
   npm start
   ```

2. **管理员操作**
   - 打开 `monitor-admin.html`
   - 登录：`admin` / `admin123`
   - 添加商品，设置秒杀时间
   - 查看实时监控数据

3. **普通用户操作**
   - 打开 `seckill-frontend.html`
   - 注册新账号并登录
   - 等待秒杀开始后抢购

4. **黄牛测试**
   - 打开 `test-huaniu-script.html` 或 `simulate-seckill.html`
   - 选择商品
   - 选择「黄牛脚本」模式
   - 点击开始模拟
   - 观察拦截效果

### 在线测试（推荐）

使用 ngrok 部署后，可以：
- 让多个设备同时访问
- 模拟真实的多人抢购场景
- 测试AI风控的真实效果
- 验证在线人数统计是否准确

---

## 🔧 常用命令

```bash
# 安装依赖
npm install

# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

# 查看运行日志
pm2 logs

# 重启服务
pm2 restart seckill-system

# 停止服务
pm2 stop seckill-system

# 删除服务
pm2 delete seckill-system
```

---

## 📝 注意事项

1. **数据持久化**：所有数据存储在 `data/db.json`，删除此文件会重置所有数据

2. **生产环境**：建议使用 MySQL/PostgreSQL 数据库替代 JSON 文件

3. **安全建议**：
   - 修改默认管理员密码
   - 在生产环境中使用 HTTPS
   - 添加请求频率限制
   - 使用真实的数据库存储敏感信息

4. **性能优化**：
   - 使用 Redis 缓存热点数据
   - 添加数据库索引
   - 使用负载均衡

---

## 📞 技术支持

如有问题，请检查：
1. Node.js 版本（推荐 16.x 或 18.x）
2. 端口 3000 是否被占用
3. 数据库文件是否存在且格式正确

---

**祝你比赛顺利！🎉**