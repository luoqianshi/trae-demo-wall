# 邻聚 (LinkHood) - 沉浸式邻圈社交平台

邻聚是一个面向小区、大学和朋友圈的真实身份邻圈社交与生活供需交易平台。本项目为完整可部署的全栈应用，包含前端、后端、MySQL 数据库，支持 Docker Compose 一键部署。

## 技术栈

- **前端**：原生 HTML + CSS + JavaScript（无需构建工具）
- **后端**：Node.js + Express + Sequelize ORM
- **数据库**：MySQL 8.0
- **部署**：Docker Compose
- **认证**：JWT + bcryptjs

## 项目结构

```
linkhood/
├── docker-compose.yml          # Docker Compose 部署配置
├── README.md                   # 项目说明
├── backend/                    # 后端服务
│   ├── Dockerfile
│   ├── package.json
│   ├── .env                    # 环境变量（开发用）
│   ├── .sequelizerc            # Sequelize CLI 配置
│   ├── server.js               # 主入口
│   ├── config/
│   │   └── database.js         # 数据库配置
│   ├── middleware/
│   │   └── auth.js             # JWT 认证中间件
│   ├── models/                 # Sequelize 数据模型
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Circle.js
│   │   ├── CircleMember.js
│   │   ├── Need.js
│   │   ├── Order.js
│   │   ├── Activity.js
│   │   ├── Feedback.js
│   │   ├── AuthRecord.js
│   │   └── Comment.js
│   ├── routes/                 # API 路由
│   │   ├── auth.js
│   │   ├── circles.js
│   │   ├── needs.js
│   │   ├── orders.js
│   │   ├── activities.js
│   │   ├── feedbacks.js
│   │   └── users.js
│   ├── migrations/             # 数据库迁移文件
│   │   ├── 001-create-users.js
│   │   ├── 002-create-circles.js
│   │   ├── 003-create-circle-members.js
│   │   ├── 004-create-needs.js
│   │   ├── 005-create-orders.js
│   │   ├── 006-create-activities.js
│   │   ├── 007-create-feedbacks.js
│   │   ├── 008-create-auth-records.js
│   │   └── 009-create-comments.js
│   └── seeders/
│       └── 001-demo-data.js    # 演示数据
└── frontend/                   # 前端静态页面
    ├── Dockerfile
    ├── nginx.conf              # Nginx 配置（含 API 代理）
    ├── index.html
    ├── api.js                  # API 客户端封装
    ├── app.js                  # 前端应用逻辑
    └── styles.css              # 样式
```

## 快速开始（Docker Compose）

### 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0

### 一键启动

```bash
# 进入项目目录
cd linkhood

# 构建并启动所有服务（前端、后端、MySQL）
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

启动后访问：
- **前端页面**：http://localhost:8080
- **后端 API**：http://localhost:3000
- **API 健康检查**：http://localhost:3000/health

### 停止服务

```bash
docker-compose down

# 同时删除数据卷（会清空数据库）
docker-compose down -v
```

## 数据迁移

后端容器启动时会自动执行迁移和填充演示数据：

```bash
# 手动执行迁移（进入后端容器）
docker exec -it linkhood-backend sh
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 迁移命令（本地开发）

```bash
cd backend
npm install

# 运行迁移
npm run migrate

# 填充演示数据
npm run seed

# 重置（撤销所有迁移）
npm run migrate:undo
```

## 演示账号

演示数据已预置以下账号（密码均为 `123456`）：

| 用户名 | 昵称 | 角色 |
|--------|------|------|
| admin | 管理员 | 超级管理员 |
| linxiaoman | 林小满 | 普通用户 |
| zhouyu | 周屿 | 普通用户 |
| chenyi | 陈一 | 普通用户 |
| xuan | 许安 | 普通用户 |
| yeweihui | 业委会观察员 | 普通用户 |
| nangua | 南瓜烘焙 | 普通用户 |

## API 接口列表

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/auth-record` - 提交认证
- `GET /api/auth/auth-records` - 获取我的认证列表

### 邻圈
- `GET /api/circles` - 邻圈列表
- `GET /api/circles/:id` - 邻圈详情
- `POST /api/circles/:id/join` - 申请加入
- `POST /api/circles/:id/review/:userId` - 审核加入（管理员）

### 供需
- `GET /api/needs` - 需求列表（支持分类、关键词筛选）
- `GET /api/needs/:id` - 需求详情
- `POST /api/needs` - 发布需求
- `POST /api/needs/:id/boost` - 助力
- `POST /api/needs/:id/comments` - 评论

### 订单
- `GET /api/orders` - 我的订单
- `GET /api/orders/:id` - 订单详情
- `POST /api/orders` - 创建订单（接受需求）
- `PUT /api/orders/:id/status` - 更新订单状态

### 活动
- `GET /api/activities` - 活动列表
- `POST /api/activities` - 发布活动
- `POST /api/activities/:id/enroll` - 报名活动

### 反馈
- `GET /api/feedbacks` - 反馈列表
- `POST /api/feedbacks` - 提交反馈
- `POST /api/feedbacks/:id/boost` - 助力反馈

### 用户
- `GET /api/users/:id` - 用户公开信息
- `PUT /api/users/profile` - 更新个人信息

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| NODE_ENV | development | 运行环境 |
| PORT | 3000 | 后端端口 |
| DB_HOST | mysql | 数据库主机 |
| DB_PORT | 3306 | 数据库端口 |
| DB_NAME | linkhood | 数据库名 |
| DB_USER | linkhood | 数据库用户 |
| DB_PASSWORD | linkhood123 | 数据库密码 |
| DB_ROOT_PASSWORD | root123 | MySQL root 密码 |
| JWT_SECRET | linkhood-secret-key... | JWT 密钥 |

## 本地开发（不使用 Docker）

### 后端

```bash
cd backend
npm install

# 确保本地 MySQL 已运行，并创建数据库
# 修改 .env 中的 DB_HOST 为 localhost

npm run migrate
npm run seed
npm run dev
```

### 前端

前端为纯静态页面，可直接用任意 HTTP 服务器打开：

```bash
cd frontend
python3 -m http.server 8080
```

## 核心功能模块

1. **用户身份与认证** - 注册/登录、实名认证、行业认证、小区/大学认证、信用体系
2. **邻圈管理** - 小区/大学/朋友圈、加入申请与审核、成员管理
3. **供需发布与管理** - 活动、闲置物品、技能服务、居家创业、意见反馈
4. **交易与订单** - 接受需求、订单管理、担保支付流程、评价机制
5. **社交与活动** - 活动发布与报名、心情树洞、问答互动
6. **我的中心** - 发布管理、订单管理、认证状态、设置

## 注意事项

- 生产环境部署前请修改 `JWT_SECRET` 和数据库密码
- 图片上传功能当前为前端演示，生产环境建议接入 OSS 或本地存储
- 支付功能为流程演示，未接入真实支付接口
