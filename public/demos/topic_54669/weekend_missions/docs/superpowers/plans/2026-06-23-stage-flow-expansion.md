# 关卡流程扩展实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将第 1 关单文件流程扩展为 4 关可串联的模块化流程，新增 FC 开场界面、3 个新关底场景、4 种行进风格、BOSS 关倒计时、总通关动画。

**Architecture:** 配置驱动方案。`stages.js` 集中管理 4 关配置数据，`flow.js` 状态机驱动通用流程，`endings/base.js` 提供关底基类，4 个 endings 子模块只覆盖差异部分。所有 JS 用普通 `<script>` 标签加载（非 ES module），保证 `file://` 协议可用。

**Tech Stack:** 纯 Canvas 2D、Press Start 2P 字体、零外部依赖。

**Spec:** [2026-06-23-stage-flow-expansion-design.md](file:///e:/weekend_missions/docs/superpowers/specs/2026-06-23-stage-flow-expansion-design.md)

---

## 文件结构

```
preview/
├── stages-preview.html              # 预览入口（新建）
├── stage-1-flow.html                # 保留（旧单文件版本，作参考）
├── generate-stages.js               # 路线数据生成脚本（新建，临时）
└── js/                               # 新建目录
    ├── core.js                       # 全局状态、主循环、调色板、输入分发
    ├── textures.js                   # 通用纹理生成
    ├── map.js                        # 真实地图绘制
    ├── stages.js                     # 4 关配置数据 + 内联路线（由脚本生成）
    ├── flow.js                       # 通用流程引擎
    └── scenes/
        ├── intro.js                  # FC 开场界面
        ├── walk.js                   # 行进场景
        ├── transition.js             # 转场动画
        ├── clear.js                  # 通关动画
        ├── finale.js                 # 总通关动画
        └── endings/
            ├── base.js               # 关底基类
            ├── coffee.js             # 咖啡店（第1关）
            ├── bookstore.js          # 书店（第2关）
            ├── mall.js               # 商场顶楼（第3关）
            └── park.js               # 海边公园（第4关，BOSS）
```

**关键设计决策**：
- 所有模块挂载到全局 `window.WM` 对象
- 场景统一接口：`init(stageConfig) / update(dt) / draw(ctx) / handleInput(action, data) / isDone()`
- 关底基类提供 `init / updateAutoMove / drawPopup / confirmTask / playTaskAnim / onAnimDone` 框架
- 路线数据由 `generate-stages.js` 脚本从 `routes.json` 生成，避免手抄出错

**重要参考**：第 1 关已验证的实现逻辑在 [stage-1-flow.html](file:///e:/weekend_missions/preview/stage-1-flow.html)，所有场景模块应参考其中的纹理生成、玩家精灵、地图绘制、转场动画、通关动画逻辑。

---

## Task 1: 创建预览入口 HTML

**Files:**
- Create: `preview/stages-preview.html`

- [ ] **Step 1: 创建预览入口 HTML**

创建 `preview/stages-preview.html`，布局参考 `stage-1-flow.html`：顶部状态栏 + 上半地图 canvas + 黄黑分隔条 + 下半游戏 canvas + 扫描线遮罩。`<script>` 标签按依赖顺序加载所有 js 模块（非 ES module），最后调用 `WM.start()` 启动。

关键点：
- `#mapCanvas` 占上部 60%，`#gameCanvas` 固定 480×270 占下部 40%
- 加载顺序：core → textures → map → stages → scenes/intro → scenes/walk → scenes/transition → scenes/clear → scenes/finale → scenes/endings/base → scenes/endings/coffee → scenes/endings/bookstore → scenes/endings/mall → scenes/endings/park → flow
- Google Fonts 用 CDN（预览阶段，最终交付再本地化）
- 顶部状态栏显示 `STAGE X/4 · 关卡名` 和进度提示

完整 HTML 代码参考 spec 第九章。

- [ ] **Step 2: 提交**

```bash
git add preview/stages-preview.html
git commit -m "feat: 创建4关流程预览入口HTML"
```

---

## Task 2: 创建 core.js（全局状态与主循环）

**Files:**
- Create: `preview/js/core.js`

- [ ] **Step 1: 创建 core.js**

创建 `preview/js/core.js`，从 `stage-1-flow.html` 提取并改造全局逻辑。内容包括：

1. **全局命名空间 `window.WM`**：包含 `state`（phase/stageIndex/progress/hp/totalCost/totalDuration）、`currentStage`、`currentEnding`、`mapImgLoaded`、`tex`、`STAGES`、`ROUTES`、`scenes`、`endings`、`walkEffects`、`flow`、`map`
2. **常量**：`VIEW_W=480`、`VIEW_H=270`、`TILE=16`
3. **NES 调色板 `WM.PAL`**：从 `stage-1-flow.html` 的 PAL 对象完整复制，并新增 4 种行进风格色（citySky/forestSky/commercialSky/seasideSky）
4. **Canvas 引用**：`gameCanvas`、`gctx`、`mapCanvas`、`mctx`
5. **工具函数**：`makeTex(w,h,drawFn)`、`tx(i)`、`ty(i)`、`setProgress(text)`、`setStageInfo(text)`、`toGameCoord(e)`
6. **输入分发**：keydown 监听 Space/Enter，click/mousemove 监听 canvas，按 `WM.state.phase` 分发到对应场景的 `handleInput` 方法（ending 场景单独走 `WM.currentEnding`）
7. **主循环 `WM.gameLoop`**：dt 上限 50ms，按 phase 调用对应场景的 update/draw，地图在 walk/arrived/transition/finale 阶段刷新
8. **启动入口 `WM.start`**：fitCanvas → map.init → textures.init → 设置 stageIndex=0 → enterIntro → requestAnimationFrame

参考 `stage-1-flow.html` 第 134-176 行（PAL）、第 463-468 行（toGameCoord）、第 1141-1163 行（输入）、第 1170-1223 行（主循环和启动）。

- [ ] **Step 2: 提交**

```bash
git add preview/js/core.js
git commit -m "feat: 创建 core.js 全局状态与主循环"
```

---

## Task 3: 创建 textures.js（通用纹理生成）

**Files:**
- Create: `preview/js/textures.js`

- [ ] **Step 1: 创建 textures.js**

创建 `preview/js/textures.js`，从 `stage-1-flow.html` 提取所有纹理生成逻辑到 `WM.textures.init()` 方法。内容包括：

1. **咖啡馆纹理**（从 stage-1-flow.html 第 193-288 行提取）：floorA/floorB/wallFloor/wall/bar/machine/table/chair/lamp/menu/window/plant/star
2. **玩家精灵**（从第 293-346 行提取）：`drawPlayerFrame(g,dir,frame)` 函数 + `player[4][2]` 数组 + `playerHold`（持杯）
3. **新增玩家变体**：`playerHoldBook`（持书，绿色书+白页）、`playerHoldCamera`（持相机，黑色机身+黄灯）、`playerSit`（坐下姿态，BOSS关用）
4. **行进场景纹理**（从第 352-391 行提取）：building[3]、tree、cloud
5. **书店纹理**（新增）：`bookshelf`（32×40，3层书架×6本彩色书）、`readTable`（24×16，桌面+绿书）
6. **商场顶楼纹理**（新增）：`glassRail`（32×16，玻璃护栏）、`bench`（32×16，长椅）、`vendingMachine`（24×32，售货机带商品格）
7. **海边公园纹理**（新增）：`benchPark`（32×16，公园长椅）、`streetLamp`（8×32，路灯）、`beachTree`（16×32，椰子树）

所有纹理挂载到 `WM.tex` 对象。参考 `stage-1-flow.html` 的 `makeTex` 工具函数和 NES 调色板配色。

- [ ] **Step 2: 提交**

```bash
git add preview/js/textures.js
git commit -m "feat: 创建 textures.js 通用纹理生成"
```

---

## Task 4: 创建 map.js（真实地图绘制）

**Files:**
- Create: `preview/js/map.js`

- [ ] **Step 1: 创建 map.js**

创建 `preview/js/map.js`，从 `stage-1-flow.html` 提取地图绘制逻辑，扩展为支持任意关卡聚焦 + 全路线总览。内容包括：

1. **`WM.map` 对象**：`MAP_CENTER_LNG=113.935`、`MAP_CENTER_LAT=22.502`、`MAP_ZOOM=14`、`MAP_IMG_W=800`、`MAP_IMG_H=600`、`img`、`loaded`
2. **`init()`**：加载 `../docs/maps/shenzhen_full.png`，不设 crossOrigin，100ms 超时兜底隐藏 loading
3. **`resize()`**：根据父容器尺寸调整 mapCanvas
4. **`lngLatToPixel(lng,lat)`**：Web Mercator 投影，参考 stage-1-flow.html 第 454-462 行
5. **`draw(stageIndex)`**：绘制单关聚焦地图。从 `WM.ROUTES[stageIndex+1]` 取路线，计算 bounding box，填充比 0.8，绘制底图（或网格 fallback）+ 红色路径 + 起终点标记 + 移动标记（walk 阶段脉冲圆，arrived/transition/ending/clear 阶段终点实心圆）
6. **`drawAll()`**：绘制全路线总览（finale 用）。收集 4 条路线所有点，计算整体 bounding box，4 条路线全部标绿，5 个地点标记编号
7. **`drawMarker(x,y,color,label,name)`**：参考 stage-1-flow.html 第 551-568 行

参考 `stage-1-flow.html` 第 396-568 行的完整地图绘制逻辑。

- [ ] **Step 2: 提交**

```bash
git add preview/js/map.js
git commit -m "feat: 创建 map.js 真实地图绘制"
```

---

## Task 5: 创建路线数据生成脚本并生成 stages.js

**Files:**
- Create: `preview/generate-stages.js`（临时脚本）
- Create: `preview/js/stages.js`（由脚本生成）

- [ ] **Step 1: 创建生成脚本**

创建 `preview/generate-stages.js`（Node.js 脚本），读取 `../docs/maps/routes.json`，提取 4 条路线，去重相邻重复点，转换为 `[lng,lat]` 二元数组格式，输出 `preview/js/stages.js` 文件内容。

脚本逻辑：
```js
const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'maps', 'routes.json'), 'utf8'));

// 提取路线数据，去重相邻重复点
const routes = {};
data.routes.forEach((r, i) => {
    const pts = [];
    r.points.forEach(p => {
        const last = pts[pts.length-1];
        if (!last || last[0] !== p.lng || last[1] !== p.lat) {
            pts.push([p.lng, p.lat]);
        }
    });
    routes[i+1] = { from: r.from, to: r.to, pts };
});

// 4关配置
const stages = [
    {
        index: 0, name: "南海意馆", color: "#6B4423",
        route: routes[1],
        task: { title: "点一杯「孤独的星球」", cost: "¥45", duration: "1h", hp: 20 },
        walk: { style: "city", skyColor: "#1a2a4a", midColor: "#2a3a5a", groundColor: "#3a3a3a", dynamicElements: ["lamp_glow"] },
        ending: { type: "coffee", taskPoint: { x: 80, y: 176 }, path: [{x:240,y:224},{x:160,y:224},{x:112,y:208},{x:80,y:176}] },
    },
    {
        index: 1, name: "南山书城", color: "#2d5016",
        route: routes[2],
        task: { title: "找一本关于旅行的书", cost: "¥0", duration: "2h", hp: 15 },
        walk: { style: "forest", skyColor: "#a8d8f0", midColor: "#4a7c3a", groundColor: "#6B5333", dynamicElements: ["leaf_fall", "light_spot"] },
        ending: { type: "bookstore", taskPoint: { x: 80, y: 176 }, path: [{x:240,y:224},{x:160,y:224},{x:112,y:208},{x:80,y:176}] },
    },
    {
        index: 2, name: "海岸城", color: "#5a2a5a",
        route: routes[3],
        task: { title: "拍一张城市俯瞰照", cost: "¥0", duration: "1h", hp: 10 },
        walk: { style: "commercial", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
        ending: { type: "mall", taskPoint: { x: 80, y: 176 }, path: [{x:240,y:224},{x:160,y:224},{x:112,y:208},{x:80,y:176}] },
    },
    {
        index: 3, name: "深圳湾公园", color: "#ff7a3a",
        route: routes[4],
        task: { title: "在海边长椅坐10分钟", cost: "¥0", duration: "10min", hp: 0 },
        walk: { style: "seaside", skyColor: "#ff7a3a", midColor: "#4a7c9a", groundColor: "#8B7355", dynamicElements: ["wave_scroll", "seagull"] },
        ending: { type: "park", taskPoint: { x: 80, y: 176 }, path: [{x:240,y:224},{x:160,y:224},{x:112,y:208},{x:80,y:176}], isBoss: true, countdown: 10 },
    },
];

// 输出 stages.js
const output = `'use strict';

// ==========================================
// 内联路线数据（由 generate-stages.js 从 docs/maps/routes.json 生成，去重相邻重复点）
// ==========================================
WM.ROUTES = ${JSON.stringify(routes, null, 2)};

// ==========================================
// 4关配置数据
// ==========================================
WM.STAGES = ${JSON.stringify(stages, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'js', 'stages.js'), output, 'utf8');
console.log('Generated preview/js/stages.js');
console.log('Routes:', Object.keys(routes).map(k => `${k}: ${routes[k].from}→${routes[k].to} (${routes[k].pts.length} points)`).join(', '));
```

- [ ] **Step 2: 运行脚本生成 stages.js**

```bash
cd preview
node generate-stages.js
```

预期输出：
```
Generated preview/js/stages.js
Routes: 1: 海上世界→南海意馆 (X points), 2: 南海意馆→南山书城 (X points), 3: 南山书城→海岸城 (X points), 4: 海岸城→深圳湾公园 (X points)
```

- [ ] **Step 3: 验证生成的 stages.js**

打开 `preview/js/stages.js` 确认：
- `WM.ROUTES` 对象有 4 条路线，每条 `pts` 是 `[lng,lat]` 二元数组
- `WM.STAGES` 数组有 4 关配置，每关包含 index/name/color/route/task/walk/ending
- 第 4 关 ending 有 `isBoss: true` 和 `countdown: 10`

- [ ] **Step 4: 提交**

```bash
git add preview/generate-stages.js preview/js/stages.js
git commit -m "feat: 创建 stages.js 4关配置数据与路线数据生成脚本"
```

---

## Task 6: 创建 flow.js（流程状态机）

**Files:**
- Create: `preview/js/flow.js`

- [ ] **Step 1: 创建 flow.js**

创建 `preview/js/flow.js`，实现顶层状态机切换。`WM.flow` 对象包含以下方法（参考 spec 第四章）：

1. `enterIntro(stageConfig)`：设 phase='intro'，调用 `WM.scenes.intro.init(stageConfig)`
2. `enterWalk(stageConfig)`：设 phase='walk'，调用 `WM.scenes.walk.init(stageConfig)`
3. `arriveDestination()`：设 phase='arrived'，600ms 后调用 `enterTransition()`
4. `enterTransition()`：设 phase='transition'，调用 `WM.scenes.transition.init(WM.currentStage)`
5. `enterEnding(stageConfig)`：设 phase='ending'，根据 `stageConfig.ending.type` 选择 `WM.endings[type]`，调用其 `init(stageConfig)`
6. `onEndingComplete()`：调用 `enterClear()`
7. `enterClear()`：设 phase='clear'，调用 `WM.scenes.clear.init(WM.currentStage)`
8. `onClearDone()`：若 stageIndex<3，stageIndex++ 并 enterIntro；否则设 phase='finale' 并调用 `WM.scenes.finale.init()`

每个方法还要更新 `WM.setStageInfo` 显示当前关卡信息（如 `STAGE 2/4 · 南山书城`）。

参考 `stage-1-flow.html` 第 573-612 行的状态切换逻辑（startWalking/arriveAtDestination）和第 688-693 行（onCoffeeComplete）。

- [ ] **Step 2: 提交**

```bash
git add preview/js/flow.js
git commit -m "feat: 创建 flow.js 流程状态机"
```

---

## Task 7: 创建 scenes/intro.js（FC 开场界面）

**Files:**
- Create: `preview/js/scenes/intro.js`

- [ ] **Step 1: 创建 intro.js**

创建 `preview/js/scenes/intro.js`，实现 FC 风格开场动画。`WM.scenes.intro` 对象实现统一接口：

1. `init(stageConfig)`：存储 config，重置 `t=0`、`skipped=false`
2. `update(dt)`：累加 `t`，不自动结束（等用户输入）
3. `draw(ctx)`：按时间轴绘制
   - 0~0.2s：纯黑
   - 0.2~1.2s：`STAGE X` 大字（黄色 24px Press Start 2P）从中间弹出，闪烁2次
   - 1.2~1.8s：关卡名（白色 16px）从下滑入
   - 1.8~2.4s：任务简报（青色 10px，如"任务：点一杯「孤独的星球」"）淡入
   - 2.4s+：`PRESS SPACE`（黄色 8px）闪烁
   - 全程：纯黑背景 + 扫描线
4. `handleInput(action)`：若 action==='space' 或 'click' 且 `t>0.5s`（防误触），设 `skipped=true`，调用 `WM.flow.enterWalk(WM.currentStage)`
5. `isDone()`：返回 `skipped`

文字内容从 `stageConfig` 读取：`STAGE ${stageConfig.index+1}`、`stageConfig.name`、`任务：${stageConfig.task.title}`。

- [ ] **Step 2: 提交**

```bash
git add preview/js/scenes/intro.js
git commit -m "feat: 创建 FC 开场界面 intro.js"
```

---

## Task 8: 创建 scenes/walk.js（行进场景）

**Files:**
- Create: `preview/js/scenes/walk.js`

- [ ] **Step 1: 创建 walk.js**

创建 `preview/js/scenes/walk.js`，实现配置驱动的行进场景。`WM.scenes.walk` 对象：

1. `init(stageConfig)`：存储 config，重置 `progress=0`、`walkTimer=null`、`charFrame=0`、`charTimer=0`，初始化动态元素（调用 `WM.walkEffects[name].init()` for each name in `config.walk.dynamicElements`），设 `WM.setProgress('行进中 0%')`
2. `update(dt)`：
   - 累加 progress（每 50ms +2，约 2.5s 走完），参考 stage-1-flow.html 第 591-598 行
   - progress>=100 时调用 `WM.flow.arriveDestination()`
   - 更新走路动画帧（150ms 切换）
   - 更新所有动态元素
3. `draw(ctx)`：参考 stage-1-flow.html 第 722-795 行，但视差层颜色和动态元素由 `stageConfig.walk` 驱动：
   - 天空渐变：用 `stageConfig.walk.skyColor`
   - 中景层：根据 `stageConfig.walk.style` 绘制不同剪影（city=建筑、forest=树木、commercial=霓虹招牌、seaside=海平面+远山）
   - 地面层：用 `stageConfig.walk.groundColor`
   - 小人：从左 15% 走到右 75%，底部对齐草地顶部（`groundY - 16`）
   - 终点旗：固定右侧 78%
   - 进度条：底部
   - 顶部提示：`STAGE ${index+1} · 前往${stageConfig.name}`
   - 调用所有动态元素的 draw
4. `handleInput(action)`：空实现（行进阶段无需用户输入）

**4 种行进风格差异**（通过 style 判断）：
- city：建筑剪影 + 路灯（lamp_glow 效果）
- forest：树木轮廓 + 树叶飘落（leaf_fall）+ 光斑（light_spot）
- commercial：霓虹招牌剪影 + 霓虹闪烁（neon_flicker）+ 行人剪影（pedestrian）
- seaside：海平面+远山 + 海浪滚动（wave_scroll）+ 海鸥（seagull）

- [ ] **Step 2: 创建动态元素模块（在 walk.js 内或单独）**

在 `walk.js` 末尾定义 `WM.walkEffects` 对象，包含 7 个动态元素，每个有 `init()/update(dt)/draw(ctx)` 方法：

- `lamp_glow`：路灯暖光呼吸（sin 波动透明度）
- `leaf_fall`：树叶飘落（≤15 个粒子，从顶部生成，下落+左右摆动）
- `light_spot`：地面光斑闪烁（≤10 个，随机位置+随机透明度）
- `neon_flicker`：霓虹色块闪烁（随机切换颜色/熄灭）
- `pedestrian`：行人剪影走过（≤5 个，从右到左，不同速度）
- `wave_scroll`：海浪线条滚动（3层正弦波，不同速度）
- `seagull`：海鸥剪影飞过（≤3 个，从左到右，上下浮动）

粒子数限制参考 spec 第八章。

- [ ] **Step 3: 提交**

```bash
git add preview/js/scenes/walk.js
git commit -m "feat: 创建行进场景 walk.js 与动态元素"
```

---

## Task 9: 创建 scenes/transition.js（转场动画）

**Files:**
- Create: `preview/js/scenes/transition.js`

- [ ] **Step 1: 创建 transition.js**

创建 `preview/js/scenes/transition.js`，从 `stage-1-flow.html` 提取转场逻辑。`WM.scenes.transition` 对象：

1. `init(stageConfig)`：存储 config，重置 `t=0`、`phase=0`、`endingInited=false`
2. `update(dt)`：参考 stage-1-flow.html 第 619-642 行，**关键坑点**：phase 1 的两个时间点判断用独立 `if` + 标志位，不能用 `else if` 链
   - phase 0 (400ms)：黑条合拢
   - phase 1 (900ms)：全黑+文字，中途（t>450ms 且 !endingInited）初始化关底场景
   - phase 2 (400ms)：黑条展开 → 调用 `WM.flow.enterEnding(WM.currentStage)`
3. `draw(ctx)`：参考 stage-1-flow.html 第 644-686 行
   - phase 0/2：绘制上下黑条（合拢/展开，cubic ease）
   - phase 1：全黑 + 显示"进入${stageConfig.name}..."（黄色闪烁）+ "任务：${stageConfig.task.title}"（白色）
   - phase 1 时背景渲染行进场景（phase<=1），phase 2 时渲染关底场景

文字内容从 `stageConfig` 读取，不再硬编码"南海意馆咖啡"。

- [ ] **Step 2: 提交**

```bash
git add preview/js/scenes/transition.js
git commit -m "feat: 创建转场动画 transition.js"
```

---

## Task 10: 创建 scenes/endings/base.js（关底基类）

**Files:**
- Create: `preview/js/scenes/endings/base.js`

- [ ] **Step 1: 创建 base.js**

创建 `preview/js/scenes/endings/base.js`，提供关底场景基类。`WM.endings.base` 对象：

1. `init(stageConfig)`：存储 config，初始化 `player={x:240,y:224,w:12,h:8,dir:0,frame:0,moving:false,animTimer:0,speed:0.9,holding:false}`，`phase='auto_move'`，`steamParticles=[]`，`path=stageConfig.ending.path`，`pathIdx=0`，`popupBtn={x:VIEW_W/2-70,y:VIEW_H/2+18,w:140,h:22}`，`popupHover=false`
2. `update(dt)`：若 phase==='auto_move' 调用 `updateAutoMove(dt)`，调用 `updateSteam(dt)`（子类可扩展）
3. `updateAutoMove(dt)`：参考 stage-1-flow.html 第 870-903 行，沿 path 逐点移动，到达后设 phase='popup'，玩家朝向吧台
4. `confirmTask()`：设 phase='task_anim'，调用 `playTaskAnim()`（子类覆盖）
5. `playTaskAnim()`：基类默认空实现，2秒后调用 `onAnimDone()`
6. `onAnimDone()`：设 phase='done'，调用 `WM.flow.onEndingComplete()`
7. `handleInput(action, data)`：若 phase==='popup' 且 action==='space' 或 'click'（点击在 popupBtn 区域内），调用 `confirmTask()`
8. `handleMouseMove(mx,my)`：检测 popupBtn hover
9. `draw(ctx)`：调用 `drawBackground()/drawDecorations()/drawTaskPoint()/drawPlayer()/drawSteam()/drawLighting()/drawPopup()`（子类覆盖 drawBackground 和 drawDecorations）
10. `drawPlayer()`：参考 stage-1-flow.html 第 1007-1011 行，根据 player.holding 选择纹理
11. `drawPopup()`：参考 stage-1-flow.html 第 1036-1072 行，通用弹窗（标题/任务/按钮），文字从 `stageConfig.task` 读取
12. `drawLighting()`：参考 stage-1-flow.html 第 1022-1034 行，暖光叠加
13. `updateSteam(dt)` 和 `drawSteam(ctx)`：参考 stage-1-flow.html 第 948-955 行和 1013-1019 行

子类需覆盖：`drawBackground(ctx)`、`drawDecorations(ctx)`、`playTaskAnim()`、`drawTaskPoint()`（可选）

- [ ] **Step 2: 提交**

```bash
git add preview/js/scenes/endings/base.js
git commit -m "feat: 创建关底基类 base.js"
```

---

## Task 11: 创建 endings/coffee.js（咖啡店·第1关）

**Files:**
- Create: `preview/js/scenes/endings/coffee.js`

- [ ] **Step 1: 创建 coffee.js**

创建 `preview/js/scenes/endings/coffee.js`，继承 `WM.endings.base`，从 `stage-1-flow.html` 的 CoffeeScene 提取差异部分。`WM.endings.coffee` 对象：

1. 用 `Object.create(WM.endings.base)` 创建
2. 覆盖 `drawBackground(ctx)`：绘制咖啡馆地板和墙壁，参考 stage-1-flow.html 第 985-993 行
3. 覆盖 `drawDecorations(ctx)`：绘制咖啡馆装饰物（lamp/menu/window/bar/machine/plant/table/chair），参考 stage-1-flow.html 第 804-816 行的 `coffeeDecorations` 数组和第 995-999 行的绘制逻辑
4. 覆盖 `playTaskAnim()`：参考 stage-1-flow.html 第 905-928 行的 `confirmOrder` 逻辑
   - 生成蒸汽粒子（6个，从咖啡机位置）
   - 2.5秒后设 `player.holding=true`（持杯）
   - 再 0.8秒后调用 `onAnimDone()`
5. 覆盖 `drawTaskPoint()`：绘制浮动星星，参考 stage-1-flow.html 第 1002-1005 行
6. `init(stageConfig)` 调用 `super.init` 后，设置 `player.holding` 用 `WM.tex.playerHold` 纹理

装饰物布局直接复用 stage-1-flow.html 的 `coffeeDecorations` 数组。

- [ ] **Step 2: 提交**

```bash
git add preview/js/scenes/endings/coffee.js
git commit -m "feat: 创建咖啡店关底场景 coffee.js"
```

---

## Task 12: 创建 endings/bookstore.js（书店·第2关）

**Files:**
- Create: `preview/js/scenes/endings/bookstore.js`

- [ ] **Step 1: 创建 bookstore.js**

创建 `preview/js/scenes/endings/bookstore.js`，继承 `WM.endings.base`。`WM.endings.bookstore` 对象：

1. 用 `Object.create(WM.endings.base)` 创建
2. 覆盖 `drawBackground(ctx)`：绘制书店地板（木地板用 floorA/floorB）和墙壁（wall），布局类似咖啡馆但色调偏冷（绿色调）
3. 覆盖 `drawDecorations(ctx)`：绘制书店装饰物
   - 5 个 `bookshelf` 纹理沿后墙排列
   - 2 个 `readTable` + `chair` 在中间
   - 1 个 `plant` 在角落
   - 1 个 `lamp` 在天花板
   定义 `bookstoreDecorations` 数组，类似 `coffeeDecorations`
4. 覆盖 `playTaskAnim()`：
   - 设 phase='task_anim'
   - 生成"书架抖动"效果（1秒，bookshelf 位置轻微震动）
   - 1秒后生成"书本滑出"粒子（从书架飞向玩家）
   - 2秒后设 `player.holding=true`（用 `WM.tex.playerHoldBook` 纹理）
   - 再 0.8秒后调用 `onAnimDone()`
5. 覆盖 `drawPlayer()`：若 `player.holding` 用 `WM.tex.playerHoldBook`，否则用默认
6. 覆盖 `drawTaskPoint()`：绘制浮动星星在目标书架前

装饰物布局参考咖啡馆，但用书店纹理替换。

- [ ] **Step 2: 提交**

```bash
git add preview/js/scenes/endings/bookstore.js
git commit -m "feat: 创建书店关底场景 bookstore.js"
```

---

## Task 13: 创建 endings/mall.js（商场顶楼·第3关）

**Files:**
- Create: `preview/js/scenes/endings/mall.js`

- [ ] **Step 1: 创建 mall.js**

创建 `preview/js/scenes/endings/mall.js`，继承 `WM.endings.base`。`WM.endings.mall` 对象：

1. 用 `Object.create(WM.endings.base)` 创建
2. 覆盖 `drawBackground(ctx)`：绘制商场顶楼
   - 地板：用 floorA/floorB 但色调偏冷灰
   - 墙壁：用 glassRail 纹理（玻璃护栏）代替实心墙，表示露天顶楼
   - 远景：绘制城市建筑剪影（用 building 纹理，缩小+偏暗）
3. 覆盖 `drawDecorations(ctx)`：绘制顶楼装饰物
   - 沿护栏排列 `glassRail`
   - 2 个 `bench` 长椅
   - 1 个 `vendingMachine` 售货机
   - 1 个 `plant` 绿植
   定义 `mallDecorations` 数组
4. 覆盖 `playTaskAnim()`：
   - 设 phase='task_anim'
   - "镜头拉近"效果（1秒，画布缩放从 1.0 到 1.3，中心对准玩家）
   - 1秒后"闪光"效果（白色全屏闪烁 200ms）
   - 1.2秒后显示"照片框"（黑色边框 + 白色内框 + 玩家剪影）
   - 2.5秒后设 `player.holding=true`（用 `WM.tex.playerHoldCamera` 纹理）
   - 再 0.8秒后调用 `onAnimDone()`
5. 覆盖 `drawPlayer()`：若 `player.holding` 用 `WM.tex.playerHoldCamera`
6. 覆盖 `drawTaskPoint()`：绘制浮动星星在护栏边（最佳拍照点）

- [ ] **Step 2: 提交**

```bash
git add preview/js/scenes/endings/mall.js
git commit -m "feat: 创建商场顶楼关底场景 mall.js"
```

---

## Task 14: 创建 endings/park.js（海边公园·第4关 BOSS）

**Files:**
- Create: `preview/js/scenes/endings/park.js`

- [ ] **Step 1: 创建 park.js**

创建 `preview/js/scenes/endings/park.js`，继承 `WM.endings.base`，覆盖交互逻辑加入倒计时。`WM.endings.park` 对象：

1. 用 `Object.create(WM.endings.base)` 创建
2. 覆盖 `init(stageConfig)`：调用 `super.init`，额外初始化 `countdown=stageConfig.ending.countdown`（10）、`countdownTimer=0`、`sunsetProgress=0`
3. 覆盖 `drawBackground(ctx)`：绘制海边公园
   - 天空：渐变（橙红→深紫，随 sunsetProgress 变化）
   - 海面：蓝色波浪（用 wave_scroll 效果）
   - 地面：木栈道纹理（用 groundColor）
   - 远山：剪影
4. 覆盖 `drawDecorations(ctx)`：绘制公园装饰物
   - 1 个 `benchPark` 长椅（任务点）
   - 2 个 `streetLamp` 路灯
   - 2 个 `beachTree` 椰子树
   定义 `parkDecorations` 数组
5. 覆盖 `confirmTask()`：**BOSS 关特殊逻辑**
   - 设 phase='task_anim'
   - 设 `player` 纹理为 `WM.tex.playerSit`（坐下姿态）
   - 设 `player.moving=false`
   - 开始倒计时
6. 覆盖 `playTaskAnim()`：**BOSS 关倒计时逻辑**
   - 每帧 `countdownTimer += dt`
   - 每秒 `countdown--`，更新 `sunsetProgress = (10 - countdown) / 10`
   - 倒计时到 0 时调用 `onAnimDone()`
7. 覆盖 `draw(ctx)`：调用 super.draw，额外绘制倒计时进度条
   - 屏幕下方：10 格进度条（像素风，每秒消失一格）
   - 倒计时数字（大字，黄色）
8. 覆盖 `drawPlayer()`：若 phase==='task_anim' 用 `WM.tex.playerSit`
9. 覆盖 `drawTaskPoint()`：绘制浮动星星在长椅前

- [ ] **Step 2: 提交**

```bash
git add preview/js/scenes/endings/park.js
git commit -m "feat: 创建海边公园BOSS关底场景 park.js"
```

---

## Task 15: 创建 scenes/clear.js（通关动画）

**Files:**
- Create: `preview/js/scenes/clear.js`

- [ ] **Step 1: 创建 clear.js**

创建 `preview/js/scenes/clear.js`，从 `stage-1-flow.html` 提取通关动画逻辑。`WM.scenes.clear` 对象：

1. `init(stageConfig)`：存储 config，重置 `t=0`、`phase=0`，更新 `WM.state.hp -= stageConfig.task.hp`、`WM.state.totalCost += 解析stageConfig.task.cost`、`WM.state.totalDuration += 解析stageConfig.task.duration`
2. `update(dt)`：参考 stage-1-flow.html 第 1080-1086 行
   - phase 0 (200ms)：闪白
   - phase 1 (400ms)：黑边合拢
   - phase 2 (600ms)：STAGE CLEAR 文字弹出
   - phase 3 (2500ms)：任务回顾 → 调用 `WM.flow.onClearDone()`
3. `draw(ctx)`：参考 stage-1-flow.html 第 1088-1135 行
   - phase 0：白色遮罩淡出
   - phase 1+：上下黑边合拢（cubic ease）
   - phase 2+：`STAGE CLEAR` 像素文字（黄色 24px，scale 弹性动画）
   - phase 3：任务回顾（任务名✓ + 消耗¥ + 时长 + HP变化），文字从 `stageConfig.task` 读取

**注意**：clear 动画期间背景仍渲染当前关底场景（`WM.currentEnding.draw(ctx)`），通关动画叠加在上面。

- [ ] **Step 2: 提交**

```bash
git add preview/js/scenes/clear.js
git commit -m "feat: 创建通关动画 clear.js"
```

---

## Task 16: 创建 scenes/finale.js（总通关动画）

**Files:**
- Create: `preview/js/scenes/finale.js`

- [ ] **Step 1: 创建 finale.js**

创建 `preview/js/scenes/finale.js`，实现总通关动画。`WM.scenes.finale` 对象：

1. `init()`：重置 `t=0`，调用 `WM.map.drawAll()` 绘制全路线总览
2. `update(dt)`：累加 `t`
3. `draw(ctx)`：按时间轴绘制
   - 0~0.5s：黑屏
   - 0.5~1.5s：`ALL STAGES CLEARED!`（黄色大字 20px）弹入
   - 1.5~3.0s：4关路线总览地图淡入（调用 `WM.map.drawAll()`，alpha 渐变）
   - 3.0~4.0s：冒险总结淡入
     - `通关数 4/4`
     - `总花费 ${WM.state.totalCost}`
     - `总时长 ${WM.state.totalDuration}h`
     - `剩余 HP ${WM.state.hp}/100`
   - 4.0~5.0s：评级显示（基于剩余 HP）
     - S：HP≥40（金色）
     - A：HP≥20（黄色）
     - B：HP≥1（绿色）
     - C：HP=0（红色）
     评级字母大字 32px，带光晕效果
   - 5.0s+：`PRESS ENTER 重玩` 闪烁
4. `handleInput(action)`：若 action==='enter'，重置 `WM.state`（hp=100/totalCost=0/totalDuration=0/stageIndex=0），`WM.currentStage=WM.STAGES[0]`，调用 `WM.flow.enterIntro(WM.currentStage)`

**注意**：finale 阶段地图 canvas 显示全路线总览（在 core.js 的主循环中 phase==='finale' 时调用 `WM.map.drawAll()`）。

- [ ] **Step 2: 提交**

```bash
git add preview/js/scenes/finale.js
git commit -m "feat: 创建总通关动画 finale.js"
```

---

## Task 17: 集成测试与修复

**Files:**
- Modify: 各 js 文件（按需修复）

- [ ] **Step 1: 在 TRAE 内置浏览器打开预览**

打开 `preview/stages-preview.html`，验证完整流程：

1. **intro 阶段**：FC 开场显示 STAGE 1 + 南海意馆 + 任务 + PRESS SPACE
2. 按 Space → 进入 walk
3. **walk 阶段**：城市街道风格，小人从左走到右，进度条增长，地图标记移动
4. 进度 100% → arrived（0.6s）→ transition
5. **transition 阶段**：黑条合拢 → "进入南海意馆..." → 黑条展开（验证不卡住）
6. **ending 阶段（coffee）**：自动移动到吧台 → 弹窗 → 按 Space → 蒸汽 → 持杯
7. **clear 阶段**：闪白 → 黑边 → STAGE CLEAR → 任务回顾 → 自动进入第2关 intro
8. 重复验证第 2-3 关（bookstore/mall）
9. **第4关 park（BOSS）**：自动移动到长椅 → 弹窗 → 按 Space → 坐下 → 10秒倒计时（进度条+日落渐变）→ clear
10. **finale 阶段**：ALL STAGES CLEARED → 4关地图总览 → 总结 → 评级 → PRESS ENTER
11. 按 Enter → 重玩

- [ ] **Step 2: 在用户浏览器（file://）打开预览**

用 Chrome/Edge 直接双击打开 `preview/stages-preview.html`，验证：
- 地图图片加载（或降级网格背景）
- 路线数据正确（不 fetch）
- 所有 JS 加载顺序正确（无未定义错误）
- 完整流程可走通

- [ ] **Step 3: 修复发现的问题**

根据测试结果修复：
- 转场动画卡住（参考 stage-1-flow.html 的 `coffeeInited` 标志位方案）
- 小人位置不对（`groundY - 16` 底部对齐）
- 地图标记不移动（phase 名称匹配）
- 关底场景切换错误（ending.type 与模块名匹配）
- 通关后不进入下一关（stageIndex 边界检查）

- [ ] **Step 4: 提交修复**

```bash
git add preview/js/
git commit -m "fix: 集成测试修复"
```

---

## Task 18: 更新项目进度记录文档

**Files:**
- Modify: `项目进度记录.md`

- [ ] **Step 1: 更新进度记录**

更新 `项目进度记录.md`：
- 当前完成度：4关流程扩展已完成
- 新增文件结构：js/ 目录下所有模块
- 验证结果：TRAE 浏览器 + 用户浏览器（file://）均通过
- 待办：主应用 index.html 集成（下一个 spec）

- [ ] **Step 2: 提交**

```bash
git add 项目进度记录.md
git commit -m "docs: 更新项目进度记录"
```

---

## Self-Review

### Spec 覆盖检查
- ✅ FC 开场界面 → Task 7
- ✅ 4 种行进场景风格 → Task 8
- ✅ 转场动画 → Task 9
- ✅ 4 个关底场景 → Task 10-14
- ✅ 通关动画 → Task 15
- ✅ 总通关动画 → Task 16
- ✅ BOSS 关倒计时 → Task 14
- ✅ 路线数据内联 → Task 5
- ✅ 地图绘制（单关+全路线） → Task 4
- ✅ 模块结构与全局通信 → Task 1-3, 6
- ✅ 集成测试 → Task 17

### 类型一致性检查
- 场景接口 `init/update/draw/handleInput` 全部统一 ✅
- 关底基类方法名 `init/updateAutoMove/confirmTask/playTaskAnim/onAnimDone` 全部一致 ✅
- `WM.state.phase` 值：intro/walk/arrived/transition/ending/clear/finale 全部一致 ✅
- `stageConfig` 字段：index/name/color/route/task/walk/ending 全部一致 ✅

### 已知风险
- 路线数据由脚本生成，需确认 Node.js 环境可用
- Google Fonts CDN 在离线环境不可用（预览阶段可接受，最终交付需本地化）
- 4 个关底场景的装饰物布局需实际调试调整坐标

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-23-stage-flow-expansion.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
