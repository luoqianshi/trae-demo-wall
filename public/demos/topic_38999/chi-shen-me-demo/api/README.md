# 「吃什么」API 服务部署指南

## 快速开始

### 1. 获取 DeepSeek API 密钥

前往 [DeepSeek 开放平台](https://platform.deepseek.com/api_keys) 注册并获取 API 密钥。

### 2. 安装依赖

```bash
cd api
npm install  # 实际上无需额外依赖，使用 Node.js 内置模块
```

### 3. 配置环境变量

```bash
# 方法 1：直接设置环境变量
export DEEPSEEK_API_KEY="sk-your-api-key-here"

# 方法 2：复制 .env 文件
cp .env.example .env
# 编辑 .env 填入你的密钥
```

### 4. 启动服务

```bash
node server.js
```

服务启动后，控制台会显示：
```
「吃什么」API 服务已启动
端口: 3000
模型: deepseek-v4-pro
```

### 5. 测试 API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "今天好累，想吃辣的",
    "context": {
      "time": "周五晚",
      "mood": "疲惫"
    }
  }'
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/session?id=xxx` | 获取会话状态 |
| POST | `/api/chat` | 聊天 |
| POST | `/api/profile` | 更新画像 |

### POST /api/chat

**请求体：**
```json
{
  "sessionId": "demo-123",
  "message": "今天好累，想吃辣的",
  "context": {
    "time": "周五晚",
    "weather": "雨",
    "mood": "疲惫",
    "inventory": {
      "permanent": ["大米", "鸡蛋"],
      "shortTerm": ["番茄", "嫩豆腐"],
      "frozen": ["速冻饺子"]
    }
  }
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "text": "收到——「想吃辣」记下了。",
    "memoryChip": "根据你刚才说的「想吃辣」，我猜...",
    "recommendations": [
      { "name": "红油冒菜", "desc": "红汤 · 麻辣", "imgKey": "maocai", "tags": ["辣"] }
    ],
    "showEighth": true,
    "profileUpdate": "主动表达「想吃辣」偏好",
    "actions": [{ "label": "抽签", "action": "draw" }]
  },
  "session": {
    "messageCount": 5,
    "profile": { ... }
  }
}
```

## 前端集成

在 `chi-shen-me-demo.html` 中引入 API 客户端：

```html
<script src="api-client.js"></script>
```

然后修改场景加载逻辑，优先使用 API：

```javascript
// 在 loadScene 中，如果 API 可用，调用真实 AI
async function loadSceneWithAPI(name) {
  const result = await apiClient.sendMessage(
    SCENES[name].userIntent, // 用户意图
    { time: '周五晚', weather: '雨', mood: '疲惫' }
  );

  if (result.mode === 'api') {
    // 使用真实 AI 回复
    const flow = apiResponseToFlow(result.data);
    flow.forEach(step => renderStep(step));
  } else {
    // Fallback 到离线演示
    loadScene(name);
  }
}
```

## 生产部署

### 使用 PM2

```bash
npm install -g pm2
pm2 start server.js --name "chi-shen-me-api"
pm2 save
```

### 使用 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t chi-shen-me-api .
docker run -p 3000:3000 -e DEEPSEEK_API_KEY=sk-xxx chi-shen-me-api
```

### 环境变量

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DEEPSEEK_API_KEY` | 是 | - | DeepSeek API 密钥 |
| `PORT` | 否 | 3000 | 服务端口 |
| `DEEPSEEK_MODEL` | 否 | deepseek-v4-pro | 模型名称 |

## 注意事项

1. **密钥安全**：永远不要将 `DEEPSEEK_API_KEY` 提交到代码仓库
2. **CORS**：默认允许所有来源，生产环境应限制为前端域名
3. **会话存储**：当前使用内存存储，重启后数据丢失。生产环境建议使用 Redis
4. **流式响应**：当前为非流式，如需流式可修改 `stream: true` 并处理 SSE
