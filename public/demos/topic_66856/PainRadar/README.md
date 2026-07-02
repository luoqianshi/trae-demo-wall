# PainRadar（痛点雷达）｜AI全球产品机会挖掘引擎

> 把全球用户的"抱怨噪音"，变成"可赚钱的产品机会地图"

## 🎯 项目简介

PainRadar是一个AI驱动的全球需求挖掘与筛选平台，它自动抓取Reddit、小红书、B站、抖音、AppStore等多平台真实用户反馈，将"用户抱怨"转化为可执行的产品机会清单。

系统不仅告诉你"大家在抱怨什么"，还会告诉你：
- 这个需求是否真的值得做
- 竞争是否激烈
- 是否适合快速做MVP
- 如何第一步变现

## 📦 项目结构

```
PainRadar/
├── dist/index.html        # 纯HTML版本（可直接打开体验）
├── package.json           # React项目配置
├── tsconfig.json          # TypeScript配置
├── vite.config.ts         # Vite配置
├── tailwind.config.js     # TailwindCSS配置
├── TRAE参赛帖.md         # TRAE官方社区发帖模板
└── src/
  ├── components/
  │   ├── Header.tsx        # 顶部导航
  │   ├── Navigation.tsx    # Tab切换
  │   ├── opportunities/    # 机会发现模块
  │   │   ├── OpportunitiesPage.tsx
  │   │   ├── OpportunityCard.tsx
  │   │   └── OpportunityDetail.tsx
  │   ├── trends/           # 趋势分析模块
  │   ├── validator/        # 想法验证模块
  │   └── reports/          # 报告中心模块
  ├── data/mockData.ts      # Mock数据
  ├── store/index.ts        # Zustand状态管理
  ├── types/index.ts        # TypeScript类型定义
  └── App.tsx               # 主应用
```

## 🚀 快速开始

### 方式一：直接打开（推荐新手）

双击 `dist/index.html` 即可在浏览器中体验完整功能，无需安装任何依赖。

### 方式二：React开发模式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## ✨ 核心功能

### 1. 🎯 机会发现引擎
- 从9大平台类型自动抓取用户痛点
- AI分析提取产品机会
- 智能推荐：竞争小+市场大+痛度高+潜力极高
- 按类别筛选、关键词搜索

### 2. 📈 趋势分析仪表盘
- 实时追踪全球市场热门趋势
- 展示增长率、热度、关键词
- 帮助用户把握风口

### 3. ✅ AI想法验证器
- 输入产品想法，AI自动分析
- 验证得分、竞品情况
- 市场缺口、MVP可行性
- 变现策略建议

### 4. 📊 专业报告生成
- 一键生成Markdown格式报告
- 包含市场数据、变现方案
- 完整实施步骤
- 可下载使用

### 5. 🔧 全生命周期实施指南
- 验证阶段 → MVP阶段 → 增长阶段
- 每一步详细操作说明
- 所需工具（含链接和费用）
- 参考资源链接

## 📊 数据来源覆盖

| 类型 | 国内外平台 |
|------|-----------|
| 🌐 社交平台 | 小红书、Twitter、Reddit、LinkedIn、微信、微博 |
| 📹 视频平台 | B站、抖音、TikTok、YouTube、快手、视频号 |
| 🎬 直播平台 | 虎牙、斗鱼、Twitch |
| 📰 新闻媒体 | 36氪、虎嗅、新浪科技、Hacker News |
| 💻 开发者社区 | GitHub、Stack Overflow、CSDN、掘金 |
| 💬 问答社区 | 知乎、Quora |
| 📝 博客论坛 | Medium、Substack、简书、Dev.to |
| 🛒 电商平台 | 淘宝、亚马逊、拼多多 |
| 🔍 搜索引擎 | Google搜索趋势 |

## 🎯 目标用户

### A层（最核心）：独立开发者/AI创业者
- 典型人群：做SaaS、Chrome插件、GPT工具站的人
- 核心压力："我做什么能赚钱？"
- 最愿意付费的人群

### B层：自由职业者/小团队产品经理
- 想做副业产品
- 不会做用户研究
- 依赖"机会雷达"

### C层：AI工具站/内容博主
- 需要持续输出"新工具/新机会"
- 需要选题源

## 💰 商业价值

- **提升创业成功率，降低试错成本**
- 帮助用户避免低价值项目
- 提供高概率盈利方向
- 节省市场调研时间（从几天→几分钟）

> 本质："创业版的GoogleTrends + 需求风控系统"

## 📈 效率提升

| 维度 | 传统方式 | PainRadar | 提升 |
|------|---------|-----------|------|
| 选题效率 | 1-3天 | 5分钟 | ↑10x |
| 信息处理成本 | 人工筛选 | AI自动 | ↓90% |
| 决策速度 | 几天 | 即时 | ↑5-20x |

---

**一句话总结：PainRadar = 把全球用户的"抱怨噪音"，变成"可赚钱的产品机会地图"**
