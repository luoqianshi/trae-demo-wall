# 阶段 3：杭州/上海城市氛围个性化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不重写引擎的前提下，为 `hangzhou-solo`、`shanghai-friends` 增加城市专属关底变体、轻量行进变体和少量动态效果。

**Architecture:** 保持现有 `ending.type` 与 `walk.style` 驱动流程不变，新增 `ending.variant` 与 `walk.variant` 作为装饰层。新增 `js/scenes/endings/variants.js` 集中绘制关底城市符号，现有关底只接入薄调用入口；`walk.js` 叠加轻量城市背景符号和动态元素。

**Tech Stack:** 纯 HTML/CSS/Canvas 2D/JavaScript；普通 `<script>` 加载；Node.js 生成 `js/stages.js`；file:// 离线运行。

---

## 文件结构与职责

| 文件 | 操作 | 职责 |
|---|---|---|
| `js/scenes/endings/variants.js` | Create | 8 个杭州/上海关底变体绘制函数与 `WM.drawEndingVariant` 入口 |
| `index.html` | Modify | 加载 `variants.js` |
| `js/scenes/endings/{coffee,bookstore,mall,park}.js` | Modify | 调用 `WM.drawEndingVariant(this, 'back/front', ctx)` |
| `js/scenes/walk.js` | Modify | 增加 `drawVariant` 与 `steam_rise/camera_flash/river_reflection` |
| `generate-stages.js` | Modify | 写入 `ending.variant`、`walk.variant` 与新增动态元素 |
| `js/stages.js` | Generate | 由 `node generate-stages.js` 重新生成 |

---

## Task 1: 先写失败验证，锁定阶段 3 数据目标

**Files:**
- Create temporary: `tmp-stage3-data-test.js`

- [ ] **Step 1: 创建失败验证脚本**

Create `tmp-stage3-data-test.js`:

```js
'use strict';

global.WM = {};
require('./js/stages.js');

const endingVariants = {
    'hangzhou-solo': ['hangzhou-noodle', 'hangzhou-gallery', 'hangzhou-oldstreet', 'hangzhou-sunset'],
    'shanghai-friends': ['shanghai-restaurant', 'shanghai-lilong-art', 'shanghai-nanjing-road', 'shanghai-bund'],
};
const walkVariants = {
    'hangzhou-solo': ['hangzhou-oldtown', null, 'hangzhou-oldtown', 'hangzhou-lake'],
    'shanghai-friends': ['shanghai-neon', null, 'shanghai-neon', 'shanghai-river'],
};

for (const themeId of Object.keys(endingVariants)) {
    const theme = WM.THEMES[themeId];
    if (!theme) throw new Error('missing theme ' + themeId);
    endingVariants[themeId].forEach(function (expected, i) {
        const actual = theme.stages[i].ending && theme.stages[i].ending.variant;
        if (actual !== expected) throw new Error(themeId + ' stage ' + i + ' ending expected ' + expected + ' got ' + actual);
    });
    walkVariants[themeId].forEach(function (expected, i) {
        const actual = theme.stages[i].walk && theme.stages[i].walk.variant || null;
        if (actual !== expected) throw new Error(themeId + ' stage ' + i + ' walk expected ' + expected + ' got ' + actual);
    });
}
console.log('STAGE3 DATA OK');
```

- [ ] **Step 2: 运行并确认失败**

Run:

```bash
node tmp-stage3-data-test.js
```

Expected: fails with `ending expected hangzhou-noodle got undefined`.

- [ ] **Step 3: 删除临时脚本**

Run:

```powershell
Remove-Item tmp-stage3-data-test.js
```

Expected: file removed.

---

## Task 2: 新增关底变体模块并加载

**Files:**
- Create: `js/scenes/endings/variants.js`
- Modify: `index.html`
- Create temporary: `tmp-stage3-variant-api-test.js`

- [ ] **Step 1: 创建 API 失败验证脚本**

Create `tmp-stage3-variant-api-test.js`:

