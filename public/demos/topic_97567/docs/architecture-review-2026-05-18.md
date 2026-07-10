# 雪球日记架构审查档案

> 审查日期：2026-05-18
> 审查范围：全项目架构（API层 / 前端层 / 数据层 / 认证层 / 业务逻辑层）
> 审查方法：基于 improve-codebase-architecture 技能的深层化分析框架

---

## 一、项目概况

| 维度 | 现状 |
|------|------|
| 技术栈 | Next.js 16.2.4 + React 19 + Tailwind CSS 4 + Framer Motion |
| 数据存储 | `local-db.ts`（JSON文件）为主，Supabase 仅文档描述未实际接入 |
| 认证 | 伪认证（硬编码 local-token-1），无真实 JWT 验证 |
| 测试 | Vitest，覆盖部分 lib 和 API 路由，Hooks/组件无测试 |
| 代码规模 | ~40 组件 / ~12 Hooks / ~20 API 路由 / 3 Context |

---

## 二、架构问题清单

### 问题 1：数据层双轨——文档描述与代码实现严重脱节

**涉及文件**：`src/lib/local-db.ts`、`docs/tech-stack.md`、`docs/data-model.md`

**问题**：
- 文档声称 Supabase + PostgreSQL 为主数据源，但所有 API 路由直接 `import * as db from '@/lib/local-db'`
- `local-db.ts` 使用 `fs.writeFileSync` 将全量数据写入 `data/local-db.json`，这是一个内存中的单文件数据库
- 没有数据访问层（Repository）抽象，API 路由与存储实现硬耦合
- 无 Supabase 客户端初始化代码被任何 API 路由引用

**影响**：
- 无法切换到真实数据库而不重写所有 API 路由
- JSON 文件在并发写入时存在数据丢失风险
- 生产环境完全不可用

**建议**：
- 引入 Repository 接口层，将 `local-db.ts` 作为 LocalRepository 实现
- 创建 SupabaseRepository 实现，通过环境变量切换
- API 路由只依赖 Repository 接口，不依赖具体实现

---

### 问题 2：认证系统形同虚设

**涉及文件**：`src/lib/api-auth.ts`、`src/hooks/useAuth.ts`

**问题**：
- `authenticateRequest` 只做 token 字符串提取，不验证任何签名或有效期
- `extractUserIdFromToken` 对 `local-token-` 前缀的 token 直接返回后缀作为 userId
- `useAuth` 硬编码 `LOCAL_TOKEN = 'local-token-1'`，所有用户共享同一身份
- 无注册/登录的真实验证逻辑，API 路由的 `userId` 完全可伪造

**影响**：
- 任何请求只要携带 `Authorization: Bearer local-token-1` 即可通过认证
- 多用户场景下数据隔离完全失效
- 安全等级为零

**建议**：
- 接入 Supabase Auth 或实现真实 JWT 签发/验证
- 在 `authenticateRequest` 中验证 token 签名和过期时间
- `useAuth` 应通过 Supabase SDK 管理登录状态

---

### 问题 3：雪球阶段配置不一致——3阶段 vs 5阶段

**涉及文件**：`src/lib/snowball-score.ts`、`AGENTS.md`

**问题**：
- `snowball-score.ts` 只定义了 3 个阶段：`snowflake`(0-49) / `small_ball`(50-199) / `ball`(200+)
- `AGENTS.md` 和 UI 组件描述了 5 个阶段：雪粒/小雪球/雪球/大雪球/雪人
- `SnowballAnimation.tsx` 和 `SnowballCharacter.tsx` 按 5 阶段渲染，但 `SnowballContext` 只能产出 3 阶段
- 阶段阈值不匹配导致高阶段用户永远无法触发对应的视觉效果

**影响**：
- 用户达到 500 分后仍显示"雪球"阶段，无法进化到"大雪球"/"雪人"
- 5 阶段角色设计投入被浪费

