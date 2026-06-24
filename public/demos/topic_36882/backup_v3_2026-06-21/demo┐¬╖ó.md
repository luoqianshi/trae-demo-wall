# 遗韵工坊 - 非遗文创设计工具 Demo 开发规划

## 一、项目概述

### 1.1 产品定位
"遗韵工坊"是一款面向非遗文创设计师和爱好者的在线设计工具，帮助用户通过选择非遗项目、搭配文创类型、结合社会热点，快速生成具有文化内涵的文创产品方案。

### 1.2 核心功能
- **非遗知识库浏览**：展示各类非遗项目，支持分类筛选，支持用户自定义添加非遗项目（支持手动录入或联网查询）
- **文创类型选择**：提供多种文创产品载体选择，支持用户自定义添加文创类型
- **社会热点追踪**：展示当前与非遗相关的热门话题，支持用户自定义添加热点
- **智能设计工坊**：组合非遗元素与文创类型，生成产品方案；支持三种AI生成模式：
  - **内置AI模型**：直接调用系统内置AI能力生成方案
  - **自定义AI API**：用户配置自己的API Key进行生成
  - **Trae提示词导出**：生成优化后的提示词，用户可复制到TRAE中生成产品图、分析、文案
- **生产决策支持**：模拟社交媒体反响数据，辅助生产决策

### 1.3 技术目标
- 构建为**单文件可互动HTML**（或极少量文件）
- 零外部依赖（除Google Fonts外，字体可做本地降级）
- 纯前端实现，无需后端服务
- 支持主流浏览器（Chrome、Firefox、Safari、Edge）

---

## 二、页面架构

### 2.1 单页应用（SPA）结构

```
index.html          # 主入口文件（包含所有HTML、CSS、JS）
├── CSS（内嵌<style>）
├── HTML（6个Section）
└── JavaScript（内嵌<script>）
```

### 2.2 页面区块（Sections）

| 区块ID | 名称 | 功能描述 | 核心交互 |
|--------|------|----------|----------|
| `home` | 首页 | Hero展示、品牌介绍、快速入口 | CTA按钮跳转 |
| `heritage` | 非遗知识 | 非遗项目卡片网格、分类筛选 | 卡片选择、筛选切换 |
| `creative` | 文创类型 | 文创产品卡片网格、分类筛选 | 卡片选择、筛选切换 |
| `trends` | 社会热点 | 时间线展示热点事件 | 时间线浏览 |
| `designer` | 设计工坊 | 参数配置、产品生成 | 表单选择、生成方案 |
| `production` | 生产决策 | 数据看板、生产建议 | 数据展示 |

---

## 三、技术架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────┐
│           遗韵工坊 Demo                  │
│         （单HTML文件架构）                │
├─────────────────────────────────────────┤
│  表现层 (Presentation)                   │
│  ├── CSS 变量系统（主题色）               │
│  ├── 响应式布局（Grid + Flex）            │
│  ├── 动画系统（CSS Keyframes）            │
│  └── 装饰元素（SVG纹理、几何图形）         │
├─────────────────────────────────────────┤
│  交互层 (Interaction)                    │
│  ├── 路由系统（Section切换）              │
│  ├── 状态管理（全局变量）                 │
│  ├── 事件处理（点击、选择、筛选）          │
│  └── 模拟数据（产品生成逻辑）              │
├─────────────────────────────────────────┤
│  数据层 (Data)                           │
│  ├── 非遗项目数据（硬编码）               │
│  ├── 文创类型数据（硬编码）               │
│  ├── 社会热点数据（硬编码）               │
│  ├── 产品文案模板（硬编码）               │
│  └── 生产决策数据（硬编码）               │
└─────────────────────────────────────────┘
```

### 3.2 核心模块设计

#### 3.2.1 路由与导航模块
```javascript
// 模块：Router
// 职责：管理页面区块切换

function navigateTo(sectionId) {
    // 1. 隐藏所有 section
    // 2. 显示目标 section
    // 3. 更新导航栏激活状态
    // 4. 滚动到顶部
}
```

#### 3.2.2 状态管理模块
```javascript
// 模块：StateManager
// 职责：管理用户选择状态

const appState = {
    selectedHeritage: '',    // 选中的非遗项目
    selectedCreative: '',    // 选中的文创类型
    selectedTrend: '',       // 选中的社会热点
    selectedStyle: '',       // 选中的设计风格
    selectedAudience: '',    // 选中的目标人群
    generatedProducts: [],   // 已生成的产品方案
    aiConfig: {              // AI API配置
        enabled: false,
        provider: '',        // openai | claude | custom
        apiKey: '',
        apiUrl: '',
        model: ''
    }
};
```

#### 3.2.3 筛选器模块
```javascript
// 模块：Filter
// 职责：处理卡片网格的筛选逻辑