```js
'use strict';
const fs = require('fs');
const vm = require('vm');
const sandbox = { WM: {}, console, Date, Math };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('js/scenes/endings/variants.js', 'utf8'), sandbox, { filename: 'js/scenes/endings/variants.js' });
const names = ['hangzhou-noodle','hangzhou-gallery','hangzhou-oldstreet','hangzhou-sunset','shanghai-restaurant','shanghai-lilong-art','shanghai-nanjing-road','shanghai-bund'];
if (typeof sandbox.WM.drawEndingVariant !== 'function') throw new Error('missing drawEndingVariant');
names.forEach(function (name) {
    if (!sandbox.WM.endingVariants[name]) throw new Error('missing ' + name);
});
console.log('VARIANT API OK');
```

- [ ] **Step 2: 运行并确认失败**

Run:

```bash
node tmp-stage3-variant-api-test.js
```

Expected: fails because `variants.js` does not exist.

- [ ] **Step 3: 创建 `variants.js`**

Create `js/scenes/endings/variants.js` with these public APIs:

```js
'use strict';

WM.endingVariantHelpers = {
    rect: function (ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },
    text: function (ctx, text, x, y, color, size) {
        ctx.fillStyle = color;
        ctx.font = (size || 8) + 'px "Microsoft YaHei", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, Math.round(x), Math.round(y));
        ctx.textAlign = 'left';
    },
    lantern: function (ctx, x, y) {
        this.rect(ctx, x, y, 2, 18, '#6b4423');
        this.rect(ctx, x - 7, y + 16, 16, 11, '#e74c3c');
        this.rect(ctx, x - 5, y + 18, 12, 7, '#ff8a4a');
        this.rect(ctx, x - 3, y + 27, 8, 2, '#f1c40f');
    },
    bowl: function (ctx, x, y) {
        this.rect(ctx, x - 13, y - 4, 26, 8, '#f5e6c8');
        this.rect(ctx, x - 10, y + 4, 20, 4, '#8b7355');
        this.rect(ctx, x - 8, y - 7, 16, 3, '#ffe0a3');
        const t = Date.now() / 360;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 3; i++) ctx.fillRect(Math.round(x - 6 + i * 6 + Math.sin(t + i) * 2), Math.round(y - 15 - i * 3), 2, 5);
    },
    painting: function (ctx, x, y, color) {
        this.rect(ctx, x, y, 42, 30, '#f5e6c8');
        this.rect(ctx, x + 3, y + 3, 36, 24, color);
        this.rect(ctx, x + 8, y + 9, 10, 10, '#ffffff');
        this.rect(ctx, x + 22, y + 7, 11, 14, '#1a2a4a');
    },
    skyline: function (ctx, baseY) {
        const xs = [250, 280, 308, 344, 382, 420];
        const hs = [42, 68, 50, 76, 46, 58];
        for (let i = 0; i < xs.length; i++) {
            this.rect(ctx, xs[i], baseY - hs[i], 22, hs[i], '#111827');
            this.rect(ctx, xs[i] + 5, baseY - hs[i] + 8, 3, 3, '#f1c40f');
        }
        this.rect(ctx, 326, baseY - 88, 6, 88, '#111827');
        this.rect(ctx, 318, baseY - 70, 22, 10, '#e74c3c');
        this.rect(ctx, 315, baseY - 45, 28, 12, '#f1c40f');
    },
};

WM.endingVariants = {
    'hangzhou-noodle': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 24, 34, 116, 28, '#6b4423');
            h.rect(ctx, 34, 42, 96, 13, '#8b7355');
            h.text(ctx, '片儿川', 82, 53, '#ffe066', 10);
            h.lantern(ctx, 154, 14);
            h.lantern(ctx, 338, 14);
            h.rect(ctx, 20, 124, 168, 16, '#8b7355');
        },
        drawFront: function (ctx, stage, ending) {
            WM.endingVariantHelpers.bowl(ctx, ending.taskPoint.x, ending.taskPoint.y - 8);
        },
    },
    'hangzhou-gallery': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 0, WM.VIEW_W, 100, 'rgba(245,230,200,0.28)');
            h.painting(ctx, 48, 28, '#00d2d3');
            h.painting(ctx, 154, 24, '#ff9a5a');
            h.painting(ctx, 260, 30, '#4a7c3a');
            h.painting(ctx, 366, 24, '#f1c40f');
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, ending.taskPoint.x - 20, ending.taskPoint.y - 14, 40, 12, '#f5e6c8');
            h.rect(ctx, ending.taskPoint.x - 14, ending.taskPoint.y - 28, 28, 16, '#8fbfe8');
        },
    },
    'hangzhou-oldstreet': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 0, WM.VIEW_W, 112, 'rgba(50,70,60,0.35)');
            for (let x = 18; x < WM.VIEW_W; x += 84) {
                h.rect(ctx, x, 54, 58, 34, '#6b5333');
                h.rect(ctx, x + 4, 60, 50, 8, '#8b7355');
                h.lantern(ctx, x + 48, 30);
            }
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, ending.taskPoint.x - 22, ending.taskPoint.y - 18, 44, 18, '#8b7355');
            h.rect(ctx, ending.taskPoint.x - 16, ending.taskPoint.y - 28, 32, 10, '#f1c40f');
            h.text(ctx, '纪念品', ending.taskPoint.x, ending.taskPoint.y - 20, '#4a2f1a', 8);
        },
    },
    'hangzhou-sunset': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 72, WM.VIEW_W, 74, 'rgba(74,124,154,0.55)');
            h.rect(ctx, 0, 142, WM.VIEW_W, 4, 'rgba(255,217,138,0.35)');
            h.rect(ctx, 64, 88, 42, 8, '#3a2d22');
            h.rect(ctx, 80, 68, 8, 20, '#3a2d22');
            h.rect(ctx, 73, 62, 22, 8, '#3a2d22');
        },
    },
    'shanghai-restaurant': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 36, 35, 96, 32, '#7f1d1d');
            h.text(ctx, '本帮菜', 84, 55, '#f1c40f', 10);
            h.rect(ctx, 278, 34, 86, 28, '#3a1a3a');
            h.text(ctx, '红烧肉', 321, 52, '#f1c40f', 9);
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            const x = ending.taskPoint.x, y = ending.taskPoint.y;
            ctx.fillStyle = '#8b5a2b';
            ctx.beginPath();
            ctx.arc(x, y - 10, 22, 0, Math.PI * 2);
            ctx.fill();
            h.rect(ctx, x - 10, y - 17, 20, 9, '#e74c3c');
            h.rect(ctx, x + 16, y - 22, 2, 23, '#f5e6c8');
            h.rect(ctx, x + 21, y - 22, 2, 23, '#f5e6c8');
        },
    },
    'shanghai-lilong-art': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 0, WM.VIEW_W, 100, 'rgba(127,29,29,0.35)');
            h.text(ctx, 'ART', 74, 64, '#00d2d3', 16);
            h.text(ctx, '田子坊', 198, 54, '#f1c40f', 12);
            h.rect(ctx, 320, 34, 64, 44, '#111827');
            h.rect(ctx, 326, 40, 52, 32, '#e74c3c');
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, ending.taskPoint.x - 24, ending.taskPoint.y - 34, 48, 34, '#f5e6c8');
            h.rect(ctx, ending.taskPoint.x - 18, ending.taskPoint.y - 28, 36, 22, '#1a2a4a');
        },
    },
    'shanghai-nanjing-road': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            [{ x: 38, y: 26, w: 68, c: '#e74c3c', t: '老字号' }, { x: 146, y: 42, w: 74, c: '#f1c40f', t: '南京路' }, { x: 268, y: 28, w: 86, c: '#00d2d3', t: '伴手礼' }].forEach(function (s) {
                h.rect(ctx, s.x, s.y, s.w, 16, s.c);
                h.text(ctx, s.t, s.x + s.w / 2, s.y + 12, '#111827', 8);
            });
        },
        drawFront: function (ctx, stage, ending) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, ending.taskPoint.x - 24, ending.taskPoint.y - 22, 48, 22, '#f1c40f');
            h.text(ctx, '伴手礼', ending.taskPoint.x, ending.taskPoint.y - 8, '#111827', 8);
        },
    },
    'shanghai-bund': {
        drawBack: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 82, WM.VIEW_W, 68, 'rgba(26,42,74,0.55)');
            h.skyline(ctx, 126);
            for (let y = 92; y < 144; y += 13) h.rect(ctx, 260, y, 160, 1, 'rgba(241,196,15,0.35)');
        },
        drawFront: function (ctx) {
            const h = WM.endingVariantHelpers;
            h.rect(ctx, 0, 154, WM.VIEW_W, 4, '#f1c40f');
            for (let x = 0; x < WM.VIEW_W; x += 28) h.rect(ctx, x, 146, 3, 18, '#f1c40f');
        },
    },
};

WM.drawEndingVariant = function (ending, layer, ctx) {
    if (!ending || !ending.config || !ending.config.ending) return;
    const name = ending.config.ending.variant;
    if (!name || !WM.endingVariants) return;
    const variant = WM.endingVariants[name];
    if (!variant) return;
    const fn = layer === 'back' ? variant.drawBack : variant.drawFront;
    if (typeof fn === 'function') fn.call(variant, ctx, ending.config, ending);
};
```

