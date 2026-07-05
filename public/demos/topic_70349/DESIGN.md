# DESIGN.md — 视觉与交互规范

> 配套 AGENTS.md 使用。本文件定义"长什么样 / 怎么动"，AGENTS.md 定义"必须遵守什么"。

## 1. 总体气质

工具型 Web 应用，类似 Linear / iA Writer 的克制感，但配色采用农业绿系（与 `pig-feed-formula.html` 报告同源）以保持品牌连续性。**不是 SaaS 落地页**。

- 信息密度：中等偏高；首屏即可完成"看阶段 → 改原料 → 算成本 → 看风险"完整闭环
- 视觉关键词：克制、表格友好、绿色静谧、数字等宽
- 禁止：大渐变 hero、emoji 装饰、紫色渐变、Inter/Roboto/Arial

## 2. 排版

| 角色 | 字体 | 字号 | 字重 |
|------|------|------|------|
| 页面主标题 | Noto Sans CJK SC | 22px | 700 |
| 区段标题（H2） | Noto Sans CJK SC | 16px | 600 |
| 表头 | Noto Sans CJK SC | 12px | 600 大写 |
| 正文 | Noto Sans CJK SC | 14px | 400 |
| 数字 / 单位 | JetBrains Mono | 13px | 500 |
| 风险文字 | Noto Sans CJK SC | 13px | 400 |

## 3. 配色（CSS 变量）

```css
:root {
  --bg:        #f7f8f5;
  --bg-2:      #ffffff;
  --ink:       #1f2d23;
  --muted:     #6b7c6e;
  --rule:      #d6e0d8;
  --accent:    #2d7a3e;
  --accent-2:  #c0772a;   /* 参考 / 二次育肥 */
  --warn:      #d4a017;   /* 上限营养超标 */
  --warn-bg:   #fdf6e3;
  --danger:    #c0392b;   /* 不可行 */
  --danger-bg: #fdeaea;
}
```

## 4. 间距与栅格

- 容器最大宽度 1280px，左右内边距 24px
- 12 列栅格；gap 16px
- 区段上下间距 24px
- 卡片内边距 20px
- 表格行高 44px（满足触摸目标）

## 5. 布局

### 5.1 ≥1280px 桌面

```
┌──────────────────────────────────────────────────────────┐
│ Header (左 logo+标题 / 右 标准来源徽章)                │
├──────────────────────────────────────────────────────────┤
│ PigTypePhase (猪种 SegmentedControl + 阶段 Chip 行)    │
├──────────────────────────────────────────────────────────┤
│ TargetCard (4 列 MetricBlock：CP/DE/水分/置信)         │
├──────────────────────────────────┬───────────────────────┤
│ IngredientsTable (7/12)         │ ResultCard (5/12)    │
│ - 操作栏（新增/CSV/导入/导出）  │ - 4 Metric 汇总       │
│ - 表（10 列 sticky 表头）        │ - 配方单（粘表头）    │
│                                  │ - 风险 Callout 列表   │
└──────────────────────────────────┴───────────────────────┘
```

### 5.2 768–1023px

双列改为单列，结果卡跟随原料表下方。

### 5.3 375–767px

表格改为卡片堆叠：每张卡片显示一个原料的全部可编辑字段（行内 flex 列布局）。数字保持等宽。

## 6. 组件规范

### 6.1 SegmentedControl（猪种）
- 3 段，宽度 240px
- 选中段填色 `--accent`，文字白
- 未选中段文字 `--ink`，背景透明

### 6.2 Chip（阶段）
- 高度 32px
- 默认态：白底 + 1px `--rule` 描边 + `--ink` 文字
- 选中态：`--accent` 填色 + 白字
- 二次育肥（>120kg）带右上角橙色"参考"小徽章（8px 字号）

### 6.3 MetricBlock
- 等宽数字（JetBrains Mono）
- 数字下方小字单位 / 来源
- 数字超大（28px），颜色 `--ink`

### 6.4 Callout
- 三态：info（绿左 4px）/ warn（黄左 4px）/ danger（红左 4px）
- 背景对应变量
- 内边距 16px，圆角 8px

### 6.5 表格输入框
- 透明背景；聚焦时 1.5px `--accent` 描边
- 数字右对齐 + 单位浅色小字左对齐
- 错误态：1.5px `--danger` 描边

## 7. 动效

- 入场：header → pigTypePhase → targetCard → ingredientsTable → resultCard；stagger 80ms；y +6 → 0；opacity 0 → 1；缓动 `cubic-bezier(.2,.7,.2,1)`；时长 280ms
- 状态切换：颜色 / 边框 150ms ease
- 不做：滚动触发、3D、视差
- 求解中：结果卡显示骨架条（120ms × 3 次渐隐）

## 8. 可访问性

- 所有输入框有 `<label>`（视觉隐藏但屏幕阅读器可读）
- 按钮 `aria-label`，禁用态 `aria-disabled="true"`
- 颜色对比度 ≥ 4.5:1
- 键盘可全操作（Tab 顺序、Enter 提交、Esc 关闭弹窗）
- 焦点环 2px `--accent` 描边

## 9. 不使用

- 渐变背景（仅 hero 微渐变；v1 无 hero）
- emoji 装饰
- 紫 / 蓝渐变
- 阴影 > 4px
- 圆角 > 8px
- 动画 > 400ms
- 滚动触发动画

## 10. 资产

- 字体从 `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap` 加载
- 不使用 `pig-feed-formula.html` 中的 ECharts；v1 不需要图表
