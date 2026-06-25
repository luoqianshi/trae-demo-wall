# 知行板 LearnFlow 动态智能规划升级计划

## Summary（摘要）

把当前 Demo 中"纯规则模板"的伪 AI 规划，升级为**基于用户真实输入的动态智能分析引擎**：识别目标领域、解析卡点类型、计算可行性分数，并据此生成个性化阶段路线、任务、风险与复盘建议，让每次不同输入都得到明显不同的计划输出。

聚焦评审维度中权重最高的两项——**创新性 30% + 实用性 30%**，让评审在 1 分钟内看到"输入被真正理解了"。

约束：保持单文件 `index.html`（CSS/JS 内联、不依赖任何外部资源），可直接 zip 上传社区。

---

## Current State Analysis（现状分析）

当前 `index.html`（638 行）的核心问题：

| 函数 | 现状 | 问题 |
|------|------|------|
| `phaseTemplates()` (L486-512) | 仅按 `scenario` 下拉框返回 4 套**硬编码**阶段，与用户填写的 `goal`/`pain` 内容完全无关 | 换任何目标，阶段文案一字不变 → 创新性失分 |
| `buildTasks()` (L514-529) | 任务文案固定，仅把 goal 前 30 字拼进描述 | 看不出"理解"了输入 |
| `buildReview()` (L590-605) | 仅按 `completion` 百分比给 3 段固定建议 | doneText/blockText 完全没被用 |
| `renderPlan()` 中的"AI 判断" (L559) | 一句静态文案"这个目标适合采用最小产出+每日复盘" | 与输入无关，最暴露"伪 AI" |
| `score` 计算 (L541) | `100 - days/2 + 常量` | 不是真实可行性，纯数字游戏 |
| `buildSummary()` (L607-613) | 拼接固定模板 | 无动态内容 |

UI 框架（hero / features / kanban / 复盘 / 摘要）、移动端适配、localStorage、示例数据均良好，**保留不动**。

---

## Proposed Changes（具体改动）

**唯一改动文件：** `d:\learnflow_initial_demo\index.html`

### 改动 1：新增"动态分析引擎"知识库（JS 顶部，state 定义之后）

在 `<script>` 内 `const state = {...}` 之后，新增两个知识库常量：

**A. 领域知识库 `DOMAIN_KB`**——按关键词命中识别目标领域，每个领域带专属 4 阶段模板：
- `programming`（编程开发）：python/java/javascript/前端/后端/算法/数据分析/机器学习/开发/sql/react...
- `language`（语言学习）：英语/日语/雅思/托福/四六级/口语/单词/语法...
- `exam`（考试备考）：考证/面试/考研/考公/cpa/法考/教资/笔试...
- `report`（职场汇报）：汇报/述职/报告/ppt/演讲/答辩/季度/年度...
- `research`（论文研究）：论文/研究/文献/开题/毕业/综述/实验...
- `project`（项目交付）：项目/上线/交付/看板/系统/app/小程序/网站...
- `design`（设计创作）：设计/ui/ux/海报/figma/插画/视觉...
- 兜底 `general`（通用提升）：以上都未命中时使用

每个领域提供 4 个阶段 `[标题, 描述模板]`，描述模板用 `${kw}` 占位符引用识别到的关键词，让阶段文案与输入强相关。

**B. 卡点知识库 `BLOCKER_KB`**——从 `pain`/`blockText` 解析卡点类型，每类带专属建议：
- `procrastination`（拖延倾向）：拖延/不想/懒/分心/坚持/中断...
- `overload`（信息过载）：资料太多/散/看不完/不知道先学...
- `structure`（缺乏结构）：不知道怎么/没头绪/从哪/怎么开始...
- `time`（时间紧张）：没时间/时间不够/下班/加班/忙...
- `feedback`（缺乏反馈）：没人指导/不知道对不对/没法验证...
- `motivation`（动力不足）：没动力/焦虑/迷茫/没意义...

### 改动 2：新增分析核心函数 `analyzeInput()`

返回一个分析结果对象，作为后续所有生成的统一数据源：

```js
function analyzeInput() {
  const goal = $('goal').value.trim();
  const pain = $('pain').value.trim();
  // 1. 领域识别：扫描 goal 命中 DOMAIN_KB 关键词，取命中数最多的领域
  // 2. 关键词提取：记录命中的具体词，用于回显
  // 3. 卡点解析：扫描 pain 命中 BLOCKER_KB，可命中多个
  // 4. 时间预算：daysLeft() × 每日小时数 → totalHours
  // 5. 复杂度估算：基础分 + goal 长度因子 + 领域因子 + level 因子
  // 6. 可行性分数：clamp(totalHours × 系数 - 复杂度 + level 调整, 35, 96)
  return { domain, domainLabel, domainKeywords, blockers, totalHours, complexity, feasibility };
}
```

### 改动 3：用 `generatePhases()` 替换 `phaseTemplates()`