- [ ] **Step 4: 修改 `index.html` 加载顺序**

Replace:

```html
<script src="js/scenes/endings/base.js"></script>
<script src="js/scenes/endings/coffee.js"></script>
```

With:

```html
<script src="js/scenes/endings/base.js"></script>
<script src="js/scenes/endings/variants.js"></script>
<script src="js/scenes/endings/coffee.js"></script>
```

- [ ] **Step 5: 运行 API 验证与语法检查**

Run:

```bash
node tmp-stage3-variant-api-test.js
node --check js/scenes/endings/variants.js
```

Expected includes:

```text
VARIANT API OK
```

- [ ] **Step 6: 删除临时脚本**

Run:

```powershell
Remove-Item tmp-stage3-variant-api-test.js
```

Expected: file removed.

---

## Task 3: 四个关底接入 `WM.drawEndingVariant`

**Files:**
- Modify: `js/scenes/endings/coffee.js`
- Modify: `js/scenes/endings/bookstore.js`
- Modify: `js/scenes/endings/mall.js`
- Modify: `js/scenes/endings/park.js`
- Create temporary: `tmp-stage3-ending-hook-test.js`

- [ ] **Step 1: 创建失败验证脚本**

Create `tmp-stage3-ending-hook-test.js`:

```js
'use strict';
const fs = require('fs');
['coffee','bookstore','mall','park'].forEach(function (name) {
    const file = 'js/scenes/endings/' + name + '.js';
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes("WM.drawEndingVariant(this, 'back', ctx)")) throw new Error(file + ' missing back hook');
    if (!src.includes("WM.drawEndingVariant(this, 'front', ctx)")) throw new Error(file + ' missing front hook');
});
console.log('ENDING HOOKS OK');
```

