# EchoLife (人生回响) - AI Digital Life OS

> 全球首个 AI 数字生命操作系统，持续学习一个人的人生经历、价值观、性格、家庭关系和成长轨迹，形成可持续成长的数字生命。

## 项目概述

EchoLife 不是聊天机器人，不是回忆录，也不是数字分身 —— 它是一个持续成长的数字生命。通过 3 层认知模型（记忆 → 理解 → 成长）和 7 个 AI Agent 协同工作，将碎片化的人生经历转化为结构化的生命记忆体系。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 15, React 19, TypeScript, TailwindCSS, Framer Motion, Recharts |
| 后端 | NestJS 10, TypeScript, Prisma 5, Passport JWT |
| 数据库 | PostgreSQL 16 + pgvector (向量检索), Redis 7 (缓存/工作记忆) |
| AI | GLM-4-Plus (智谱 AI), 7 Agent 架构, RAG 混合检索 |
| 部署 | Docker, Docker Compose, Nginx 反向代理 |
| 工具链 | pnpm workspace, Turborepo, ESLint, Prettier |

## 项目结构

```
echolife/
├── apps/
│   ├── api/                    # NestJS 后端
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 28 张表完整 Schema
│   │   │   └── seed.ts         # 数据库种子数据
│   │   └── src/
│   │       ├── common/          # 公共模块 (guards, decorators, filters, utils)
│   │       ├── prisma/          # Prisma 服务
│   │       ├── redis/           # Redis 服务
│   │       └── modules/
│   │           ├── auth/        # 认证模块 (JWT + Refresh Token)
│   │           ├── user/        # 用户模块 (资料/设置/订阅)
│   │           ├── ai/          # AI 模块 (Agent 编排/LLM/RAG/Prompt)
│   │           ├── memory/      # 记忆管理
│   │           ├── interview/   # AI 访谈
│   │           ├── lifetree/    # 生命树
│   │           ├── personality/ # 人格 DNA
│   │           ├── family/      # 家庭记忆
│   │           ├── capsule/     # 时间胶囊
│   │           ├── summary/     # 生活总结
│   │           ├── knowledge/   # 知识图谱
│   │           ├── notification/# 通知
│   │           └── admin/       # 管理后台
│   └── web/                    # Next.js 前端
│       └── src/
│           ├── app/             # App Router 页面
│           ├── components/      # UI 组件
│           ├── hooks/           # 自定义 Hooks
│           ├── stores/          # Zustand 状态管理
│           └── lib/             # 工具库
├── packages/
│   └── shared/                 # 共享包 (类型/枚举/常量/工具)
├── infra/
│   ├── docker/                 # Dockerfile
│   └── nginx/                  # Nginx 配置
├── docker-compose.yml          # 全栈部署
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose (用于数据库)

### 1. 克隆并安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入 GLM_API_KEY 等配置
```

### 3. 启动数据库

```bash
docker compose up -d postgres redis
```

### 4. 数据库迁移和种子数据

```bash
pnpm db:migrate
pnpm db:generate
pnpm db:seed
```

### 5. 启动开发服务器

```bash
pnpm dev
```

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001/api/v1
- Swagger 文档: http://localhost:3001/api/docs

### 6. Docker 全栈部署

```bash
docker compose up -d
```

生产环境（含 Nginx）:

```bash
docker compose --profile production up -d
```

## 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@echolife.ai | Admin@2024 |
| 普通用户 | demo@echolife.ai | Demo@2024 |

## 核心 AI 架构

### 7 个 Agent

| Agent | 职责 |
|-------|------|
| Life Coach | 编排器，路由用户输入到合适的子 Agent |
| Story Agent | 访谈引导与故事生成 |
| Memory Agent | 记忆提取与 RAG 检索 |
| Emotion Agent | 情感分析与人格 DNA 生成 |
| Knowledge Agent | 实体提取与知识图谱构建 |
| Summary Agent | 周期性生活总结 |
| Relationship Agent | 家庭记忆交叉匹配 |

### RAG 混合检索

检索得分 = 语义相似度 (70%) + 时间衰减 (20%) + 情感权重 (10%)

使用 pgvector IVFFlat 索引进行近似最近邻搜索，1536 维向量。

### SSE 流式响应

AI 访谈使用 Server-Sent Events 流式输出，事件类型包括: `token`, `entities`, `emotion`, `done`, `error`。

## 安全设计

- JWT 认证 + Refresh Token 轮换
- RBAC 权限控制 (6 种角色)
- AES-256-GCM 字段级加密
- bcrypt 密码哈希
- Redis 限流 (100 次/分钟)
- 操作审计日志
- 软删除机制

## 许可证

私有项目，版权所有。
