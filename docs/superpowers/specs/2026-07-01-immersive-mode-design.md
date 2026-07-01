# 纯享模式（Immersive Mode）设计

## 概述

在 TRAE Demo Wall 中新增"纯享模式"，用户可以像刷短视频一样随机浏览所有已部署的 Web 作品。iframe 全屏沉浸展示，支持上一个/下一个随机切换、新标签页全局打开、查看详情。

## 入口按钮与路由

### 入口按钮

在 `HeroSection.vue` 中"灵感孵化舱"按钮**前面**新增"纯享模式"按钮。相比"灵感孵化舱"的玻璃拟态半透明风格（`bg-white/5 border-white/10`），纯享模式按钮采用更突出的样式：品牌强调色绿色渐变背景（`bg-trae-accent`），配合发光阴影（`shadow-trae-glow`），形成视觉主次关系。

使用 `<router-link :to="{ name: 'immersive' }">` 跳转到内部路由。

### 路由

在 `router/index.js` 中新增：
- 路径：`/immersive`
- 名称：`immersive`
- 组件：`@/views/ImmersiveView.vue`（懒加载）

## 数据加载与随机播放

### 数据加载

复用 `projectStore` 的 `loadIndex()` 加载摘要列表（获取总数和页数），然后新增 `loadAllPagesForImmersive()` 方法：并行批量加载所有 page 文件（每批 5-8 个并发请求），合并后筛选出 `type` 为 `local` 或 `external` 且有可预览 URL 的项目，缓存到 `immersiveProjects` 状态，避免重复加载。

### 随机播放逻辑

- 维护 `playOrder: number[]` 数组（项目索引的随机排列）
- `currentIndex` 指针指向当前播放位置
- "下一个"：`currentIndex = (currentIndex + 1) % playOrder.length`
- "上一个"：`currentIndex = (currentIndex - 1 + playOrder.length) % playOrder.length`
- 进入页面时随机打乱一次顺序，循环播放

### URL 构建

- `type === 'external'` 且有 `demoUrl` → `previewUrl = demoUrl`
- `type === 'local'` 且有 `localPath` → `previewUrl = localPath`
- 否则跳过该项目

## 页面布局与交互

### 整体布局

`ImmersiveView.vue` 占满整个视口（`h-screen w-screen overflow-hidden`），无滚动。结构从上到下：

1. **顶部导航栏**（简约）：左侧返回首页按钮，中间显示当前项目序号（如 "12 / 1713"），右侧显示当前项目标题
2. **中央 iframe 区域**：占据大部分屏幕，16:9 比例居中显示，带圆角和边框
3. **底部信息浮层**：半透明玻璃拟态条，左侧显示项目标题和作者，右侧显示浏览量和点赞数

### 交互按钮

底部浮层上方居中放置导航按钮组：
- **上一个**（左箭头图标）
- **下一个**（右箭头图标）
- **新标签页打开**（外部链接图标）：点击在浏览器新标签页中打开当前项目的完整 URL
- **查看详情**（信息图标）：跳转到 `/#/project/{id}` 详情页

### 键盘快捷键

- `←` / `↑`：上一个
- `→` / `↓` / `空格`：下一个
- `Enter`：新标签页打开当前项目

### iframe 加载与 fallback

- 切换项目时，先显示 loading 骨架屏（旋转加载图标）
- iframe `onload` 事件触发后隐藏 loading
- 设置 5 秒超时：若 iframe 未触发 onload，显示 fallback 遮罩层（"该作品不支持内嵌预览" + "在新标签页打开"按钮 + "下一个"按钮）
- iframe 使用 `sandbox="allow-scripts allow-same-origin allow-popups"`，与现有 `ProjectDetail.vue` 一致

### 切换动画

切换项目时，iframe 区域使用淡入淡出过渡（`transition-opacity duration-300`），避免生硬切换。

## 组件拆分与文件结构

### 新增文件

| 文件 | 职责 |
|------|------|
| `src/views/ImmersiveView.vue` | 纯享模式页面视图，组装子组件，管理数据加载和播放状态 |
| `src/components/ImmersivePlayer.vue` | 核心播放器组件，管理 iframe、loading、fallback、切换、键盘快捷键 |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/router/index.js` | 新增 `/immersive` 路由 |
| `src/components/HeroSection.vue` | 在"灵感孵化舱"按钮前新增"纯享模式"入口按钮 |
| `src/stores/projectStore.js` | 新增 `immersiveProjects` 状态和 `loadAllPagesForImmersive()` 方法 |

### 组件职责边界

**ImmersiveView.vue**（页面容器）：
- 调用 store 加载数据，管理加载状态
- 维护 `playOrder` 和 `currentIndex` 播放状态
- 渲染顶部导航栏
- 把当前 `project` 和序号传给 `ImmersivePlayer`
- 处理 `prev`/`next`/`open-detail` 事件

**ImmersivePlayer.vue**（播放器）：
- 接收 `project`（当前项目）和 `index`/`total`（序号）
- 渲染 iframe、loading 骨架屏、fallback 遮罩
- 处理键盘快捷键
- emit `prev`/`next`/`open-detail` 事件给父组件
- "新标签页打开"直接用 `<a target="_blank">`，不需要 emit

**projectStore.js**：
- `immersiveProjects: []`：缓存所有可预览项目（含完整字段）
- `immersiveLoaded: false`：避免重复加载
- `loadAllPagesForImmersive()`：批量并行加载所有 page 文件，筛选出有 previewUrl 的项目，填充 `immersiveProjects`

## 错误处理

- 数据加载失败：显示错误提示 + 重试按钮
- 项目列表为空：显示空状态提示
- iframe 超时/fallback：5 秒超时后显示 fallback 遮罩层，提供"在新标签页打开"和"下一个"按钮

## 不涉及的范围

- 爬虫和数据更新逻辑不变
- 现有首页、详情页、卡片组件不变（仅 HeroSection 新增按钮）
- 不涉及用户登录、收藏、历史记录等功能