- [ ] **Step 2: 运行并确认失败**

Run:

```bash
node tmp-stage3-ending-hook-test.js
```

Expected: fails with `missing back hook`.

- [ ] **Step 3: 修改 `coffee.js`**

In `drawBackground`, add before the closing `};`:

```js
    WM.drawEndingVariant(this, 'back', ctx);
```

In `drawDecorations`, add before the closing `};`:

```js
    WM.drawEndingVariant(this, 'front', ctx);
```

- [ ] **Step 4: 修改 `bookstore.js`**

In `drawBackground`, add before the closing `};`:

```js
    WM.drawEndingVariant(this, 'back', ctx);
```

In `drawDecorations`, add before the closing `};`:

```js
    WM.drawEndingVariant(this, 'front', ctx);
```

- [ ] **Step 5: 修改 `mall.js`**

In `drawBackground`, add before the closing `};`:

```js
    WM.drawEndingVariant(this, 'back', ctx);
```

In `drawDecorations`, add before the closing `};`:

```js
    WM.drawEndingVariant(this, 'front', ctx);
```

- [ ] **Step 6: 修改 `park.js`**

In `drawBackground`, add before the closing `};`:

```js
    WM.drawEndingVariant(this, 'back', ctx);
```

In `drawDecorations`, add before the closing `};`:

