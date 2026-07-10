# 雪球日记成就系统完善 — 项目复盘与工程经验沉淀

> 生成于 2026-05-17，基于三阶段完整开发过程的全面复盘。

---

## 第一部分：错误与问题案例清单

本次开发过程中，共识别出 **10 个** 具体问题，按严重程度分为三级：

### 🔴 严重 — 功能不可用

| # | 问题 | 类别 | 首次发现时机 |
|---|------|------|-------------|
| 1 | `goal_complete` 成就永远无法解锁 | 硬编码残留 | 代码审查阶段 |
| 2 | `hidden_midnight` / `hidden_perfect` 成就永远无法解锁 | 上下文丢失 | 代码审查阶段 |
| 3 | `goal_first` 成就用户未创建目标即自动解锁 | 种子数据污染 | 用户反馈 |

### 🟡 中等 — 架构缺陷

| # | 问题 | 类别 | 首次发现时机 |
|---|------|------|-------------|
| 4 | `checkAndUnlockAchievements` 中 36 行硬编码 `conditionMap` | 可维护性 | 结构分析阶段 |
| 5 | 互动/点击计数仅存 localStorage，换设备丢失 | 数据可靠性 | 架构评估阶段 |
| 6 | `/api/achievements/check` 端点与主路由逻辑重复 | 代码冗余 | 代码审查阶段 |

### 🟢 轻微 — 实现不完整

| # | 问题 | 类别 | 首次发现时机 |
|---|------|------|-------------|
| 7 | `getUserStats` 缺少 `goals_completed`、`challenges_completed` 等 5 个统计字段 | 数据缺失 | 代码审查阶段 |
| 8 | 奖励称号仅 4 个，设计文档规划了 16 个 | 需求未完成 | 对照设计文档 |
| 9 | 测试用例依赖默认数据中的预设目标 | 测试耦合 | 运行时错误 |
| 10 | `.next/types/validator.ts` 缓存了已删除的路由引用 | 构建缓存 | 类型检查 |

---

## 第二部分：根因分析与避免措施

### 问题 1：`goal_complete` 硬编码为 `false`

**现场还原：**

```typescript
// 原始代码 — local-db.ts checkAndUnlockAchievements
const conditionMap: Record<string, boolean> = {
  // ... 其他成就都有正确条件 ...
  goal_complete: false,  // ← 硬编码为 false
};
```

**根因链：**

`getUserStats()` 的返回值中不包含 `goals_completed` 字段 → 开发者无法正确编写 `goal_complete` 的条件表达式 → 临时硬编码 `false` 占位 → 忘记回填 → 成就永久不可用。

**根因类型：上下游接口不一致** — 数据生产者（`getUserStats`）未提供消费者（`checkAndUnlockAchievements`）所需的字段。

**避免措施：**

- **原则："接口契约先于实现"**。定义成就条件时，同步确认 `getUserStats` 是否已返回对应统计字段，若没有则先补字段再写条件。
- **实操**：在 `data-models.ts` 的成就定义中，`cond_rule` 字符串可解析为 `{field, operator, value}` 三元组，写一个脚本自动校验 `cond_rule` 中的 `field` 是否存在于 `getUserStats` 的返回类型中。
- **测试**：每个成就 ID 的正向条件测试必须在 CI 中运行，缺一不可。

---

### 问题 2：`hidden_midnight` / `hidden_perfect` 上下文丢失

**现场还原：**

```typescript
// API 路由 — achievements/route.ts
const fullStats = {
  ...stats,
  midnight_record: clientData.midnight_record || false,  // ← 始终为 false
  record_500_words: clientData.record_500_words || false, // ← 始终为 false
};

// 调用方 — useRecords.ts
await checkAchievements({ skipCelebration: true });  // ← 未传递上下文
```

**根因链：**

成就条件需要客户端上下文（当前时间判断深夜、内容字数判断） → 依赖注入链路未打通 → API 接收不到数据 → 使用 `|| false` 兜底 → 成就不可用。

**根因类型：依赖注入链路断裂** — 数据从产生点到消费点的传递路径不完整。

**避免措施：**

- **原则："需要客户端上下文的成就条件，必须在条件定义中显式标注"**。例如在 `AchievementDefinition` 中增加 `requiresClientContext: boolean` 字段，让开发者在定义成就时就能意识到这个成就需要客户端配合。
- **实操**：对标注了 `requiresClientContext` 的成就，lint 规则检查对应的 API 调用是否传递了必要参数。

