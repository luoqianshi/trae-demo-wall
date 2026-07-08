# TRPG Desk v2.4.50

跑团主持人辅助器 · 服务器部署版

## 部署方式

### 方式 1: 直接运行(最简单)
```bash
cd trpg-desk-v2.4.50
npm install --omit=dev
node server.js
```

### 方式 2: PM2 进程管理(推荐服务器部署)
```bash
npm install -g pm2
cd trpg-desk-v2.4.50
npm install --omit=dev
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启
```

### 方式 3: Docker 部署
```bash
cd trpg-desk-v2.4.50
docker-compose up -d
```

### 方式 4: Mac/Windows 一键启动
- Mac: 双击 `start.command`
- Windows: 双击 `start.bat`

## AI 配置

### 默认: Agnes AI(开箱即用)
config.example.json 已包含 Agnes AI API key,无需额外配置。

### 自定义 API(支持 OpenAI 兼容 API)
复制 config.example.json 为 config.json,修改 customApi 部分:
```json
{
  "customApi": {
    "enabled": true,
    "baseUrl": "https://api.openai.com",
    "apiKey": "sk-your-key",
    "textModel": "gpt-4o-mini",
    "imageModel": "dall-e-3",
    "imageSize": "1024x1024"
  }
}
```

支持的 API:
- OpenAI: https://api.openai.com
- Deepseek: https://api.deepseek.com
- 通义千问: https://dashscope.aliyuncs.com/compatible-mode
- 其他 OpenAI 兼容 API

### 环境变量配置
```bash
export AGNES_API_KEY=sk-xxxxx
# 或
export PORT=4000
```

## Nginx 反向代理(可选)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 功能特性
- 多人实时同步(Socket.IO)
- AI 图片生成(版图、NPC头像、物品图标)
- AI NPC 对话(多轮对话、共享对话、手动回复)
- NPC 商店系统
- 版图管理、棋子移动
- 线索卡、背包系统
- 语音识别(需 HTTPS)
