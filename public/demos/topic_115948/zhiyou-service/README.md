# 智友服务端 (zhiyou-service)

基于 FastAPI 的智友后端服务。

## 技术栈

- **框架**：FastAPI（Python 异步 Web 框架）
- **ORM**：SQLAlchemy 2.0（异步）
- **数据库**：
  - 开发模式：SQLite（默认，无需额外安装）
  - 生产模式：PostgreSQL 16
- **缓存**：Redis（会话管理）
- **认证**：JWT（JSON Web Token）
- **AI 服务**：OpenAI 兼容接口

## 目录结构

```
zhiyou-service/
├── app/
│   ├── __init__.py
│   ├── main.py                 # 应用入口
│   ├── config.py               # 配置管理
│   ├── database.py             # 数据库连接
│   ├── core/
│   │   ├── __init__.py
│   │   └── security.py         # 密码哈希、JWT 工具
│   ├── models/                 # 数据模型
│   │   ├── __init__.py
│   │   ├── types.py            # 跨数据库兼容类型
│   │   ├── user.py
│   │   ├── friend.py
│   │   ├── chat.py
│   │   ├── memory.py
│   │   └── social.py
│   ├── schemas/                # Pydantic 模型（请求/响应）
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── friend.py
│   │   ├── chat.py
│   │   └── memory.py
│   ├── services/               # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── friend_service.py
│   │   ├── chat_service.py
│   │   ├── ai_service.py
│   │   └── memory_service.py
│   └── api/
│       └── v1/                 # API v1 路由
│           ├── __init__.py
│           ├── auth.py
│           ├── friends.py
│           ├── chat.py
│           └── memories.py
├── requirements.txt            # 依赖列表
└── zhiyou.db                   # SQLite 数据库文件（运行后自动生成）
```

## 快速开始

### 1. 环境要求

- Python 3.9+
- pip3

### 2. 安装依赖

```bash
cd zhiyou-service
pip3 install -r requirements.txt
```

### 3. 配置环境变量（可选）

开发模式使用 SQLite，无需配置即可启动。生产环境需要配置以下环境变量：

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `USE_SQLITE` | 是否使用 SQLite 数据库 | `true` |
| `DATABASE_URL` | 数据库连接地址（PostgreSQL） | - |
| `SECRET_KEY` | JWT 密钥 | 开发模式有默认值 |
| `ALGORITHM` | JWT 算法 | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 访问令牌过期时间（分钟） | `1440` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 刷新令牌过期时间（天） | `30` |
| `REDIS_URL` | Redis 连接地址 | `redis://localhost:6379/0` |
| `AI_API_BASE` | AI API 基础地址 | `https://api.openai.com/v1` |
| `AI_API_KEY` | AI API 密钥 | `sk-xxx`（需自行配置） |
| `AI_MODEL` | AI 模型名称 | `gpt-3.5-turbo` |

### 4. 启动服务

**开发模式（自动重载）：**

```bash
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**生产模式：**

```bash
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

启动后访问：
- API 文档（Swagger UI）：http://localhost:8000/docs
- API 文档（ReDoc）：http://localhost:8000/redoc
- 健康检查：http://localhost:8000/health

## API 接口

### 认证模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新令牌 |
| GET | `/api/v1/auth/me` | 获取当前用户信息 |

### 智友管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/friends` | 获取智友列表 |
| POST | `/api/v1/friends` | 创建智友 |
| GET | `/api/v1/friends/{id}` | 获取智友详情 |
| PUT | `/api/v1/friends/{id}` | 更新智友 |
| DELETE | `/api/v1/friends/{id}` | 删除智友 |

### 聊天模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/chat/{friend_id}/messages` | 获取聊天消息列表 |
| POST | `/api/v1/chat/{friend_id}/send` | 发送消息 |
| POST | `/api/v1/chat/{friend_id}/read` | 标记消息已读 |

### 记忆模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/chat/{friend_id}/memories` | 获取记忆列表 |
| POST | `/api/v1/chat/{friend_id}/memories` | 手动添加记忆 |
| DELETE | `/api/v1/chat/memories/{id}` | 删除记忆 |

## 数据库切换到 PostgreSQL

生产环境推荐使用 PostgreSQL，步骤如下：

1. 安装 PostgreSQL 16
2. 创建数据库和用户：
   ```sql
   CREATE DATABASE zhiyou;
   CREATE USER zhiyou WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE zhiyou TO zhiyou;
   ```
3. 设置环境变量：
   ```bash
   export USE_SQLITE=false
   export DATABASE_URL=postgresql+asyncpg://zhiyou:your_password@localhost:5432/zhiyou
   ```
4. 启动服务，表会自动创建

## 常见问题

### 1. 端口 8000 被占用

```bash
# 查看占用端口的进程
lsof -ti:8000

# 杀掉进程
lsof -ti:8000 | xargs kill -9
```

### 2. AI 聊天返回错误

需要配置有效的 `AI_API_KEY` 环境变量。开发阶段可暂时不配置，注册登录和智友管理功能不受影响。

### 3. 数据库迁移

目前使用 `Base.metadata.create_all` 自动建表，后续如果需要迁移管理，推荐使用 Alembic。

## 开发规范

- 代码风格遵循 PEP 8
- 异步函数命名使用 `async/await`
- 数据库操作全部使用异步会话
- API 响应统一使用 `BaseResponse` 包装
