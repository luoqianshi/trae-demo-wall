# CodeArchaeology 代码考古学 - 产品需求与架构设计文档

## 1. 功能模块清单

### 1.1 项目导入面板（左侧栏）

| 模块 | 字段 | 说明 |
|------|------|------|
| 项目信息 | name | 项目名称：e-commerce-platform |
| | language | 语言：Java Spring Boot |
| | lines_of_code | 代码行数：128,456 |
| | file_count | 文件数：2,847 |
| 时间统计 | total_commits | 提交总数：3,247 |
| | first_commit | 首次提交：2021-07-15 |
| | last_commit | 最近提交：2024-06-30 |
| | active_developers | 活跃开发者：12人 |
| 健康概览 | overall_health | 总体健康度：68% |
| | debt_score | 技术债评分：4.2/10 |
| | risk_level | 风险等级：中 |

### 1.2 考古地层图（中间主视觉）

横向时间轴展示 **12个季度** 的代码健康度地层：

| 季度 | 健康度 | 颜色编码 |
|------|--------|----------|
| 2021 Q3 | 45% | 危险红 |
| 2021 Q4 | 52% | 危险红 |
| 2022 Q1 | 58% | 警告橙 |
| 2022 Q2 | 62% | 警告橙 |
| 2022 Q3 | 65% | 警告橙 |
| 2022 Q4 | 68% | 电光蓝 |
| 2023 Q1 | 70% | 电光蓝 |
| 2023 Q2 | 72% | 电光蓝 |
| 2023 Q3 | 75% | 荧光绿 |
| 2023 Q4 | 78% | 荧光绿 |
| 2024 Q1 | 80% | 荧光绿 |
| 2024 Q2 | 85% | 荧光绿 |

交互功能：
- 悬停显示详细信息（提交数、Bug数、技术债评分）
- 点击展开该季度的代码变更详情
- 时间轴可左右滚动查看历史

### 1.3 文明关系图谱（右下）

D3.js 力导向图展示 **12个模块**、**28条依赖关系**：

模块列表：
1. user-service
2. order-service
3. payment-service
4. inventory-service
5. notification-service
6. auth-service
7. gateway-service
8. config-service
9. log-service
10. monitor-service
11. cache-service
12. search-service

节点大小规则：
- 复杂度 > 80：大型节点（直径 60px）
- 复杂度 50-80：中型节点（直径 45px）
- 复杂度 < 50：小型节点（直径 30px）

边粗细规则：
- 耦合强度 > 0.7：粗边（4px）
- 耦合强度 0.4-0.7：中等边（2px）
- 耦合强度 < 0.4：细边（1px）

交互功能：
- 拖拽节点重新排列
- 悬停高亮依赖链
- 点击节点显示模块详情
- 双击节点打开AI重构建议

### 1.4 遗迹扫描报告（右侧）

列出 **36个代码遗迹**，按严重程度分组：

| 类型 | 数量 | 图标 | 颜色 |
|------|------|------|------|
| Critical | 8 | 💀 | 危险红 #ff6b6b |
| Warning | 15 | ⚠️ | 警告橙 #ff9f43 |
| Info | 13 | 🔍 | 电光蓝 #00d4ff |

遗迹类型分布：
- dead-code：12个
- coupling：8个
- duplicate：7个
- complexity：9个

交互功能：
- 类型筛选（全部/Critical/Warning/Info）
- 搜索框按模块名/描述搜索
- 点击遗迹打开AI重构建议弹窗
- 批量选择标记已处理

### 1.5 AI 重构建议弹窗（居中模态框）

弹窗布局：

```
┌─────────────────────────────────────────────────┐
│  AI 重构建议 - [遗迹标题]                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐       │
│  │   BEFORE 代码    │  │    AFTER 代码    │       │
│  │   (红线边框)     │  │   (绿线边框)     │       │
│  │ 200+ 行死代码    │  │  精简至 45 行    │       │
│  └─────────────────┘  └─────────────────┘       │
│                                                 │
│  ┌───────────────────────────────────────────┐   │
│  │ 风险评估：代码风险[低] | 测试覆盖[中] | 迁移[低] │   │
│  └───────────────────────────────────────────┘   │
│                                                 │
│  ┌───────────────────────────────────────────┐   │
│  │ 迁移步骤：                                  │   │
│  │ 1. 创建 UserNotFoundException 异常类        │   │
│  │ 2. 重构 UserService.optimizedMethod()       │   │
│  │ 3. 更新相关调用方代码                        │   │
│  │ 4. 补充单元测试用例                          │   │
│  └───────────────────────────────────────────┘   │
│                                                 │
│  [复制重构代码]  [导出报告]  [关闭]               │
└─────────────────────────────────────────────────┘
```

