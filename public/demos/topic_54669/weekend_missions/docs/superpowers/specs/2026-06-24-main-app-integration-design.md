# 主应用集成设计文档（Spec）

> **创建日期：** 2026-06-24
> **范围：** 把 preview 完整 FC 关卡引擎集成进主应用 index.html；全局 FC 卡带屏外壳；自适应关卡数；真实地图（file:// 可显示）
> **状态：** 待实施
> **前置成果：** `preview/stages-preview.html` + `preview/js/`（已调好的核心关卡流程，本次集成以它为基准，所有设计围绕它）

---

## 一、目标

把 preview 里已经调好的核心关卡流程（FC开场→行进→转场→关底→通关→总通关）**完整嵌入**主应用，让玩家从开机、选主题、AI 简报，到逐关闯关、总通关、分享卡片，全程在**同一个 FC 卡带屏外壳**内完成，风格统一。

三条核心原则：

1. **以 preview 引擎为基准**：preview 是用户调好的核心流程，集成时引擎逻辑**原则上不改**，只做「自适应关数」和「通关回调外围」两处接口改造。
2. **外壳全局化**：FC 卡带屏外壳（机身/品牌条/POWER 灯/CRT 黑框/扫描线）包裹**所有界面**，不再只包关卡。
3. **先跑通一条线**：本次先用深圳主题完整打通端到端，多主题/多城市留后续阶段。

**不在本次范围（阶段 1）**：杭州/上海完整数据、彩蛋系统、存档续玩、"换一个"完整实现（先隐藏或占位）。

---

## 二、背景：两套割裂系统的合并

当前项目存在两套互不相通的实现，集成的本质是合并：

| 维度 | index.html（外围） | preview 引擎（核心） | 集成后 |
|------|-------------------|---------------------|--------|
| 驱动 | DOM + CSS 动画 | Canvas 2D + 主循环 | 外围 DOM + 引擎 Canvas 共存 |
| 关卡流程 | 文字弹窗 + `confirm()` 签到（空壳） | 完整 FC 流程 | **用引擎替换空壳** |
| 地图 | 竖排 emoji 节点 | 真实深圳地图投影 | **用真实地图** |
| 外壳 | 无 | console-shell | **全局包裹** |
| 关卡数 | 5 关写死 | 4 关写死 | **自适应 `STAGES.length`** |
| 关底 type | park/cafe/culture/shop | coffee/bookstore/mall/park | **统一为引擎命名** |

结论：index.html 的 map / stage-detail 两个环节按用户要求**换掉**，由引擎接管；保留并改造 boot / home / dialog / 结算 / 分享 这些外围 DOM 环节。

---

## 三、技术约束（继承自前序 spec，不可违背）

- **必须 `file://` 协议可用**：评委双击 HTML 即运行，不起服务。
- **不能用 ES module**：用普通 `<script>` 标签按序加载。
- **不能用 fetch**：路线/主题数据全部内联到 JS。
- **地图图片用 `<img>` 标签加载**：`file://` 下 `<img src>` 加载本地 png **不受 CORS 限制**（已验证 preview 可显示），fetch 才被拦。因此地图沿用 `img.src = 相对路径` 方案即可在 file:// 显示。
- **纯 Canvas 2D**，零外部依赖。
- 字体 Press Start 2P 当前用 Google Fonts CDN（离线本地化留后续）。

---

## 四、目标架构

### 4.1 全局结构

```
┌─ .console-shell（FC 卡带屏外壳，全局唯一，等比缩放）──────────┐
│  shell-top: WEEKEND MISSIONS 品牌条 · POWER 灯                  │
│  ┌─ .screen（CRT 黑框，可切换内容容器）─────────────────────┐  │
│  │                                                          │  │
│  │  ┌ DOM 层 #dom-pages ────────────────────────────────┐  │  │
│  │  │  page-boot / page-home / page-dialog /             │  │  │
│  │  │  page-result / page-share                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  ┌ Canvas 层 #game-layer ────────────────────────────┐  │  │
│  │  │  .map-section  (mapCanvas)                         │  │  │
│  │  │  .divider                                          │  │  │
│  │  │  .game-section (gameCanvas)                        │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  .scanlines（扫描线，覆盖全屏）                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

- **同一时刻只显示一层**：非关卡阶段显示 DOM 层、隐藏 Canvas 层；进入关卡显示 Canvas 层、隐藏 DOM 层。
- 外壳沿用 preview 已落地的等比缩放方案（`aspect-ratio:880/1102` + `height:96vh` + `max-width:96vw`），所有界面随之统一缩放。
- DOM 层各页面铺满 `.screen`，像素风样式（沿用 index.html 现有 CSS，去掉各自的全屏 `min-height:100vh`，改为填充容器）。

### 4.2 角色分工

| 阶段 | 由谁负责 | 显示层 |
|------|---------|--------|
| boot 开机动画 | 外围 app.js | DOM |
| home 主题/路线选择 | 外围 app.js | DOM |
| dialog AI 打字简报 | 外围 app.js | DOM |
| **intro→walk→transition→ending→clear（循环 N 关）** | **preview 引擎** | **Canvas** |
| **finale 总通关动画** | **preview 引擎** | **Canvas** |
| result 结算（评级/统计） | 外围 app.js | DOM |
| share 分享卡片 | 外围 app.js | DOM |

### 4.3 全流程时序

```
boot(DOM 0.8s 开机)
 → home(DOM 选主题卡)
 → dialog(DOM AI 打字 briefing + 加载文案)
 → [切到 Canvas 层] WM.start() 启动引擎
 →   intro → walk → transition → ending → clear   （重复 N 次，N = 该主题关卡数）
 →   finale（引擎总通关动画，按当前关数显示统计/评级）
 → finale 结束 → 回调 WM.onAllCleared()
 → [切回 DOM 层] result 结算页（读 WM.state 统计）
 → share 分享卡片（复用 index 现有 3 模板 canvas 绘制）
 → 再来一局 → 回 home
