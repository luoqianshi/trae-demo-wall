# 彩笺寄 - AI 写作规划工具 - 后端开发策划方案

## 1. 项目概述

### 1.1 项目背景
本项目是为学术写作者打造的 AI 写作规划工具，旨在帮助用户系统化管理长周期写作任务。前端已完成古风视觉风格的单页应用开发，现需设计并实现完整的后端服务架构。

### 1.2 核心目标
- 提供稳定可靠的 API 服务支撑前端业务
- 实现用户认证与数据持久化
- 支持 AI 写作规划核心功能
- 确保系统安全性与可扩展性

### 1.3 大赛评分标准考量
| 评分维度 | 设计要点 |
|---------|---------|
| 技术先进性 | 采用现代化技术栈，微服务架构，AI 集成 |
| 功能完整性 | 完整的用户管理、写作规划、数据统计功能 |
| 安全性 | JWT 认证、数据加密、防攻击措施 |
| 可扩展性 | 模块化设计、接口标准化、易于扩展 |

---

## 2. 项目架构设计

### 2.1 技术栈选型

| 分类 | 技术 | 版本 | 选型理由 |
|-----|------|------|---------|
| 语言 | Python | 3.11+ | 高性能、丰富的 AI 生态支持 |
| 框架 | FastAPI | 0.100+ | 现代异步框架，自动文档生成 |
| 数据库 | PostgreSQL | 15+ | 支持 JSON 类型，适合复杂数据结构 |
| ORM | SQLAlchemy | 2.0+ | 强大的 ORM 工具，支持异步操作 |
| 缓存 | Redis | 7.0+ | 高性能缓存，支持会话管理 |
| AI 集成 | OpenAI API | - | 提供写作建议与规划能力 |
| 认证 | PyJWT | 2.8+ | JWT 令牌管理 |
| 部署 | Docker | 24+ | 容器化部署，环境一致性 |
| 监控 | Prometheus + Grafana | - | 性能监控与告警 |

### 2.2 系统分层结构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端层 (Frontend)                      │
│              彩笺寄 HTML 单页应用                           │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/JSON
┌─────────────────────────▼───────────────────────────────────┐
│                    API 网关层 (Gateway)                     │
│           Nginx / FastAPI Router                           │
│         路由转发、请求限流、日志记录                         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/JSON
┌─────────────────────────▼───────────────────────────────────┐
│                    应用服务层 (Application)                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  User API   │ │  Plan API   │ │  Stat API   │           │
│  │  用户管理   │ │  写作规划   │ │  数据统计   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────┬───────────────────────────────────┘
                          │ SQL / Redis Protocol
┌─────────────────────────▼───────────────────────────────────┐
│                    数据层 (Data)                           │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │    PostgreSQL       │  │      Redis          │          │
│  │  持久化数据存储     │  │  缓存/会话/队列     │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 模块划分

| 模块 | 职责描述 |
|-----|---------|
| `auth` | 用户认证、JWT 令牌管理 |
| `user` | 用户信息管理、个人资料 |
| `plan` | 写作计划、任务管理 |
| `progress` | 进度追踪、统计分析 |
| `ai` | AI 写作建议、内容生成 |
| `utils` | 工具函数、通用服务 |
| `config` | 配置管理 |

---

## 3. 数据库设计

### 3.1 数据模型

#### 3.1.1 用户表 (users)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| `id` | UUID | PRIMARY KEY | 用户唯一标识 |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱地址 |
| `username` | VARCHAR(64) | UNIQUE, NOT NULL | 用户名 |
| `password_hash` | VARCHAR(255) | NOT NULL | 密码哈希 |
| `avatar_url` | VARCHAR(512) | NULL | 头像链接 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

#### 3.1.2 写作计划表 (writing_plans)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| `id` | UUID | PRIMARY KEY | 计划唯一标识 |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | 所属用户 |
| `title` | VARCHAR(255) | NOT NULL | 计划标题 |
| `description` | TEXT | NULL | 计划描述 |
| `status` | VARCHAR(32) | NOT NULL, DEFAULT 'draft' | 状态：draft/active/completed |
| `deadline` | DATE | NULL | 截止日期 |
| `total_words` | INTEGER | DEFAULT 0 | 目标总字数 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

