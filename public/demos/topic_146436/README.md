# 心晴日记 · 青少年心理疗愈画板

> 一个让青少年用画画和文字记录心情、获得 AI 温暖陪伴的心理疗愈日记应用。结合「绘画投射分析」和「表达性写作」心理学方法，每天画一画、写一写，生成专属心情画像和日记卡。

## ✨ 功能特性

- **手写绘画 + AI 识别** — 在纸上画下或写下心情，AI 用多模态识别理解你的画作和文字
- **心理学方法陪伴** — 运用「绘画投射分析」和「表达性写作」方法，AI 像温柔的朋友陪伴你，不诊断、不评判
- **每日引导问题** — 每天一个温暖的引导问题（"今天的心情是什么颜色？""画一棵生命树"），不想答可以一键换题
- **多轮连续对话** — 支持多轮对话，AI 记住你之前聊的内容，延续对话而非重新开始
- **心情画像生成** — 聊完后点"总结今日心情"，AI 根据你的画作+对话生成一幅治愈系心情画像
  - 有画作时用图生图，引用你的画作
  - 纯文字交流时根据心情生成抽象意象图
  - 8 种随机艺术风格（水彩/彩铅/水墨/曼陀罗/印象派等）
- **心情日记卡导出** — 生成含画像+日期+心情+鼓励语的心晴日记卡，一键导出为 PNG 图片
- **语音朗读** — Web Speech API 朗读 AI 回复，支持语音开关和语速调节
- **历史日记回顾** — 查看往日的心情记录
- **Pad / 触屏适配** — 支持平板触屏手写，响应式布局

## 🚀 快速开始

### 方式一：一键启动（推荐）

**Windows**：双击 `start.bat`

**macOS / Linux**：
```bash
chmod +x start.sh
./start.sh
```

脚本会自动：
1. 检查 Node.js 环境
2. 首次启动自动创建配置文件
3. 自动安装 npm 依赖
4. 启动服务并打开浏览器

**环境要求**：Node.js 18+（[下载地址](https://nodejs.org/)）

### 方式二：从源码启动

```bash
git clone https://github.com/femnn/mind-diary.git
cd mind-diary
npm install
cp config.example.json config.json  # 编辑填入 API Key
npm start
```

浏览器打开 http://localhost:3001

### 方式三：离线体验版

无需安装任何环境，直接打开 `dist/心晴日记-体验版.html` 即可体验手写绘画和界面（AI 功能不可用）。

## 🔧 AI 配置

复制 `config.example.json` 为 `config.json`，填入 API Key：

```json
{
  "agnesApiKey": "sk-your-agnes-api-key-here",
  "customApi": {
    "enabled": false,
    "baseUrl": "https://api.openai.com",
    "apiKey": "sk-your-openai-key",
    "textModel": "gpt-4o-mini",
    "imageModel": "dall-e-3"
  }
}
```

- **默认**：使用 [Agnes AI](https://agnes-ai.com)（`agnes-2.0-flash` 文字 + `agnes-image-2.1-flash` 图片）
- **自定义**：设置 `customApi.enabled: true` 可接入任意 OpenAI 兼容 API
- **优先级**：环境变量 `AGNES_API_KEY` > `config.json` > `config.example.json`

## 🎨 使用流程

1. 打开页面，看到今天的引导问题
2. 在纸上画下或写下你的回答（支持多轮对话，可以继续补充）
3. AI 识别你的画作/文字，用心理学方法温暖回应
4. 聊完后点"总结今日心情"
5. AI 生成你的专属心情画像 + 鼓励语
6. 预览心情日记卡，点"保存图片"导出

## 📁 项目结构

```
mind-diary/
├── server.js              # Express 服务端 + AI 接口
├── public/
│   ├── index.html         # 主页面
│   ├── client.js          # 前端逻辑（手写、对话、卡片导出）
│   └── style.css          # 样式
├── dist/
│   └── 心晴日记-体验版.html  # 离线体验版单文件
├── data/
│   └── diaries.json       # 日记数据存储
├── config.example.json    # 配置模板
├── config.json            # 运行时配置（需自行创建）
├── start.bat              # Windows 一键启动
├── start.sh               # macOS/Linux 一键启动
├── railway.toml           # Railway 部署配置
├── render.yaml            # Render 部署配置
└── Procfile               # 通用部署配置
```

## 🛠️ 技术栈

- **后端**：Node.js + Express
- **前端**：原生 JavaScript + Canvas + Web Speech API
- **AI**：Agnes AI（多模态识别 + 文字 + 图片生成）
- **心理学方法**：绘画投射分析（HTP 测试原理）+ 表达性写作（Pennebaker 范式）

## 📦 线上部署

支持 Railway、Render 等支持 Node.js 的平台。详见 [DEPLOY.md](./DEPLOY.md)。

## 📜 License

MIT License — 自由使用、修改和分发。

## 🙏 致谢

- **灵感来源**：感谢 [@berryxia](https://x.com/berryxia) 在 X 上分享的 Tom Riddle 日记创意，本项目在此基础上发展而来，将"神秘日记"的理念转化为温暖的心理疗愈工具
- [Agnes AI](https://agnes-ai.com) — AI 能力提供方
- 项目使用 [TRAE IDE](https://www.trae.cn/) AI 辅助开发完成