```js
    WM.drawEndingVariant(this, 'front', ctx);
```

- [ ] **Step 7: 运行钩子验证与语法检查**

Run:

```bash
node tmp-stage3-ending-hook-test.js
node --check js/scenes/endings/coffee.js
node --check js/scenes/endings/bookstore.js
node --check js/scenes/endings/mall.js
node --check js/scenes/endings/park.js
```

Expected includes:

```text
ENDING HOOKS OK
```

- [ ] **Step 8: 删除临时脚本**

Run:

```powershell
Remove-Item tmp-stage3-ending-hook-test.js
```

Expected: file removed.

---

## Task 4: 数据层写入 8 个 `ending.variant` 与 4 个 `walk.variant`

**Files:**
- Modify: `generate-stages.js`
- Generate: `js/stages.js`
- Create temporary: `tmp-stage3-data-test.js`

- [ ] **Step 1: 重新创建 Task 1 的数据验证脚本**

Use the exact `tmp-stage3-data-test.js` content from Task 1 Step 1.

- [ ] **Step 2: 修改杭州 stages**

Update `generate-stages.js` `hangzhouStages` entries to include:

```js
// stage 0
walk: { style: "city", variant: "hangzhou-oldtown", skyColor: "#8fbfe8", midColor: "#8B7355", groundColor: "#6B5333", dynamicElements: ["lamp_glow", "steam_rise"] },
ending: { type: "coffee", variant: "hangzhou-noodle", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },

// stage 1
walk: { style: "forest", skyColor: "#a8d8f0", midColor: "#4a7c3a", groundColor: "#6B5333", dynamicElements: ["leaf_fall", "light_spot"] },
ending: { type: "bookstore", variant: "hangzhou-gallery", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },

// stage 2
walk: { style: "commercial", variant: "hangzhou-oldtown", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
ending: { type: "mall", variant: "hangzhou-oldstreet", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },

// stage 3
walk: { style: "forest", variant: "hangzhou-lake", skyColor: "#ff9a5a", midColor: "#4a7c3a", groundColor: "#6B5333", dynamicElements: ["leaf_fall", "light_spot", "river_reflection"] },
ending: { type: "park", variant: "hangzhou-sunset", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }], isBoss: true, countdown: 10 },
```

- [ ] **Step 3: 修改上海 stages**

Update `generate-stages.js` `shanghaiStages` entries to include:

```js
// stage 0
walk: { style: "commercial", variant: "shanghai-neon", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian", "steam_rise"] },
ending: { type: "coffee", variant: "shanghai-restaurant", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },

// stage 1
walk: { style: "city", skyColor: "#1a2a4a", midColor: "#2a3a5a", groundColor: "#3a3a3a", dynamicElements: ["lamp_glow", "camera_flash"] },
ending: { type: "bookstore", variant: "shanghai-lilong-art", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },

// stage 2
walk: { style: "commercial", variant: "shanghai-neon", skyColor: "#3a1a3a", midColor: "#5a2a5a", groundColor: "#2a2a2a", dynamicElements: ["neon_flicker", "pedestrian"] },
ending: { type: "mall", variant: "shanghai-nanjing-road", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }] },

// stage 3
walk: { style: "seaside", variant: "shanghai-river", skyColor: "#1a2a4a", midColor: "#4a7c9a", groundColor: "#2a2a2a", dynamicElements: ["wave_scroll", "seagull", "camera_flash", "river_reflection"] },
ending: { type: "park", variant: "shanghai-bund", taskPoint: { x: 80, y: 176 }, path: [{ x: 240, y: 224 }, { x: 160, y: 224 }, { x: 112, y: 208 }, { x: 80, y: 176 }], isBoss: true, countdown: 10 },
```