```

---

## 五、文件结构

把 preview 成果提升为正式主应用，迁移到根目录 `js/`：

```
index.html              # 重写：外壳 + DOM 层 + Canvas 层 + 按序 script 加载
js/
├── core.js             # 引擎核心（迁移，几乎不动）
├── textures.js         # 纹理（迁移，不动）
├── map.js              # 地图（迁移 + 改：投影参数从主题配置读，支持多城市）
├── stages.js           # 改：WM.THEMES 多主题数据（先深圳），脚本生成
├── flow.js             # 改：自适应关数 + onAllCleared 回调外围
├── app.js              # 新增：外围流程（boot/home/dialog/result/share/路由）
└── scenes/
    ├── intro.js        # 迁移，仅改 STAGE x/N 文案
    ├── walk.js         # 迁移，不动
    ├── transition.js   # 迁移，不动
    ├── clear.js        # 迁移，仅改 STAGE x/N 文案
    ├── finale.js       # 改：自适应关数 + Enter 改为回调外围
    └── endings/
        ├── base.js / coffee.js / bookstore.js / mall.js / park.js  # 迁移，不动
```

> 迁移后 `map.js` 图片相对路径由 `../docs/maps/` 改为 `docs/maps/`（因 index.html 在根目录）。
> `generate-stages.js` 同步迁移并改造为输出 `WM.THEMES`。

加载顺序（script 标签，base 早于 endings，flow 最后，app 在 flow 后）：
```
core → textures → map → stages → scenes(intro/walk/transition/clear/finale)
     → endings(base→coffee/bookstore/mall/park) → flow → app
```

---

## 六、数据模型统一

合并成一份数据，以引擎 STAGES 格式为基础扩展外围字段：

```js
WM.THEMES = {
  'shenzhen-couple': {
    id: 'shenzhen-couple',
    title: '深圳·情侣甜蜜大作战',
    city: '深圳',
    budget: 200,
    groupSize: 2,
    themeColor: '#FD79A8',
    briefing: [ /* AI 打字文案，外围 dialog 用 */ ],
    map: {                          // 地图投影参数（多城市自适应来源）
      centerLng: 113.945129, centerLat: 22.500940, zoom: 14,
      imgW: 800, imgH: 600,
      img: 'docs/maps/shenzhen_full.png',
      places: [ {name,lng,lat}, ... ]
    },
    routes: { 1:{from,to,pts}, 2:{...}, ... },   // 内联路线（关数可变）
    stages: [                       // 关数不固定 → 自适应来源
      { index, name, color, route, task:{title,cost,duration,hp},
        walk:{style,...}, ending:{type,taskPoint,path,...} }
    ]
  },
  // 'hangzhou-solo' / 'shanghai-friends' 阶段 2 再补（关数可不同）
}
```

选中主题时：
```
WM.currentTheme = WM.THEMES[id]
WM.STAGES = WM.currentTheme.stages
WM.ROUTES = WM.currentTheme.routes
WM.map 投影参数 = WM.currentTheme.map
```
引擎按 `WM.STAGES.length` 跑，天然自适应。

---

## 七、自适应关卡数改造（5 处，已定位）

| # | 文件 / 位置 | 现状 | 改为 |
|---|------------|------|------|
| 1 | `flow.js onClearDone` | `if (WM.state.stageIndex < 3)` | `if (stageIndex < WM.STAGES.length - 1)` |
| 2 | `core.js start` / `intro.js` / `clear.js` | 硬编码 `/4`、`STAGE 1/4` | `'/' + WM.STAGES.length` |
| 3 | `finale.js draw` | `'通关 4/4'`、`'4关路线总览'` | 用 `WM.STAGES.length` |
| 4 | `map.js drawAll` | `for (i=1;i<=4;i++)` | 遍历 `Object.keys(WM.ROUTES)` 实际条数 |
| 5 | `finale.js handleInput` | Enter 重置重玩引擎 | 改为 `WM.onAllCleared()` 回调外围结算 |

---

## 八、引擎 ↔ 外围 接口契约

外围与引擎通过 `WM` 全局对象通信，定义两个钩子：

```js
// 外围 → 引擎：选好主题、切到 Canvas 层后调用
WM.startMission(themeId)
  // 内部：装配 STAGES/ROUTES/map 参数 → WM.start()（沿用引擎现有启动）

