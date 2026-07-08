# Chat Platform — Python 聊天平台

一个基于 Python 的前后端分离桌面聊天平台，支持用户注册/登录、添加好友、一对一私信功能。

## 技术栈

| 层面 | 技术 |
|------|------|
| 后端框架 | FastAPI（异步高性能） |
| 桌面 GUI | CustomTkinter（现代风格） |
| 数据库 | SQLite（通过 SQLAlchemy 2.0 async） |
| 实时通信 | WebSocket |
| 认证 | JWT + bcrypt 密码哈希 |

## 快速开始

### 1. 启动后端

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

后端启动后，访问 http://127.0.0.1:8000/docs 查看 Swagger API 文档。

### 2. 启动前端（桌面 GUI）

在另一个终端中：

```bash
cd frontend
pip install -r requirements.txt
python -m app.main
```

### 3. 使用

1. 注册两个账号（如 alice 和 bob）
2. 分别登录
3. 搜索对方用户名并发送好友请求
4. 对方接受后即可开始私信聊天

## 项目结构

```
chat_platform/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py             # 入口 + WebSocket 端点
│   │   ├── config.py           # 配置管理
│   │   ├── database.py         # 数据库连接
│   │   ├── models/             # ORM 模型
│   │   ├── schemas/            # Pydantic 模型
│   │   ├── routers/            # REST API 路由
│   │   ├── services/           # 业务逻辑
│   │   ├── websocket/          # WebSocket 管理
│   │   └── utils/              # 安全工具
│   └── requirements.txt
├── frontend/                   # 桌面 GUI 客户端
│   ├── app/
│   │   ├── main.py             # 应用入口
│   │   ├── api_client.py       # REST 客户端
│   │   ├── ws_client.py        # WebSocket 客户端
│   │   ├── session.py          # 会话管理
│   │   ├── views/              # 页面视图
│   │   ├── components/         # UI 组件
│   │   └── utils/              # 配置
│   └── requirements.txt
└── README.md
```

## API 端点

### 认证
- `POST /api/auth/register` — 注册
- `POST /api/auth/login` — 登录

### 用户
- `GET /api/users/search?q=xxx` — 搜索用户

### 好友
- `GET /api/friends` — 好友列表
- `POST /api/friends/requests` — 发送好友请求
- `GET /api/friends/requests` — 待处理请求
- `POST /api/friends/requests/{id}/accept` — 接受
- `POST /api/friends/requests/{id}/reject` — 拒绝

### 消息
- `GET /api/messages/{user_id}` — 聊天历史
- `ws://host:8000/ws?token=<jwt>` — WebSocket 实时消息
