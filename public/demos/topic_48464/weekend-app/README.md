# 周末灵感生成器

> 输入城市、预算、天气、心情和同行人，30 秒生成一份可执行的个性化周末计划。

TRAE AI 创造力大赛参赛项目 · 生活娱乐赛道

## 快速开始

```bash
cd weekend-app
npm install
npm start
# → http://localhost:3000
```

开发模式（文件变动自动重启）：

```bash
npm run dev
```

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | HTML + CSS + 原生 JS | 无构建步骤，复用 PRD 视觉设计系统 |
| 后端 | Node.js + Express | 轻量 API 服务 |
| AI 层 | 可配置 LLM API + 规则生成器 + 模板兜底 | 无 Key 时用规则引擎，接入 Key 即用真实大模型 |
| 数据 | JSON 文件 + 内存缓存 | 北上广深 POI 数据集 |

## 接入大模型（可选）

设置环境变量即可启用真实大模型生成，未设置时自动降级到规则引擎：

```bash
# Windows PowerShell
$env:LLM_API_KEY="sk-xxx"
$env:LLM_API_BASE="https://api.openai.com/v1"
$env:LLM_MODEL="gpt-4o-mini"
npm start
```

## 项目结构

```
weekend-app/
├── server/
│   ├── index.js              # Express 入口，路由与静态托管
│   ├── config.js             # 服务配置（端口/LLM/缓存）
│   ├── data/
│   │   └── poi.js            # 北上广深 POI 数据集（112 个兴趣点）
│   └── services/
│       ├── orchestrator.js   # 方案生成编排服务（核心链路）
│       ├── promptEngine.js   # Prompt 工程引擎
│       ├── llmClient.js      # 大模型调用（超时/重试/JSON修复）
│       ├── mockGenerator.js  # 规则生成器（无 Key 降级方案）
│       ├── qualityCheck.js   # 输出质量校验
│       └── templateFallback.js # 模板兜底
└── public/
    ├── index.html            # 主页面
    ├── css/style.css         # 样式（PRD 设计系统）
    └── js/app.js             # 前端逻辑
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/generate` | 生成周末方案 |
| GET | `/api/options` | 获取城市/预算/天气等选项枚举 |
| GET | `/api/health` | 健康检查 |

### 生成接口示例

```json
// POST /api/generate
{
  "city": "上海",
  "budget": "100-300",
  "weather": "sunny",
  "mood": ["放松", "文艺"],
  "companion": "couple"
}
```

## 工作项进度

详见 `work-items.html`。P0 核心链路已全部完成，可体验完整 Demo。