function filterCards(gridId, category) {
    // 1. 切换筛选按钮激活状态
    // 2. 根据 data-category 显示/隐藏卡片
}
```

#### 3.2.4 产品生成器模块
```javascript
// 模块：ProductGenerator
// 职责：根据用户选择生成产品方案

function generateProduct() {
    // 1. 验证必填参数
    // 2. 显示加载动画
    // 3. 检查是否启用AI
    //    - 若启用AI：调用AI API进行分析和文案生成
    //    - 若未启用：使用本地模板替换生成
    // 4. 渲染产品展示区域
}
```

#### 3.2.5 数据模板模块
```javascript
// 模块：DataTemplates
// 职责：提供产品生成的文案模板

const productNameTemplates = {
    '笔记本': '{heritage}纹样手账本',
    '丝巾': '{heritage}艺术丝巾',
    // ...
};

const copyTextTemplates = {
    '苏绣': '一针一线，绣出千年风华...',
    '景泰蓝': '铜胎掐丝，珐琅点蓝...',
    // ...
};
```

#### 3.2.6 自定义数据管理模块
```javascript
// 模块：CustomDataManager
// 职责：管理用户自定义添加的非遗、文创、热点数据

const customData = {
    heritages: [],    // 用户自定义非遗项目
    creatives: [],    // 用户自定义文创类型
    trends: []        // 用户自定义社会热点
};

function addCustomHeritage(data) {
    // 1. 打开添加弹窗（表单：名称、分类、描述、地点、年份）
    // 2. 支持"联网查询"按钮，自动填充信息
    // 3. 保存到 customData.heritages
    // 4. 重新渲染卡片网格
    // 5. 同步更新设计工坊下拉选项
}

function addCustomCreative(data) {
    // 1. 打开添加弹窗（表单：名称、分类、描述、成本、热度）
    // 2. 保存到 customData.creatives
    // 3. 重新渲染卡片网格
    // 4. 同步更新设计工坊下拉选项
}

function addCustomTrend(data) {
    // 1. 打开添加弹窗（表单：标题、日期、描述、标签）
    // 2. 保存到 customData.trends
    // 3. 重新渲染时间线
    // 4. 同步更新设计工坊下拉选项
}
```

#### 3.2.7 AI配置与调用模块
```javascript
// 模块：AIConfigManager
// 职责：管理AI API配置和调用

function showAIConfigModal() {
    // 1. 打开AI配置弹窗
    // 2. 配置项：
    //    - 启用AI开关
    //    - 选择提供商（OpenAI / Claude / 自定义）
    //    - API Key输入
    //    - API URL（自定义时显示）
    //    - 模型选择
    // 3. 保存配置到 localStorage
}

async function callAIAPI(prompt) {
    // 1. 读取AI配置
    // 2. 构建请求体
    // 3. 发送fetch请求
    // 4. 解析返回结果
    // 5. 错误处理（网络错误、API错误）
}

function buildAIPrompt(heritage, creative, trend, style, audience) {
    // 构建发送给AI的Prompt
    // 包含：非遗项目信息、文创类型、热点、风格、人群
    // 要求：生成产品名称、文案、设计说明
}
```

#### 3.2.8 内置AI模型模块
```javascript
// 模块：BuiltInAIModel
// 职责：提供无需配置的内置AI生成能力

const builtInAI = {
    enabled: true,
    // 使用系统内置的轻量级AI能力
    // 可以是本地规则引擎+模板库的增强版本
    // 或调用无需API Key的公共AI服务
};

function generateWithBuiltInAI(params) {
    // 1. 基于规则引擎分析参数组合
    // 2. 从扩展模板库中匹配最佳文案
    // 3. 进行简单的语义组合和优化
    // 4. 返回生成结果
    // 优势：无需配置，开箱即用
}
```

#### 3.2.9 Trae提示词生成模块
```javascript
// 模块：TraePromptGenerator
// 职责：生成优化后的提示词供用户复制到TRAE使用

function generateTraePrompt(heritage, creative, trend, style, audience) {
    // 1. 构建结构化提示词
    // 2. 包含：
    //    - 角色定义（非遗文创设计师）
    //    - 背景信息（非遗项目详情）
    //    - 任务要求（生成产品图+分析+文案）
    //    - 输出格式（JSON/Markdown）
    //    - 约束条件
    // 3. 返回完整提示词文本
}