---

## 2. 技术架构

### 2.1 技术栈

| 层次 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 语言 | HTML5 | - | 语义化标签 |
| | CSS3 | - | 原生CSS动画 |
| | JavaScript | ES6+ | 原生JS，无框架依赖 |
| 可视化 | D3.js | v7 | 力导向图、地层图 |
| 字体 | JetBrains Mono | - | 等宽字体 |
| 图标 | Lucide Icons | - | 嵌入式SVG图标 |

### 2.2 文件结构

```
index.html
├── <head>
│   ├── <meta> tags
│   ├── <title>
│   ├── <link> JetBrains Mono 字体
│   ├── <script> D3.js v7 CDN
│   └── <style> 全局样式 + 组件样式
└── <body>
    ├── <header> 顶部导航栏
    ├── <main> 主内容区
    │   ├── <aside class="left-panel"> 项目导入面板
    │   ├── <section class="center-panel"> 考古地层图
    │   └── <aside class="right-panel">
    │       ├── <div class="graph-section"> 文明关系图谱
    │       └── <div class="report-section"> 遗迹扫描报告
    ├── <div class="modal-overlay"> AI重构建议弹窗
    └── <script> 业务逻辑 + D3.js可视化 + 模拟数据
```

### 2.3 核心技术要点

#### 2.3.1 D3.js 力导向图配置

```javascript
const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.size / 2 + 5));
```

#### 2.3.2 响应式设计

- 最小宽度：1200px
- 左侧栏宽度：280px（固定）
- 中间主视觉：flex 1（自适应）
- 右侧栏宽度：400px（固定）
- 移动端：横向滚动

---

## 3. 视觉设计规范

### 3.1 色彩系统

| 用途 | 颜色 | 十六进制 | 用途说明 |
|------|------|----------|----------|
| 背景色 | 深空黑 | #0a0a0f | 页面主背景 |
| 卡片色 | 深灰黑 | #12121a | 面板、卡片背景 |
| 边框色 | 暗紫灰 | #1e1e2e | 卡片边框、分割线 |
| 文字主色 | 浅灰 | #e8e8f0 | 主要文字内容 |
| 文字次色 | 中灰 | #6b6b80 | 辅助文字、标签 |
| 健康绿 | 荧光绿 | #00ff88 | 健康指标、成功状态、进度条 |
| 交互蓝 | 电光蓝 | #00d4ff | 交互元素、链接、图表线条 |
| 警告橙 | 警告橙 | #ff9f43 | 警告状态、中等风险 |
| 危险红 | 危险红 | #ff6b6b | 危险状态、高风险 |
| 紫色 | 科技紫 | #a855f7 | 装饰色、特殊标记 |

### 3.2 字体规范

| 用途 | 字体 | 大小 | 字重 | 行高 |
|------|------|------|------|------|
| 标题 | JetBrains Mono | 24px | 700 | 1.2 |
| 副标题 | JetBrains Mono | 18px | 600 | 1.3 |
| 正文 | JetBrains Mono | 13px | 400 | 1.6 |
| 代码 | JetBrains Mono | 11px | 400 | 1.5 |
| 标签 | JetBrains Mono | 10px | 500 | 1.4 |

### 3.3 间距规范

| 层级 | 间距 | 用途 |
|------|------|------|
| 页面边距 | 24px | 主内容区与页面边缘 |
| 面板间距 | 16px | 各模块之间的间距 |
| 卡片内边距 | 20px | 卡片内容与边框 |
| 元素间距 | 8px/12px | 按钮、标签等元素间距 |

### 3.4 动效规范

