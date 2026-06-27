# 工位回血 · 项目内容总结（功能 / 元素 / 逻辑）

> 范围：本仓库根目录下两份 HTML 单页 — 应用主体 [app.html](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html) 与 宣传介绍页 [workstation-heal-card.html](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html)。
> 本文只关注**元素结构、功能能力、状态/数据/业务逻辑**。

---

## 一、应用主体 · [app.html](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html)

一个**纯前端、无后端、纯 LocalStorage**的单页应用。基于哈希路由（`#today / #library / #history / #me`），通过模板克隆 + JavaScript 挂载实现 SPA 体验。

当前版本：**v0.5.0**（侧边栏标识 v0.4.0，"我的"模块标识 v0.5.0 · Phase 5）。

### 1. 全局框架元素

#### 1.1 左侧 sidebar（[L2820-L2852](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L2820-L2852)）

| 元素 | 说明 |
|---|---|
| `.brand`（HEAL · Daily Recovery） | 品牌标识 |
| `.nav-item[data-tab="today"]` | 跳转 `#today`，附 `NEW` 徽标 |
| `.nav-item[data-tab="library"]` | 跳转 `#library` |
| `.nav-item[data-tab="history"]` | 跳转 `#history` |
| `.nav-item[data-tab="me"]` | 跳转 `#me` |
| `.sidebar-foot` | 版本号 `v0.4.0` + 版权 |

**逻辑**：点击触发 `hashchange` → 路由器 `render()` 重新挂载对应模板。

#### 1.2 顶栏 topbar（[L2859-L2870](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L2859-L2870)）

| 元素 ID | 内容 | 数据源 |
|---|---|---|
| `#topTitle` | 当前 Tab 标题 | `VIEWS[tab].title` |
| `#topDate` | 今日日期 + 星期 | `syncDate()` |
| `#topStreak` | 连签天数 | `state.streak` |
| `#topDrawn` / `#topRound` | 今日抽卡数 / 第几轮 | `state.today.drawn / round` |
| `#topHp` | 累计总 HP | `state.hpTotal` |

**逻辑**：每次路由切换 + 抽卡 / 完成卡牌后都调用 `syncTopMeta()` 同步。

---

### 2. Today · 今日回血 Tab（模板 [#tpl-today](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L2881-L2959)）

由 4 个面板顺序组成：HP 进度 → 状态选择 → 抽卡 CTA → 抽卡结果（三段式）。

#### 2.1 HP 进度面板（[L2890-L2895](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L2890-L2895)）

| 元素 | 功能 |
|---|---|
| `#hpFill` | HP 进度条填充（0–100）|
| `#hpVal` | 当前 HP 数字 |

**逻辑**：[animateHp(target, instant)](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3782) 用 `requestAnimationFrame` 在 ~900ms 内插值，把 HP 从旧值缓动到新值。封顶 100。

#### 2.2 第一步 · 状态选择（[L2898-L2925](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L2898-L2925)）

10 个 `.mood-chip` 多选标签：

```
sit(久坐) · eye(眼疲劳) · neck(肩颈僵) · back(腰背酸) · meeting(会议轰炸)
stress(赶 DDL) · mood(心情烦躁) · sleepy(困倦) · brain(脑子卡壳) · hungry(饿肚子)
```

**逻辑**：
- 点击 toggle `.is-on`，同步到 `state.today.moods` 并 `saveState()`
- `#drawBtn` 抽卡按钮文案随状态/批次变化（见下方 `refreshHint()`）
- 不选状态也可以抽 → 走"随机抽 3 张"分支

#### 2.3 第二步 · 三段式抽卡区（[L2927-L2958](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L2927-L2958)）

> 仅在 `state.today.cards.length > 0`（即已抽卡）时显示。

外层 `.panel.today-stack#cardsPanel` 内含 3 个 section：

**a) 进度概览段（head）**
| 元素 ID | 功能 |
|---|---|
| `#todayProgressBadge` | `已完成 / 总数` 徽标 |
| `#todayProgressFill` | 进度条填充（按 done/total 百分比）|
| `#todayProgressMeta` | 三态文案：未抽卡 / 进行中 / 全部完成 |

