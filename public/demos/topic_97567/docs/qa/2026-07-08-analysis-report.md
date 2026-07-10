# 雪球日记项目质量评估报告（第一轮）

> 评估日期：2026-07-08
> 评估方式：4 个并行搜索子代理深度扫描 + 综合分析
> 评估范围：API 路由 / 核心库 / React 组件 / 页面 / 配置 / 测试 / 数据模型

---

## 一、关键发现概览

| 维度 | 致命 | 高 | 中 | 低 | 小计 |
|------|------|------|------|------|------|
| API 认证与权限 | 3 | 1 | - | - | 4 |
| API 错误处理 | - | - | 3 | 2 | 5 |
| 数据持久化层 | 1 | 2 | 1 | - | 4 |
| API HTTP 语义 | - | - | 3 | - | 3 |
| API 输入验证 | - | 2 | - | 1 | 3 |
| API 重复代码 | - | 2 | 2 | 2 | 6 |
| 分数计算三件套 | - | 3 | 3 | 2 | 8 |
| 成就引擎 | - | - | 3 | 3 | 6 |
| 工具函数 | - | 1 | 4 | 5 | 10 |
| React Context | - | 2 | 5 | 3 | 10 |
| React Hooks | - | 5 | 13 | 7 | 25 |
| React 组件 | - | 2 | 9 | 8 | 19 |
| 错误边界 | - | 1 | 3 | 2 | 6 |
| 数据模型一致性 | 1 | 2 | 3 | 2 | 8 |
| 测试覆盖 | - | 5 | 3 | - | 8 |
| 配置文件 | - | 2 | 2 | 1 | 5 |
| **合计** | **5** | **30** | **57** | **38** | **130** |

---

## 二、致命问题（必须立即修复）

### D-1. 挑战类成就永远无法解锁

**位置**：`src/lib/local-db.ts:422-433`
**现象**：`getUserStats` 中使用 `challenge.difficulty === 'bronze'`（字符串比较）
**实际数据**：`data/local-db.json` 中 `difficulty` 字段为数字（1/2/3），并通过 `challenge_type: "bronze"/"silver"/"gold"` 字段表示类型
**影响**：`bronzeCompleted`/`silverCompleted`/`goldCompleted` 永远为 0，导致 `challenge_bronze_5`、`challenge_silver_1`、`challenge_gold_1`、`challenge_all_types` 等成就**永远无法解锁**

### D-2. 认证机制形同虚设

**位置**：`src/lib/api-auth.ts:27-28`
**现象**：`extractUserIdFromToken` 在 token 格式未知时 fallback 返回 `LOCAL_USER_ID = '1'`
**影响**：任何人传 `Authorization: Bearer anything` 都能通过认证成为用户 1

### D-3. 横向越权（多路由）

**位置**：
- `src/app/api/tasks/route.ts:196-203` DELETE 不校验 task owner
- `src/app/api/tasks/[id]/route.ts:92-110` DELETE 不校验 owner
- `src/app/api/records/route.ts:88-100,112-128` DELETE/PATCH 不校验 owner
- `src/app/api/records/follow-up/route.ts:12-32,44-96` 完全不使用 userId
- `src/app/api/reminders/route.ts:62-92,94-118` PUT/DELETE 不校验 owner
- `src/app/api/procrastination/route.ts:18-24,88-91` GET/PUT 不校验 owner

**影响**：任意用户可读取/修改/删除他人资源

### D-4. JSON 持久化层并发竞态

**位置**：`src/lib/local-db.ts:108-138`
**现象**：
- `cachedData` 进程内单例，无锁
- `saveData` 直接 `fs.writeFileSync` 覆盖整个文件（非原子）
- 文件损坏时静默返回默认数据，下一次保存会用空数据覆盖原文件

**影响**：高并发下数据丢失；写入崩溃会损坏数据库；文件损坏会清空用户数据

### D-5. Procrastination Steps 字段名不一致

**位置**：
- `data/local-db.json:201-225` 实际字段为 `{ task: string, completed: boolean }`
- `src/lib/data-models.ts:58,63,68` 与 `src/lib/local-db.ts:481` 类型定义为 `{ description: string, completed: boolean }`