| 动效类型 | 持续时间 | 缓动函数 | 用途 |
|----------|----------|----------|------|
| 悬停过渡 | 0.3s | ease-out | 按钮、卡片悬停 |
| 进度动画 | 2s | ease-out | 扫描进度条 |
| 模态框 | 0.2s | ease-out | 弹窗显示/隐藏 |
| 节点动画 | 0.5s | ease-out | D3力导向图 |
| 闪烁效果 | 1s | step-end | 终端光标 |

### 3.5 风格特征

- **科幻终端风格**：深色背景、等宽字体、终端命令行元素
- **黑客仪表盘**：扫描线动画、矩阵雨背景、发光边框
- **数据可视化**：多层图表、颜色编码、交互反馈

---

## 4. 模拟数据结构设计

### 4.1 项目信息

```javascript
const projectInfo = {
    name: 'e-commerce-platform',
    language: 'Java Spring Boot',
    framework: 'Spring Boot 2.7.x',
    linesOfCode: 128456,
    fileCount: 2847,
    totalCommits: 3247,
    firstCommit: '2021-07-15',
    lastCommit: '2024-06-30',
    activeDevelopers: 12,
    overallHealth: 68,
    debtScore: 4.2,
    riskLevel: 'medium',
    modules: 12
};
```

### 4.2 模块列表

```javascript
const modules = [
    { id: 'user-service', name: '用户服务', complexity: 72, status: 'healthy' },
    { id: 'order-service', name: '订单服务', complexity: 85, status: 'warning' },
    { id: 'payment-service', name: '支付服务', complexity: 68, status: 'healthy' },
    { id: 'inventory-service', name: '库存服务', complexity: 55, status: 'healthy' },
    { id: 'notification-service', name: '通知服务', complexity: 42, status: 'healthy' },
    { id: 'auth-service', name: '认证服务', complexity: 78, status: 'warning' },
    { id: 'gateway-service', name: '网关服务', complexity: 65, status: 'healthy' },
    { id: 'config-service', name: '配置服务', complexity: 35, status: 'healthy' },
    { id: 'log-service', name: '日志服务', complexity: 48, status: 'healthy' },
    { id: 'monitor-service', name: '监控服务', complexity: 52, status: 'healthy' },
    { id: 'cache-service', name: '缓存服务', complexity: 70, status: 'healthy' },
    { id: 'search-service', name: '搜索服务', complexity: 60, status: 'healthy' }
];
```

### 4.3 依赖关系（28条）

```javascript
const dependencies = [
    { source: 'gateway-service', target: 'auth-service', weight: 0.9 },
    { source: 'gateway-service', target: 'user-service', weight: 0.8 },
    { source: 'gateway-service', target: 'order-service', weight: 0.85 },
    { source: 'order-service', target: 'payment-service', weight: 0.95 },
    { source: 'order-service', target: 'inventory-service', weight: 0.9 },
    { source: 'order-service', target: 'user-service', weight: 0.7 },
    { source: 'order-service', target: 'notification-service', weight: 0.6 },
    { source: 'payment-service', target: 'auth-service', weight: 0.5 },
    { source: 'payment-service', target: 'log-service', weight: 0.4 },
    { source: 'user-service', target: 'auth-service', weight: 0.8 },
    { source: 'user-service', target: 'cache-service', weight: 0.65 },
    { source: 'inventory-service', target: 'cache-service', weight: 0.75 },
    { source: 'notification-service', target: 'log-service', weight: 0.5 },
    { source: 'auth-service', target: 'cache-service', weight: 0.8 },
    { source: 'auth-service', target: 'log-service', weight: 0.4 },
    { source: 'config-service', target: 'gateway-service', weight: 0.3 },
    { source: 'config-service', target: 'order-service', weight: 0.35 },
    { source: 'config-service', target: 'user-service', weight: 0.3 },
    { source: 'log-service', target: 'monitor-service', weight: 0.55 },
    { source: 'monitor-service', target: 'gateway-service', weight: 0.4 },
    { source: 'monitor-service', target: 'order-service', weight: 0.45 },
    { source: 'cache-service', target: 'search-service', weight: 0.5 },
    { source: 'search-service', target: 'user-service', weight: 0.4 },
    { source: 'search-service', target: 'order-service', weight: 0.45 },
    { source: 'order-service', target: 'search-service', weight: 0.5 },
    { source: 'inventory-service', target: 'order-service', weight: 0.8 },
    { source: 'payment-service', target: 'order-service', weight: 0.3 },
    { source: 'auth-service', target: 'order-service', weight: 0.2 }
];
```