**b) 卡牌段（cards）**
| 元素 ID | 功能 |
|---|---|
| `#cardGrid` | 3 张抽卡渲染容器 |
| `#allDoneBox` | 「全部完成」庆贺信息容器 |

**c) 行动段（action）**
| 元素 ID | 功能 |
|---|---|
| `#todayActionsSummary` | 实时汇总：已完成 N 张 · +X HP · 第 R 轮 |
| `#flipAllBtn` | 一键全部翻牌（依次延迟 120ms 翻面）|
| `#redrawBtn` | 重抽今日卡牌（弹 confirm 二次确认，未完成 HP 记录保留）|

**核心逻辑 → [updateTodayProgress()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3361-L3395)**：
1. 计算 `total / done / pct / hp / round`
2. 写入 4 个文案与 1 个进度条
3. 根据"有无未翻面卡片"决定 `#flipAllBtn` 是否 disable
4. 根据"是否抽过卡"决定 `#redrawBtn` 是否 disable

挂载在 `window.__refreshTodayProgress`，供 `completeCard()` 与单卡翻面回调统一刷新。

#### 2.4 抽卡核心逻辑

```
[drawBtn click]
  ↓ batchState() 判定 active / cleared / empty
  ↓ 若 active 直接 return
  ↓ 清空 grid 与 state.today.cards
  ↓ drawCards(moods)  → weightedSample 抽 3 张
  ↓ bumpStreakIfFirstToday()  → 跨日连签 +1
  ↓ state.today.drawn += 3 ; round +=1
  ↓ 写入 state.today.cards + state.library（解锁图鉴计数）
  ↓ saveState() + syncTopMeta()
  ↓ 依次延迟 150ms renderCard(card, grid)
  ↓ refreshHint() + updateTodayProgress()
```

**[drawCards(moods)](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3401-L3409)**：
1. 用 `inHourWindow()` 过滤"饭点限定卡"
2. 用 `notDisabled()` 排除用户在 Me 页关闭的状态
3. 若选了状态，先按状态交集筛候选；不足 3 张 → 回退完整池
4. 调 [weightedSample(candidates, 3)](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3366-L3383) 加权抽样，权重 `n:65 / r:25 / sr:8 / ssr:2`

**[refreshHint()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3526)**：根据批次状态 + 状态选择数 + 下一轮编号，动态更新 `#drawHint` 文案与 `#drawBtn` 文本/禁用态。

#### 2.5 单卡渲染与生命周期 → [renderCard()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3632-L3645)

每张卡由两面构成：
- **背面**：emoji `⊕` + `HEAL · CLICK TO FLIP` 提示
- **正面**：稀有度徽标 + HP 标签（如 SR · +22 HP，可能附 ⏰ 饭点限定）+ emoji + 名称 + 描述 + 倒计时环 + 「我做完了」按钮

**交互**：
- 点击卡片任意位置 → toggle `.is-flipped`，**首次翻到正面时启动倒计时**
- 倒计时 `setInterval` 每秒：环条进度更新 + 数字递减，到 0 自动变 `OK` + 按钮文案 `✅ 完成回血`
- 点击按钮 → `completeCard()` → 写入 `state.today.cards[i].done = true` + 累加 HP + 写 `state.history` + 触发 HP 动效与 `+N` 飘字
- 完成后卡片加 `.is-done`

**[maybeShowAllDone()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3763)**：3 张全 done 时在 `#allDoneBox` 显示"第 R 轮全部完成 + 累计 HP + 连签 + 引导抽下一轮"。

---

### 3. Library · 图鉴 Tab（模板 [#tpl-library](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L2961-L3004)）

#### 3.1 顶部 hero
| 元素 | 功能 |
|---|---|
| `#libBar` | 收集进度环（已点亮 / 28）|
| `#libGot` / `#libAll` | 已收集张数 / 总张数 |
| `#libStats` | 按稀有度分类的统计（N/R/SR/SSR）|