function showTraePromptModal(prompt) {
    // 1. 打开提示词展示弹窗
    // 2. 显示格式化后的提示词
    // 3. 提供"一键复制"按钮
    // 4. 提供使用说明：
    //    - 打开TRAE（IDE/Work）
    //    - 新建对话
    //    - 粘贴提示词
    //    - 等待生成结果
}

// TRAE提示词模板示例
const traPromptTemplate = `
# 角色
你是一位资深的非遗文创产品设计师，擅长将传统文化元素与现代设计理念融合。

# 背景信息
- 非遗项目：{heritage}
- 文创类型：{creative}
- 社会热点：{trend}
- 设计风格：{style}
- 目标人群：{audience}

# 任务要求
请为我设计一款文创产品方案，包含以下内容：
1. **产品概念图描述**：详细描述产品的外观设计、色彩搭配、纹样运用
2. **产品分析**：市场定位、竞品分析、差异化卖点
3. **产品文案**：
   - 产品名称（3个备选）
   - 主标语（slogan）
   - 产品描述（200字左右）
   - 社交媒体推广文案（3条，适合小红书/微博/抖音）

# 输出格式
请以Markdown格式输出，结构清晰，便于阅读。
`;
```

---

## 四、数据结构设计

### 4.1 非遗项目数据

```javascript
const heritageData = [
    {
        id: 'suxiu',
        name: '苏绣',
        category: 'craft',        // craft | art | performance | custom
        categoryName: '传统技艺',
        description: '以精细、素雅、色彩和谐著称...',
        location: '江苏苏州',
        year: '2006年入选',
        icon: '🧵',
        copyText: '一针一线，绣出千年风华...',
        isCustom: false           // 区分系统数据与用户自定义数据
    },
    // ... 更多项目
];

// 用户自定义非遗项目数据结构
const customHeritageTemplate = {
    id: 'custom_xxx',         // 自定义ID前缀
    name: '',
    category: 'craft',
    categoryName: '',
    description: '',
    location: '',
    year: '',
    icon: '✨',
    copyText: '',
    isCustom: true
};
```

### 4.2 文创类型数据

```javascript
const creativeData = [
    {
        id: 'notebook',
        name: '手账笔记本',
        category: 'stationery',   // stationery | accessory | home | digital
        categoryName: '文具用品',
        description: '封面采用非遗纹样设计...',
        cost: '¥15-30',
        heat: '★★★★★',
        icon: '📓',
        nameTemplate: '{heritage}纹样手账本',
        isCustom: false
    },
    // ... 更多类型
];

// 用户自定义文创类型数据结构
const customCreativeTemplate = {
    id: 'custom_xxx',
    name: '',
    category: 'stationery',
    categoryName: '',
    description: '',
    cost: '',
    heat: '★★★★☆',
    icon: '🎁',
    nameTemplate: '{heritage}{creative}',
    isCustom: true
};
```

### 4.3 社会热点数据

```javascript
const trendData = [
    {
        id: 'new-chinese',
        title: '新中式美学崛起',
        date: '2024年6月',
        tag: '持续升温',
        description: '年轻人对传统文化的认同感增强...',
        tags: ['#新中式', '#国潮', '#文化自信'],
        copyText: '契合新中式美学潮流，传统与现代的完美融合',
        isCustom: false
    },
    // ... 更多热点
];

// 用户自定义热点数据结构
const customTrendTemplate = {
    id: 'custom_xxx',
    title: '',
    date: '',
    tag: '用户添加',
    description: '',
    tags: [],
    copyText: '',
    isCustom: true
};
```

### 4.4 AI配置数据

```javascript
// 生成模式枚举
const AIGenerationMode = {
    BUILT_IN: 'built_in',      // 内置AI模型
    CUSTOM_API: 'custom_api',  // 自定义AI API
    TRAE_PROMPT: 'trae_prompt' // Trae提示词导出
};

const aiConfigTemplate = {
    enabled: false,
    provider: 'openai',       // openai | claude | custom
    apiKey: '',
    apiUrl: '',               // 自定义API时使用
    model: 'gpt-3.5-turbo',   // 根据提供商变化
    temperature: 0.7,
    maxTokens: 2000
};