- [ ] **Step 4: 语法检查并重新生成**

Run:

```bash
node --check generate-stages.js
node generate-stages.js
```

Expected includes:

```text
Generated js/stages.js
Themes: shenzhen-couple, hangzhou-solo, shanghai-friends
```

- [ ] **Step 5: 运行数据验证**

Run:

```bash
node tmp-stage3-data-test.js
```

Expected:

```text
STAGE3 DATA OK
```

- [ ] **Step 6: 删除临时脚本**

Run:

```powershell
Remove-Item tmp-stage3-data-test.js
```

Expected: file removed.

---

## Task 5: 行进场景增加 4 个 `walk.variant` 与 3 个动态元素

**Files:**
- Modify: `js/scenes/walk.js`
- Create temporary: `tmp-stage3-walk-test.js`

- [ ] **Step 1: 创建失败验证脚本**

Create `tmp-stage3-walk-test.js`:

```js
'use strict';
const fs = require('fs');
const src = fs.readFileSync('js/scenes/walk.js', 'utf8');
['drawVariant', 'hangzhou-oldtown', 'hangzhou-lake', 'shanghai-neon', 'shanghai-river', 'steam_rise', 'camera_flash', 'river_reflection'].forEach(function (token) {
    if (!src.includes(token)) throw new Error('missing ' + token);
});
console.log('WALK VARIANTS OK');
```

- [ ] **Step 2: 运行并确认失败**

Run:

```bash
node tmp-stage3-walk-test.js
```

Expected: fails with `missing drawVariant`.

- [ ] **Step 3: 在 `draw` 中调用变体层**

Replace:

```js
        this.drawMidground(ctx, walk.style, walk.midColor, groundY);

        ctx.fillStyle = walk.groundColor;
```

With:

```js
        this.drawMidground(ctx, walk.style, walk.midColor, groundY);
        this.drawVariant(ctx, walk.variant, walk.style, groundY);

        ctx.fillStyle = walk.groundColor;
```

- [ ] **Step 4: 新增 `drawVariant` 方法**

Insert after `drawMidground`:

```js
    drawVariant: function (ctx, variant, style, groundY) {
        var W = WM.VIEW_W;
        var off, x, i;
        if (variant === 'hangzhou-oldtown') {
            off = (this.scrollX * 7) % 88;
            for (i = 0; i < 7; i++) {
                x = i * 88 - off - 40;
                ctx.fillStyle = '#6B5333';
                ctx.fillRect(Math.round(x), groundY - 58, 58, 36);
                ctx.fillStyle = '#8B7355';
                ctx.fillRect(Math.round(x) + 5, groundY - 50, 48, 9);
                ctx.fillStyle = '#E74C3C';
                ctx.fillRect(Math.round(x) + 42, groundY - 72, 12, 12);
                ctx.fillStyle = '#F1C40F';
                ctx.fillRect(Math.round(x) + 44, groundY - 68, 8, 4);
            }
        } else if (variant === 'hangzhou-lake') {
            ctx.fillStyle = 'rgba(74,124,154,0.55)';
            ctx.fillRect(0, groundY - 42, W, 42);
            ctx.fillStyle = 'rgba(255,217,138,0.35)';
            for (i = 0; i < 8; i++) ctx.fillRect(i * 72 - (this.scrollX * 3) % 72, groundY - 28 + (i % 2) * 7, 34, 2);
        } else if (variant === 'shanghai-neon') {
            off = (this.scrollX * 9) % 76;
            var cols = ['#E74C3C', '#F1C40F', '#00D2D3', '#FD79A8'];
            for (i = 0; i < 8; i++) {
                x = i * 76 - off - 38;
                ctx.fillStyle = 'rgba(10,10,20,0.7)';
                ctx.fillRect(Math.round(x), groundY - 72, 54, 52);
                ctx.fillStyle = cols[i % cols.length];
                ctx.fillRect(Math.round(x) + 7, groundY - 62, 40, 7);
                ctx.fillRect(Math.round(x) + 13, groundY - 44, 28, 5);
            }
        } else if (variant === 'shanghai-river') {
            ctx.fillStyle = 'rgba(26,42,74,0.55)';
            ctx.fillRect(0, groundY - 52, W, 52);
            ctx.fillStyle = '#111827';
            for (i = 0; i < 7; i++) {
                x = 180 + i * 38 - (this.scrollX * 2) % 38;
                ctx.fillRect(Math.round(x), groundY - 82 - (i % 3) * 12, 22, 82 + (i % 3) * 12);
            }
        }
    },
```