### 4.4 代码遗迹（36个）

```javascript
const relics = [
    // Critical (8)
    { id: 'R001', module: 'order-service', type: 'dead-code', severity: 'critical', 
      title: 'UserService.legacyMethod()', description: '该方法已 180 天未被调用，包含 247 行不可达代码',
      suggestion: '删除死代码，将有用逻辑迁移至新服务' },
    { id: 'R002', module: 'order-service', type: 'coupling', severity: 'critical',
      title: 'OrderModule 循环依赖', description: '与 payment-service 和 inventory-service 形成 3 层循环依赖',
      suggestion: '引入事件驱动架构解耦' },
    { id: 'R003', module: 'payment-service', type: 'complexity', severity: 'critical',
      title: 'PaymentProcessor.process() 圈复杂度 42', description: '单方法包含 42 个条件分支，难以维护',
      suggestion: '拆分为多个独立方法，采用策略模式' },
    { id: 'R004', module: 'auth-service', type: 'dead-code', severity: 'critical',
      title: 'TokenUtil 废弃类', description: '整个工具类已被 Spring Security 替代，包含 5 个废弃方法',
      suggestion: '完全移除该类及所有引用' },
    { id: 'R005', module: 'inventory-service', type: 'duplicate', severity: 'critical',
      title: '库存扣减逻辑重复 3 次', description: '在 OrderService、InventoryController、API 层各实现一次',
      suggestion: '抽取公共服务，统一调用入口' },
    { id: 'R006', module: 'gateway-service', type: 'complexity', severity: 'critical',
      title: 'FilterChain 嵌套 8 层', description: '请求过滤链深度嵌套，难以调试和扩展',
      suggestion: '重构为责任链模式，每层独立' },
    { id: 'R007', module: 'user-service', type: 'coupling', severity: 'critical',
      title: 'UserEntity 被 15 个模块直接引用', description: '领域实体暴露过多，修改风险极高',
      suggestion: '引入 DTO 层隔离，定义稳定接口' },
    { id: 'R008', module: 'notification-service', type: 'dead-code', severity: 'critical',
      title: 'SMSGateway v1 API', description: '使用已废弃的短信网关 API，官方已停止维护',
      suggestion: '迁移至 v3 API，更新配置参数' },
    
    // Warning (15)
    { id: 'R009', module: 'order-service', type: 'complexity', severity: 'warning',
      title: 'OrderValidator 方法过长', description: 'validateOrder() 方法超过 150 行',
      suggestion: '按校验规则拆分为多个小方法' },
    { id: 'R010', module: 'payment-service', type: 'duplicate', severity: 'warning',
      title: '金额计算逻辑重复', description: 'discount() 和 calculateTotal() 有 60% 代码重复',
      suggestion: '抽取公共计算服务' },
    { id: 'R011', module: 'user-service', type: 'coupling', severity: 'warning',
      title: 'UserRepository 与 Cache 紧耦合', description: '仓储层直接操作缓存，违背分层原则',
      suggestion: '引入缓存服务层，仓储层只负责数据库' },
    { id: 'R012', module: 'inventory-service', type: 'complexity', severity: 'warning',
      title: 'StockManager 圈复杂度 28', description: '库存管理逻辑过于集中',
      suggestion: '按功能拆分：入库、出库、盘点' },
    { id: 'R013', module: 'auth-service', type: 'duplicate', severity: 'warning',
      title: '密码加密逻辑重复', description: '在 3 个地方实现相同的 BCrypt 加密',
      suggestion: '统一至 SecurityConfig' },
    { id: 'R014', module: 'gateway-service', type: 'coupling', severity: 'warning',
      title: '路由配置硬编码', description: '路由规则直接写在代码中，无法动态调整',
      suggestion: '迁移至配置中心或数据库' },
    { id: 'R015', module: 'config-service', type: 'dead-code', severity: 'warning',
      title: '旧版配置加载器', description: 'Spring Cloud Config 1.x 兼容代码',
      suggestion: '清理废弃代码，统一使用 2.x API' },
    { id: 'R016', module: 'log-service', type: 'complexity', severity: 'warning',
      title: 'LogParser 正则表达式复杂', description: '单正则包含 10+ 捕获组，难以理解',
      suggestion: '分步解析，使用命名捕获组' },
    { id: 'R017', module: 'monitor-service', type: 'coupling', severity: 'warning',
      title: 'MetricsCollector 依赖过多', description: '同时依赖 6 个监控 SDK',
      suggestion: '抽象统一接口，按需加载' },
    { id: 'R018', module: 'cache-service', type: 'dead-code', severity: 'warning',
      title: 'RedisClusterConfig 废弃配置', description: '集群模式已停用，保留单节点配置即可',
      suggestion: '删除集群配置相关代码' },
    { id: 'R019', module: 'search-service', type: 'complexity', severity: 'warning',
      title: 'SearchQueryBuilder 链式调用过长', description: '单次查询构建超过 20 个链式调用',
      suggestion: '使用构建器模式，分步构建' },
    { id: 'R020', module: 'notification-service', type: 'coupling', severity: 'warning',
      title: 'EmailService 与模板引擎紧耦合', description: '直接依赖 Freemarker 实现',
      suggestion: '抽象模板接口，支持多种引擎' },
    { id: 'R021', module: 'order-service', type: 'duplicate', severity: 'warning',
      title: '退款逻辑与订单创建重复', description: '状态机处理逻辑有 40% 重复',
      suggestion: '抽取状态机框架，统一状态流转' },
    { id: 'R022', module: 'payment-service', type: 'dead-code', severity: 'warning',
      title: 'AlipayLegacyCallback', description: '支付宝旧版回调接口，已迁移至新版',
      suggestion: '保留 1 个月后删除' },
    { id: 'R023', module: 'inventory-service', type: 'coupling', severity: 'warning',
      title: 'WarehouseDAO 直接被 Controller 调用', description: '跳过 Service 层，违反分层架构',
      suggestion: '新增 Service 层，Controller 只调用 Service' },
    
    // Info (13)
    { id: 'R024', module: 'user-service', type: 'complexity', severity: 'info',
      title: 'UserDTO 字段过多', description: '包含 25 个字段，建议拆分',
      suggestion: '按用途拆分为 BasicUserDTO、FullUserDTO 等' },
    { id: 'R025', module: 'order-service', type: 'duplicate', severity: 'info',
      title: '订单状态枚举重复定义', description: '在 order-service 和 payment-service 各定义一次',
      suggestion: '提取共享模块，统一枚举定义' },
    { id: 'R026', module: 'payment-service', type: 'coupling', severity: 'info',
      title: 'PayPalConfig 与特定实现绑定', description: '配置类包含 PayPal 特有字段',
      suggestion: '使用泛型或接口抽象支付配置' },
    { id: 'R027', module: 'inventory-service', type: 'dead-code', severity: 'info',
      title: 'CSVImporter 未使用', description: '库存导入功能已改用 Excel',
      suggestion: '标记 @Deprecated，计划移除' },
    { id: 'R028', module: 'notification-service', type: 'complexity', severity: 'info',
      title: 'NotificationFactory 分支较多', description: '支持 8 种通知类型，分支较多',
      suggestion: '考虑使用策略模式替代 if-else' },
    { id: 'R029', module: 'auth-service', type: 'duplicate', severity: 'info',
      title: 'JWT 配置重复', description: '在 application.yml 和 SecurityConfig 各定义一次',
      suggestion: '统一配置来源' },
    { id: 'R030', module: 'gateway-service', type: 'dead-code', severity: 'info',
      title: 'RateLimitFilter 旧版实现', description: '已替换为 Bucket4j 实现',
      suggestion: '清理旧版代码' },
    { id: 'R031', module: 'config-service', type: 'complexity', severity: 'info',
      title: 'ConfigLoader 条件判断复杂', description: '支持 5 种配置源，判断逻辑嵌套',
      suggestion: '使用责任链模式处理不同配置源' },
    { id: 'R032', module: 'log-service', type: 'coupling', severity: 'info',
      title: 'LogAppender 与 Elasticsearch 绑定', description: '日志输出直接依赖 ES',
      suggestion: '抽象输出接口，支持多种存储' },
    { id: 'R033', module: 'monitor-service', type: 'duplicate', severity: 'info',
      title: 'HealthIndicator 实现重复', description: '多个模块实现类似的健康检查',
      suggestion: '提取公共健康检查模块' },
    { id: 'R034', module: 'cache-service', type: 'complexity', severity: 'info',
      title: 'CacheEvictionPolicy 逻辑复杂', description: '驱逐策略包含多种条件',
      suggestion: '拆分为独立策略类' },
    { id: 'R035', module: 'search-service', type: 'dead-code', severity: 'info',
      title: 'SolrClient 兼容代码', description: '已迁移至 Elasticsearch，保留 Solr 兼容',
      suggestion: '确认不再使用后删除' },
    { id: 'R036', module: 'user-service', type: 'coupling', severity: 'info',
      title: 'UserEventListener 监听过多', description: '监听 6 种事件，职责过重',
      suggestion: '按事件类型拆分多个监听器' }
];
```

