# 知行合一盈亏记录系统 — 产品扩展实施计划

## Context

当前项目是一个 TRAE AI 创造力大赛的参赛作品，仅有精美的静态落地页（Landing Page），六大核心功能（交易记录、盈亏统计、胜率分析、情绪追踪、风控提醒、数据导出）均为文字描述和硬编码数据展示，没有任何实际可用的交互功能。

**目标：** 将落地页扩展为全功能可用的股票盈亏记录 Web 应用，同时保留原有落地页作为产品介绍入口。

---

## 架构方案

### 双模式 SPA 架构
- **落地页模式**：保留原有产品介绍页面
- **应用模式**：完整的交易记录 CRUD + 六大核心功能
- 通过 Hash 路由 (`#landing` / `#app/...`) 切换两种模式
- CTA 按钮 "立即体验行合一" 跳转到 `#app/dashboard`

### 技术约束
- 纯前端，无后端，支持 `file://` 协议直接打开
- 数据持久化使用 localStorage
- 多文件 `<script src>` 加载（`file://` 下可用，ES Module 不可用）
- 复用现有 ECharts 库，不引入新框架或大型依赖

### 文件结构
```
e:\zhixingheyi-stock-tracker\
├── xingheyi-stock-tracker.html        # 主入口（重构后含双模式 HTML 骨架）
├── _shared/js/echarts.min.js          # 保留不变
├── _shared/fonts/                      # 保留不变
├── assets/
│   ├── *.jpg                           # 保留不变
│   ├── charts-landing.js               # 原charts.js重命名，仅用于落地页
│   ├── css/
│   │   ├── base.css                    # CSS变量、重置、全局样式
│   │   ├── landing.css                 # 落地页专用样式
│   │   └── app.css                     # 功能应用专用样式
│   └── js/
│       ├── store.js                    # 数据持久化层（localStorage CRUD + 统计计算）
│       ├── router.js                   # Hash路由控制器
│       ├── app.js                      # 应用主控制器
│       ├── trade-form.js               # 交易记录表单（新增/编辑）
│       ├── trade-list.js               # 交易记录列表（筛选/排序/分页）
│       ├── dashboard.js                # 仪表盘首页
│       ├── statistics.js               # 盈亏统计
│       ├── winrate.js                  # 胜率分析
│       ├── emotion.js                  # 情绪追踪
│       ├── risk-control.js             # 风控提醒
│       ├── export.js                   # 数据导出（CSV + 打印PDF）
│       ├── charts-app.js               # 应用模式图表配置（数据驱动）
│       └── utils.js                    # 工具函数 + 股票代码映射表
```

---

## 数据模型

### Trade（交易记录）
```javascript
{
  id: "trx_a1b2c3d4",           // 随机ID
  date: "2026-06-24",           // 交易日期
  stockCode: "600519",          // 股票代码
  stockName: "贵州茅台",         // 股票名称
  direction: "sell",            // "buy" | "sell"
  pnlAmount: 2350,             // 盈亏金额（正=盈利，负=亏损）
  pnlPercent: 5.2,             // 盈亏比例（%）
  costPrice: null,             // 买入价（可选）
  sellPrice: null,             // 卖出价（可选）
  shares: null,                // 成交股数（可选）
  reason: "达到目标价位",        // 交易理由
  emotion: "calm",             // 情绪标签
  notes: "",                   // 交易心得（长文本）
  tags: [],                    // 自定义标签
  createdAt: "...",            // 创建时间
  updatedAt: "..."             // 修改时间
}
```

### Settings（风控设置）
```javascript
{
  riskControl: {
    dailyLossLimit: 3000,
    weeklyLossLimit: 10000,
    monthlyLossLimit: 30000,
    alertThreshold: 80
  }
}
```

### localStorage 键值
- `zhiXingHeYi_trades` → Trade[] 数组
- `zhiXingHeYi_settings` → Settings 对象
- `zhiXingHeYi_version` → 数据版本号

---

## 核心交互设计亮点

### 交易记录表单（体现"手动记录唤醒感知"理念）
1. **盈亏金额实时变色**：正数绿色渐变，负数红色渐变，强化感知
2. **情绪可视化选择器**：大按钮+emoji，强迫用户正视情绪状态
3. **二次确认机制**："你确定要记录这笔 +2,350 元的盈利？"，非一键提交
4. **记录成功动画**：盈利绿色粒子扩散，亏损红色缓慢消散
5. **风控内嵌提醒**：表单内实时显示当日亏损接近阈值警告

### 应用模式布局
- 顶部导航栏 + 左侧功能菜单 + 右侧主内容区
- 底部状态栏：总交易笔数 | 总盈亏 | 风控状态
- 移动端：侧栏折叠为底部 Tab 栏

---

## 实施阶段