- [ ] **Step 5: 新增 3 个 `WM.walkEffects` entry**

Inside `WM.walkEffects`, before final `};`, add:

```js
    steam_rise: {
        particles: [],
        t: 0,
        init: function () {
            this.t = 0;
            this.particles = [];
            for (var i = 0; i < 10; i++) this.particles.push({ x: 60 + i * 42, y: 178 + (i % 3) * 6, phase: i * 0.7 });
        },
        update: function (dt) { this.t += dt; },
        draw: function (ctx) {
            for (var i = 0; i < this.particles.length; i++) {
                var p = this.particles[i];
                ctx.fillStyle = 'rgba(255,255,255,0.45)';
                ctx.fillRect(Math.round(p.x + Math.sin(this.t / 700 + p.phase) * 3), Math.round(p.y - (Math.sin(this.t / 500 + p.phase) + 1) * 7), 2, 5);
            }
        },
    },

    camera_flash: {
        t: 0,
        init: function () { this.t = 0; },
        update: function (dt) { this.t += dt; },
        draw: function (ctx) {
            var pulse = Math.max(0, Math.sin(this.t / 420));
            if (pulse < 0.85) return;
            ctx.fillStyle = 'rgba(255,255,255,' + ((pulse - 0.85) * 0.7) + ')';
            ctx.fillRect(0, 0, WM.VIEW_W, WM.VIEW_H);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(380, 122, 6, 6);
        },
    },

    river_reflection: {
        t: 0,
        init: function () { this.t = 0; },
        update: function (dt) { this.t += dt; },
        draw: function (ctx) {
            var groundY = Math.round(WM.VIEW_H * 0.7);
            ctx.fillStyle = 'rgba(241,196,15,0.28)';
            for (var i = 0; i < 8; i++) ctx.fillRect(Math.round(i * 70 - (this.t * 0.025) % 70), Math.round(groundY - 32 + (i % 3) * 8), 34, 2);
        },
    },
```

- [ ] **Step 6: 运行验证与语法检查**

Run:

```bash
node tmp-stage3-walk-test.js
node --check js/scenes/walk.js
```

Expected includes:

```text
WALK VARIANTS OK
```

- [ ] **Step 7: 删除临时脚本**

Run:

```powershell
Remove-Item tmp-stage3-walk-test.js
```

Expected: file removed.

---

## Task 6: 三主题 smoke test 与最终验证

**Files:**
- Create temporary: `tmp-stage3-smoke.js`

- [ ] **Step 1: 创建 smoke 脚本**

Create `tmp-stage3-smoke.js`:

```js
'use strict';
const fs = require('fs');
const vm = require('vm');
const noopCtx = new Proxy({}, { get: () => () => {} });
const mockEl = { getContext: () => noopCtx, addEventListener: () => {}, getBoundingClientRect: () => ({ width: 480, height: 270, left: 0, top: 0 }), style: {}, width: 480, height: 270, parentElement: null, textContent: '' };
mockEl.parentElement = mockEl;
const sandbox = { console, process, document: { getElementById: () => mockEl, createElement: () => mockEl, querySelectorAll: () => [], addEventListener: () => {} }, requestAnimationFrame: () => {}, setTimeout: () => {}, setInterval: () => {}, clearTimeout: () => {}, clearInterval: () => {}, Image: function () { return { onload: null, onerror: null, set src(v) {} }; }, devicePixelRatio: 1, Date, Math };
vm.createContext(sandbox);
vm.runInContext('window=globalThis;window.addEventListener=function(){};', sandbox);
function load(file) { vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file }); }
['js/core.js','js/stages.js','js/scenes/intro.js','js/scenes/walk.js','js/scenes/transition.js','js/scenes/clear.js','js/scenes/finale.js','js/scenes/endings/base.js','js/scenes/endings/variants.js','js/scenes/endings/coffee.js','js/scenes/endings/bookstore.js','js/scenes/endings/mall.js','js/scenes/endings/park.js','js/flow.js'].forEach(load);
const WM = vm.runInContext('WM', sandbox);
function parseCost(c) { const m = String(c).match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; }
function parseDur(d) { const s = String(d); const n = parseFloat((s.match(/[\d.]+/) || ['0'])[0]); return s.indexOf('min') !== -1 ? n / 60 : n; }
for (const themeId of ['shenzhen-couple', 'hangzhou-solo', 'shanghai-friends']) {
    WM.applyTheme(themeId);
    WM.state.hp = 100; WM.state.totalCost = 0; WM.state.totalDuration = 0; WM.state.stageIndex = 0; WM.state.phase = 'intro'; WM.currentStage = WM.STAGES[0];
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
console.log('STAGE3 SMOKE OK');
```

- [ ] **Step 2: 运行所有语法检查**

Run:

```bash
node --check generate-stages.js
node --check js/stages.js
node --check js/scenes/walk.js
node --check js/scenes/endings/variants.js
node --check js/scenes/endings/coffee.js
node --check js/scenes/endings/bookstore.js
node --check js/scenes/endings/mall.js
node --check js/scenes/endings/park.js
node --check js/app.js
```

Expected: no output and exit code 0 for each command.

- [ ] **Step 3: 运行 smoke test**

Run:

```bash
node tmp-stage3-smoke.js
```

Expected includes:

```text
shenzhen-couple stages=4 phase=finale
hangzhou-solo stages=4 phase=finale
shanghai-friends stages=4 phase=finale
STAGE3 SMOKE OK
```

- [ ] **Step 4: 删除临时脚本**

Run:

```powershell
Remove-Item tmp-stage3-smoke.js
```

Expected: file removed.

- [ ] **Step 5: 手动 file:// 验收**

Open `index.html` by double-clicking it or opening:

```text
file:///e:/weekend_missions/index.html
```

Expected:

```text
杭州线：面馆、展廊、老街、日落山顶符号可见
上海线：本帮菜馆、弄堂艺术墙、南京路、外滩符号可见
深圳线：原 4 关仍可运行
```

---

## Self-Review Checklist

- [ ] Spec AC-01: 深圳没有 `ending.variant` 时保持默认绘制。
- [ ] Spec AC-02: 杭州 4 个关底变体在 Task 2/4 覆盖。
- [ ] Spec AC-03: 上海 4 个关底变体在 Task 2/4 覆盖。
- [ ] Spec AC-04: `generate-stages.js` 与数据验证在 Task 4 覆盖。
- [ ] Spec AC-05/AC-06: 三主题结构和流程闭合在 Task 6 覆盖。
- [ ] Spec AC-07: JS 语法检查在 Task 6 覆盖。
- [ ] Spec AC-08: 所有新增视觉均为 Canvas 形状，无外部资源和 API Key。
- [ ] Spec AC-09: 手动 file:// 验收在 Task 6 覆盖。

---

> **文档结束** — 待用户确认执行方式后开始实施。