#### 3.2 过滤器 `#libFilter`
按稀有度筛选；可切 `全部 / N / R / SR / SSR`。

#### 3.3 图鉴主网格 `#libGrid`
每张卡：
- **已抽过**：名称 + 累计抽中次数
- **未抽过**：`?` + `未解锁`

点击 → 弹 [openLibModal()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3945) 详情卡（稀有度、HP、时长、描述、抽中次数、对应状态）。

**核心逻辑** [mountLibrary()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3826)：
1. 计算已解锁张数
2. 按稀有度分组统计 → 渲染 `#libStats`
3. `renderLibGrid(filter)` 根据筛选刷新网格

---

### 4. History · 历史 & 周报 Tab（模板 [#tpl-history](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3006-L3040)）

#### 4.1 最近 4 周热力图 `#hxCal`
- 按日聚合 HP，分五档 `l0 / l1 / l2 / l3 / l4`
- 单元格 hover 显示日期 + HP

#### 4.2 本周回血曲线 `#hxChartWrap`
本周（周一为起点）每日累计 HP。

#### 4.3 周报 `#hxReportWrap`
- 本周累计 HP / 完成卡数 / 活跃天数 / 最佳一天
- [weeklyCheerLine(hp, days)](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L4240) 动态生成鼓励文案

**核心逻辑**：
- [getDailyAgg()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3993) 把 `state.history[]` 聚合为 `{ date → totalHp }`
- [mondayOf(d)](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3978) 算所在周周一
- [hpLevel(hp)](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L4008) 把 HP 映射为五档 index

---

### 5. Me · 我的 Tab（模板 [#tpl-me](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3042-L3182)）

#### 5.1 个人 Hero 卡 `.me-hero`
4 个指标：
| ID | 内容 |
|---|---|
| `#meHp` | 累计 HP |
| `#meStreak` | 当前连签 |
| `#meCards` | 完成卡牌数（`state.history.length`）|
| `#meCollect` | 图鉴收集 N / 28 |

副标题 `#meSub` 显示 `已陪伴你 N 天`，由 [daysSince(installDate)](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L4264) 计算。

#### 5.2 回血提醒 `.is-remind`
| 元素 ID | 功能 |
|---|---|
| `#meRemindOn` (switch) | 总开关，写入 `state.settings.remindOn` |
| `#meRemindTime` (time input) | 提醒时间，默认 `14:30` |

**逻辑** [scheduleReminder()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L4273)：
- `Notification.requestPermission()` 申请浏览器通知权限
- 计算下次到点时间 → `setTimeout` 触发 `new Notification('...')`
- 仅在页面打开时生效（关闭页面后任务消失）

#### 5.3 卡池偏好 `.is-pool`
| 元素 ID | 功能 |
|---|---|
| `#meHourLimit` (switch) | 控制饭点限定卡是否生效，写 `state.settings.hourLimit` |
| `#meTagChips` | 10 个状态标签，点击 toggle 加入/移出 `state.settings.disabledTags` |
| `#meTagAllN` | 显示状态总数（10）|

**逻辑联动**：`drawCards()` 在抽样时调 `notDisabled(card)` → 任一 tag 在 `disabledTags` 中 → 卡被排除。

#### 5.4 数据管理 `.is-data`
| 按钮 ID | 功能 |
|---|---|
| `#meExportBtn` | 导出 `state` 为 JSON 文件下载 |
| `#meImportBtn` + `#meImportFile` | 选 JSON 文件 → 合并 / 覆盖到 `state` → `saveState()` |
| `#meResetBtn` | 弹 confirm → 清空 LocalStorage → 回到初始 |

操作完成后调 [meToast(msg, kind)](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L4253) 显示瞬时提示。

#### 5.5 关于 `.is-about`
静态信息：应用名、版本（v0.5.0）、已上线模块、卡池规模、致谢。

---

### 6. 数据层 · LocalStorage

#### 6.1 存储键与默认结构（[L3241-L3263](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3241-L3263)）

