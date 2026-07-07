# 见澄明 H5 全量项目

> AI 驱动的澄明力评测与训练系统

## 项目结构

```
jianchengming/
├── backend/              # Node.js 后端 (Fastify + PostgreSQL)
│   ├── src/
│   │   ├── app.js        # 入口
│   │   ├── config/
│   │   │   └── database.js    # PostgreSQL 连接池
│   │   ├── routes/
│   │   │   ├── user.js   # 用户 API
│   │   │   ├── eval.js   # 评测 API
│   │   │   ├── report.js # 报告 API
│   │   │   ├── coach.js  # 训练 API
│   │   │   └── health.js # 健康检查
│   │   ├── utils/
│   │   │   └── doubaoClient.js  # 豆包 API 封装
│   │   └── migrate.js    # 数据库迁移
│   ├── migrations/
│   │   └── 001_init_schema.sql  # 7 表 DDL
│   ├── package.json
│   └── .env.example
│
├── frontend/             # H5 前端 (原生 JS + Vite)
│   ├── src/
│   │   ├── js/
│   │   │   ├── app.js    # 主应用
│   │   │   └── config/api.js  # API 封装
│   │   └── css/style.css # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── docs/                 # 配置文件
    ├── questions-standard.json
    ├── questions-fast.json
    ├── scoring-standard.json
    ├── scoring-fast.json
    └── system-prompt.json
```

## 快速启动

### 后端
```bash
cd backend
cp .env.example .env   # 编辑数据库和 API Key 配置
npm install
npm run migrate        # 执行数据库迁移
npm run dev            # 开发模式
```

### 前端
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 原生 HTML/CSS/JS + Vite |
| 后端 | Node.js + Fastify |
| 数据库 | PostgreSQL (JSONB) |
| AI | 豆包 Doubao-Seed-2.0-lite |
| 部署 | Vercel + Supabase |
