# 主应用集成实施计划（阶段 1）

> **For agentic workers:** 按任务逐个实施，每个任务完成后用 checkbox（`- [ ]` → `- [x]`）标记。每完成一组做一次 file:// 自测验证。

**Goal:** 把 preview 的完整 FC 关卡引擎集成进主应用 `index.html`，所有界面统一包进 FC 卡带屏外壳，关卡数自适应，地图在 file:// 下真实显示。阶段 1 先跑通深圳一条完整线（开机→选主题→AI简报→4关引擎→总通关→结算→分享）。

**Architecture:** 全局 `.console-shell` 外壳包裹 `.screen`；`.screen` 内 DOM 层（boot/home/dialog/result/share）与 Canvas 层（map+game）互斥切换。preview 引擎原则不动，仅改「自适应关数」+「finale 回调外围」。外围流程由新增 `js/app.js` 驱动，与引擎通过全局 `WM` 通信。

**Tech Stack:** 纯 Canvas 2D + DOM；普通 `<script>` 标签加载（非 module）；数据内联（不用 fetch）；地图用 `<img>` 加载（file:// 可显示）；零外部依赖。

**Spec:** [2026-06-24-main-app-integration-design.md](file:///e:/weekend_missions/docs/superpowers/specs/2026-06-24-main-app-integration-design.md)

---

## 文件结构（阶段 1 完成后）

```
index.html              # 重写：外壳 + DOM 层 + Canvas 层 + 按序 script 加载
js/
├── core.js             # 迁移自 preview，几乎不动
├── textures.js         # 迁移，不动
├── map.js              # 迁移 + 改：投影参数从 WM.currentTheme.map 读 + 路径修正
├── stages.js           # 改：WM.THEMES（先深圳），脚本生成
├── flow.js             # 改：自适应关数 + onAllCleared 回调
├── app.js              # 新增：外围流程 + 路由 + DOM/Canvas 层切换
└── scenes/
    ├── intro.js        # 迁移 + 改 STAGE x/N 文案
    ├── walk.js         # 迁移，不动
    ├── transition.js   # 迁移，不动
    ├── clear.js        # 迁移 + 改 STAGE x/N 文案
    ├── finale.js       # 改：自适应关数 + Enter 改回调外围
    └── endings/        # base/coffee/bookstore/mall/park 迁移，不动
generate-stages.js      # 迁移 + 改造为输出 WM.THEMES
```

**关键约定：**
- 引擎逻辑以 preview 为基准，改动最小化，只动 spec 第七节列出的点。
- 外围 ↔ 引擎接口：`WM.startMission(themeId)`（外围调）、`WM.onAllCleared()`（引擎回调，app.js 实现）。
- 地图图片路径迁移后由 `../docs/maps/` 改为 `docs/maps/`。

---

## 任务列表

### A. 引擎迁移与路径修正

- [ ] **A1** 复制 `preview/js/` 全部文件到根 `js/`（core/textures/map/stages/flow + scenes 全套）。
- [ ] **A2** 修改 `js/map.js`：`this.img.src` 路径 `../docs/maps/shenzhen_full.png` → `docs/maps/shenzhen_full.png`。
- [ ] **A3** 临时验证：建一个最小 `index.html`（直接照搬 preview 外壳 + 按序加载根 js）双击打开，确认引擎能跑、地图能显示（基线确认，后续会重写 index）。

### B. 数据模型统一（WM.THEMES）

- [ ] **B1** 迁移 `generate-stages.js` 到根目录，改造输出结构：从 `WM.ROUTES/WM.STAGES` 改为 `WM.THEMES['shenzhen-couple'] = { id,title,city,budget,groupSize,themeColor,briefing,map:{center/zoom/img/places},routes,stages }`。
- [ ] **B2** briefing 文案沿用 index.html 现有深圳 briefing；map.places 沿用 map.js 现有 PLACES；stages 沿用现有 4 关配置。
- [ ] **B3** 运行 `node generate-stages.js` 重新生成 `js/stages.js`，确认输出 `WM.THEMES` 结构正确。

### C. 引擎自适应关数改造（spec 第七节）

- [ ] **C1** `js/flow.js`：`onClearDone` 的 `stageIndex < 3` → `stageIndex < WM.STAGES.length - 1`。
- [ ] **C2** `js/core.js`：`WM.startMission(themeId)` 装配 `WM.currentTheme / WM.STAGES / WM.ROUTES`，并把 map 投影参数注入 `WM.map`；`start()` 里 `STAGE 1/4` 改 `'/' + WM.STAGES.length`。
- [ ] **C3** `js/map.js`：投影参数（center/zoom/imgW/imgH/img/places）改为从 `WM.currentTheme.map` 读；`drawAll` 的 `for i=1..4` 改为遍历 `Object.keys(WM.ROUTES)`。
- [ ] **C4** `js/scenes/intro.js`、`js/scenes/clear.js`：`STAGE x/4` 文案改 `'/' + WM.STAGES.length`。
- [ ] **C5** `js/scenes/finale.js`：`通关 4/4`、`4关路线总览` 改用 `WM.STAGES.length`；`getRating` 保留。

### D. 引擎 ↔ 外围接口

- [ ] **D1** `js/finale.js` `handleInput`：Enter 不再重玩引擎，改为调用 `if (WM.onAllCleared) WM.onAllCleared()`；同时 finale 动画播完后（约 5s）自动调一次 `onAllCleared`（保留 Enter 作为提前跳过）。
- [ ] **D2** 在 `js/core.js` 暴露 `WM.startMission(themeId)`：装配数据 → 切到 Canvas 层（调 app 提供的 `WM.showGameLayer()`）→ `WM.start()`。

### E. 重写 index.html（外壳全局化 + 双层结构）

- [ ] **E1** 顶层结构：`.console-shell`（沿用 preview 外壳 CSS：aspect-ratio 880/1102 + 96vh）包 `.shell-top` + `.screen`。
- [ ] **E2** `.screen` 内放两层：`#dom-pages`（含 page-boot/home/dialog/result/share）与 `#game-layer`（map-section + divider + game-section），加 `.scanlines`。
- [ ] **E3** 迁移 index.html 现有 DOM 页面结构与像素风 CSS 到 `#dom-pages`，去掉各页 `min-height:100vh`，改为填满 `.screen`；移除旧的 map/stage-detail 页面（由引擎接管）。
- [ ] **E4** 按序加载脚本：core→textures→map→stages→scenes→endings→flow→app；末尾不再直接 `WM.start()`，改由 app 初始化。

### F. 新增 js/app.js（外围流程驱动）

- [ ] **F1** 路由/层切换：`showDomPage(name)` 显示指定 DOM 页隐藏 Canvas 层；`WM.showGameLayer()` 隐藏 DOM 页显示 Canvas 层。
- [ ] **F2** boot：0.8s 开机动画 → `home`。
- [ ] **F3** home：渲染主题卡（先深圳，可多张占位）→ 点击 `selectTheme` → dialog。
- [ ] **F4** dialog：打字机渲染 `theme.briefing` + 加载文案 → 调 `WM.startMission(themeId)` 进引擎。
- [ ] **F5** result：实现 `WM.onAllCleared()` → 切回 DOM → 读 `WM.state`（hp/totalCost/totalDuration/STAGES.length）渲染结算页 + 评级（复用 finale getRating 规则）。
- [ ] **F6** share：复用 index 现有 3 套分享卡片 canvas 绘制（pixel/modern/literary）+ 下载 PNG；"再来一局"重置 `WM.state` 回 home。
- [ ] **F7** 移除 bug：删掉 `init()` 的 `removeItem('wm_progress')`；阶段 1 隐藏"换一个"按钮；结算 HP 显示 `Math.max(0,hp)`。

### G. 端到端验证（file://）

- [ ] **G1** 双击 `index.html` 打开，确认无控制台报错，boot→home 正常。
- [ ] **G2** 走完整条线：选深圳 → AI简报 → 4关引擎(intro→walk→transition→ending→clear ×4) → finale → 结算 → 分享下载 → 再来一局。
- [ ] **G3** 确认地图显示真实深圳底图（非网格），STAGE x/4 数字正确，结算统计/评级正确。
- [ ] **G4** 自适应验证：临时把深圳 stages 改为 3 关，确认流程正确闭合（x/3、finale 统计、地图路线数），验证后改回。
- [ ] **G5** 视觉验证：所有界面都在卡带屏外壳内，风格统一，缩放正常无裁切。

---

## 验收标准（对应 spec 第十二节 AC-01~AC-09）

- 双击 file:// 启动无报错；所有界面在外壳内统一；深圳整条线打通；地图真实显示；关数显示正确；结算评级正确；3 套分享卡可切换下载；再来一局可回 home；自适应关数验证通过。

---

> **文档结束** — 待用户确认后开始按任务实施。