---

### 问题 3：`goal_first` 种子数据污染

**现场还原：**

```typescript
// 原始默认数据 — local-db.ts getDefaultData()
goals: [
  {
    id: '1',
    user_id: '1',
    title: '学习编程',    // ← 预设了一个目标
    // ...
  },
],
tasks: [],    // ← 任务却是空的
records: [],  // ← 记录也是空的
```

**根因链：**

开发时为方便调试加入了预设数据 → 未将调试数据与正式默认数据分离 → 用户首次启动即拥有"假目标" → `goals_count >= 1` 触发成就。

**根因类型：调试数据泄漏到生产默认值** — 开发便利性与生产正确性之间缺乏隔离。

**避免措施：**

- **原则："默认数据必须是最小可用状态"**。`getDefaultData()` 中对每个数组字段问一个问题："空数组下系统能正常运行吗？"若不能，需要修复的是代码而非塞入默认数据。
- **实操**：若确实需要种子数据（如引导教程），通过独立的 `seedDevData()` 函数提供，且仅在 `NODE_ENV === 'development'` 时调用，绝不混入 `getDefaultData()`。
- **强制机制**：在测试中增加一条规则 —— `resetData()` 后调用 `getUserStats()`，所有计数必须为 0。

---

### 问题 4：硬编码 conditionMap

**现场还原：**

```typescript
// 原始代码 — 36 行 if-else 风格的布尔表达式
const conditionMap: Record<string, boolean> = {
  records_1: stats.records_count >= 1,
  records_3: stats.records_count >= 3,
  // ... 34 more lines ...
  first_procrastination: stats.procrastination_count >= 1,
};
```

**根因：** 新增成就需要修改同一函数的同一对象，违反开闭原则。条件逻辑不可复用，每个条件都是匿名表达式。

**避免措施：**

