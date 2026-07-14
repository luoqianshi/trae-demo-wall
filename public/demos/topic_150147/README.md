# PBL K-12 项目制学习平台

专为中小学生打造的「纯线上PBL项目学习平台」，让教育机构一键开展标准化PBL课程，让学生在"做中学"的过程中培养科学探究、动手实践和协作能力。平台预置100+个精心设计的K-12项目任务，覆盖科学实验、自然探索、创意制作、编程入门、人文社科、生活实践等多个类别。

## 项目架构

```
PBL/
├── server/              # 后端API服务 (Node.js + Express + TypeScript + SQLite)
│   ├── src/
│   │   ├── config/      # 配置：数据库、环境变量
│   │   ├── middleware/   # 中间件：JWT认证
│   │   ├── models/      # 数据模型与初始化
│   │   ├── routes/      # API路由
│   │   └── index.ts     # 服务入口
│   └── package.json
├── admin-web/           # 管理后台 (React + TypeScript + Vite + Ant Design)
│   ├── src/
│   │   ├── pages/       # 页面
│   │   ├── services/    # API服务
│   │   └── App.tsx      # 路由配置
│   └── package.json
├── platform-admin/      # 平台总后台 (React + TypeScript + Vite + Ant Design)
│   ├── src/
│   │   ├── pages/       # 页面
│   │   └── App.tsx
│   └── package.json
├── miniapp/             # 学生端小程序 (Taro + React)
│   ├── src/
│   │   ├── pages/       # 页面
│   │   └── app.config.ts
│   └── package.json
└── README.md
```

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Node.js 18+ / Express / TypeScript / SQLite (better-sqlite3) |
| 管理后台 | React 18 / TypeScript / Vite / Ant Design 5 |
| 平台管理 | React 18 / TypeScript / Vite / Ant Design 5 |
| 学生小程序 | Taro 3 / React 18 / 微信小程序 / H5 |

## 快速启动

### 1. 启动后端服务

```bash
cd server
npm install
npm run dev
```

服务启动在 `http://localhost:3000`

### 2. 启动管理后台

```bash
cd admin-web
npm install
npm run dev
```

访问 `http://localhost:5173`

### 3. 启动平台管理后台

```bash
cd platform-admin
npm install
npm run dev
```

访问 `http://localhost:5174`

### 4. 启动学生小程序

```bash
cd miniapp
npm install
npm run dev:weapp
```

用微信开发者工具打开 `miniapp/dist` 目录

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 平台管理员 | admin | admin123 |
| 教师 | teacher | teacher123 |
| 学生 | student | student123 |

## 预置PBL任务类别

| 类别 | 数量 | 说明 |
|------|------|------|
| 科学实验 | 20+ | 物理、化学、生物实验探究 |
| 自然探索 | 15+ | 自然观察、环境研究 |
| 创意制作 | 18+ | 手工DIY、模型搭建、艺术创作 |
| 编程入门 | 12+ | Scratch、Python基础、AI初体验 |
| 人文社科 | 20+ | 古诗词、历史、地理、文化 |
| 生活实践 | 15+ | 社区服务、商业模拟 |

## 环境变量配置

复制 `server/.env` 并根据需要修改：

```env
PORT=3000
JWT_SECRET=your-jwt-secret
DB_PATH=./data/pbl.db
UPLOAD_DIR=./uploads
WX_APPID=your_wx_appid
WX_SECRET=your_wx_secret
```

## 开发说明

- 后端使用SQLite，无需额外安装数据库，开箱即用
- 首次启动自动创建数据库表和预置数据
- 管理后台通过Vite代理访问后端API
- 小程序需要在微信开发者工具中配置后端API地址
- 文件上传支持jpg/png/gif/pdf/doc/ppt/mp4/mp3/zip格式，最大10MB

## 文档

- [产品需求文档 (PRD)](docs/PRD.md)
- [软件工程文档使用指南](docs/软件工程文档使用指南-面向智能体.md)
- 详细设计文档见 `.trae/documents/` 目录