```js
STORAGE_KEY = 'heal-app-state-v1'
HP_MAX = 100

defaultState = {
  streak: 0,                     // 连签天数
  lastDrawDate: '',              // 上次抽卡日期（用于跨日判断）
  installDate: 'YYYY-MM-DD',     // 首次启动日期
  today: {
    date: 'YYYY-MM-DD',
    drawn: 0,                    // 今日累计抽卡数
    round: 0,                    // 今日第几轮
    hpToday: 0,                  // 今日累计 HP
    cards: [{ id, done }],       // 当前批次
    moods: [],                   // 当前选择的状态标签
  },
  hpTotal: 0,                    // 全时累计 HP（不封顶）
  library: { [cardId]: count },  // 图鉴解锁次数表
  history: [{ date, ts, id, hp, rarity }],  // 完成事件流（图鉴/周报数据源）
  settings: {
    remindOn: false,
    remindTime: '14:30',
    hourLimit: true,             // 饭点限定卡开关
    disabledTags: [],            // 用户关闭的状态
  },
}
```

#### 6.2 跨日处理 → [loadState()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3265-L3293)

1. 读取并 JSON.parse
2. 若 `today.date !== todayStr()`：
   - **昨天有抽卡** → 连签延续（`streak` 不动）
   - **昨天无抽卡** → `streak = 0`（断签清零）
   - 重置 `today` 字段
3. 兼容老数据：补 `round` 与 `settings` 默认字段

#### 6.3 连签累加 → [bumpStreakIfFirstToday()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3299)

抽卡按钮第一次触发时，若 `lastDrawDate !== today` 则 `streak += 1` 并把 `lastDrawDate` 更新到今天。

---

### 7. 路由与挂载

#### 7.1 [tab router](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3311-L3345)

```js
VIEWS = {
  today:   { title: '今日回血', render: tplClone('tpl-today'),   onMount: mountToday },
  library: { title: '卡牌图鉴', render: tplClone('tpl-library'), onMount: mountLibrary },
  history: { title: '历史 & 周报', render: tplClone('tpl-history'), onMount: mountHistory },
  me:      { title: '我的',     render: tplClone('tpl-me'),      onMount: mountMe },
}
```

- `getTab()`：解析 `location.hash` → tab id，默认 `today`
- `render()`：清空 `#viewRoot` → 克隆模板 → 调 `onMount()` → 同步 sidebar `.is-active`
- 监听 `hashchange` 触发 `render()`

#### 7.2 模板克隆 → [tplClone(id)](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3324)

`document.getElementById(id).content.cloneNode(true)` — 标准 `<template>` 复制。

---

### 8. 卡池数据 · 28 张

| 稀有度 | 张数 | 权重 | HP 区间 | 时长 |
|---|---|---|---|---|
| N（普通） | 14 | 65% | 8–10 | 30–60s |
| R（稀有） | 8 | 25% | 14–18 | 20–180s |
| SR（史诗） | 4 | 8% | 22–25 | 60–90s |
| SSR（传说） | 2 | 2% | 35 | 120–180s |

每张卡的字段：`id / name / emoji / rarity / hp / dur / tags[] / desc`，部分含 `hourRange`（饭点限定）。

完整定义见 [CARD_POOL（L3190-L3226）](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3190-L3226)。

---

### 9. 关键工具函数索引