**影响**：读取历史 session 时 `step.description` 为 undefined，UI 显示空白

---

## 三、高危问题（优先修复）

### H-1. 时区不一致导致"今日分数"错位

**位置**：`src/lib/score-engine.ts:23-29`（UTC 日期）vs `src/lib/snowball-score-calculator.ts`（本地日期）
**影响**：UTC+8 在本地 20:00 以后，"今日分数"会显示成明日的事件分数

### H-2. Quick 子任务双重计数

**位置**：`src/lib/snowball-score-calculator.ts:31-35`
**现象**：`quickCompleted` 统计所有 `type==='quick'` 的已完成任务；`subtaskCompleted` 统计所有带 `parent_id` 的已完成任务。一个 `type==='quick'` 且有 `parent_id` 的子任务会被同时计入
**影响**：`taskCompletedCount` 虚高

### H-3. Quadrant-utils 纯日期串时区 BUG

**位置**：`src/lib/quadrant-utils.ts:26-28,92-97`
**现象**：`new Date('2026-07-08')` 按 UTC 00:00 解析，而 `Date.now()` 是本地时间戳
**影响**：非 UTC 时区下 `getDaysUntilDue`/`calculateUrgency` 在跨日时段偏移一天

### H-4. Context Value 未 memoize（全局性能）

**位置**：
- `src/contexts/RecordsContext.tsx:19-24`
- `src/contexts/SnowballContext.tsx:158-172`

**影响**：Provider 每次渲染都返回新对象字面量，导致所有消费者全树 re-render

### H-5. useAchievements 状态碎片化

**位置**：`src/hooks/useAchievements.ts`（被 useTasks/useRecords/useChallenges/useProcrastination/page.tsx 各自独立调用）
**影响**：5+ 个独立 state 实例，`newlyUnlockedAchievements` 在不同组件中不一致

### H-6. ReturnWelcome 每次渲染重新随机选消息

**位置**：`src/app/components/ReturnWelcome.tsx:27`
**影响**：父组件每次 re-render 都会重新随机选择消息文字，用户可见的文字闪烁变化

### H-7. Navbar 使用 `<a href>` 而非 `<Link>`

**位置**：`src/app/components/Navbar.tsx:24,38,83`
**影响**：3 处使用原生 `<a>` 标签导航，导致整页刷新，丧失客户端路由优势

### H-8. 缺少 global-error.tsx

**位置**：`src/app/` 目录
**影响**：`layout.tsx` 中 SnowballProvider/RecordsProvider 抛错时无兜底，用户看到白屏

### H-9. useReminder 死代码

**位置**：`src/hooks/useReminder.ts`（全文件）
**现象**：经 Grep 确认，整个 src 目录下除自身定义外无任何引用，仅 `useReminders`（复数）被使用
**影响**：与 `useReminders` 大量重复代码，维护混乱

### H-10. createTask 强制 goal_id: null

**位置**：`src/lib/local-db.ts:189`
**现象**：`goal_id: null` 写在 `...taskData` 展开之后，强制覆盖 `taskData.goal_id`
**影响**：任务永远无法关联到 goal

### H-11. createUserChallenge 返回值缺 id

**位置**：`src/lib/local-db.ts:524-529`
**现象**：返回的是入参 `userChallenge`，不是 `data.userChallenges` 中带 `generateId()` 的对象
**影响**：调用方拿不到 id

### H-12. getTasks 的 goalId 参数无效

**位置**：`src/lib/local-db.ts:167-172`
**现象**：`goalId` 参数声明后从未使用
**影响**：调用方若指望按 goalId 过滤将拿到错误结果

### H-13. next.config.ts 允许任意 HTTPS 主机

**位置**：`next.config.ts:7-12`
**现象**：`images.remotePatterns: [{ protocol: "https", hostname: "**" }]`
**影响**：SSRF/安全风险

### H-14. tsconfig.json 关闭严格模式

**位置**：`tsconfig.json:11`
**现象**：`"strict": false`
**影响**：导致 `local-db.ts` 大量 `any[]`，掩盖类型错误

### H-15. tasks 页面无错误状态 UI

