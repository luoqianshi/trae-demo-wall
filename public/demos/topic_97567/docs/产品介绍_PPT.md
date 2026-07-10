---
marp: true
theme: default
backgroundColor: #FFF8F0
class: invert
header: '雪球日记 - 产品介绍'
footer: '© 2026 雪球日记 | 让成长可见'
paginate: true
---

# 雪球日记

## 让微小的成功被看见
### - 用 AI 陪伴与可视化成长

![bg right:40% 80%](data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iODAiIGZpbGw9IiNGRkI2QzEiLz4KPHBhdGggZD0iTTgwIDE1MEE3MCA3MCAwIDEgMSAyMjAgMTUwQTcwIDcwIDAgMCAxIDgwIDE1MCIgc3Ryb2tlPSIjODdDRUVCIHN0cm9rZS13aWR0aD0iMTAiLz4KPC9zdmc+)

---

# 目录

1. 产品概述与价值主张
2. 产品功能总览
3. 核心功能详解
4. 技术架构设计
5. 技术栈与实现
6. 产品特点与亮点
7. 未来规划

---

# 产品首页

![homepage](screenshots/homepage.png)

> 雪球日记首页 - 温暖的视觉设计，清晰的功能入口

---

# 一、产品概述与价值主张

## 问题痛点

| 问题 | 传统方式的困扰 |
|------|----------------|
| **小成就容易被忽略** | 每天都在努力，但进步不易察觉 |
| **缺乏持续动力** | 缺乏正向反馈机制 |
| **拖延症难克服** | 目标大到无从下手 |
| **习惯养成困难** | 缺少持续的记录与反馈 |
| **成长轨迹模糊** | 不记得自己的努力与成果 |

---

## 雪球日记 - 解决之道

```mermaid
flowchart LR
    A[小成功<br/>记录] --> B[雪球变大<br/>可视化]
    B --> C[获得成就<br/>激励]
    C --> D[建立正向<br/>反馈循环]
    D --> A
    style A fill:#FFB6C1
    style B fill:#87CEEB
    style C fill:#98D89E
    style D fill:#F7DC6F
```

### 核心理念
> **每天记录一个小成功，雪球会越来越大！**

---

# 二、产品功能总览

## 功能全景图

| 模块 | 核心功能 |
|------|----------|
| **📝 记录系统** | 3秒快速记录、AI自动标签、情感分析 |
| **❄️ 雪球成长** | 分数计算、阶段进化、庆祝动画 |
| **🎯 任务管理** | 四象限优先级、长任务分解、习惯打卡 |
| **🏆 成就体系** | 37个成就、7大分类、里程碑激励 |
| **🤖 AI陪伴** | 智能反馈、每日提问、拖延急救 |
| **📊 成长分析** | 成长时间线、数据统计、AI报告 |

---

# 任务管理页面

![tasks](screenshots/tasks.png)

> 任务管理 - 四象限优先级、长任务分解、习惯追踪

---

# 记录系统页面

![records](screenshots/records.png)

> 记录系统 - 快速记录，成长动力

---

# 三、核心功能详解

## 1. 雪球成长系统

```mermaid
stateDiagram-v2
    [*] --> 雪粒
    雪粒 --> 小雪球: 记录达到50分
    小雪球 --> 雪球: 记录达到200分
    
    雪粒: 雪粒（0-49分）
    小雪球: 小雪球（50-199分）
    雪球: 雪球（200+分）
```

| 动作 | 分数奖励 |
|------|----------|
| 创建记录 | +5 分 |
| 完成普通任务 | +5 分 |
| 完成快速任务 | +2 分 |
| 习惯打卡 | +5 分 |
| 完成长任务 | +10 分 |

---

## 2. 任务管理

### 四象限优先级

```mermaid
flowchart TD
    classDef q1 fill:#FF6B6B
    classDef q2 fill:#4ECDC4
    classDef q3 fill:#FFE66D
    classDef q4 fill:#95A5A6
    
    subgraph 四象限任务管理
        Q1[Q1<br/>紧急且重要]
        Q2[Q2<br/>重要不紧急]
        Q3[Q3<br/>紧急不重要]
        Q4[Q4<br/>不紧急不重要]
    end
    
    class Q1 q1
    class Q2 q2
    class Q3 q3
    class Q4 q4
```