| 函数 | 位置 | 作用 |
|---|---|---|
| [weightedSample()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3366) | L3366 | 按稀有度权重不放回抽样 |
| [inHourWindow()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3385) | L3385 | 判断"饭点限定"卡是否在窗口内 |
| [notDisabled()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3394) | L3394 | 排除被用户禁用的标签 |
| [drawCards()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3401) | L3401 | 抽卡主流程 |
| [animateHp()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3782) | L3782 | HP 数字 + 进度条缓动 |
| [popHpDelta()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3809) | L3809 | 完成卡时飘 `+N` |
| [dateKey() / mondayOf() / hpLevel()](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/app.html#L3974-L4014) | L3974+ | 历史聚合三件套 |

---

## 二、宣传介绍页 · [workstation-heal-card.html](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html)

一个**单页营销介绍页**，**无业务逻辑、无状态、无交互行为**（仅锚点跳转）。其作用是面向参赛评审 / 潜在用户介绍"工位回血卡"的设计意图、玩法、价值与未来规划。

### 1. 顶部导航 · [L1511-L1521](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html#L1511-L1521)

- 品牌：`HEAL CARD`
- 链接：`#problem / #how / #cards / #scenario / #value / #future`（页内锚点）

### 2. Hero · [L1524-L1546](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html#L1524-L1546)

- 徽标：`学习工作赛道 · 创意展示`
- 主标：`工位回血卡`
- 4 个特征标签：抽卡挑战 / 30–90秒微任务 / 卡牌收集 / 低负担日常仪式

### 3. Problem · "健康知而不行"困境 · [L1547-L1589](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html#L1547-L1589)

6 个痛点：**久坐成疾 · 盯屏过度 · 饮水不足 · 情绪紧绷 · 打卡疲劳 · 缺少趣味**

### 4. Gameplay · 四步玩法 · [L1591-L1692](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html#L1591-L1692)

| 步骤 | 标题 |
|---|---|
| 1 | 选择状态 |
| 2 | 生成卡池 |
| 3 | 抽取回血卡 |
| 4 | 完成获反馈 |

### 5. Card System · 稀有度与示例 · [L1694-L1776](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html#L1694-L1776)

- 4 张代表卡：社畜补水卡（N）/ 屏幕放生卡（R）/ 脖子解封卡（SR）/ 人类重启卡（SSR）
- 4 张「更多示例」：腰部回正卡 · 正经吃饭卡 · 大脑摇晃卡 · 摸鱼社交卡
- 特别说明：**饭点限定卡**机制（只在 11:30–13:30 / 17:30–19:30 出现）

### 6. Scenarios · 使用场景 · [L1778-L1837](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html#L1778-L1837)

介绍何时使用：会议间隙 / 久坐间歇 / 午后困倦 / 任务卡顿 / DDL 紧绷等。

### 7. Value · 价值定位 · [L1839-L1867](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html#L1839-L1867)

- ⚡ 效率提升价值
- 🌍 社会价值（企业关怀文化、员工幸福感）

### 8. Future · 进度与未来 · [L1869-L1932](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html#L1869-L1932)

- ✅ 已实装（v0.4）：抽卡、HP、连签、图鉴、周报
- 🚀 未来：多设备同步、团队协作、AI 个性化推荐、企业版接入

### 9. CTA + Footer · [L1934-L1944](file:///Users/tyzhang/Learn/trae_app/workstation-heal-card/workstation-heal-card.html#L1934-L1944)

- CTA：`立即体验抽卡` → 锚回 `#how`
- Footer：版权与项目信息

---

## 三、两份文件的关系

| | app.html | workstation-heal-card.html |
|---|---|---|
| **角色** | 可用的应用主体 | 营销 / 介绍页 |
| **状态/数据** | 有（LocalStorage） | 无 |
| **交互逻辑** | 抽卡 / 翻牌 / 完成 / 提醒 / 导入导出 | 仅锚点跳转 |
| **路由** | 哈希路由 + 模板克隆 | 单页静态 |
| **数据持久化** | `localStorage['heal-app-state-v1']` | 无 |

---

## 四、整体业务循环（核心闭环）

```
用户进入 Today
   ↓ 选状态（可跳过）
   ↓ 抽 3 张卡（带稀有度权重 + 状态/时段/偏好过滤）
   ↓ 翻牌 → 倒计时 → 完成
   ↓ 累加 HP · 写入历史 · 解锁图鉴 · 连签 +1
   ↓ 可在 Library 查看收集进度
   ↓ 可在 History 看周报与热力图
   ↓ 可在 Me 调整偏好 · 备份 · 设提醒
跨日 → loadState() 自动重置 today，根据 lastDrawDate 维护连签
```
