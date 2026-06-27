# EQagent - 人际关系修炼助手

> 基于熊太行《识人攻略》《关系攻略》的 AI 人物分析器

## 参赛作品简介

这是一个 AI 人际关系分析工具，用户描述遇到的人或场景，系统会基于识人攻略理论框架，自动分析：
- 🎯 人物类型判断（推脱者、伪君子、鹰派、鸽派等）
- 🕸️ 特质蛛网图（六维人格画像）
- 💡 相处建议与行动步骤

## 功能特点

- 🤖 **AI 智能分析**：基于《识人攻略》理论框架，结构化输出分析结果
- 🕸️ **特质蛛网图**：ECharts 雷达图可视化展示六维人格特质
- 🔐 **API Key 本地存储**：AES 加密，不上传服务器
- 📱 **单页应用**：简洁的用户体验，输入→分析→结果

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + TailwindCSS |
| 后端 | Express.js + Node.js |
| AI | OpenAI / DeepSeek API |
| 可视化 | ECharts 雷达图 |

## 快速开始

### 一键启动（推荐）

**Windows 用户**：双击 `启动.bat`

**Mac/Linux 用户**：
```bash
chmod +x 启动.sh
./启动.sh
```

### 手动启动

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动项目

```bash
npm run dev
```

### 3. 配置 API Key

打开 http://localhost:5173 后，点击右上角"配置"按钮：
- 填写你的 AI API Key（如 DeepSeek API Key）
- 选择 AI 模型（支持 DeepSeek、GPT 等）
- Base URL 可留空（使用默认地址）

### 4. 开始使用

1. 在文本框中描述你想分析的人或场景
2. 点击"开始分析"
3. 查看分析结果：人物类型、特质蛛网图、相处建议、行动步骤

## 项目结构

```
人际关系修炼助手/
├── api/                    # 后端 API
│   ├── app.ts             # Express 应用入口
│   ├── server.ts          # 服务器启动
│   └── routes/ai.ts       # AI 分析接口
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   │   ├── ConfigCard.vue  # API 配置卡片
│   │   └── RadarChart.vue  # 蛛网图组件
│   ├── pages/HomePage.vue  # 主页面
│   └── ...
├── public/chapters/        # 章节内容（Markdown）
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 安全说明

- API Key 存储在浏览器 localStorage 中
- 使用 AES 加密，不会上传到任何服务器
- 用户需要自行配置 API Key 才能使用

## 参赛亮点

1. **本地 AI 应用**：不依赖第三方服务器，用户自配 API Key
2. **理论框架落地**：将《识人攻略》书本知识产品化
3. **结构化 AI 输出**：JSON 结构化解析 + 可视化展示
4. **隐私保护**：Key 本地加密存储，用户数据不外传

---

MIT License