### 4.5 地层数据（12个季度）

```javascript
const stratigraphy = [
    { quarter: '2021 Q3', commits: 156, bugs: 28, debtScore: 7.8, health: 45, color: '#ff6b6b' },
    { quarter: '2021 Q4', commits: 234, bugs: 24, debtScore: 7.2, health: 52, color: '#ff6b6b' },
    { quarter: '2022 Q1', commits: 189, bugs: 20, debtScore: 6.5, health: 58, color: '#ff9f43' },
    { quarter: '2022 Q2', commits: 267, bugs: 18, debtScore: 6.0, health: 62, color: '#ff9f43' },
    { quarter: '2022 Q3', commits: 312, bugs: 15, debtScore: 5.5, health: 65, color: '#ff9f43' },
    { quarter: '2022 Q4', commits: 289, bugs: 12, debtScore: 4.8, health: 68, color: '#00d4ff' },
    { quarter: '2023 Q1', commits: 345, bugs: 10, debtScore: 4.5, health: 70, color: '#00d4ff' },
    { quarter: '2023 Q2', commits: 378, bugs: 8, debtScore: 4.2, health: 72, color: '#00d4ff' },
    { quarter: '2023 Q3', commits: 412, bugs: 6, debtScore: 3.8, health: 75, color: '#00ff88' },
    { quarter: '2023 Q4', commits: 356, bugs: 5, debtScore: 3.5, health: 78, color: '#00ff88' },
    { quarter: '2024 Q1', commits: 298, bugs: 4, debtScore: 3.2, health: 80, color: '#00ff88' },
    { quarter: '2024 Q2', commits: 252, bugs: 3, debtScore: 2.8, health: 85, color: '#00ff88' }
];
```