### 阶段 1：基础设施
- [ ] 创建 `assets/js/utils.js` — UUID生成、日期/金额格式化、股票代码映射表(200只热门A股)
- [ ] 创建 `assets/js/store.js` — localStorage CRUD、统计计算接口、发布-订阅通知
- [ ] 创建 `assets/css/base.css` — 从原HTML提取CSS变量和重置样式
- [ ] 创建 `assets/css/landing.css` — 落地页专用样式
- [ ] 创建 `assets/css/app.css` — 应用模式样式（导航/侧栏/表单/卡片/仪表盘）
- [ ] 重构 HTML 主入口文件，引用拆分后的CSS/JS，确保落地页不变

### 阶段 2：核心 CRUD
- [ ] 创建 `assets/js/router.js` — Hash路由控制器
- [ ] 创建 `assets/js/app.js` — 应用主控制器、双模式切换
- [ ] 创建 `assets/js/trade-form.js` — 新增/编辑交易表单
- [ ] 创建 `assets/js/trade-list.js` — 交易列表 + 筛选 + 排序 + 分页
- [ ] CTA 按钮连接到 `#app/trades/new`

### 阶段 3：仪表盘与统计
- [ ] 创建 `assets/js/dashboard.js` — 仪表盘首页（概览卡片+最近交易+风控状态）
- [ ] 创建 `assets/js/charts-app.js` — 数据驱动的 ECharts 图表配置
- [ ] 创建 `assets/js/statistics.js` — 盈亏统计（日/周/月/年切换 + 多图表）
- [ ] 创建 `assets/js/winrate.js` — 胜率分析（胜率/盈亏比/极值/期望值）

### 阶段 4：情绪与风控
- [ ] 创建 `assets/js/emotion.js` — 情绪选择器 + 情绪-盈亏相关性分析
- [ ] 创建 `assets/js/risk-control.js` — 风控设置 + 实时检测 + 全局提醒条

### 阶段 5：导出与设置
- [ ] 创建 `assets/js/export.js` — CSV导出 + window.print() PDF方案
- [ ] 设置页面（风控阈值、数据管理、清空/导入/导出）

### 阶段 6：打磨
- [ ] 首次使用引导遮罩（3步操作提示）
- [ ] 预置示例数据（一键导入10条样例数据）
- [ ] 空状态设计（无数据时优雅引导界面）
- [ ] 移动端响应式适配
- [ ] 微交互动画（记录成功效果、页面切换过渡）
- [ ] ECharts 实例内存管理（路由切换时 dispose）

---

## 关键文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `xingheyi-stock-tracker.html` | 重构 | 添加应用模式HTML骨架，引用拆分后的CSS/JS |
| `assets/charts.js` | 重命名 | → `charts-landing.js`，保留落地页图表 |
| `assets/js/store.js` | 新建 | 数据核心，所有模块依赖 |
| `assets/js/app.js` | 新建 | 应用主控制器 |
| `assets/js/trade-form.js` | 新建 | 产品理念核心载体 |
| `assets/js/router.js` | 新建 | Hash路由 |
| `assets/js/trade-list.js` | 新建 | 交易列表 |
| `assets/js/dashboard.js` | 新建 | 仪表盘 |
| `assets/js/statistics.js` | 新建 | 盈亏统计 |
| `assets/js/winrate.js` | 新建 | 胜率分析 |
| `assets/js/emotion.js` | 新建 | 情绪追踪 |
| `assets/js/risk-control.js` | 新建 | 风控提醒 |
| `assets/js/export.js` | 新建 | 数据导出 |
| `assets/js/charts-app.js` | 新建 | 应用图表配置 |
| `assets/js/utils.js` | 新建 | 工具函数 |
| `assets/css/base.css` | 新建 | 基础样式 |
| `assets/css/landing.css` | 新建 | 落地页样式 |
| `assets/css/app.css` | 新建 | 应用样式 |

---

## 验证方案

1. **基础功能验证**：双击 HTML 文件在浏览器中直接打开 → 落地页正常显示 → 点击 CTA 进入应用模式
2. **CRUD验证**：新增交易记录 → 列表中显示 → 编辑修改 → 删除 → 数据持久化（刷新后仍在）
3. **统计验证**：录入多条数据 → 仪表盘显示正确统计 → 切换日/周/月/年周期数据正确
4. **图表验证**：所有 ECharts 图表根据真实数据渲染，无硬编码数据
5. **风控验证**：设置日亏损上限 → 录入亏损交易 → 接近阈值时显示警告 → 超限时显示危险提醒
6. **导出验证**：导出 CSV → Excel 打开内容正确 → 打印 PDF 布局合理
7. **移动端验证**：缩小浏览器窗口至 768px 以下 → 侧栏折叠 → 触控交互正常
8. **file:// 协议验证**：在 Chrome/Edge 中直接双击打开 → 所有功能正常