// 预设AI提供商配置
const aiProviders = {
    openai: {
        name: 'OpenAI',
        defaultUrl: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4o']
    },
    claude: {
        name: 'Claude',
        defaultUrl: 'https://api.anthropic.com/v1/messages',
        models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus']
    },
    custom: {
        name: '自定义',
        defaultUrl: '',
        models: []
    }
};

// TRAE提示词配置
const traePromptConfig = {
    enabled: true,
    template: `
# 角色
你是一位资深的非遗文创产品设计师，擅长将传统文化元素与现代设计理念融合。

# 背景信息
- 非遗项目：{heritage}
- 文创类型：{creative}
- 社会热点：{trend}
- 设计风格：{style}
- 目标人群：{audience}

# 任务要求
请为我设计一款文创产品方案，包含以下内容：
1. **产品概念图描述**：详细描述产品的外观设计、色彩搭配、纹样运用
2. **产品分析**：市场定位、竞品分析、差异化卖点
3. **产品文案**：
   - 产品名称（3个备选）
   - 主标语（slogan）
   - 产品描述（200字左右）
   - 社交媒体推广文案（3条，适合小红书/微博/抖音）

# 输出格式
请以Markdown格式输出，结构清晰，便于阅读。
`,
    usageGuide: `
使用步骤：
1. 复制上方提示词
2. 打开 TRAE（IDE 或 Work）
3. 新建对话，粘贴提示词
4. 等待 AI 生成完整方案
5. 如需产品图，可追加提示："请为我生成产品概念图"
`
};
```

---

## 五、交互流程设计

### 5.1 核心用户流程

```
[首页] 
   ↓ CTA点击
[非遗知识] → 选择非遗项目
   ↓
[文创类型] → 选择文创类型
   ↓
[社会热点] → （可选）了解热点
   ↓
[设计工坊] → 配置参数 → 生成方案
   ↓
[生产决策] → 查看数据建议
```

### 5.2 设计工坊交互流程

```
用户进入设计工坊
    ↓
├─→ 选择非遗项目（必填）
│       ↓
│   若系统没有 → 点击"添加非遗项目"
│       ↓
│   打开添加弹窗 → 手动填写 或 点击"联网查询"
│       ↓
│   保存后自动选中新添加的项目
│
├─→ 选择文创类型（必填）
│       ↓
│   若系统没有 → 点击"添加文创类型"
│       ↓
│   打开添加弹窗 → 手动填写信息
│       ↓
│   保存后自动选中新添加的类型
│
├─→ 选择社会热点（可选）
│       ↓
│   若系统没有 → 点击"添加社会热点"
│       ↓
│   打开添加弹窗 → 手动填写信息
│       ↓
│   保存后自动选中新添加的热点
│
├─→ 选择设计风格（可选）
├─→ 选择目标人群（可选）
│
↓
点击"生成产品方案"
    ↓
显示加载动画
    ↓
选择生成模式（弹窗或下拉选择）
    ↓
├─→ 模式一：内置AI模型（推荐新手）
│       ↓
│   无需配置，直接调用系统内置AI
│       ↓
│   展示AI生成的产品方案
│
├─→ 模式二：自定义AI API（适合有API Key的用户）
│       ↓
│   检查是否已配置AI API
│       ↓
│   ├─→ 已配置：调用AI API生成方案
│   └─→ 未配置：提示配置（打开AI配置弹窗）
│       ↓
│   展示AI生成的产品方案
│
└─→ 模式三：Trae提示词导出（适合TRAE用户）
        ↓
    生成优化后的提示词
        ↓
    打开提示词展示弹窗
        ↓
    用户可复制提示词到TRAE
        ↓
    在TRAE中生成产品图、分析、文案
    ↓
展示产品方案（名称+文案+设计说明）
    ↓
├─→ 发布到社交媒体 → 跳转生产决策
└─→ 保存方案 → 提示保存成功
```

### 5.3 状态同步机制

```
在"非遗知识"页面选择卡片
    ↓
更新 appState.selectedHeritage
    ↓
同步更新"设计工坊"下拉框值
    ↓
添加卡片选中样式（selected类）
```

---

## 六、UI/UX 设计规范

### 6.1 色彩系统

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--ink-black` | `#1a1a1a` | 主文字、标题 |
| `--paper-white` | `#f5f0e8` | 页面背景 |
| `--cinnabar` | `#c23a30` | 主品牌色、CTA按钮 |
| `--gold` | `#c9a96e` | 装饰元素、强调色 |
| `--jade` | `#2d6a4f` | 正向指标、成功状态 |
| `--stone` | `#8b7e66` | 次要文字、描述 |
| `--mist` | `#e8e0d4` | 边框、分隔线 |
| `--shadow` | `rgba(26,26,26,0.08)` | 阴影 |