**任务类型：**
- 快速任务：简单快捷
- 普通任务：标准任务
- 长任务：目标级任务，可分解
- 习惯：每日/每周重复

---

## 3. 拖延急救

### 躺平 → 行动 的魔法分解术

```mermaid
flowchart LR
    A[当前状态] --> B[选择目标场景]
    B --> C[AI生成小步骤]
    C --> D[一步步完成]
    D --> E[最终达成]
    
    style A fill:#FFB6C1
    style C fill:#87CEEB
    style E fill:#98D89E
```

### 支持的场景
- 躺平刷手机 → 去图书馆学习
- 躺着不想动 → 去运动
- 发呆 → 去做饭
- 短视频停不下 → 开始工作
- 游戏入迷 → 去睡觉

---

## 4. 成就体系

### 个人成就中心页面

![profile](screenshots/profile.png)

> 成就体系 - 37个成就，装饰奖励系统

### 37个成就，7大分类

```mermaid
pie title 成就分类
    "记录类" : 8
    "连续类" : 8
    "挑战类" : 5
    "任务类" : 2
    "互动类" : 3
    "隐藏类" : 3
    "大师类" : 1
```

| 级别 | 说明 |
|------|------|
| **micro** | 入门级，轻松获得 |
| **minor** | 普通级，稍加努力 |
| **growth** | 成长级，持续坚持 |
| **major** | 大师级，显著成就 |
| **transformation** | 蜕变级，终极目标 |

---

# 四、技术架构设计

## 系统整体架构

```mermaid
flowchart TB
    subgraph "前端应用层"
        Pages[页面<br/>Pages]
        Components[组件<br/>Components]
        Contexts[状态管理<br/>Contexts]
        Hooks[自定义Hooks<br/>Hooks]
    end
    
    subgraph "API网关层"
        API[API Routes<br/>Next.js App Router]
    end
    
    subgraph "业务逻辑层"
        DB[本地数据库<br/>local-db.ts]
        Score[雪球分数<br/>snowball-score.ts]
        Achievement[成就引擎<br/>achievement-engine.ts]
        Quadrant[四象限计算<br/>quadrant-utils.ts]
    end
    
    subgraph "数据存储层"
        File[本地JSON文件<br/>local-db.json]
    end
    
    Pages --> Components
    Components --> Contexts
    Contexts --> Hooks
    Hooks --> API
    API --> DB
    DB --> Score
    DB --> Achievement
    DB --> Quadrant
    DB --> File
    
    style Pages fill:#FFB6C1
    style Components fill:#FFB6C1
    style API fill:#87CEEB
    style DB fill:#98D89E
    style File fill:#F7DC6F
```

---

## 技术架构详解

### 分层设计