// 引擎 → 外围：finale 动画结束 / 玩家按 Enter 时回调
WM.onAllCleared()
  // 由 app.js 实现：切回 DOM 层 → 渲染 result 结算页
  // 统计数据从 WM.state 读：hp / totalCost / totalDuration / STAGES.length
```

- finale 不再自行重玩；重玩入口移到外围 result/share 页的"再来一局"。
- 结算评级沿用 finale 的 `getRating(hp)`（S≥40/A≥20/B≥1/C=0）。

---

## 九、地图（file:// 必须显示）

- 沿用 preview 的 `<img>` 加载 + Mercator 投影 + cover 填充方案，**file:// 下可正常显示**（已验证）。
- 路径迁移：`../docs/maps/xxx.png` → `docs/maps/xxx.png`。
- 多城市：投影参数（center/zoom/img/places）从 `WM.currentTheme.map` 读，不再写死深圳。
- **底图占位规则**：有底图的城市（深圳 `shenzhen_full.png`、杭州 `hangzhou.png`、上海 `shanghai.png` 均已存在）**必须显示真实底图**；无底图时降级为 `drawGridFallback` 深色网格（保留路线/标记照常绘制）。
- 阶段 1 仅深圳，深圳底图必显示。

---

## 十、Bug 修复清单（一并处理）

| # | 问题 | 处理 |
|---|------|------|
| 1 | `init()` 每次 `removeItem('wm_progress')` 导致"继续上局"永久失效 | 移除该行（存档逻辑留阶段 3，本次先不破坏） |
| 2 | "换一个" `replace-btn` 只有 `console.log` | 阶段 1 先隐藏按钮（避免半成品），完整实现留阶段 3 |
| 3 | 接受彩蛋后 `currentStageIndex` 未更新，地图高亮错位 | 彩蛋留阶段 3，本次不引入 |
| 4 | 签到用原生 `confirm()` 破坏像素风 | 关卡签到改由引擎关底场景内完成（无 confirm） |
| 5 | HP 可扣成负数 / 预算无上限钳制 | 结算显示时钳制 `Math.max(0, hp)`，预算超额变红 |

> 阶段 1 的核心是"流程跑通"，2/3 号 bug 涉及的彩蛋与换一个功能本次先不启用，避免引入新风险。

---

## 十一、分阶段实施

### 阶段 1（本次重点）— 跑通深圳一条线
1. 重写 `index.html`：卡带屏外壳全局化 + DOM 层 + Canvas 层双结构 + 按序加载脚本。
2. 迁移 `preview/js/` → 根 `js/`，修地图相对路径。
3. 自适应关数改造（第七节 5 处）。
4. 新建 `js/app.js`：boot → home → dialog → `WM.startMission` → finale → `onAllCleared` → result → share。
5. 数据：`WM.THEMES` 先放深圳一个主题（沿用引擎现成 4 关）。
6. 复用 index 现有 3 套分享卡片绘制代码到 share 页。
7. 验证：双击 `index.html`（file://）从开机一路打通到通关分享，地图正常显示。

### 阶段 2 — 多主题 / 多城市
- 补杭州（`hangzhou.png`）、上海（`shanghai.png`）主题数据，**关数可不同**，验证自适应。
- 各城市路线数据补齐（routes 内联）。

### 阶段 3 — 完善
- 存档续玩、"换一个"、彩蛋系统、像素风弹窗、字体本地化、演示模式。

---

## 十二、阶段 1 验收标准

| # | 验收条件 | 验证方式 |
|---|---------|---------|
| AC-01 | 双击 index.html（file://）正常启动，无控制台报错 | 手动打开 |
| AC-02 | 所有界面（boot/home/dialog/关卡/结算/分享）都在 FC 卡带屏外壳内，视觉统一 | 目测 |
| AC-03 | 选深圳主题 → AI 打字简报 → 自动进入关卡引擎 | 流程测试 |
| AC-04 | 引擎从 intro 完整跑完 4 关到 finale，关卡数显示 x/4 正确 | 流程测试 |
| AC-05 | 地图在 file:// 下显示真实深圳底图（非网格） | 目测 |
| AC-06 | finale 后进入 DOM 结算页，统计/评级正确（HP/花费/时长） | 数据核对 |
| AC-07 | 分享页 3 套模板可切换、可下载 PNG | 功能测试 |
| AC-08 | "再来一局"可回到 home 重新开始 | 流程测试 |
| AC-09 | 把引擎关数改为非 4（如临时设 3 关）时流程仍正确闭合（自适应验证） | 代码验证 |

---

> **文档结束** — 待用户确认后进入实施。
