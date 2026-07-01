# 纯享模式优化设计

## 概述

对现有纯享模式进行三项优化：懒加载替代全量预加载、底部栏精简、Fallback 精美预览卡片。

## 优化 1：懒加载 + 历史回溯

### 问题
进入纯享模式需加载全部 86 页数据（约 4.7MB），等待时间长。

### 方案

**首次进入**：只加载 `index.json`（一次请求，含所有项目摘要：id/title/author/thumbnail/views/likes）。从中随机选取一个项目，按需加载其所在 page 文件获取完整数据（type/localPath/demoUrl/description）。首次只需 2 次请求即可展示。

**历史回溯模型**：
- 维护 `history: Project[]` 栈和 `historyIndex` 指针
- "下一个"：从 `index.json` 摘要中随机选取一个**未看过**的项目，按需加载其 page 数据，加入 history 栈
- "上一个"：`historyIndex--`，直接返回已缓存的项目数据，无需网络请求
- 已加载的 page 数据缓存在 store 中，已看过的项目完整数据缓存在 history 中

**顶部进度显示**：改为显示已浏览数量（如"已浏览 12 个"），而非"x / 总数"。

### Store 变更

`projectStore.js` 不再需要 `loadAllPagesForImmersive()` 全量加载方法。改为：
- 复用已有的 `loadIndex()` 加载摘要
- 复用已有的 `getProjectDetail(id)` 按需加载单个项目的完整数据（内部自动加载对应 page）

## 优化 2：底部栏精简

### 问题
底部信息栏信息过载：4 个导航按钮 + 标题 + 作者 + 浏览量 + 点赞数。

### 方案

底部栏只保留一行，居中放置 3 个按钮：
- **上一个**（左箭头）
- **下一个**（右箭头，绿色强调）
- **新标签页打开**（外部链接图标）

删除：查看详情、项目标题、作者、浏览量、点赞数。

顶部导航栏保留当前项目标题（已有），用户如需查看详情可从"新标签页打开"后访问原帖。

## 优化 3：Fallback 精美预览卡片

### 问题
外部站点设置 `X-Frame-Options` 时，iframe 显示空白，5 秒后显示简陋的错误页，体验差。

### 方案

**检测时机**：iframe 加载超时保持 5 秒，触发 fallback。

**预览卡片设计**：
- 替代简陋错误页，改为展示作品缩略图作为背景（带毛玻璃模糊 + 暗化遮罩）
- 卡片中央居中显示：作品缩略图（圆形或圆角，64x64px）、标题（白色粗体）、作者（灰色）、描述（灰色小字，最多 2 行截断）
- 卡片底部一个醒目的绿色按钮"在新标签页打开"（`target="_blank"`）
- 不自动跳过，让用户决定是否打开或继续下一个

**数据来源**：
- 缩略图、标题、作者：`index.json` 摘要中已有（`thumbnail`/`title`/`author`）
- 描述（`description`）：从 page 文件获取，懒加载方案已按需加载

**无缩略图的情况**：显示首字母占位（与 `ProjectCard.vue` 的无图占位逻辑一致），背景使用品牌色渐变。

## 涉及文件

| 文件 | 修改内容 |
|------|---------|
| `src/views/ImmersiveView.vue` | 替换全量加载为懒加载 + 历史回溯；精简底部栏 |
| `src/components/ImmersivePlayer.vue` | 替换简陋 fallback 为精美预览卡片 |
| `src/stores/projectStore.js` | 移除 `immersiveProjects`/`immersiveLoaded`/`loadAllPagesForImmersive()`，不再需要全量加载 |

## 不涉及的范围

- 路由和入口按钮不变
- 爬虫和数据更新逻辑不变
- 键盘快捷键不变
- iframe sandbox 策略不变