- **原则："条件与判定分离"**。条件定义（what）与判定逻辑（how）应解耦。见本项目的解决方案：[achievement-engine.ts](file:///d:/code/python/test/snowball-diary-new/src/lib/achievement-engine.ts)，通过工厂函数固化模式（`numericCondition` / `booleanCondition` / `compositeCondition`），新增成就仅需在注册表中加一行。
- **检验标准**：新增一个成就类型是否只需改一个文件？是否需要重复已有代码模式？两条都应是"否"。

---

### 问题 5：localStorage 单一存储

**根因：** 互动计数是成就条件的一部分，但只存在客户端 localStorage。换设备、清缓存后丢失。

**避免措施：**

- **原则："凡是参与成就判定的数据，必须有服务端持久化"**。
- **模式**：客户端 localStorage 仍可用于即时 UI 反馈（避免网络延迟），但每次写入后异步同步到服务端，成就检查时以服务端数据为准。
- **检验**：成就条件中使用的字段，是否全部来自 `getUserStats()` 或 `getUserInteractions()`（两个都是服务端函数）？若是，则数据可靠性得到保证。

---

### 问题 6：冗余 `/api/achievements/check` 端点

**根因：** 功能迭代过程中新增了独立端点，但主端点后来也具备了相同能力，形成冗余。

**避免措施：**

- **原则："DRY 适用于 API 设计"**。API 路由是公开契约，去重比代码去重更重要。任何新端点必须有唯一且明确的存在理由。
- **实操**：定期运行路由分析脚本，输出所有端点及其功能描述，人工审查是否有功能重叠。

---

### 问题 7：`getUserStats` 统计字段不完整

**根因：** `getUserStats` 最初只返回少量字段，后续成就扩展时未同步扩展统计。

**避免措施：**

- **原则："成就条件注册表驱动统计需求"**。不应是先写 `getUserStats` 再写条件，而应是先定义条件所需字段，再实现 `getUserStats`。`achievement-engine.ts` 中每个条件的 `threshold.field` 天然形成一个"所需字段列表"，`getUserStats` 应对照此列表确保全覆盖。
- **自动校验**：测试中可以写 `ACHIEVEMENT_CONDITIONS[*].threshold.field` 集合与 `getUserStats` 返回值的 key 集合做差集比较。

---

### 问题 8：奖励称号实现不完整

**根因：** 设计文档规划了 16 个称号，代码中只实现了 4 个，其余 12 个在设计文档中但未落地。

**避免措施：**

- **原则："设计文档即检查清单"**。迭代结束后，逐项对照设计文档验收，用 checklist 而非主观判断。
- **实操**：设计文档中的列表项在实现完成后标记 `[x]`，未实现的标 `[ ]` 并注明原因/计划。

---

### 问题 9：测试依赖默认数据

**现场还原：**

```typescript
// 测试代码
updateGoal('1', { progress: 75 });  // ← 硬编码 id='1'，假设默认数据中有此目标
```

**根因：** 测试假设了默认数据中存在特定记录，当默认数据被清理后测试失败。

**避免措施：**

- **原则："测试数据自给自足"**。每个测试用例应通过 `createXxx()` 自行创建所需数据，不依赖 `getDefaultData()` 的任何内容。
- **实操**：`resetData()` 后的状态应当是绝对干净的，如果某个测试需要数据，它必须在 `resetData()` 之后显式创建。将这一规则写入测试编写规范。

---

### 问题 10：构建缓存引用已删除文件

**现象：** `npx tsc --noEmit` 报错 `.next/types/validator.ts` 引用已删除的 `achievements/check/route.js`。

**根因：** Next.js 在 `next build` 或 `next dev` 时生成类型文件缓存于 `.next/` 目录，删除源文件后缓存未同步清理。

**避免措施：**

- **实操**：删除任何 API 路由或页面文件后，执行 `rm -rf .next` 清理构建缓存。将此步骤加入 post-delete checklist。
- **自动化**：CI 中的类型检查步骤应在 `rm -rf .next` 之后执行，确保使用最新构建产物。

---

## 第三部分：标准化项目开发框架搭建指南

### 3.1 项目初始化清单

基于本项目经验，新项目启动时应完成以下初始化：

```
□ 1. 技术选型文档（docs/tech-stack.md）
     - 列出语言、框架、数据库、测试框架
     - 每个选择附带一句话理由
□ 2. 架构设计文档（docs/architecture.md）
     - 整体分层图（前端 → API → 业务逻辑 → 数据）
     - 模块间依赖关系
□ 3. TypeScript 严格模式
     - tsconfig.json 中 strict: true
     - noUncheckedIndexedAccess: true
□ 4. 测试框架配置
     - beforeEach 中统一调用 resetData()
     - 禁止测试间共享状态
□ 5. Lint 配置
     - ESLint + Prettier
     - 禁止 console.log（仅允许 console.error）
□ 6. CI 流水线
     - type-check → lint → test → build
     - 每个阶段失败阻断后续
□ 7. 默认数据审计
     - getDefaultData() 中所有数组字段为空
     - 种子数据独立于默认数据
□ 8. API 路由清单
     - 记录每个端点的职责和唯一性
□ 9. 成就/条件类系统的引擎抽象
     - 条件定义与判定逻辑分离
□ 10. .trae/rules/project_rules.md
      - 记录 lint 命令、test 命令、typecheck 命令
```

### 3.2 架构设计原则

| 原则 | 说明 | 本项目中的体现 |
|------|------|--------------|
| **条件与判定分离** | 条件"是什么"和"怎么判断"是两个独立关注点 | `achievement-engine.ts` 的 `ACHIEVEMENT_CONDITIONS` 注册表 vs `evaluateCondition()` |
| **接口契约先于实现** | 数据生产者和消费者之间需要类型契约 | `getUserStats` 的返回类型必须在成就条件定义前确定 |
| **单一数据源** | 每个数据字段只有一个权威来源 | 互动计数：服务端为主，localStorage 为缓存 |
| **默认即最小** | `getDefaultData()` 必须是系统最小可运行状态 | 所有集合默认空数组，不预设业务数据 |
| **API 去重** | 每个端点必须有唯一且明确的存在理由 | 删除冗余 `/check` 端点 |
| **测试数据自给自足** | 测试用例不依赖全局默认数据 | 每个测试内部 `createXxx()` 自行构建数据 |

### 3.3 技术选型决策框架

当面临技术选型时，按以下顺序决策：

1. **兼容性优先**：是否已有项目在用？优先选择团队熟悉的方案。
2. **类型安全**：是否有 TypeScript 一等支持？（本项目全部选择有类型的方案）
3. **零额外依赖**：是否能用标准库或框架内置能力解决？如能用 `CustomEvent` 就不用额外事件库。
4. **简单性**：方案是否能用 50 行说清楚？若不行，考虑是否有更简单的替代。

**反例（本项目中避免的）**：为成就系统引入一个完整的状态管理库（如 Zustand/Redux），实际上一个 React Hook + CustomEvent 总线就足够。

### 3.4 开发流程规范

```
需求分析 → 设计文档 → 技术方案 → 编码 → 自测 → 代码审查 → 合并
```

**每个阶段的具体要求：**

- **需求分析**：明确"用户能做什么"，而非"系统内部怎么做"。
- **设计文档**：包含数据结构、API 契约、状态流转图。使用 checklist 格式，便于逐项验收。
- **技术方案**：说明文件结构、新增/修改文件清单、关键算法或模式选择。
- **编码**：遵循 Karpathy 准则 —— 最小改动、不改不相关的代码、先写测试。
- **自测**：运行 `type-check → lint → test` 全套命令。
- **代码审查**：关注默认数据污染、硬编码、数据源一致性、测试覆盖。
- **合并**：删除构建缓存（`.next`），确保 CI 通过。

---

## 第四部分：可复用的工程经验体系

### 4.1 错误预防三板斧

**第一板斧：类型系统做护栏**

本次开发中的所有 3 个严重 bug，都可以通过更强的类型约束在编译期捕获：

```typescript
// 反例：宽泛的 any 类型
function checkAndUnlockAchievements(userId: string, stats: any): string[] { ... }

// 正例：精确的类型契约，缺失字段在编译期报错
interface AchievementStats {
  goals_count: number;
  goals_completed: number;   // ← 必须提供，否则编译报错
  completed_tasks: number;
  // ...
}
function checkAndUnlockAchievements(userId: string, stats: AchievementStats): string[] { ... }
```

**经验**：凡是成就条件中用到的字段，都必须在 `AchievementStats` 接口中声明为必填。TypeScript 编译会自动发现缺失。

---

**第二板斧：条件注册表 + 自动校验**

```typescript
// achievement-engine.ts 中的条件天然形成"所需字段集合"
const requiredFields = Object.values(ACHIEVEMENT_CONDITIONS)
  .map(c => c.threshold?.field)
  .filter(Boolean);

// 自动校验：getUserStats 必须返回这些字段
// 可以在测试中做差集比较
```

**经验**：不要让"数据源提供哪些字段"和"条件需要哪些字段"各自独立演化 —— 用代码自动校验二者的对齐。

---

**第三板斧：默认数据零假设**

```typescript
// 任何 getDefaultData() 中的数组字段，默认值就是 []
// 所有"初始数据"通过独立函数注入，且仅在开发环境使用
```

**经验**：把 `getDefaultData()` 当作"空数据库"对待。这不是说数据库永远为空，而是说"默认状态 = 洁净状态"。

---

### 4.2 代码质量控制策略

| 策略 | 具体做法 | 工具 |
|------|---------|------|
| **编译期检查** | `npx tsc --noEmit` 作为 CI 第一步 | TypeScript |
| **代码风格** | ESLint 统一规则，禁止 any（除非显式标注 eslint-disable） | ESLint |
| **测试覆盖** | 成就条件类代码必须100%覆盖正向和反向用例 | Vitest |
| **幂等性测试** | 任何带副作用的状态变更函数，必须测试重复调用不产生重复结果 | Vitest |
| **边界值测试** | 阈值 ±1 的边界必须测试（如 `>= 7` 需测试 6 和 7） | Vitest |
| **构建验证** | CI 中执行 `next build`，确保生产构建不报错 | Next.js |

---

### 4.3 团队协作模式

本项目的协作模式是"AI 辅助开发"，从中提炼的经验适用于任何"人+工具"的开发模式：

1. **对话即文档**：每次交互的决策、分析结果都应沉淀为文档（如 `spec.md`、实施计划、复盘文档），确保知识不随会话结束而消失。
2. **先查后写**：修改前先搜索全项目相关代码，理解现有架构后再动手。本项目中先由 `search` agent 做了完整分析，避免了盲目修改。
3. **任务原子化**：使用 TodoWrite 工具将大任务拆为小步骤，完成一个标记一个，防止遗漏。
4. **验证闭环**：每次改动后立即运行测试和类型检查，不让错误累积。

---

### 4.4 风险预判与应对机制

| 风险类型 | 识别信号 | 应对策略 |
|---------|---------|---------|
| **硬编码蔓延** | 代码中出现字面量而非常量/配置 | 抽取为配置对象或注册表 |
| **逻辑重复** | 两个函数/端点做相似的事 | 合并或抽象共同逻辑 |
| **默认数据污染** | `getDefaultData()` 中有非空数组 | 迁移到独立种子函数 |
| **类型退化** | `any` / `as any` 出现 | 定义精确接口替代 |
| **统计字段缺失** | 成就条件引用的字段在 `getUserStats` 中不存在 | 先补字段，后写条件 |
| **客户端/服务端数据分裂** | 同一指标在两处分别维护 | 确定单一数据源，另一方作为缓存 |
| **构建缓存陈旧** | 删除源文件后类型检查仍报错 | `rm -rf .next` 作为清理标准操作 |

---

### 4.5 可复用的代码模式

#### 模式一：条件评估器工厂

```typescript
// 适用于：游戏化系统、权限系统、规则引擎等需要大量条件判定的场景
function numericCondition(field: string, threshold: number): AchievementCondition {
  return {
    evaluate: (stats) => (stats[field] as number) >= threshold,
    progress: (stats) => Math.min(1, (stats[field] as number) / threshold),
    threshold: { field, value: threshold },
  };
}

// 注册所有条件
export const CONDITIONS: Record<string, AchievementCondition> = {
  // 新增条件只需一行
  'new_condition': numericCondition('new_field', 10),
};
```

**适用场景**：任何需要大量条件判定 + 进度计算的系统（徽章、等级、权限、信用分等）。

---

#### 模式二：客户端即时反馈 + 服务端异步同步

```typescript
// 适用于：需要即时 UI 反馈但数据需要持久化的场景
export function incrementSnowballInteractions(): number {
  const current = getSnowballInteractions() + 1;
  localStorage.setItem('snowball_interactions_count', String(current));  // 即时
  syncInteractionToServer('snowball_interaction');                       // 持久化
  return current;
}
```

**适用场景**：点赞计数、阅读进度、互动统计等需要"即响应用户 + 可靠存储"的数据。

---

#### 模式三：测试全覆盖条件矩阵

```typescript
// 适用于：条件判定类代码的测试
const conditionTests = [
  { id: 'records_7', passingStats: { records_count: 7 }, failingStats: { records_count: 6 } },
  // ... 更多条件
];

for (const { id, passingStats, failingStats } of conditionTests) {
  it(`should unlock ${id} with passing stats`, () => {
    expect(checkAndUnlockAchievements('1', makeStats(passingStats))).toContain(id);
  });

  it(`should not unlock ${id} with failing stats (boundary: just below threshold)`, () => {
    expect(checkAndUnlockAchievements('1', makeStats(failingStats))).not.toContain(id);
  });
}
```

**适用场景**：任何有 N 个相似条件的判定系统，用数据驱动测试保证全覆盖。

---

#### 模式四：API 端点三位一体（GET / POST / PATCH）

```typescript
// GET    — 只读查询，返回完整状态
// POST   — 触发副作用检查（如成就解锁）
// PATCH  — 轻量更新（如互动计数 +1）
export async function GET(request: NextRequest) { ... }   // 查询
export async function POST(request: NextRequest) { ... }  // 操作
export async function PATCH(request: NextRequest) { ... } // 增量更新
```

**适用场景**：RESTful 资源设计，避免为每个小操作创建独立端点。

---

## 第五部分：本次成果量化总结

| 维度 | 改动前 | 改动后 |
|------|-------|-------|
| 可用成就 | 34/37（3 个不可用） | 37/37（全部可用） |
| 硬编码条件行数 | 36 行匿名表达式 | 0 行（全部注册表驱动） |
| 统计字段覆盖 | 4 个字段 | 10 个字段 |
| 互动数据持久化 | localStorage only | 服务端 + localStorage 双写 |
| API 端点 | 3 个（含冗余） | 1 个（三位一体） |
| 奖励称号 | 4 个 | 16 个（覆盖全部成就等级） |
| 测试数量 | 约 30 个 | 120 个（含条件矩阵全覆盖） |
| 进度展示 | 无 | 百分比进度条 + 渐变动画 |