| 层级 | 职责 | 关键文件 |
|------|------|----------|
| **页面层** | 路由、页面布局 | [src/app/page.tsx](file:///d:/code/python/test/snowball-diary-new/src/app/page.tsx) |
| **组件层** | 可复用UI组件 | [src/app/components/](file:///d:/code/python/test/snowball-diary-new/src/app/components/) |
| **状态层** | React Context状态管理 | [src/contexts/](file:///d:/code/python/test/snowball-diary-new/src/contexts/) |
| **业务逻辑层** | 核心业务规则 | [src/lib/](file:///d:/code/python/test/snowball-diary-new/src/lib/) |
| **数据层** | 本地JSON持久化 | [data/local-db.json](file:///d:/code/python/test/snowball-diary-new/data/local-db.json) |

---

## 核心数据流

```mermaid
sequenceDiagram
    participant User as 用户
    participant Page as 页面组件
    participant Hook as 自定义Hook
    participant API as API Routes
    participant DB as local-db.ts
    participant File as local-db.json
    
    User->>Page: 点击操作
    Page->>Hook: 调用函数
    Hook->>API: 发送请求
    API->>DB: 调用数据操作
    DB->>File: 读写JSON文件
    File-->>DB: 返回数据
    DB-->>API: 返回结果
    API-->>Hook: 响应数据
    Hook->>Page: 更新状态
    Page->>User: 界面更新
```

---

## 核心模块设计

### 数据持久化层 - local-db.ts

```mermaid
flowchart LR
    subgraph "数据模型"
        Users[用户<br/>users]
        Tasks[任务<br/>tasks]
        Records[记录<br/>records]
        Achievements[用户成就<br/>userAchievements]
        Challenges[挑战<br/>challenges]
        UserChallenges[用户挑战<br/>userChallenges]
        Growth[成长数据<br/>growthData]
    end
    
    subgraph "操作函数"
        GetUser[getUser]
        CreateTask[createTask]
        UpdateTask[updateTask]
        CreateRecord[createRecord]
        CheckAchievement[checkAndUnlockAchievements]
        GetStats[getUserStats]
    end
    
    操作函数 --> 数据模型
    数据模型 --> JSON[JSON文件<br/>local-db.json]
    
    style JSON fill:#F7DC6F
```

---

# 五、技术栈与实现

## 技术栈总览

| 类别 | 技术 | 版本 |
|------|------|------|
| **前端框架** | Next.js | 16.2.4 |
| **UI库** | React | 19.2.4 |
| **样式** | Tailwind CSS | 4 |
| **动画** | Framer Motion | 12.38.0 |
| **图表** | Recharts | 3.8.1 |
| **语言** | TypeScript | 5+ |
| **测试** | Vitest | 4.1.5 |
| **数据存储** | 本地JSON文件 | - |
| **AI服务** | 智谱AI GLM-4-Flash | - |

---

## 核心技术选型原因

| 技术 | 选择理由 |
|------|----------|
| **Next.js 16** | App Router、API Routes一体化、SSR能力 |
| **Tailwind CSS** | 原子化CSS、快速开发、一致性设计 |
| **Framer Motion** | 流畅动画、简单API、雪球成长特效 |
| **本地JSON存储** | 零配置、无需服务器、开箱即用 |
| **TypeScript** | 类型安全、良好开发体验、代码可维护性 |

---

# 六、产品特点与亮点

## 七大核心特点

| 特点 | 说明 |
|------|------|
| ✨ **极简设计** | 界面清爽、交互直观、3秒快速记录 |
| ❄️ **雪球成长** | 从雪粒到雪球的可视化成长过程 |
| 🎨 **精美动画** | Framer Motion驱动的流畅交互体验 |
| 🤖 **AI陪伴** | 智能反馈、每日提问、拖延急救 |
| 🎯 **任务分解** | 四象限优先级、长任务拆解、习惯追踪 |
| 🏆 **成就激励** | 37个成就、正向反馈、持续激励 |
| 📊 **数据洞察** | 成长时间线、统计分析、AI报告 |

---

## 用户价值实现路径

```mermaid
journey
    title 用户的雪球成长之旅
    section 初识
        下载体验: 5: 用户
        新手引导: 4: 雪球AI
    section 开始记录
        记录第一个小成功: 5: 用户
        雪球开始变大: 6: 系统
    section 持续使用
        获得第一个成就: 7: 系统
        建立记录习惯: 8: 用户
    section 达成蜕变
        解锁雪球大师: 9: 用户
        回顾成长历程: 10: 用户
```

---

# 七、未来规划

## 产品迭代路线图

| 阶段 | 时间 | 核心功能 |
|------|------|----------|
| **V1.0** | ✅ 已完成 | 基础记录、任务管理、雪球成长 |
| **V2.0** | ✅ 已完成 | 成就系统、AI反馈、拖延急救 |
| **V3.0** | ✅ 已完成 | 本地持久化、挑战系统、成长时间线 |
| **V4.0** | 🛠️ 规划中 | 云端同步、多设备支持、社区功能 |
| **V5.0** | 📋 规划中 | 移动端APP、数据导出、高级分析 |

---

# Q&A

## 常见问题

| 问题 | 回答 |
|------|------|
| 数据存储在哪里？ | 本地 `data/local-db.json` 文件 |
| 需要联网使用吗？ | 核心功能离线可用，AI功能需联网 |
| 可以重置数据吗？ | 删除 `data/local-db.json` 即可 |
| 支持多用户吗？ | 当前本地版单用户，云端版支持多用户 |

---

# 谢谢观看

## 让每一天的努力都被看见

### 雪球日记 - 与你的雪球一起成长

> **项目地址**  
> GitHub: [查看代码](file:///d:/code/python/test/snowball-diary-new/)  
> 文档: [docs/](file:///d:/code/python/test/snowball-diary-new/docs/)  
> Code Wiki: [docs/code-wiki.md](file:///d:/code/python/test/snowball-diary-new/docs/code-wiki.md)
