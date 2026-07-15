# 单词拼写防御游戏 - 部署文档

## 项目概述

一款面向初中生的英语单词拼写防御游戏，通过游戏化方式帮助学生记忆和拼写英语单词。游戏融合了塔防元素，玩家通过正确拼写单词获得英雄角色来抵御敌人入侵。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **样式**: TailwindCSS 3
- **状态管理**: Zustand
- **动画**: Framer Motion
- **路由**: React Router DOM

## 项目结构

```
spelling-defense-game/
├── src/
│   ├── components/          # 组件目录
│   │   ├── game/            # 游戏相关组件
│   │   ├── home/            # 首页相关组件
│   │   └── progress/        # 进度相关组件
│   ├── pages/               # 页面组件
│   ├── store/               # Zustand状态管理
│   ├── data/                # 数据文件（词汇、英雄）
│   ├── types/               # TypeScript类型定义
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 入口文件
│   └── index.css            # 全局样式
├── index.html               # HTML模板
├── package.json             # 依赖配置
├── vite.config.ts           # Vite配置
├── tailwind.config.js       # TailwindCSS配置
├── postcss.config.js        # PostCSS配置
└── tsconfig.json            # TypeScript配置
```

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

## 安装与运行

### 开发模式

```bash
# 安装依赖
npm install

# 或使用 pnpm
pnpm install

# 启动开发服务器
npm run dev

# 或
pnpm dev
```

开发服务器默认运行在 http://localhost:5173

### 生产构建

```bash
# 构建生产版本
npm run build

# 或
pnpm build

# 预览生产构建
npm run preview

# 或
pnpm preview
```

## 部署方案

### 静态部署（推荐）

由于项目是纯前端应用，所有数据存储在本地浏览器中，可以直接部署到任何静态托管服务。

#### Vercel 部署

1. 安装 Vercel CLI：
   ```bash
   npm install -g vercel
   ```

2. 登录并部署：
   ```bash
   vercel login
   vercel deploy
   ```

#### Netlify 部署

1. 在 Netlify 控制台创建新项目
2. 连接 GitHub 仓库
3. 设置构建命令：`npm run build`
4. 设置发布目录：`dist`
5. 点击部署

#### GitHub Pages 部署

1. 安装 gh-pages：
   ```bash
   npm install gh-pages --save-dev
   ```

2. 在 package.json 中添加脚本：
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```

3. 部署：
   ```bash
   npm run build
   npm run deploy
   ```

### Docker 部署

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 配置说明

### 词汇数据库

词汇数据存储在 `src/data/words.ts`，包含110个初中英语核心词汇，按难度等级（1-5）分类。

### 英雄数据

英雄数据存储在 `src/data/heroes.ts`，包含6个不同元素的英雄角色。

### 游戏配置

主要游戏配置在 `src/store/gameStore.ts` 中：
- `GRID_SIZE`: 战场网格大小（默认5x5）
- 波次数量：15波
- 初始生命：10

## 性能优化

- 代码分割：使用 React.lazy 和 Suspense
- 图片优化：使用 WebP 格式
- 缓存策略：利用 localStorage 缓存用户进度
- 懒加载：组件按需加载

## 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 移动端支持

- 响应式设计
- 触摸优化
- 自适应布局

## 常见问题

### 构建失败

确保 Node.js 版本 >= 18.0.0，尝试删除 `node_modules` 和 `package-lock.json` 后重新安装。

### 样式不生效

确保 `index.css` 正确引入了 TailwindCSS。

### 数据丢失

用户进度存储在浏览器 localStorage 中，清除浏览器数据会导致进度丢失。

## 许可证

MIT License
