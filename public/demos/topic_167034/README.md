# PetPilot - AI桌面宠物 Demo

一个可交互的 AI 桌面宠物 Demo，用于展示未来产品形态。

## 项目结构

```
petpilot-demo/
├── server.py              # Flask 后端服务器
├── requirements.txt       # Python 依赖
├── .env.example           # 环境变量示例（不含真实Key）
├── .gitignore             # Git 忽略配置
├── README.md              # 项目说明
└── frontend/              # 前端文件
    ├── index.html         # 主页面
    ├── style.css          # 样式文件
    └── app.js             # 前端逻辑
```

## 功能特性

- 🐱 **AI宠物互动**：点击宠物触发随机动作和表情
- 💬 **智能聊天**：基于 DeepSeek API 的 AI 对话
- 🧠 **记忆系统**：宠物会记住主人的名字、喜好等信息
- 📊 **次数限制**：每日免费体验 100 次
- 📱 **响应式设计**：支持桌面和移动设备

## 技术栈

- **前端**：HTML / CSS / JavaScript
- **后端**：Python Flask
- **AI**：DeepSeek API

## 安装与运行

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置 API Key

复制 `.env.example` 为 `.env` 并填写你的 DeepSeek API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
DEEPSEEK_API_KEY=your_api_key_here
```

获取 API Key：https://platform.deepseek.com/

### 3. 启动服务器

```bash
python server.py
```

### 4. 访问应用

打开浏览器访问：http://localhost:3000

## API 接口

### POST /api/chat

发送聊天消息

**请求**：
```json
{
    "session_id": "xxx",
    "message": "你好"
}
```

**返回**：
```json
{
    "success": true,
    "reply": "喵~你好呀主人！",
    "trial_used": 1,
    "trial_total": 100
}
```

### GET /api/session

获取或创建会话

**请求**：
```
GET /api/session?session_id=xxx
```

**返回**：
```json
{
    "success": true,
    "session_id": "abc123",
    "trial_used": 0,
    "trial_total": 100
}
```

### GET /api/user_data

获取用户数据

**请求**：
```
GET /api/user_data?session_id=xxx
```

**返回**：
```json
{
    "success": true,
    "trial_used": 5,
    "trial_total": 100
}
```

## 安全说明

### API Key 安全

- API Key 仅存储在服务器端的 `.env` 文件中
- 前端代码中不包含任何 API Key
- 所有 AI 请求通过服务器代理转发
- 禁止在前端使用 localStorage 保存 API Key

### 数据存储

用户数据保存在 `memory/` 目录下，文件名格式为 `{session_id}.json`：

```json
{
    "user_profile": {
        "name": "张三",
        "nickname": "",
        "likes": ["我喜欢吃苹果"],
        "dislikes": []
    },
    "pet_memory": {
        "important_events": [],
        "conversation_summary": ""
    },
    "chat_history": [],
    "trial_count": 10,
    "last_reset": "2024-01-15"
}
```

### 发布注意事项

**不要发送以下文件：**
- ❌ `.env` - 包含 API Key
- ❌ `memory/` - 包含用户数据
- ❌ `__pycache__/` - Python 缓存文件
- ❌ `node_modules/` - Node.js 依赖

**应该发送的文件：**
- ✅ `server.py`
- ✅ `requirements.txt`
- ✅ `.env.example`
- ✅ `frontend/`
- ✅ `README.md`
- ✅ `.gitignore`

## 部署方案

### 方案A：自己部署服务器（推荐）

将服务器部署到云服务器（如阿里云 ECS、腾讯云、Render 等），用户通过公网访问。

```
用户浏览器 → 你的服务器 → DeepSeek API
```

用户完全接触不到 API Key。

### 方案B：别人本地运行

发送压缩包给别人，让其在本地运行。

打包内容：
```
PetPilot-Demo.zip/
├── server.py
├── requirements.txt
├── .env.example
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md
```

别人需要自己创建 `.env` 文件并填写自己的 API Key。

## 额外建议

### 后端限流

每个用户每日 100 次聊天限制已内置在代码中。

### API 额度限制

建议在 DeepSeek 后台设置：
- 月预算
- 消费提醒
- 额度限制

### 生产环境 CORS 配置

生产环境应限制跨域：

```python
CORS(app, origins=["https://yourdomain.com"])
```

## License

MIT License