---

## 5. 页面布局草图

### 5.1 整体布局（ASCII）

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  ⛏️ CodeArchaeology ──────────────────────────────────────────── [扫描中...]  │
├──────────────┬───────────────────────────────────────────────┬────────────────┤
│              │                                               │                │
│  ┌──────────┐│  ┌──────────────────────────────────────────┐ │  ┌──────────┐ │
│  │ 项目信息  ││  │                                          │ │  │          │ │
│  │          ││  │                                          │ │  │  文明     │ │
│  │ e-commerce││  │       考古地层图 (横向时间轴)            │ │  │  关系     │ │
│  │ Java      ││  │                                          │ │  │  图谱     │ │
│  │ 128K LOC ││  │  ┌────┬────┬────┬────┬────┬────┬────┐   │ │  │          │ │
│  │ 3,247提交││  │  │Q3  │Q4  │Q1  │Q2  │Q3  │Q4  │... │   │ │  │ D3力导   │ │
│  │          ││  │  │2021│2021│2022│2022│2022│2022│    │   │ │  │ 向图     │ │
│  │ 健康度68%││  │  │ #ff│ #ff│ #ff│ #ff│ #ff│ #00│    │   │ │  │          │ │
│  │ 技术债4.2││  │  │ 6b │ 6b │ 9f │ 9f │ 9f │ d4 │    │   │ │  │ 12模块   │ │
│  │          ││  │  │ 6b │ 6b │ 43 │ 43 │ 43 │ ff │    │   │ │  │ 28依赖   │ │
│  │ [扫描]   ││  │  └────┴────┴────┴────┴────┴────┴────┘   │ │  │          │ │
│  │ [上传]   ││  │                                          │ │  │          │ │
│  └──────────┘│  └──────────────────────────────────────────┘ │  └──────────┘ │
│              │                                               │                │
│              │                                               │  ┌──────────┐ │
│              │                                               │  │          │ │
│              │                                               │  │ 遗迹扫描 │ │
│              │                                               │  │ 报告     │ │
│              │                                               │  │          │ │
│              │                                               │  │ 💀 8危   │ │
│              │                                               │  │ ⚠️15警   │ │
│              │                                               │  │ 🔍13信   │ │
│              │                                               │  │          │ │
│              │                                               │  │ [筛选]   │ │
│              │                                               │  │ [搜索]   │ │
│              │                                               │  └──────────┘ │
│   280px      │                    flex 1                    │    400px      │
├──────────────┴───────────────────────────────────────────────┴────────────────┤
│  [AI重构建议]  [导出报告]  [文档]                                            │
└────────────────────────────────────────────────────────────────────────────────┘
                              最小宽度: 1200px
