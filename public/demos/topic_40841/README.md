# 活动真探 - 靠谱活动发现与验真平台

> TRAE AI 创造力大赛参赛作品 · 社会服务赛道

## 项目简介

「多源汇聚 + 可信验真 + 地理/线上分流」的双端系统，帮用户发现附近/线上的靠谱活动、福利、考证与赛事，并展示「可信分 + 官方报名入口 + 防骗提示」。

核心差异化：**验真防骗，不是普通活动聚合。**

## 技术栈

React 18 + TypeScript + Vite 5 + React Router v6 + Zustand + Tailwind CSS 3 + Ant Design 5 + lucide-react + framer-motion

## 快速启动

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 dist/
npm run preview  # http://localhost:4173
```

## 双端入口

| 端 | 路径 | 说明 |
|---|---|---|
| 手机 App 用户端 | `/app` | 底部 Tab（附近/考证/赛事/互助/我的） |
| Web 管理后台 | `/admin` | 打开即 Dashboard，无需登录 |

两端通过 localStorage 共享数据，管理端审核通过后 App 端实时同步。

## 4 条演示路径

1. **发现活动**：首页 → 点击「惠民超市免费领鸡蛋」→ 可信分 92 + 环形进度 → 核实依据 → 防骗提示 → 复制官方链接
2. **上传审核**：App 上传 → 管理端「审核工作台」通过 → 首页同步出现
3. **考证 + 赛事**：考证 Tab → 教师资格证 → 复制官方链接；赛事 Tab → TRAE 大赛 → 报名步骤
4. **余量互助**：互助 Tab → 申请领取 → 管理端审核（规划预览）

## 功能清单

**手机 App 用户端（10 页）**

- 附近：距离筛选、分类筛选、活动卡片、统计条
- 活动详情：可信分动画、环形进度、防骗提示、收藏、举报
- 考证频道：含金量、难度、费用、中介风险警示
- 赛事频道：TRAE 大赛特色卡片、报名步骤条
- 余量互助：今日余量、领取说明、申请资格（规划预览）
- 上传求证：表单提交、成功动画
- 我的：收藏、上传记录、防骗指南、管理后台入口
- 防骗指南、我的收藏、我的上传

**Web 管理后台（8 页）**

- 数据看板：统计卡片、趋势图、待审摘要
- 活动管理：表格 CRUD、上架/下架/删除
- 审核工作台：AI 初审结果、通过/驳回/转人工
- 可信规则：权重滑块、风险关键词管理
- 分区推送：地理/全国推送、置顶活动
- 用户上传管理：查看详情、审核
- 风险拦截记录：拦截日志、风险类型统计
- 互助审核：余量发布队列、帮扶资质队列（规划预览）

## Mock 数据

数据写在 `src/mock/data.ts`：

- 地理类活动 8 条、考证类 5 条、赛事类 3 条
- 风险样例 3 条、用户上传 2 条、风险拦截日志 5 条
- 余量互助 3 条商家余量 + 2 条资质申请

通过 localStorage 持久化，可在「我的」页面重置演示数据。

## 部署

```bash
npm install
npm run build
```

**Vercel**：推送到 Git 仓库 → vercel.com → New Project → 导入。Framework Preset: Vite；Build: `npm run build`；Output: `dist`。

**Netlify**：Build: `npm run build`；Publish: `dist`。`public/_redirects` 已配置 SPA 回退。

## 项目结构

```
ActiveDetective/
├── index.html
├── package.json
├── vite.config.ts          # port 5173
├── TRAE_PROMPT.md
├── vercel.json
├── public/
│   ├── _redirects
│   └── images/activities/   # 16 张 jpg
├── .gitignore
└── src/
    ├── main.tsx, App.tsx
    ├── types/index.ts
    ├── store/
    ├── mock/data.ts
    ├── hooks/
    ├── utils/
    ├── styles/globals.css
    ├── components/
    ├── layouts/
    └── pages/
        mobile/  # 10 页
        admin/   # 8 页
```

## 已知限制

- Demo 无后端，所有数据为 Mock + localStorage
- 无真实 AI / 爬虫接口
- 封面已本地化；TRAE 大赛用官方 mp4 视频封面
- 余量互助、资质审核为规划预览，未完全持久化