### 6.2 字体规范

| 用途 | 字体 | 字重 |
|------|------|------|
| 标题/品牌 | Noto Serif SC | 600-900 |
| 正文/UI | Noto Sans SC | 300-700 |

### 6.3 间距系统

| 元素 | 间距 |
|------|------|
| Section padding | 60px |
| Card gap | 30px |
| Card padding | 28px |
| 组件间距 | 24px |
| 元素间距 | 12-16px |

### 6.4 响应式断点

| 断点 | 宽度 | 布局调整 |
|------|------|----------|
| Desktop | > 1024px | 完整布局 |
| Tablet | 768-1024px | 2列网格、单列设计器 |
| Mobile | < 768px | 单列、缩小字体 |

---

## 七、动画与过渡设计

### 7.1 页面切换动画
```css
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
/* 时长：0.6s，缓动：ease */
```

### 7.2 卡片悬停效果
```css
.card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(26, 26, 26, 0.12);
}
/* 时长：0.4s */
```

### 7.3 按钮交互效果
```css
.hero-cta:hover {
    background: #a52f26;
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(194, 58, 48, 0.3);
}
/* 时长：0.3s */
```

### 7.4 加载动画
```css
@keyframes spin {
    to { transform: rotate(360deg); }
}
/* 用于产品生成时的Loading指示器 */
```

---

## 八、开发实施计划

### 8.1 文件结构

```
非遗产品设计/
├── demo开发.md          # 本文档（开发规划）
├── index.html           # 主HTML文件（最终产物）
└── assets/              # （可选）静态资源
    └── fonts/           # 本地字体文件（如需离线使用）
```

### 8.2 开发阶段

#### Phase 1：基础框架搭建
- [ ] 创建HTML骨架结构
- [ ] 实现CSS变量系统和基础样式
- [ ] 实现导航栏和路由切换
- [ ] 实现6个Section的基础布局

#### Phase 2：静态内容填充
- [ ] 填充"非遗知识"页面（卡片网格+筛选+添加按钮）
- [ ] 填充"文创类型"页面（卡片网格+筛选+添加按钮）
- [ ] 填充"社会热点"页面（时间线+添加按钮）
- [ ] 填充"生产决策"页面（数据看板）

#### Phase 3：核心交互实现
- [ ] 实现卡片选择功能（非遗+文创）
- [ ] 实现设计工坊表单联动
- [ ] 实现产品生成逻辑（模板替换）
- [ ] 实现加载动画和结果展示

#### Phase 4：自定义数据功能
- [ ] 实现非遗项目添加弹窗（表单+联网查询）
- [ ] 实现文创类型添加弹窗（表单）
- [ ] 实现社会热点添加弹窗（表单）
- [ ] 实现数据持久化（localStorage）
- [ ] 实现自定义数据渲染与同步

#### Phase 5：AI配置与调用功能
- [ ] 实现AI配置弹窗（UI界面）
- [ ] 实现AI配置持久化（localStorage）
- [ ] 实现AI Prompt构建逻辑
- [ ] 实现AI API调用（fetch）
- [ ] 实现AI结果解析与展示
- [ ] 实现AI错误处理与降级

#### Phase 5.1：内置AI模型功能
- [ ] 实现内置AI规则引擎
- [ ] 实现扩展模板库
- [ ] 实现内置AI生成逻辑
- [ ] 实现内置AI结果展示

#### Phase 5.2：Trae提示词导出功能
- [ ] 实现Trae提示词生成器
- [ ] 实现提示词展示弹窗（含一键复制）
- [ ] 实现使用说明展示
- [ ] 实现提示词模板变量替换

#### Phase 6：完善与优化
- [ ] 添加页面加载动画
- [ ] 优化响应式布局
- [ ] 添加错误提示（表单验证）
- [ ] 浏览器兼容性测试

### 8.3 关键技术点

| 技术点 | 实现方案 | 优先级 |
|--------|----------|--------|
| 单文件打包 | HTML内嵌CSS+JS | P0 |
| 路由切换 | JS控制Section显示/隐藏 | P0 |
| 状态同步 | 全局变量+DOM同步 | P0 |
| 产品生成 | 模板字符串替换 / AI API调用 / Trae提示词 | P0 |
| 自定义数据 | 弹窗表单 + localStorage | P0 |
| AI配置 | 弹窗表单 + localStorage + fetch | P0 |
| 内置AI | 规则引擎 + 扩展模板库 | P0 |
| Trae提示词 | 模板替换 + 弹窗展示 + 剪贴板API | P0 |
| 联网查询 | WebSearch / WebFetch API | P1 |
| 筛选功能 | data-category属性过滤 | P1 |
| 响应式 | CSS Grid + Media Query | P1 |
| 动画效果 | CSS Keyframes + Transition | P2 |