**建议**：
- 统一 `SNOWBALL_STAGES` 为 5 阶段配置，与 UI 保持一致
- 或将 UI 组件降级为 3 阶段，与数据层保持一致

---

### 问题 4：Hooks 职责膨胀——God Object 反模式

**涉及文件**：`src/hooks/useRecords.ts`（735行）、`src/hooks/useTasks.ts`（538行）

**问题**：

**useRecords** 同时管理：
- 记录 CRUD（records, createRecord, deleteRecord, updateRecord）
- AI 反馈获取（fetchFeedback, feedbackMap, loadingFeedbackMap）
- 追问对话系统（followUpMap, answerFollowUp, continueChat, conversationsMap）
- 庆祝效果系统（celebrationType, showCelebration, streakDays, feedbackMessage）
- 连续天数计算（calculateStreakDays）
- 成就检测（checkAchievements）

**useTasks** 同时管理：
- 任务 CRUD + 乐观更新
- 目标数据（goals）
- 统计数据（stats）
- 四象限数据（fetchQuadrantData）
- 阈值配置（fetchThresholds, updateThresholds）
- 子任务管理（fetchSubtasks, createSubtask）
- 习惯打卡（checkinHabit）
- 成就检测（checkAchievements）

**影响**：
- 任何子功能变更都需要修改巨大的 Hook 文件
- 状态更新互相干扰（如 AGENTS.md 中记录的闭包陷阱和级联刷新 Bug）
- 无法对子功能独立测试
- 新开发者难以理解单个功能的完整逻辑

**建议**：
- 将 `useRecords` 拆分为：`useRecordCRUD`、`useRecordFeedback`、`useRecordCelebration`、`useConversation`
- 将 `useTasks` 拆分为：`useTaskCRUD`、`useTaskStats`、`useQuadrant`、`useSubtasks`、`useHabitCheckin`
- 通过组合模式在页面级组装所需功能

---

### 问题 5：类型安全全面缺失——`any` 泛滥

**涉及文件**：`src/lib/local-db.ts`、`src/hooks/useRecords.ts`

**问题**：
- `local-db.ts` 中 `LocalData` 接口的 11 个集合字段使用了 `any[]`
- 所有 CRUD 函数的参数和返回值类型为 `any`
- `useRecords` 中 `records` 状态类型为 `any[]`，`goals` 状态类型为 `any[]`
- API 路由中 `task` 对象经过 `enrichTaskWithUrgency` 后类型为 `any`
- 数据从数据库到前端全链路无类型约束

**影响**：
- 重构时无法通过编译器发现断裂
- IDE 无法提供有效自动补全
- 运行时类型错误频发（如 AGENTS.md 记录的 `priority` 为 `undefined` 导致 TypeError）

**建议**：
- 为 `local-db.ts` 中每个集合定义具体类型接口
- API 路由的请求/响应使用 Zod 或 io-ts 做运行时验证
- Hooks 的状态使用具体类型替代 `any`

---

### 问题 6：成就系统定义重复——两套规则需手动同步

**涉及文件**：`src/lib/data-models.ts`、`src/lib/achievement-engine.ts`

**问题**：
- `data-models.ts` 中 `achievementDefinitions` 数组定义了 `cond_rule` 字符串（如 `'records_count >= 1'`）
- `achievement-engine.ts` 中 `ACHIEVEMENT_CONDITIONS` 对象定义了实际的条件评估函数
- 两者必须手动保持 ID 一致，`cond_rule` 字符串仅作文档用途，不被任何代码执行
- 新增成就时需要同时修改两个文件，容易遗漏

**影响**：
- `cond_rule` 与实际条件可能不一致（如 `interact_100` 的 cond_rule 写的是 `>=520`，但 id 暗示是 100）
- 维护成本高，新增成就容易出错

**建议**：
- 删除 `cond_rule` 字符串，统一使用 `achievement-engine.ts` 中的条件函数作为唯一真相源
- 或将条件函数内联到 `achievementDefinitions` 中，消除跨文件同步需求

