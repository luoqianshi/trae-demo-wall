# 阶段 2：杭州/上海多城市路线补全 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于已下载的高德地图与路线数据，补全 `hangzhou-solo`、`shanghai-friends` 两条主题线，并在 AI 首页解锁三主题选择。

**Architecture:** 保持现有 `WM.THEMES` 数据驱动架构不变。通过改造 `generate-stages.js` 读取三份 route JSON，生成三套 `theme.routes/theme.stages/theme.map`；`app.js` 只负责解锁入口与预算/人数联动，引擎无需扩展。

**Tech Stack:** 纯 HTML/CSS/JS；Node.js 数据生成脚本；本地 JSON/PNG；普通 `<script>` 加载；file:// 离线运行。

**Spec:** [2026-06-24-stage2-multi-city-routes-design.md](file:///e:/weekend_missions/docs/superpowers/specs/2026-06-24-stage2-multi-city-routes-design.md)

---

## 文件结构与职责

### 修改文件

| 文件 | 职责 |
|---|---|
| `generate-stages.js` | 改成多城市数据生成器：读取深圳/杭州/上海 route JSON，生成三套 `WM.THEMES` |
| `js/stages.js` | 由 `generate-stages.js` 重新生成，不手改 |
| `js/app.js` | 解锁杭州/上海场景 chip；扩展预算 chip；点击场景时联动默认预算/人数 |

### 读取文件

| 文件 | 用途 |
|---|---|
| `docs/maps/routes.json` | 深圳路线源数据 |
| `docs/maps/routes-hangzhou.json` | 杭州路线源数据 |
| `docs/maps/routes-shanghai.json` | 上海路线源数据 |
| `docs/maps/shenzhen_full.png` | 深圳底图 |
| `docs/maps/hangzhou.png` | 杭州底图 |
| `docs/maps/shanghai.png` | 上海底图 |

### 不修改文件

| 文件 | 原因 |
|---|---|
| `js/core.js` | 已支持 `WM.startMission(themeId)` 与自适应关数 |
| `js/map.js` | 已从 `theme.map` 读取底图、投影参数和 places |
| `js/flow.js` | 已按 `WM.STAGES.length` 自适应 |
| `js/scenes/*` | 复用现有关底与行进场景 |

---

## Task 1: 改造 route 数据加载工具

**Files:**
- Modify: `generate-stages.js`

- [ ] **Step 1: 用 `loadRouteData(fileName)` 替换当前单文件读取逻辑**

将文件顶部当前逻辑：

```js
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs', 'maps', 'routes.json'), 'utf8'));

// 提取路线数据，去重相邻重复点
const routes = {};
data.routes.forEach((r, i) => {
    const pts = [];
    r.points.forEach(p => {
        const last = pts[pts.length - 1];
        if (!last || last[0] !== p.lng || last[1] !== p.lat) {
            pts.push([p.lng, p.lat]);
        }
    });
    routes[i + 1] = { from: r.from, to: r.to, pts };
});
```

替换为：

```js
function loadRouteData(fileName) {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs', 'maps', fileName), 'utf8'));
    const routes = {};
    raw.routes.forEach((r, i) => {
        const pts = [];
        r.points.forEach(p => {
            const last = pts[pts.length - 1];
            if (!last || last[0] !== p.lng || last[1] !== p.lat) {
                pts.push([p.lng, p.lat]);
            }
        });
        routes[i + 1] = {
            from: r.from,
            to: r.to,
            distance: r.distance || 0,
            duration: r.duration || 0,
            pts,
        };
    });
    return {
        places: raw.places.map(p => ({ name: p.name, lng: p.lng, lat: p.lat })),
        routes,
    };
}

const shenzhenData = loadRouteData('routes.json');
const hangzhouData = loadRouteData('routes-hangzhou.json');
const shanghaiData = loadRouteData('routes-shanghai.json');
```

- [ ] **Step 2: 临时运行语法检查**

Run:

```bash
node --check generate-stages.js
```

Expected:

```text
(no output, exit code 0)
```

---

## Task 2: 更新深圳 stages 引用，保持原行为不变

**Files:**
- Modify: `generate-stages.js`

- [ ] **Step 1: 把深圳 stage 的 `route: routes[n]` 改为 `route: shenzhenData.routes[n]`**

修改四处：

```js
route: shenzhenData.routes[1]
route: shenzhenData.routes[2]
route: shenzhenData.routes[3]
route: shenzhenData.routes[4]
```

- [ ] **Step 2: 把深圳 theme 的 `map.places`、`routes` 改为从 `shenzhenData` 读取**

深圳 theme 中：

```js
places: data.places.map(p => ({ name: p.name, lng: p.lng, lat: p.lat }))
```

改为：

```js
places: shenzhenData.places
```

并将：

```js
routes: routes,
```

改为：

```js
routes: shenzhenData.routes,
```

- [ ] **Step 3: 运行生成脚本，确认深圳仍可生成**

Run:

```bash
node generate-stages.js
```

Expected output contains:

```text
Generated js/stages.js
Themes: shenzhen-couple
  shenzhen-couple: 4 stages, 4 routes
```

---

## Task 3: 新增杭州 stages 与 theme

**Files:**
- Modify: `generate-stages.js`

- [ ] **Step 1: 在 `shenzhenStages` 后新增 `hangzhouStages`**

插入完整配置：

```js
const hangzhouStages = [
    {
        index: 0, name: "河坊街老面馆", color: "#8B7355",
        route: hangzhouData.routes[1],
        task: { title: "吃一碗热乎的片儿川", cost: "¥25", duration: "30min", hp: 12 },
        note: "河坊街的老味道藏在热气里，一个人坐下也可以认真吃一顿饭。",
        walk: { style: "city", skyColor: "#8fbfe8", midColor: "#8B7355", groundColor: "#6B5333", dynamicElements: ["lamp_glow"] },
        ending: { type: "coffee", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 1, name: "中国美术学院南山校区", color: "#00D2D3",
        route: hangzhouData.routes[2],
        task: { title: "在校园里找一幅喜欢的作品", cost: "¥0", duration: "45min", hp: 12 },
        note: "校园里的墙、树影和展窗都像一幅画。慢慢走，挑一幅只属于今天的作品。",
        walk: { style: "forest", skyColor: "#a8d8f0", midColor: "#4a7c3a", groundColor: "#6B5333", dynamicElements: ["leaf_fall", "light_spot"] },
        ending: { type: "bookstore", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 2, name: "南宋御街", color: "#E67E22",
        route: hangzhouData.routes[3],
        task: { title: "逛一间小店，挑一个纪念品", cost: "¥40", duration: "1h", hp: 15 },
        note: "旧街的招牌和石板路把时间拉慢。给未来的自己带走一个小物件。",
        walk: { style: "commercial", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
        ending: { type: "mall", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 3, name: "宝石山日落", color: "#27AE60",
        route: hangzhouData.routes[4],
        task: { title: "爬上山顶，看一次西湖日落", cost: "¥0", duration: "1.5h", hp: 15 },
        note: "这是今天的压轴。站在山顶时，西湖会把一整天的疲惫都收走。",
        walk: { style: "forest", skyColor: "#ff9a5a", midColor: "#4a7c3a", groundColor: "#6B5333", dynamicElements: ["leaf_fall", "light_spot"] },
        ending: { type: "park", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }], isBoss: true, countdown: 10 },
    },
];
```

- [ ] **Step 2: 在 `themes` 中新增 `hangzhou-solo`**

在 `shenzhen-couple` 后新增：

```js
"hangzhou-solo": {
    id: "hangzhou-solo",
    title: "杭州·独居时光漫步",
    city: "杭州",
    budget: 150,
    groupSize: 1,
    themeColor: "#00D2D3",
    scene: { label: "独行漫游", city: "杭州西湖" },
    briefing: [
        "特工，密令已下达。",
        "本次任务：杭州·独居时光漫步",
        "作战时间：今日 13:00 - 19:00",
        "作战预算：¥150",
        "作战人数：1 人",
        "任务：一个人，一座城，发现杭州的小众浪漫。"
    ],
    map: {
        centerLng: 120.150000,
        centerLat: 30.280000,
        zoom: 13,
        imgW: 800,
        imgH: 600,
        img: "docs/maps/hangzhou.png",
        places: hangzhouData.places
    },
    routes: hangzhouData.routes,
    stages: hangzhouStages,
},
```

- [ ] **Step 3: 运行生成脚本，确认两主题输出**

Run:

```bash
node generate-stages.js
```

Expected output contains:

```text
Themes: shenzhen-couple, hangzhou-solo
  shenzhen-couple: 4 stages, 4 routes
  hangzhou-solo: 4 stages, 4 routes
```

---

## Task 4: 新增上海 stages 与 theme

**Files:**
- Modify: `generate-stages.js`

- [ ] **Step 1: 在 `hangzhouStages` 后新增 `shanghaiStages`**

插入完整配置：

```js
const shanghaiStages = [
    {
        index: 0, name: "老上海本帮菜", color: "#E67E22",
        route: shanghaiData.routes[1],
        task: { title: "点一份红烧肉，给兄弟夹第一筷", cost: "¥150", duration: "1.5h", hp: 15 },
        note: "上海的热闹从饭桌开始。第一关不是赶路，是先把气氛吃热。",
        walk: { style: "commercial", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
        ending: { type: "coffee", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 1, name: "田子坊艺术区", color: "#F1C40F",
        route: shanghaiData.routes[2],
        task: { title: "找一面最适合合影的墙", cost: "¥0", duration: "1h", hp: 12 },
        note: "巷子越窄，惊喜越多。给小队找一张能证明到此一游的背景。",
        walk: { style: "city", skyColor: "#1a2a4a", midColor: "#2a3a5a", groundColor: "#3a3a3a", dynamicElements: ["lamp_glow"] },
        ending: { type: "bookstore", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 2, name: "南京路步行街", color: "#F39C12",
        route: shanghaiData.routes[3],
        task: { title: "买一份老字号伴手礼", cost: "¥100", duration: "1h", hp: 12 },
        note: "人潮、霓虹、招牌和老字号，这一关要在热闹里保持队形。",
        walk: { style: "commercial", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
        ending: { type: "mall", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },
    },
    {
        index: 3, name: "外滩夜景", color: "#FFD700",
        route: shanghaiData.routes[4],
        task: { title: "在外滩拍一张通关合照", cost: "¥0", duration: "1h", hp: 15 },
        note: "这是今天的压轴。站在江边，对面亮起的灯就是最终通关画面。",
        walk: { style: "seaside", skyColor: "#1a2a4a", midColor: "#4a7c9a", groundColor: "#2a2a2a", dynamicElements: ["wave_scroll", "seagull"] },
        ending: { type: "park", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }], isBoss: true, countdown: 10 },
    },
];
```

- [ ] **Step 2: 在 `themes` 中新增 `shanghai-friends`**

在 `hangzhou-solo` 后新增：

```js
"shanghai-friends": {
    id: "shanghai-friends",
    title: "上海·兄弟聚会闯关",
    city: "上海",
    budget: 500,
    groupSize: 4,
    themeColor: "#F1C40F",
    scene: { label: "好友聚会", city: "上海黄浦" },
    briefing: [
        "特工，密令已下达。",
        "本次任务：上海·兄弟聚会闯关",
        "作战时间：今日 14:00 - 22:00",
        "作战预算：¥500",
        "作战人数：4 人",
        "任务：集合小队，穿过上海最热闹的街区。"
    ],
    map: {
        centerLng: 121.470000,
        centerLat: 31.230000,
        zoom: 13,
        imgW: 800,
        imgH: 600,
        img: "docs/maps/shanghai.png",
        places: shanghaiData.places
    },
    routes: shanghaiData.routes,
    stages: shanghaiStages,
},
```

- [ ] **Step 3: 运行生成脚本，确认三主题输出**

Run:

```bash
node generate-stages.js
```

Expected output contains:

```text
Themes: shenzhen-couple, hangzhou-solo, shanghai-friends
  shenzhen-couple: 4 stages, 4 routes
  hangzhou-solo: 4 stages, 4 routes
  shanghai-friends: 4 stages, 4 routes
```

---

## Task 5: 解锁 AI 首页三场景入口

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: 给 `WM.app` 增加主题默认配置**

在 `chipSelection` 后新增：

```js
    themeDefaults: {
        'shenzhen-couple': { budget: 200, people: 2 },
        'hangzhou-solo': { budget: 150, people: 1 },
        'shanghai-friends': { budget: 500, people: 4 },
    },
```

- [ ] **Step 2: 解锁 `sceneChips`**

将：

```js
var sceneChips = [
    { label: '情侣约会', value: 'shenzhen-couple', locked: false },
    { label: '独行漫游', value: 'hangzhou-solo', locked: true },
    { label: '好友聚会', value: 'shanghai-friends', locked: true },
];
```

改为：

```js
var sceneChips = [
    { label: '情侣约会', value: 'shenzhen-couple', locked: false },
    { label: '独行漫游', value: 'hangzhou-solo', locked: false },
    { label: '好友聚会', value: 'shanghai-friends', locked: false },
];
```

- [ ] **Step 3: 扩展预算 chip**

将：

```js
var budgetChips = [{ label: '¥100', value: 100 }, { label: '¥200', value: 200 }, { label: '¥300', value: 300 }];
```

改为：

```js
var budgetChips = [
    { label: '¥100', value: 100 },
    { label: '¥150', value: 150 },
    { label: '¥200', value: 200 },
    { label: '¥300', value: 300 },
    { label: '¥500', value: 500 },
];
```

- [ ] **Step 4: 新增 `applyThemeDefaults(themeId)` 方法**

在 `renderAiChat` 方法前新增：

```js
    applyThemeDefaults: function (themeId) {
        var defaults = this.themeDefaults[themeId];
        if (!defaults) return;
        this.chipSelection.budget = defaults.budget;
        this.chipSelection.people = defaults.people;
        document.querySelectorAll('#chips-budget .chip').forEach(function (chip) {
            chip.classList.toggle('selected', Number(chip.getAttribute('data-value')) === defaults.budget);
        });
        document.querySelectorAll('#chips-people .chip').forEach(function (chip) {
            chip.classList.toggle('selected', Number(chip.getAttribute('data-value')) === defaults.people);
        });
    },
```

- [ ] **Step 5: 给预算/人数 chip 加 `data-value`**

预算 chip 创建后增加：

```js
chip.setAttribute('data-value', String(c.value));
```

人数 chip 创建后也增加同一行。

- [ ] **Step 6: 点击场景时调用默认联动**

在场景点击回调中：

```js
self.chipSelection.scene = c.value;
sceneBox.querySelectorAll('.chip').forEach(function (n) { n.classList.remove('selected'); });
chip.classList.add('selected');
document.getElementById('generate-btn').disabled = false;
```

改为：

```js
self.chipSelection.scene = c.value;
sceneBox.querySelectorAll('.chip').forEach(function (n) { n.classList.remove('selected'); });
chip.classList.add('selected');
self.applyThemeDefaults(c.value);
document.getElementById('generate-btn').disabled = false;
```

---

## Task 6: 基础静态验证

**Files:**
- Test only

- [ ] **Step 1: 语法检查修改过的 JS 文件**

Run:

```bash
node --check generate-stages.js
node --check js/app.js
```

Expected:

```text
(no output, exit code 0)
```

- [ ] **Step 2: 重新生成 stages**

Run:

```bash
node generate-stages.js
```

Expected:

```text
Generated js/stages.js
Themes: shenzhen-couple, hangzhou-solo, shanghai-friends
  shenzhen-couple: 4 stages, 4 routes
  hangzhou-solo: 4 stages, 4 routes
  shanghai-friends: 4 stages, 4 routes
```

- [ ] **Step 3: 验证 `js/stages.js` 的主题结构**

Run:

```bash
node -e "global.WM={}; require('./js/stages.js'); console.log(Object.keys(WM.THEMES)); for (const [k,v] of Object.entries(WM.THEMES)) console.log(k, v.stages.length, Object.keys(v.routes).length, v.map.img);"
```

Expected includes:

```text
[ 'shenzhen-couple', 'hangzhou-solo', 'shanghai-friends' ]
shenzhen-couple 4 4 docs/maps/shenzhen_full.png
hangzhou-solo 4 4 docs/maps/hangzhou.png
shanghai-friends 4 4 docs/maps/shanghai.png
```

---

## Task 7: 引擎冒烟测试三主题流程闭合

**Files:**
- Create temporary: `tmp-stage2-smoke.js` (delete after test)

- [ ] **Step 1: 创建临时 smoke 脚本**

Create `tmp-stage2-smoke.js` with:

```js
'use strict';
const fs = require('fs');
const vm = require('vm');

const noopCtx = new Proxy({}, { get: () => () => {} });
const mockEl = {
    getContext: () => noopCtx,
    addEventListener: () => {},
    getBoundingClientRect: () => ({ width: 480, height: 270, left: 0, top: 0 }),
    style: {}, width: 480, height: 270, parentElement: null, textContent: '',
};
mockEl.parentElement = mockEl;

const sandbox = {
    console,
    document: {
        getElementById: () => mockEl,
        createElement: () => mockEl,
        querySelectorAll: () => [],
        addEventListener: () => {},
    },
    requestAnimationFrame: () => {},
    setTimeout: () => {},
    setInterval: () => {},
    clearTimeout: () => {},
    clearInterval: () => {},
    Image: function () { return { onload: null, onerror: null, set src(v) {} }; },
    devicePixelRatio: 1,
    Date,
    Math,
};
vm.createContext(sandbox);
vm.runInContext('window=globalThis;window.addEventListener=function(){};', sandbox);

function load(file) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
}

[
    'js/core.js', 'js/stages.js',
    'js/scenes/intro.js', 'js/scenes/walk.js', 'js/scenes/transition.js', 'js/scenes/clear.js', 'js/scenes/finale.js',
    'js/scenes/endings/base.js', 'js/scenes/endings/coffee.js', 'js/scenes/endings/bookstore.js', 'js/scenes/endings/mall.js', 'js/scenes/endings/park.js',
    'js/flow.js'
].forEach(load);

const WM = vm.runInContext('WM', sandbox);
function parseCost(c) { const m = String(c).match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; }
function parseDur(d) { const s = String(d); const n = parseFloat((s.match(/[\d.]+/) || ['0'])[0]); return s.indexOf('min') !== -1 ? n / 60 : n; }

for (const themeId of ['shenzhen-couple', 'hangzhou-solo', 'shanghai-friends']) {
    WM.applyTheme(themeId);
    WM.state.hp = 100;
    WM.state.totalCost = 0;
    WM.state.totalDuration = 0;
    WM.state.stageIndex = 0;
    WM.state.phase = 'intro';
    WM.currentStage = WM.STAGES[0];
    let guard = 0;
    while (guard++ < 20) {
        const stage = WM.STAGES[WM.state.stageIndex];
        WM.state.hp -= stage.task.hp;
        WM.state.totalCost += parseCost(stage.task.cost);
        WM.state.totalDuration += parseDur(stage.task.duration);
        WM.flow.onClearDone();
        if (WM.state.phase === 'finale') break;
    }
    console.log(themeId, 'stages=' + WM.STAGES.length, 'phase=' + WM.state.phase, 'hp=' + WM.state.hp, 'cost=' + WM.state.totalCost, 'duration=' + WM.state.totalDuration.toFixed(2));
    if (WM.state.phase !== 'finale') process.exit(1);
    if (WM.STAGES.length !== 4) process.exit(1);
}
console.log('SMOKE OK');
```

- [ ] **Step 2: 运行 smoke 脚本**

Run:

```bash
node tmp-stage2-smoke.js
```

Expected includes:

```text
shenzhen-couple stages=4 phase=finale
hangzhou-solo stages=4 phase=finale
shanghai-friends stages=4 phase=finale
SMOKE OK
```

- [ ] **Step 3: 删除临时 smoke 脚本**

Run:

```bash
Remove-Item tmp-stage2-smoke.js
```

Expected: file removed.

---

## Task 8: 手动 file:// 验证清单

**Files:**
- Manual: `index.html`

- [ ] **Step 1: 双击 `index.html` 打开**

Expected:
- boot 后进入 AI 首页
- 三个场景 chip 均可点击

- [ ] **Step 2: 验证杭州入口**

操作：点击 `独行漫游` → 点击 `生成密令`。

Expected:
- 预算自动选中 `¥150`
- 人数自动选中 `1人`
- AI 文案包含 `独行漫游`、`杭州西湖`、`¥150`、`1人`
- 进入关卡后地图显示杭州底图
- `STAGE 1/4` 可见

- [ ] **Step 3: 验证上海入口**

操作：回首页或刷新，点击 `好友聚会` → 点击 `生成密令`。

Expected:
- 预算自动选中 `¥500`
- 人数自动选中 `4人`
- AI 文案包含 `好友聚会`、`上海黄浦`、`¥500`、`4人`
- 进入关卡后地图显示上海底图
- `STAGE 1/4` 可见

- [ ] **Step 4: 验证深圳不回退**

操作：选择 `情侣约会`。

Expected:
- 预算自动选中 `¥200`
- 人数自动选中 `2人`
- 地图显示深圳底图
- 原深圳 4 关流程仍可运行

---

## Self-Review Checklist

- [ ] Spec AC-01/AC-02: Task 6 覆盖 `generate-stages.js` 和三主题输出
- [ ] Spec AC-03/AC-04/AC-05: Task 5 + Task 8 覆盖 AI 首页选择与默认联动
- [ ] Spec AC-06/AC-07/AC-08/AC-09: Task 7 + Task 8 覆盖三条线流程闭合与地图切换
- [ ] Spec AC-10: Task 6 覆盖 JS 语法检查
- [ ] 无新增引擎能力，符合“不修改 core/map/flow/scenes”的边界
- [ ] 无 API Key 写入代码或生成文件

---

> **文档结束** — 待用户确认后进入实施。