**位置**：`src/app/tasks/page.tsx` 全文
**影响**：`useTasks()` 抛错会白屏崩溃

### H-16. 多个核心模块无测试

**位置**：
- `src/app/api/ai/**` 7 个 AI 路由全部无测试
- `src/contexts/` 全局状态 Context 无测试
- `src/hooks/` 10 个 hook 无测试（仅 `useReturnDetection` 有）
- `src/app/components/` 40+ 组件无任何组件测试
- `src/app/api/achievements/route.ts` 关键成就 API 无测试

### H-17. LocalData 接口 12 个字段为 any[]

**位置**：`src/lib/local-db.ts:15-52`
**影响**：核心实体无类型定义，类型安全失效

---

## 四、中危问题（择机修复）

> 完整列表见各子代理审查报告。主要包括：
> - DELETE 方法使用 body 传 ID（不规范）
> - PUT/PATCH 语义混用
> - AI 路由 JSON.parse 无结构校验
> - 认证样板代码 20+ 处可抽象
> - ZhipuAI/OpenAI 调用样板 10+ 处可抽象
> - 成就定义与条件表漂移（master_all 缺条件）
> - CATEGORY_ORDER 缺三类（隐藏/急救/大师）
> - growthData 统计不回退（取消 completed 不递减）
> - recalcParentProgress 不清零
> - achievement-events.ts 的 handlers Set 死代码
> - createReminder 覆盖 is_active
> - setTimeout 未清理（多处）
> - AIFeedback isVisible 不随 feedback 重置
> - HomeSidebar 未使用 props（stageConfig/nextThreshold）
> - ChallengePanel props 过多（15 个）
> - 子路由无独立 error.tsx
> - 子页面无 SEO metadata
> - 多处 key={index} 反模式
> - 重复 Hook 命名（useReminder/useReminders）

---

## 五、低危问题（记录在案）

> 主要包括：
> - 残留 console.log 调试日志（多处）
> - 死代码（refreshCache、handlers Set 等）
> - 废弃 API（substr）
> - 冗余别名（getSnowballStage 等）
> - 文档型重复数据
> - next.config.ts 缺 compiler.removeConsole
> - eslint 无自定义规则
> - tsconfig 缺严格选项

---

## 六、修复优先级与策略

### 第一阶段：致命问题（必修）

1. **D-1**：修复 `getUserStats` 中 `difficulty` 字段比较，改为使用 `challenge_type` 字段
2. **D-2**：严格化 `extractUserIdFromToken`，未知 token 返回 null 而非 fallback
3. **D-3**：在所有 DELETE/PATCH/PUT/GET 单个资源的路由添加所有权校验
4. **D-4**：实现原子写入（write-temp-then-rename）+ 文件损坏保护
5. **D-5**：统一 procrastination steps 字段名为 `description`

### 第二阶段：高危问题（优先）

1. **H-1, H-3**：统一时区处理为本地日期
2. **H-2**：修复 quick 子任务双重计数
3. **H-4**：Context value memoize
4. **H-5**：useAchievements 重构为 Context（或最小化状态碎片化）
5. **H-6**：ReturnWelcome 使用 useState 初始化一次随机消息
6. **H-7**：Navbar 改用 `<Link>`
7. **H-8**：添加 global-error.tsx
8. **H-9**：删除 useReminder.ts 死代码
9. **H-10, H-11, H-12**：修复 local-db 三个 bug

### 第三阶段：中危问题（择机）

按业务影响排序，结合重构机会处理。

### 第四阶段：低危问题（清理）

清理调试日志、死代码、配置优化。

---

## 七、评估结论

项目整体架构合理，但存在 **5 个致命问题**（含 1 个成就永远无法解锁的业务 BUG、1 个认证漏洞、1 个横向越权、1 个并发竞态、1 个字段名不一致）和 **17 个高危问题**。

**关键风险**：
- 安全风险：认证漏洞 + 横向越权
- 数据风险：并发竞态 + 非原子写入 + 文件损坏清空
- 业务风险：挑战类成就永远无法解锁
- 性能风险：Context 未 memoize + 状态碎片化
- 用户体验风险：UI 闪烁 + 白屏风险

**建议立即进入修复阶段**。