---

### 问题 7：API 路由设计不一致——PUT vs PATCH 语义混乱

**涉及文件**：`src/app/api/tasks/route.ts`（PUT）、`src/app/api/tasks/[id]/route.ts`（PATCH）

**问题**：
- `PUT /api/tasks` 做部分更新（只更新传入的字段），违反 PUT 的全量替换语义
- `PATCH /api/tasks/[id]` 也做部分更新，语义正确
- 两个端点都能更新任务状态，但副作用不同：
  - PUT 不处理父任务进度重算
  - PATCH 处理父任务进度重算
- 前端 `useTasks` 中 `updateTaskStatusOptimistic` 根据是否子任务选择不同端点，逻辑隐晦

**影响**：
- 通过 PUT 更新子任务状态时，父任务进度不会重算（AGENTS.md 记录的 Bug #20260509）
- 开发者难以判断应该调用哪个端点

**建议**：
- 废弃 `PUT /api/tasks`，统一使用 `PATCH /api/tasks/[id]`
- 或将 PUT 改为真正的全量替换语义

---

### 问题 8：Context Provider 层次浅薄——无共享状态优化

**涉及文件**：`src/contexts/RecordsContext.tsx`、`src/contexts/GoalsContext.tsx`、`src/app/layout.tsx`

**问题**：
- `RecordsContext` 和 `GoalsContext` 只是 Hook 的透传包装，没有任何状态共享逻辑
- 每个使用 `useRecordsContext()` 的组件都会触发同一个 `useRecords()` 实例，但 Context 并不缓存或去重
- `layout.tsx` 中 Provider 嵌套顺序是 `SnowballProvider > RecordsProvider > GoalsProvider`，但 `RecordsProvider` 内部的 `useRecords` 又调用了 `useAchievements`，形成隐式依赖链
- `GoalsProvider` 在全局挂载，但目标功能已被长任务替代，大部分页面不需要

**影响**：
- 不必要的全局数据加载（GoalsProvider 在所有页面都执行）
- Provider 依赖关系不透明，重构时容易遗漏

**建议**：
- 将 `RecordsProvider` 和 `GoalsProvider` 从全局 layout 移到实际使用的页面
- 或让 Context 真正管理共享状态，避免重复 API 调用
- 明确 Provider 依赖关系并文档化

---

### 问题 9：页面组件过度膨胀——缺少组件化拆分

**涉及文件**：`src/app/tasks/page.tsx`（1108行）、`src/app/page.tsx`

**问题**：
- `tasks/page.tsx` 包含 5 种任务卡片组件、4 种视图、3 个共享组件/hook、3 个常量配置，全部内联
- `page.tsx`（首页）导入 15 个 dynamic 组件，但自身仍包含大量业务逻辑
- 组件内直接调用 `useTasks`、`useSnowball`、`useRecordsContext` 等多个 Hook，状态管理逻辑与渲染逻辑混合

**影响**：
- 单文件变更频率高，Git 冲突概率大
- 无法复用子组件（如 TaskCard、KanbanCard 定义在页面文件内）
- 性能优化困难（无法对子组件独立 memo）

**建议**：
- 将 TaskCard/KanbanCard/QuadrantTaskCard 等提取为独立组件文件
- 将视图切换逻辑提取为自定义 Hook（如 `useTaskView`）
- 将常量配置（SCORE_TEXT_MAP、URGENCY_BADGE_CONFIG）移入 `lib/` 目录

---

### 问题 10：乐观更新模式不一致——闭包陷阱反复出现

**涉及文件**：`src/hooks/useTasks.ts`、`src/app/tasks/page.tsx`

**问题**：
- AGENTS.md 记录了至少 4 次由闭包陷阱导致的 Bug（标题消失、状态不同步、页面跳转、动画丢失）
- `updateTaskStatusOptimistic` 使用函数式 `setTasks(prev => ...)` 解决了部分问题，但 `taskTitle` 和 `goalId` 仍通过闭包外变量传递
- `handleStatusChange` 中使用 `{ ...originalTask }` 浅拷贝快照作为权宜之计
- 不同任务类型（普通/子任务/习惯/长任务）的完成流程分散在 `handleStatusChange` 的条件分支中

