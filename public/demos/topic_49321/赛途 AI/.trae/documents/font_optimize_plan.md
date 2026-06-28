# 字体系统优化计划

## 任务目标

将赛途 AI 的字体系统优化为「黑白手绘项目规划板」风格，参考图中的手绘笔记本视觉效果。

## 修改清单

### 1. 字体变量系统（:root）

新增 4 个字体变量：
- `--font-body` — 正文系统字体，保持中文可读
- `--font-display` — Hero/Section 标题，模拟粗马克笔手写
- `--font-hand` — 按钮、标签、卡片标题，模拟白板手写批注
- `--font-mono` — 小型英文标签、代码感文字

### 2. 方格纸背景

给 body 添加淡灰网格背景，使用 CSS linear-gradient 实现。

### 3. Hero 主标题优化

- 字重 900
- 字距更紧
- 轻微倾斜 skew(-2deg)
- 底部粗黑手绘 underline + marker highlight
- nav-brand 中的「赛途 AI」加粗手写感

### 4. Section 标题优化

- `.section-title` — 更粗、轻微倾斜、手绘线条下划线
- `.section-tag` — 更像贴纸标签，轻微旋转

### 5. 卡片标题优化

- `.recommend-title` — 粗黑、轻微 rotate、手账便签感
- `.role-card h4` — 手绘批注风格
- `.timeline-content strong` — 粗手写感
- `.post-title` — 公告板手写标题
- `.current-plan-summary-title` — 便签标题

### 6. 按钮、Tabs、标签优化

- `.btn` — 手绘贴纸感，字重更明显
- `.tab-item` — 白板标签感
- `.type-badge`, `.difficulty-badge`, `.post-type`, `.post-tag`, `.team-gap-item` — 手绘标签，轻微旋转

### 7. 正文保持可读

正文继续使用系统中文字体，不做过度手写化处理。

## 实施步骤

1. 修改 :root 添加字体变量
2. 修改 body 添加方格纸背景
3. 修改 Hero 标题样式
4. 修改 Section 标题样式
5. 修改卡片标题样式
6. 修改按钮、Tabs、标签样式
7. 验证功能不被破坏
8. 更新 TRAE_DEV_LOG.md

## 修改文件

- `saitu-ai.html` — CSS 样式修改
- `TRAE_DEV_LOG.md` — 追加 Session 6 记录