- 接收 `analyzeInput()` 的结果
- 从 `DOMAIN_KB[domain].phases` 取阶段模板
- 把 `${kw}` 替换为识别到的真实关键词
- 按 `style`（先做项目 / 系统学习 / 快速应试）调整阶段顺序或侧重点（如"先做项目"把"最小闭环"提前）

### 改动 4：用 `generateTasks()` 替换 `buildTasks()`

- 任务描述引用真实目标关键词
- 若检测到 `procrastination` 卡点 → today 任务增加"10 分钟微启动版"
- 若检测到 `overload` → today 任务强调"只选 1 份资料"
- 若检测到 `feedback` → review 任务增加"找一个验证方式"
- 保留三车道结构（today/week/review）和 localStorage 存储逻辑

### 改动 5：重写 `renderPlan()` 输出区

替换 `$('output').innerHTML` 内容为：
1. **分析概览条**：可行性分数（真实计算）+ 时间预算 + 复杂度 + 识别领域 chips
2. **"AI 已识别"区**：把 `domainKeywords` 和命中的 `blockers` 显示为 chips（如"识别到：Python、数据分析"、"卡点：信息过载、拖延倾向"）——让评审一眼看到输入被理解
3. **动态 AI 判断**：根据领域 + 卡点生成 2-3 句针对性判断，替换原静态文案
4. **动态风险提醒**：按命中的 blocker 类型逐条给出风险 + 对应缓解建议（替换原单条 `pain` 回显）
5. **阶段路线**：用 `generatePhases()` 输出
6. **今日最小行动**：用 `generateTasks()` 输出

### 改动 6：新增"分析中"过渡动画

点击"生成行动方案"后，先在 output 区显示 ~600ms 的"AI 正在分析你的目标..."加载态，再渲染结果。纯 CSS/JS 实现，无外部依赖。让"智能感"可见。

### 改动 7：重写 `buildReview()` 为 `generateReview()`

- 解析 `doneText` 提取完成内容关键词
- 解析 `blockText` 命中 BLOCKER_KB 得到卡点类型
- 按 (completion + 命中卡点) 组合生成针对性建议，引用 doneText 内容
- 至少 3 个 step，每个都基于真实输入而非模板套话

### 改动 8：更新 `buildSummary()`

把生成的摘要改为引用动态分析结果（识别领域、可行性分数、命中卡点、阶段标题），让投稿摘要也体现个性化。

### 改动 9：微调 CSS（仅服务于动态展示）

新增样式（不改动现有视觉基调）：
- `.analysis-bar`：分析概览条（分数 + 时间 + 复杂度横向排列）
- `.detect-chips`：识别关键词/卡点的彩色标签
- `.loading-state`：分析中加载动画（脉冲点）
- `.risk-item`：风险项列表样式（带类型色标）

### 不改动的部分

- 整体页面结构、hero、features、kanban、复盘、摘要模块布局
- 移动端响应式断点
- `sampleData` 示例数据与一键填入逻辑
- localStorage 存储键名 `learnflow_tasks`
- 单文件约束、零外部依赖

---

## Assumptions & Decisions（假设与决策）

1. **不接入真实 LLM**：单文件 + 零外部资源约束下，用本地关键词分析引擎模拟"智能"，足以让输出因输入而异、体现"被理解"，满足创新性/实用性要求。
2. **保留原有 UI 基调**：不加暗色模式、不加动效大改（用户本次未选），仅加服务于动态规划的展示样式。
3. **领域识别取"命中数最多"**：避免多领域关键词交叉时误判；都未命中走 `general` 兜底。
4. **可行性分数真实可解释**：基于时间预算 × 难度，附拆解说明，比原 `100-days/2` 更有说服力。
5. **`scenario` 下拉框保留**：仍作为辅助信号，但不再作为阶段生成的唯一依据（领域识别优先）。
6. **向后兼容 localStorage**：旧 tasks 结构不变，老用户刷新不丢任务。

---

## Verification Steps（验证步骤）

1. 打开 `index.html`，点"一键填入示例"，确认默认 skill 示例生成出含"Python/数据分析"关键词的阶段与任务。
2. 改填"30 天准备考研英语"目标，确认阶段切换为语言学习领域、识别到"英语"关键词、任务与英语相关。
3. 在卡点写"资料太多容易拖延"，确认识别到"信息过载+拖延倾向"两个 chips，且风险提醒分条给出对应缓解建议。
4. 修改每日投入时间从 1 小时→3 小时以上，确认可行性分数和时间预算明显上升。
5. 在复盘助手填写真实完成情况和卡点，确认明日建议引用了输入内容、针对性变强。
6. 清空 goal 直接点生成，确认仍有 toast 提示"请先填写目标"（保留校验）。
7. 勾选看板任务后刷新页面，确认 localStorage 状态保留。
8. 缩窄窗口到手机宽度，确认新增的分析概览条/识别 chips 在移动端正常换行不溢出。
9. 确认整个文件仍为单 `index.html`，无任何外部 link/script/图片引用。
