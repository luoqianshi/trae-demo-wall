# 智萃 WisdomFlow - 企业隐性知识自动化萃取与传承平台

## 项目概述

智萃(WisdomFlow)是一个企业隐性知识自动化萃取与传承平台，通过AI访谈机器人与专家对话，自动提炼知识，生成结构化文档和SOP，构建企业知识体系。

## 技术栈

### 后端
- Node.js 20.x LTS
- Express 4.x
- MySQL 8.0+
- Redis 7.x
- Sequelize ORM
- JWT 认证

### 前端
- Vue 3 + Vite
- Element Plus
- Axios

### 小程序
- UniApp
- Vue 3

## 项目结构

```
.
├── backend/           # 后端服务
│   ├── config/        # 配置文件
│   ├── controllers/   # 控制器
│   ├── middleware/    # 中间件
│   ├── models/        # 数据模型
│   ├── routes/        # 路由配置
│   ├── utils/         # 工具函数
│   ├── app.js         # 应用入口
│   ├── server.js      # 服务启动
│   └── package.json
├── frontend/          # 前端Web应用
│   ├── src/
│   │   ├── api/       # API封装
│   │   ├── router/    # 路由配置
│   │   ├── views/     # 页面组件
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── miniapp/           # UniApp小程序
│   ├── pages/         # 页面
│   ├── api/           # API封装
│   ├── App.vue
│   ├── main.ts
│   ├── pages.json
│   └── manifest.json
├── docs/              # 文档
│   ├── ARCHITECTURE.md
│   └── PROJECT_RULES.md
└── README.md
```

## 快速开始

### 后端启动

```bash
cd backend
npm install
npm run dev
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

### 小程序开发

```bash
cd miniapp
npm install
npm run dev:h5        # H5预览
npm run dev:mp-weixin # 微信小程序预览
```

## API接口

### 认证模块
- POST /api/v1/auth/login - 登录
- POST /api/v1/auth/register - 注册

### 用户模块
- GET /api/v1/users/me - 获取当前用户

### 访谈模块
- GET /api/v1/interviews - 获取访谈列表
- POST /api/v1/interviews - 创建访谈
- GET /api/v1/interviews/:id - 获取访谈详情
- POST /api/v1/interviews/:id/messages - 添加消息
- POST /api/v1/interviews/:id/complete - 完成访谈

### 知识模块
- GET /api/v1/knowledge - 获取知识列表
- GET /api/v1/knowledge/:id - 获取知识详情
- PUT /api/v1/knowledge/:id/verify - 验证知识

### SOP模块
- GET /api/v1/sops - 获取SOP列表
- GET /api/v1/sops/:id - 获取SOP详情

### 仪表盘
- GET /api/v1/dashboard/stats - 获取统计数据

## 数据库配置

修改 `backend/.env` 文件：

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wisdomflow
DB_USER=root
DB_PASSWORD=password
```

## 安全特性

- JWT认证
- RBAC权限控制
- API限流
- 密码加密(bcrypt)
- HTTPS支持

## 许可证

MIT License
