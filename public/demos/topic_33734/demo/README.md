# LinguaHub · 多语种沉浸式学习平台

一个面向 **英语 / 日语 / 韩语 / 德语** 的全功能语言学习平台。

## ✨ 核心功能

| 模块 | 说明 |
|------|------|
| 📚 **分级课程体系** | 每种语言提供 A1/B1 级别的课程，每级包含多课互动内容 |
| 📖 **单词记忆** | 词卡翻转、音标、例句朗读，进度条显示 |
| ✏️ **语法练习** | 规则讲解 + 例句 + 交互式选择题测验 |
| 🎤 **口语跟读** | 标准发音示范，支持浏览器 Web Speech API 朗读 |
| 🎧 **听力训练** | 点击播放原文、隐藏中文答案、主动理解训练 |
| 📊 **学习进度追踪** | 每门语言的已完成课次、累计 XP、连续学习天数 |
| 🎯 **个性化推荐** | 根据用户已学内容推荐下一步学习 |
| 👤 **用户注册登录** | 本地用户系统，支持历史记录保存 |
| 🏆 **成就激励系统** | 12+ 枚徽章 / 等级系统 / XP 累积 |
| 👥 **学习社区** | 发帖、点赞、评论，与其他学习者互动 |
| 📈 **排行榜** | 实时 XP 排名，可视化用户水平 |

## 🛠 技术栈

- **前端**：原生 HTML + CSS + JavaScript（SPA 单页应用、路由、Toast）
- **后端**：Node.js + Express.js + CORS
- **数据存储**：轻量本地 JSON 存储（`./data/` 目录）
- **语音合成**：浏览器原生 Web Speech API（SpeechSynthesis）

## 📁 项目结构

```
demo/
├── index.html              # 主页面（SPA 入口）
├── css/
│   └── style.css           # 全量 UI 样式（响应式 / 动画 / 组件）
├── js/
│   └── app.js              # 前端 SPA：路由 / 视图 / 交互 / API
├── api/
│   ├── server.js           # Express 入口（http://localhost:3001）
│   ├── data/courses.js     # 四种语言的课程数据
│   ├── lib/store.js        # JSON 文件存储模块
│   └── routes/
│       ├── auth.js         # 注册 / 登录 / 个人资料
│       ├── courses.js      # 课程 / 级别 / 课时查询
│       ├── progress.js     # 学习进度 / 推荐 / 排行榜
│       ├── community.js    # 发帖 / 点赞 / 评论
│       └── achievements.js # 成就徽章系统
├── package.json
└── README.md               # 本文件
```

## 🚀 快速开始

### 1. 安装 Node.js

前往 [nodejs.org](https://nodejs.org/) 下载并安装 **LTS 版本**（推荐 18+）。

### 2. 安装依赖

在项目根目录打开终端：

```bash
npm install
```

### 3. 启动后端服务器

```bash
npm start
```

服务器将在 **http://localhost:3001** 启动。

### 4. 打开前端

直接双击 `index.html` 或在浏览器地址栏打开：

```
file:///C:/Users/24139/Desktop/demo/index.html
```

> 💡 **推荐方式**：使用 VS Code 的 `Live Server` 插件右键 `index.html` 打开，或使用任意本地静态服务器，这样语音功能和 AJAX 体验更佳。

## 📡 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | 注册 `{ username, email, password }` |
| POST | `/api/auth/login` | 登录 `{ email, password }` |
| GET | `/api/courses` | 获取四种语言的课程列表 |
| GET | `/api/courses/:code` | 获取指定语言的完整课程 |
| GET | `/api/courses/:code/level/:id/lesson/:id` | 具体课时详情 |
| POST | `/api/progress/update` | 更新学习进度 `{ userId, courseCode, levelId, lessonId, xp }` |
| GET | `/api/progress/user/:id` | 用户所有语言的进度 |
| GET | `/api/progress/leaderboard` | 排行榜 |
| POST | `/api/progress/recommend` | 个性化推荐 |
| GET | `/api/community/posts` | 帖子列表 |
| POST | `/api/community/posts` | 发布帖子 |
| POST | `/api/community/posts/:id/like` | 点赞 |
| POST | `/api/community/posts/:id/comment` | 评论 |
| GET | `/api/achievements` | 所有成就徽章 |
| GET | `/api/achievements/user/:id` | 用户已获得徽章 + 统计 |

## 💡 使用小贴士

1. **首次使用**：先注册账号 → 选择语言 → 开始第一节课
2. **XP 获取**：每看一张词卡、每答对语法题、每完成听力/口语练习都可以获得 XP，完成整节课额外获得 20 XP
3. **语音朗读**：请使用支持 Web Speech API 的浏览器（Chrome / Edge / Safari）。建议打开系统音量
4. **离线可用**：无需任何第三方账号 / 云端服务，所有数据保存在本地 `./data` 目录
5. **多语言切换**：在课程页选择不同国旗即可切换到英语、日语、韩语、德语学习

## 🌟 设计亮点

- **渐变色主题**：每种语言专属渐变配色，视觉辨识度高
- **响应式布局**：自动适配手机、平板、桌面
- **流畅动效**：悬停缩放、微交互反馈、卡片浮起效果
- **玻璃拟态导航栏**：backdrop-filter 营造通透感
- **进度环 SVG**：每一级别完成度可视化
- **Toast 通知**：操作即时反馈，无需弹窗打断

---

Made with 💜 · Happy Learning!
