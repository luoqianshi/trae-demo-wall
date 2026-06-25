# AI 未来职业体验馆（优化版）

一个面向学生与参赛展示的未来职业探索网页。项目基于 React + TypeScript + Vite + Tailwind CSS 构建，包含用户画像输入、职业推荐、沉浸式一天体验、学习路线与体验报告。

## 本次优化重点

- 修复推荐匹配度从 0.x 错误显示为 60-99% 区间的问题。
- 修复“浏览全部职业”入口被重定向的问题。
- 修复 Loading 动画 2.8 秒设计但 0.1 秒跳转的问题。
- 修复体验页 React Hook 条件调用问题。
- 表单增加 2-4 个兴趣、2-4 个科目的真实约束。
- 结果页新增推荐依据拆解，展示兴趣、科目、性格、避雷四项分数。
- 报告页新增稳定报告编号和 Top 3 横向对比。
- 体验页升级为“职业任务 + 关键决策 + 装备 HUD + 结尾选择记录”。
- 新增 4 个职业：网络安全分析师、机器人工程师、游戏策划师、新媒体策略师。
- 增加无障碍和性能细节：aria-label、减少动态效果偏好、打印样式优化。
- 移除生产构建中的开发定位插件配置，提升交付专业度。

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Framer Motion
- Lucide React

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址即可预览。

## 构建单文件 HTML

```bash
npm install
npm run build
```

构建完成后，单文件网页位于：

```txt
dist/index.html
```

如果要提交比赛，可以把 `dist/index.html` 改名为：

```txt
AI未来职业体验馆_优化版.html
```

## 常用命令

```bash
npm run dev      # 本地开发
npm run check    # TypeScript 检查
npm run lint     # ESLint 检查
npm run build    # 生产构建，输出单文件 HTML
```

## 项目结构

```txt
src/
├── components/       # 公共组件与场景组件
├── data/             # 职业数据库
├── engine/           # 推荐算法
├── pages/            # 页面：首页、输入、推荐、体验、路线、报告
├── store/            # Zustand 状态管理
├── styles/           # 动画样式
└── types/            # 类型定义
```

## 说明

本项目使用本地规则推荐算法模拟“AI 推荐”，并通过推荐依据拆解展示算法逻辑。适合比赛 Demo、职业规划展示、课堂项目和前端作品集演示。