#### 3.1.3 任务表 (tasks)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| `id` | UUID | PRIMARY KEY | 任务唯一标识 |
| `plan_id` | UUID | FOREIGN KEY, NOT NULL | 所属计划 |
| `title` | VARCHAR(255) | NOT NULL | 任务标题 |
| `description` | TEXT | NULL | 任务描述 |
| `order_num` | INTEGER | NOT NULL | 排序序号 |
| `status` | VARCHAR(32) | NOT NULL, DEFAULT 'pending' | 状态：pending/in_progress/completed |
| `target_words` | INTEGER | DEFAULT 0 | 目标字数 |
| `completed_words` | INTEGER | DEFAULT 0 | 已完成字数 |
| `deadline` | DATE | NULL | 截止日期 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 更新时间 |

#### 3.1.4 写作记录表 (writing_records)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| `id` | UUID | PRIMARY KEY | 记录唯一标识 |
| `task_id` | UUID | FOREIGN KEY, NOT NULL | 所属任务 |
| `content` | TEXT | NULL | 写作内容 |
| `word_count` | INTEGER | NOT NULL | 字数统计 |
| `writing_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | 写作日期 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

#### 3.1.5 AI 建议表 (ai_suggestions)

| 字段名 | 类型 | 约束 | 说明 |
|-------|------|------|------|
| `id` | UUID | PRIMARY KEY | 建议唯一标识 |
| `user_id` | UUID | FOREIGN KEY, NOT NULL | 所属用户 |
| `plan_id` | UUID | FOREIGN KEY, NULL | 关联计划 |
| `suggestion_type` | VARCHAR(32) | NOT NULL | 建议类型 |
| `content` | TEXT | NOT NULL | 建议内容 |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |

### 3.2 关系设计

```mermaid
erDiagram
    users ||--o{ writing_plans : "拥有"
    writing_plans ||--o{ tasks : "包含"
    tasks ||--o{ writing_records : "记录"
    users ||--o{ ai_suggestions : "接收"
    writing_plans ||--o{ ai_suggestions : "关联"
```

### 3.3 索引策略

| 表名 | 索引字段 | 索引类型 | 说明 |
|-----|---------|---------|------|
| `users` | `email` | UNIQUE | 加速邮箱登录查询 |
| `users` | `username` | UNIQUE | 加速用户名查询 |
| `writing_plans` | `user_id` | INDEX | 加速用户计划列表查询 |
| `writing_plans` | `status` | INDEX | 加速状态筛选 |
| `tasks` | `plan_id` | INDEX | 加速计划任务列表查询 |
| `tasks` | `status` | INDEX | 加速状态筛选 |
| `writing_records` | `task_id` | INDEX | 加速任务记录查询 |
| `writing_records` | `writing_date` | INDEX | 加速日期范围查询 |
| `ai_suggestions` | `user_id` | INDEX | 加速用户建议查询 |

---

## 4. API 接口规范

### 4.1 RESTful 设计原则

1. **资源命名**：使用名词而非动词
2. **HTTP 方法**：GET(查询)、POST(创建)、PUT(更新)、DELETE(删除)
3. **状态码**：遵循标准 HTTP 状态码
4. **版本控制**：URL 中包含版本号 `/api/v1/`
5. **错误处理**：统一错误响应格式

### 4.2 请求/响应格式

#### 通用响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 分页响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "size": 10,
    "pages": 10
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 错误响应格式

```json
{
  "code": 400,
  "message": "Bad Request",
  "detail": "具体错误描述",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 4.3 状态码定义

| 状态码 | 含义 | 使用场景 |
|-------|------|---------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 删除成功，无返回内容 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或认证失败 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如重复创建） |
| 500 | Internal Server Error | 服务器内部错误 |

### 4.4 接口清单

#### 4.4.1 认证接口

| API 路径 | HTTP 方法 | 功能描述 |
|---------|----------|---------|
| `/api/v1/auth/register` | POST | 用户注册 |
| `/api/v1/auth/login` | POST | 用户登录 |
| `/api/v1/auth/logout` | POST | 用户登出 |
| `/api/v1/auth/refresh` | POST | 刷新令牌 |

#### 4.4.2 用户接口

| API 路径 | HTTP 方法 | 功能描述 |
|---------|----------|---------|
| `/api/v1/users/me` | GET | 获取当前用户信息 |
| `/api/v1/users/me` | PUT | 更新用户信息 |
| `/api/v1/users/me/password` | PUT | 修改密码 |

#### 4.4.3 写作计划接口

| API 路径 | HTTP 方法 | 功能描述 |
|---------|----------|---------|
| `/api/v1/plans` | GET | 获取用户计划列表 |
| `/api/v1/plans` | POST | 创建写作计划 |
| `/api/v1/plans/{plan_id}` | GET | 获取计划详情 |
| `/api/v1/plans/{plan_id}` | PUT | 更新计划信息 |
| `/api/v1/plans/{plan_id}` | DELETE | 删除写作计划 |

#### 4.4.4 任务接口

| API 路径 | HTTP 方法 | 功能描述 |
|---------|----------|---------|
| `/api/v1/plans/{plan_id}/tasks` | GET | 获取计划任务列表 |
| `/api/v1/plans/{plan_id}/tasks` | POST | 创建任务 |
| `/api/v1/tasks/{task_id}` | GET | 获取任务详情 |
| `/api/v1/tasks/{task_id}` | PUT | 更新任务信息 |
| `/api/v1/tasks/{task_id}` | DELETE | 删除任务 |

#### 4.4.5 写作记录接口

| API 路径 | HTTP 方法 | 功能描述 |
|---------|----------|---------|
| `/api/v1/tasks/{task_id}/records` | GET | 获取任务写作记录 |
| `/api/v1/tasks/{task_id}/records` | POST | 提交写作记录 |
| `/api/v1/records/{record_id}` | GET | 获取记录详情 |
| `/api/v1/records/{record_id}` | PUT | 更新记录内容 |
| `/api/v1/records/{record_id}` | DELETE | 删除记录 |

#### 4.4.6 统计接口

| API 路径 | HTTP 方法 | 功能描述 |
|---------|----------|---------|
| `/api/v1/stats/daily` | GET | 获取每日写作统计 |
| `/api/v1/stats/weekly` | GET | 获取周写作统计 |
| `/api/v1/stats/monthly` | GET | 获取月写作统计 |
| `/api/v1/stats/plan/{plan_id}` | GET | 获取计划统计 |

#### 4.4.7 AI 建议接口

| API 路径 | HTTP 方法 | 功能描述 |
|---------|----------|---------|
| `/api/v1/ai/suggestions` | GET | 获取 AI 建议列表 |
| `/api/v1/ai/suggestions` | POST | 请求 AI 建议 |
| `/api/v1/ai/suggestions/{suggestion_id}` | DELETE | 删除建议 |
| `/api/v1/ai/generate-outline` | POST | 生成写作大纲 |

---

## 5. 核心功能模块实现方案

### 5.1 用户认证模块

#### 5.1.1 注册流程

```mermaid
sequenceDiagram
    participant Client as 前端
    participant API as Auth API
    participant DB as PostgreSQL

    Client->>API: POST /api/v1/auth/register
    Note over Client,API: { email, username, password }
    API->>DB: 检查邮箱是否已存在
    alt 邮箱已存在
        DB-->>API: 返回冲突
        API-->>Client: 409 Conflict
    else 邮箱不存在
        DB-->>API: 确认不存在
        API->>API: 密码哈希(BCrypt)
        API->>DB: 插入用户记录
        DB-->>API: 返回用户ID
        API->>API: 生成JWT令牌
        API-->>Client: 201 Created { user, access_token, refresh_token }
    end
```

#### 5.1.2 JWT 令牌结构

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 5.2 写作计划模块

#### 5.2.1 计划创建流程

1. 接收用户请求，验证 JWT 令牌
2. 验证请求参数（标题必填）
3. 生成计划 ID，创建数据库记录
4. 返回计划详情

#### 5.2.2 任务排序机制

- 使用 `order_num` 字段维护任务顺序
- 创建任务时自动计算下一个序号
- 支持拖拽排序，更新 `order_num`

### 5.3 进度统计模块

#### 5.3.1 统计计算逻辑

```
计划完成率 = (已完成任务数 / 总任务数) × 100%
写作进度 = (累计完成字数 / 目标总字数) × 100%
日均写作量 = 总字数 / 创作天数
```

#### 5.3.2 数据聚合策略

- 实时计算：适用于单个计划的统计
- 定时缓存：每日统计数据缓存到 Redis
- 增量更新：写作记录提交时更新缓存

### 5.4 AI 集成模块

#### 5.4.1 AI 建议生成流程

```mermaid
sequenceDiagram
    participant Client as 前端
    participant API as AI API
    participant Redis as 缓存
    participant OpenAI as OpenAI API

    Client->>API: POST /api/v1/ai/suggestions
    Note over Client,API: { plan_id, suggestion_type }
    API->>Redis: 检查是否有缓存建议
    alt 存在缓存
        Redis-->>API: 返回缓存数据
        API-->>Client: 200 OK { suggestion }
    else 无缓存
        Redis-->>API: 无缓存
        API->>OpenAI: 请求 AI 生成建议
        OpenAI-->>API: 返回建议内容
        API->>Redis: 缓存建议（有效期1小时）
        API->>DB: 保存建议记录
        API-->>Client: 200 OK { suggestion }
    end
```

---

## 6. 安全策略

### 6.1 认证授权机制

#### 6.1.1 JWT 认证流程

1. 用户登录获取 `access_token` 和 `refresh_token`
2. 每次请求在 `Authorization` 头携带 `Bearer {token}`
3. 服务端验证令牌签名和过期时间
4. 令牌过期时使用 `refresh_token` 获取新令牌

#### 6.1.2 权限控制

- **基于角色的访问控制 (RBAC)**：普通用户、管理员
- **资源级权限**：用户只能访问自己的数据
- **API 限流**：单用户每分钟最多 60 次请求

### 6.2 数据加密方案

| 数据类型 | 加密方式 | 说明 |
|---------|---------|------|
| 用户密码 | BCrypt | 强度因子 12 |
| JWT 令牌 | HS256/RS256 | 对称/非对称加密 |
| 敏感配置 | 环境变量 | 不存储在代码仓库 |
| 传输数据 | HTTPS | TLS 1.3 |

### 6.3 防攻击措施

| 攻击类型 | 防护措施 |
|---------|---------|
| SQL 注入 | 使用 ORM 参数化查询 |
| XSS | 输出转义，前端过滤 |
| CSRF | JWT 无状态认证天然防护 |
| 暴力破解 | 登录失败次数限制，账户锁定 |
| 拒绝服务 | API 限流，请求频率控制 |
| 敏感数据泄露 | 日志脱敏，禁止明文存储密码 |

---

## 7. 性能优化策略

### 7.1 缓存策略

| 缓存类型 | 缓存内容 | 过期时间 |
|---------|---------|---------|
| 用户会话 | JWT 令牌验证结果 | 令牌有效期 |
| 统计数据 | 每日/周/月统计 | 1 小时 |
| AI 建议 | 生成的建议内容 | 1 小时 |
| 热门计划 | 公开计划列表 | 30 分钟 |

### 7.2 数据库优化

1. **索引优化**：根据查询模式创建合适索引
2. **查询优化**：避免 N+1 查询，使用 JOIN 和批量操作
3. **读写分离**：主库写，从库读（高并发场景）
4. **连接池**：配置合理的数据库连接池大小

### 7.3 异步处理

- **任务队列**：使用 Redis 队列处理耗时任务
- **AI 建议生成**：异步调用，通过 WebSocket 推送结果
- **数据统计**：定时任务离线计算

### 7.4 代码优化

- **异步编程**：使用 FastAPI 异步特性
- **批量操作**：减少数据库交互次数
- **资源复用**：复用 HTTP 客户端连接

---

## 8. 部署方案

### 8.1 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    外部访问层                            │
│           Nginx (SSL 终止、负载均衡)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    应用层                               │
│         FastAPI 服务 (多实例容器)                       │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    数据层                               │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   PostgreSQL    │  │     Redis       │              │
│  │   (主从复制)    │  │  (集群模式)     │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Docker 配置

**docker-compose.yml 核心配置**

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET_KEY=your-secret-key
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=app
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./cert:/etc/nginx/cert
    depends_on:
      - web

volumes:
  postgres_data:
  redis_data:
```

### 8.3 环境配置

| 环境 | 数据库 | Redis | 日志级别 |
|-----|-------|-------|---------|
| 开发 | SQLite | 本地 | DEBUG |
| 测试 | PostgreSQL | 本地 | INFO |
| 生产 | PostgreSQL (主从) | Redis 集群 | WARNING |

---

## 9. 开发进度计划

### 9.1 时间线规划

| 阶段 | 时间 | 任务 | 交付物 |
|-----|------|------|-------|
| 需求分析 | 第1周 | 需求评审、技术选型 | 需求文档、技术方案 |
| 基础架构 | 第2周 | 项目初始化、数据库设计 | 项目框架、数据库脚本 |
| 核心模块 | 第3-4周 | 用户认证、写作计划、任务管理 | API 接口、单元测试 |
| AI 集成 | 第5周 | AI 建议生成、大纲生成 | AI 模块、集成测试 |
| 统计模块 | 第6周 | 数据统计、可视化接口 | 统计 API |
| 测试优化 | 第7周 | 性能测试、Bug 修复 | 测试报告 |
| 部署上线 | 第8周 | Docker 部署、环境配置 | 部署文档 |

### 9.2 关键里程碑

1. **M1**：基础架构完成（第2周结束）
2. **M2**：核心功能完成（第4周结束）
3. **M3**：AI 集成完成（第5周结束）
4. **M4**：测试通过（第7周结束）
5. **M5**：部署上线（第8周结束）

---

## 10. 测试策略

### 10.1 测试类型

| 测试类型 | 工具 | 覆盖率要求 |
|---------|------|-----------|
| 单元测试 | pytest | ≥ 80% |
| 集成测试 | pytest + TestClient | 核心流程全覆盖 |
| API 测试 | pytest + requests | 所有接口 |
| 性能测试 | locust | 100 QPS 响应 < 100ms |
| 安全测试 | bandit | 无高危漏洞 |

### 10.2 测试环境

- **测试数据库**：独立 PostgreSQL 实例
- **测试用户**：专用测试账号
- **数据隔离**：每次测试前清理数据

### 10.3 CI/CD 流程

```mermaid
flowchart LR
    A[代码提交] --> B[CI 触发]
    B --> C[代码检查]
    C --> D[单元测试]
    D --> E[集成测试]
    E --> F[安全扫描]
    F --> G{测试通过?}
    G -->|是| H[构建镜像]
    G -->|否| I[通知失败]
    H --> J[部署测试环境]
    J --> K[验收测试]
    K --> L{通过?}
    L -->|是| M[部署生产]
    L -->|否| I
```

---

## 附录：核心配置示例

### JWT 配置

```python
JWT_SECRET_KEY = "your-256-bit-secret-key-here"
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7
```

### 数据库配置

```python
DATABASE_URL = "postgresql://user:password@host:port/database"
REDIS_URL = "redis://host:port"
```

### API 限流配置

```python
RATE_LIMIT = "60/minute"
MAX_REQUESTS_PER_MINUTE = 60
```

---

**文档版本**：v1.0  
**创建日期**：2026年6月  
**适用项目**：彩笺寄 - AI 写作规划工具