**影响**：
- 每次新增任务类型或修改完成流程都可能引入新的闭包 Bug
- 乐观更新的回滚逻辑不完整（只回滚 tasks 和 stats，不回滚 UI 动画状态）

**建议**：
- 引入状态机（如 XState 或 useReducer）管理任务完成流程
- 将乐观更新逻辑封装为独立 Hook（如 `useOptimisticTaskUpdate`），统一处理快照、回滚、副作用

---

### 问题 11：追问判断逻辑基于字符串匹配——脆弱且不可靠

**涉及文件**：`src/hooks/useRecords.ts`

**问题**：
- 判断 AI 回复是否为追问的逻辑是检查字符串是否包含 `？`、`?`、`说说`、`分享`、`能`、`可以`
- 这个判断在 `answerFollowUp` 和 `continueChat` 中重复出现
- 中文语境下这些字符极容易误判（如"你能做到的！"会被误判为追问）
- AI 模型更换后，回复风格变化会导致判断完全失效

**影响**：
- 用户可能收到错误的 UI 状态（普通反馈被显示为追问输入框）
- AI 服务切换时需要重新调校关键词列表

**建议**：
- 让 AI API 在响应中显式标记 `is_follow_up: boolean` 字段（`/api/ai/feedback` 已部分实现）
- 前端只依赖结构化字段判断，不依赖内容字符串匹配
- 将判断逻辑提取为独立函数，消除重复

---

### 问题 12：缺少统一的错误处理策略

**涉及文件**：所有 API 路由、所有 Hooks

**问题**：
- API 路由中有些错误返回 `{ error: message }`，有些返回 `{ success: false, error: message }`
- `createSuccessResponse` 包装了 `{ success: true, ...data }`，但部分路由直接返回 `NextResponse.json()`
- Hooks 中错误处理不一致：有的 `setError`，有的 `console.error`，有的静默忽略
- 无全局错误边界处理 API 错误（如 401 时自动跳转登录）

**影响**：
- 前端无法统一处理 API 错误
- 认证过期时用户看不到任何提示

**建议**：
- 统一 API 响应格式：`{ success: boolean, data?: T, error?: string }`
- 创建 `useApiCall` 封装统一的错误处理和认证检查
- 401 响应自动跳转登录页

---

## 三、架构问题严重度矩阵

| # | 问题 | 严重度 | 影响范围 | 修复难度 |
|---|------|--------|---------|---------|
| 1 | 数据层双轨 | 🔴 致命 | 全局 | 高 |
| 2 | 认证形同虚设 | 🔴 致命 | 全局 | 高 |
| 3 | 雪球阶段不一致 | 🟠 严重 | 雪球系统 | 低 |
| 4 | Hooks 职责膨胀 | 🟠 严重 | 前端全局 | 中 |
| 5 | 类型安全缺失 | 🟠 严重 | 全局 | 中 |
| 6 | 成就定义重复 | 🟡 中等 | 成就系统 | 低 |
| 7 | API 语义混乱 | 🟡 中等 | API 层 | 中 |
| 8 | Context 层次浅薄 | 🟡 中等 | 前端全局 | 低 |
| 9 | 页面组件膨胀 | 🟡 中等 | 任务页/首页 | 中 |
| 10 | 乐观更新不一致 | 🟠 严重 | 任务系统 | 中 |
| 11 | 追问判断脆弱 | 🟡 中等 | 记录系统 | 低 |
| 12 | 错误处理不统一 | 🟡 中等 | 全局 | 中 |

---

## 四、深层化机会（Deepening Opportunities）

### 机会 A：引入 Repository 接口层

**涉及模块**：`local-db.ts` + 所有 API 路由