---

## 九、打包与部署

### 9.1 打包目标
最终输出为**单个可互动的HTML文件**，用户可直接在浏览器中打开使用，无需任何服务器环境。

### 9.2 打包检查清单

- [ ] 所有CSS内嵌在`<style>`标签中
- [ ] 所有JavaScript内嵌在`<script>`标签中
- [ ] 无外部API依赖
- [ ] 图片使用SVG Data URI或Emoji替代
- [ ] 字体使用系统字体降级方案

### 9.3 降级方案

```css
/* 字体降级 */
font-family: 'Noto Serif SC', 'SimSun', 'STSong', serif;
font-family: 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif;
```

---

## 十、扩展性考虑

### 10.1 未来可扩展功能
1. **真实图片展示**：将Emoji占位符替换为实际产品图片
2. **数据持久化**：使用localStorage保存用户设计方案 ✅ 已实现
3. **AI文案生成**：接入大模型API生成更丰富的产品文案 ✅ 已实现
4. **联网查询功能**：自动查询非遗项目信息并填充表单
5. **3D预览**：使用Three.js实现产品3D展示
6. **用户系统**：添加登录/注册，保存设计历史
7. **方案分享**：支持导出方案为图片/PDF
8. **批量生成**：支持一次生成多个方案对比

### 10.2 代码可维护性
- 使用模块化函数组织JavaScript
- 数据与表现分离（数据对象+模板渲染）
- 统一的命名规范（驼峰命名）
- 关键逻辑添加注释

---

## 十一、附录

### 11.1 现有设计.html功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 导航栏切换 | ✅ 已实现 | 6个Section切换 |
| 非遗卡片展示 | ✅ 已实现 | 8个项目，4个分类 |
| 文创卡片展示 | ✅ 已实现 | 8个类型，4个分类 |
| 分类筛选 | ✅ 已实现 | 按钮切换筛选 |
| 卡片选择 | ✅ 已实现 | 点击选中，同步表单 |
| 社会热点时间线 | ✅ 已实现 | 5个热点事件 |
| 设计工坊表单 | ✅ 已实现 | 5个下拉选择 |
| 产品生成 | ✅ 已实现 | 模板替换生成方案 |
| 加载动画 | ✅ 已实现 | CSS旋转动画 |
| 生产决策看板 | ✅ 已实现 | 4个指标+建议 |
| 响应式布局 | ✅ 已实现 | 3个断点 |

### 11.2 新增功能清单（本次规划）

| 功能 | 状态 | 说明 |
|------|------|------|
| 自定义非遗项目 | 📝 规划中 | 弹窗添加+联网查询+localStorage持久化 |
| 自定义文创类型 | 📝 规划中 | 弹窗添加+localStorage持久化 |
| 自定义社会热点 | 📝 规划中 | 弹窗添加+localStorage持久化 |
| AI API配置 | 📝 规划中 | 弹窗配置+多提供商支持+localStorage持久化 |
| AI智能生成 | 📝 规划中 | AI分析调优+Prompt构建+结果解析 |
| 内置AI模型 | 📝 规划中 | 规则引擎+扩展模板库，无需配置开箱即用 |
| Trae提示词导出 | 📝 规划中 | 生成优化提示词，支持一键复制到TRAE |
| 数据持久化 | 📝 规划中 | localStorage保存自定义数据和AI配置 |

### 11.3 待优化项

1. **图片资源**：当前使用Emoji占位，建议替换为实际图片
2. **字体加载**：Google Fonts可能加载慢，建议添加降级
3. **数据量**：当前数据量较小，可扩展更多非遗项目和文创类型
4. **交互反馈**：部分操作缺少视觉反馈（如保存成功提示）
5. **SEO**：单页应用不利于SEO，如需优化可考虑预渲染
6. **AI安全性**：API Key存储在localStorage中，需提醒用户注意安全风险
7. **内置AI能力**：当前内置AI基于规则引擎，可升级为更智能的本地模型

---

*文档版本：v1.0*  
*更新日期：2026-06-18*  
*作者：AI助手*  
*用途：遗韵工坊Demo开发规划*