```

### 5.2 布局尺寸明细

| 区域 | 宽度 | 高度 | 定位 |
|------|------|------|------|
| 顶部导航 | 100% | 60px | fixed |
| 左侧面板 | 280px | 剩余高度 | flex-shrink: 0 |
| 中间主视觉 | 自适应 | 剩余高度 | flex-grow: 1 |
| 右侧面板 | 400px | 剩余高度 | flex-shrink: 0 |
| 底部状态栏 | 100% | 40px | fixed |

### 5.3 模态框布局

```
                              居中显示
                    ┌─────────────────────────┐
                    │  AI 重构建议弹窗         │  宽度: 800px
                    │  高度: 600px            │
                    │  圆角: 12px             │
                    │  背景: rgba(10,10,15,0.95)│
                    └─────────────────────────┘
```

---

## 6. 交互流程设计

### 6.1 主流程

```
用户打开页面
    ↓
加载模拟数据（项目信息、地层、模块、依赖、遗迹）
    ↓
渲染左侧项目面板
    ↓
渲染中间地层图（D3.js）
    ↓
渲染右侧图谱（D3.js力导向图）
    ↓
渲染遗迹列表
    ↓
用户交互：
    ├─ 点击地层 → 显示该季度详情
    ├─ 点击图谱节点 → 显示模块详情
    ├─ 点击遗迹 → 打开AI重构建议弹窗
    └─ 点击"开始扫描" → 模拟扫描动画
```

### 6.2 AI 重构建议弹窗流程

```
用户点击遗迹项
    ↓
打开模态框，显示遗迹基本信息
    ↓
渲染原代码（BEFORE）
    ↓
渲染重构代码（AFTER）
    ↓
显示风险评估（代码风险/测试覆盖/迁移复杂度）
    ↓
显示迁移步骤列表
    ↓
用户操作：
    ├─ [复制代码] → 复制重构代码到剪贴板
    ├─ [导出报告] → 下载PDF报告
    └─ [关闭] → 关闭弹窗
```

---

## 7. 开发优先级

| 优先级 | 模块 | 说明 |
|--------|------|------|
| P0 | 模拟数据 | 完整的36个遗迹、12个模块、28条依赖、12个地层 |
| P0 | 布局框架 | 三栏布局、响应式、模态框 |
| P1 | 地层图 | D3.js横向时间轴，健康度可视化 |
| P1 | 关系图谱 | D3.js力导向图，模块依赖展示 |
| P2 | 遗迹列表 | 36个遗迹展示、筛选、搜索 |
| P2 | 重构建议弹窗 | 代码对比、风险评估、迁移步骤 |
| P3 | 动效增强 | 矩阵雨背景、扫描线、终端效果 |
| P3 | 细节优化 | 悬停效果、动画过渡、响应式适配 |