**问题**：API 路由直接调用 `local-db.ts`，存储实现与业务逻辑硬耦合

**方案**：
```
定义 ITaskRepository / IRecordRepository / IGoalRepository 接口
  → LocalJsonRepository（当前 local-db.ts 的重构）
  → SupabaseRepository（未来 Supabase 接入）
API 路由通过依赖注入获取 Repository 实例
```

**收益**：
- 局部性（Locality）：存储逻辑变更只影响 Repository 实现
- 杠杆（Leverage）：API 路由代码不因存储切换而改动
- 可测试性：API 路由可用 Mock Repository 测试

---

### 机会 B：拆分 God Hook 为组合式 Hook

**涉及模块**：`useRecords.ts`、`useTasks.ts`

**问题**：单个 Hook 管理 6-8 个不相关职责

**方案**：
```
useRecords → useRecordCRUD + useRecordFeedback + useConversation + useCelebration
useTasks → useTaskCRUD + useTaskStats + useQuadrant + useSubtasks + useHabitCheckin
页面级通过 Hook 组合模式组装
```

**收益**：
- 局部性：每个子 Hook 独立变更，不影响其他功能
- 可测试性：子 Hook 可独立单元测试
- 杠杆：新页面只引入需要的子 Hook

---

### 机会 C：统一任务完成状态机

**涉及模块**：`useTasks.ts` 的 `updateTaskStatusOptimistic`、`page.tsx` 的 `handleStatusChange`

**问题**：5 种任务类型的完成流程分散在条件分支中，闭包陷阱反复出现

**方案**：
```
定义 TaskCompletionStateMachine：
  状态：idle → animating → completing → done
  事件：startCompletion(task) → playAnimation → callAPI → celebrate
  回滚：onAPIFailure → revertState
```

**收益**：
- 局部性：完成流程的所有状态转换集中在一处
- 可测试性：状态机可独立测试所有转换路径
- 杠杆：新增任务类型只需添加转换规则

---

## 五、优先修复建议

### P0（阻塞生产）
1. **数据层双轨** → 引入 Repository 接口，至少完成 Supabase 接入的架构准备
2. **认证形同虚设** → 接入 Supabase Auth 或实现真实 JWT

### P1（影响核心体验）
3. **雪球阶段不一致** → 统一为 5 阶段配置（1小时可修复）
4. **Hooks 职责膨胀** → 拆分 useRecords 和 useTasks
5. **类型安全缺失** → 为 local-db 和 Hooks 添加具体类型

### P2（提升可维护性）
6. **API 语义混乱** → 废弃 PUT /api/tasks，统一 PATCH
7. **页面组件膨胀** → 提取独立组件文件
8. **乐观更新不一致** → 引入状态机
9. **错误处理不统一** → 统一响应格式和全局错误处理

### P3（改善代码质量）
10. **成就定义重复** → 统一为单一真相源
11. **追问判断脆弱** → 改用结构化字段
12. **Context 层次浅薄** → 按需加载 Provider

---

## 六、架构演进路线图

```
Phase 1（1-2周）：基础加固
├── 统一雪球阶段配置（5阶段）
├── 消除 any 类型（local-db + Hooks）
├── 废弃 PUT /api/tasks，统一 PATCH
└── 追问判断改用结构化字段

Phase 2（2-4周）：数据层重构
├── 定义 Repository 接口
├── 重构 local-db.ts 为 LocalJsonRepository
├── 实现 SupabaseRepository
└── API 路由切换到 Repository 接口

Phase 3（3-5周）：认证与安全
├── 接入 Supabase Auth
├── 实现真实 JWT 验证
├── 统一错误处理和 401 跳转
└── API 限流和输入验证（Zod）

Phase 4（4-6周）：前端架构优化
├── 拆分 useRecords / useTasks
├── 提取页面组件为独立文件
├── 引入任务完成状态机
└── 按需加载 Context Provider
```

---

*本档案基于 2026-05-18 代码快照生成，随项目演进需定期更新。*
