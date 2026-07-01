# Weekend Missions · 周末密令 — 开发规格说明书 (SPEC)

> **文档版本：** v1.0  
> **创建日期：** 2026-06-22  
> **产品形态：** 离线 H5 单文件应用（index.html）  
> **目标：** 初赛 Demo，2026 年 7 月 15 日前完成

---

## 1. 产品概述与核心体验

### 1.1 一句话描述

把周末城市探索变成一场 FC 红白机风格的闯关冒险游戏。用户选主题 → 看 AI"生成"密令 → 逐关打卡 → 通关生成 3 套风格分享卡片。

### 1.2 核心用户路径

```
打开 HTML → 开机仪式 → 选择主题卡 → AI 对话打字 → 密令地图 → 逐关打卡 → 第2关触发彩蛋 → 通关动画 → 分享卡片
```

### 1.3 Demo 阶段定位

- **非追求完美的 MVP**：核心流程完整、视觉有吸引力、评委能快速体验亮点
- **不是真正接入 AI**：预置数据 + 打字机效果模拟"AI 在生成"
- **评委体验目标**：3 分钟内体验完整流程，第一秒被视觉吸引，结束时愿意截图分享

---

## 2. 页面结构

### 2.1 页面清单（7个）

| 页面ID | 页面名称 | 说明 |
|--------|----------|------|
| P0 | **boot** | 开机仪式动画页（一次性） |
| P1 | **home** | 首页：标题 + 3张主题卡 |
| P2 | **dialog** | 主题确认：AI 对话打字 + 加载动画 |
| P3 | **map** | 密令地图：5个关卡节点 + HP/金币条 |
| P4 | **stage-detail** | 关卡详情：发现笔记 + 签到按钮 |
| P5 | **clear** | STAGE CLEAR：通关动画 + 数据统计 |
| P6 | **share** | 分享卡片：3套模板 + 下载 |

### 2.2 页面切换流程

```
boot (0.8s) → home → dialog → map ↔ stage-detail → clear → share
                  ↑__________|     ↑________|
                  (返回)          (返回)
```

### 2.3 页面容器结构（单文件实现）

```html
<div id="app">
  <div id="page-boot" class="page"></div>
  <div id="page-home" class="page hidden"></div>
  <div id="page-dialog" class="page hidden"></div>
  <div id="page-map" class="page hidden"></div>
  <div id="page-stage-detail" class="page hidden"></div>
  <div id="page-clear" class="page hidden"></div>
  <div id="page-share" class="page hidden"></div>
  <div id="modal-easter-egg" class="modal hidden"></div>
  <div id="demo-panel" class="demo-panel hidden"></div>
</div>
```

```css
.page { display: block; }
.page.hidden { display: none; }
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; }
```

---

## 3. 功能详细规格

### 3.1 P0: boot 开机仪式

**时长：** 0.8 秒

**动画序列：**
```
t=0ms: 黑屏
t=100ms: 白线从顶部向下扫描（bootScroll 动画，500ms）
t=600ms: "WEEKEND MISSIONS" fade-in
t=800ms: auto navigate to home
```

**触发条件：** 首次打开，或刷新页面

**实现：**
- CSS `@keyframes bootScroll`
- JavaScript `setTimeout(() => navigate('home'), 800)`

---

### 3.2 P1: home 首页

**内容：**
- 标题区：`WEEKEND MISSIONS` + `周 末 密 令`
- 副标题：`-- TRAE AI 创造力大赛参赛作品 --`
- 3张主题卡（纵向排列，移动端）
- 右下角演示模式开关
- 存档恢复入口（localStorage 有数据时）

**主题卡数据（预置）：**

| ID | 标题 | 城市 | 人数 | 预算 | 主题色 |
|----|------|------|------|------|--------|
| shenzhen-couple | 深圳·情侣甜蜜大作战 | 深圳 | 2人 | ¥200 | #FD79A8 粉 |
| hangzhou-solo | 杭州·独居时光漫步 | 杭州 | 1人 | ¥150 | #00D2D3 青 |
| shanghai-friends | 上海·兄弟聚会闯关 | 上海 | 4人 | ¥500 | #F1C40F 金 |

**主题卡点击：**
1. 卡片高亮 scale(1.05)
2. 延迟 200ms
3. navigate('dialog', { themeId })

**localStorage 检查：**
- 有存档时，标题下方显示 `▶ 继续上局` 按钮
- 点击恢复存档并跳转到 map 页

---

### 3.3 P2: dialog 主题确认页

**内容：**
- 顶部：主题名称（大字）
- AI 指挥官对话框
- 加载动画文字
- 跳过按钮

**AI 对话打字效果：**
```javascript
const briefing = "特工，密令已下达。...";
await typewriter(dialogElement, briefing, 50); // 50ms/字
```

**打字内容（按主题）：**

深圳情侣：
```
"特工，密令已下达。"
"本次任务：深圳·情侣甜蜜大作战"
"作战时间：今日 10:00 - 19:00"
"作战预算：¥200"
"作战人数：2 人"
"任务：穿越南山区，打卡 5 个甜蜜坐标。"
```

杭州独居：
```
"特工，密令已下达。"
"本次任务：杭州·独居时光漫步"
"作战时间：今日 10:00 - 19:00"
"作战预算：¥150"
"作战人数：1 人"
"任务：一个人，一座城，发现杭州的小众浪漫。"
```

上海兄弟：
```
"特工，密令已下达。"
"本次任务：上海·兄弟聚会闯关"
"作战时间：今日 10:00 - 19:00"
"作战预算：¥500"
"作战人数：4 人"
"任务：魔都美食探店，比比谁更会吃！"
```

**打字完成后（每句间隔 800ms）：**

加载动画（3阶段，每阶段 600ms）：
```
"正在扫描区域情报..."
"规划潜入路线..."
"密令生成完毕！"
```

**总时长：** 打字约 5s + 加载约 2s = 7s

**跳过按钮：** 点击立即跳转到 map 页

**完成后：**
```javascript
setState({ currentTheme: themeData });
navigate('map');
```

---

### 3.4 P3: map 密令地图页

**顶部状态栏：**
```html
<div class="status-bar">
  <span id="hp-icon">🧍</span>
  <div class="hp-bar"><div id="hp-fill" class="hp-fill"></div></div>
  <span>💰</span>
  <div class="coin-bar"><div id="coin-fill" class="coin-fill"></div></div>
  <span id="theme-name"></span>
</div>
```

**HP 状态：**
- 初始：100%
- 每通关一关：-20%
- 颜色：>60% green, 31-60% yellow, <=30% red
- 状态图标：🧍(>60%) → 😓(31-60%) → 😰(<=30%)

**金币条：**
- 显示：已花费/预算
- 每通关一关：+该关预估花费
- 超预算：红色闪烁

**关卡节点（5个 + 1个隐藏）：**
```html
<div class="stage-nodes">
  <div class="stage-node" data-index="0">1</div>
  <div class="stage-node" data-index="1">2</div>
  ...
</div>
<div class="stage-path"><!-- 虚线连接 --></div>
```

**节点状态：**
| 状态 | 样式 |
|------|------|
| 锁定 | 灰色边框 + "?" |
| 当前 | Cyan 边框 + 脉冲 + 像素小人巡逻动画 |
| 已通关 | Green 填充 + "✓" |
| BOSS(最后关) | Red 边框 + 更大尺寸 + "★" |

**当前关卡小人巡逻动画：**
```css
@keyframes patrol {
  0%, 100% { left: 4px; }
  50% { left: 24px; }
}
```

**节点点击：**
- 锁定节点：显示 "LOCKED" 提示，无操作
- 当前节点：navigate('stage-detail', { stageIndex })
- 已通关：显示"已完成"状态

**演示模式面板（开启时显示）：**
```html
<div id="demo-panel" class="demo-panel">
  <button onclick="demoSkipToEnd()">一键通关</button>
  <button onclick="demoToggleEasterEgg()">彩蛋: 开/关</button>
  <select onchange="demoSwitchTheme(this.value)">
    <option value="shenzhen-couple">深圳</option>
    <option value="hangzhou-solo">杭州</option>
    <option value="shanghai-friends">上海</option>
  </select>
</div>
```

---

### 3.5 P4: stage-detail 关卡详情页

**布局：**
```
┌────────────────────────────────┐
│ STAGE 1: 海上世界文化艺术中心  │ ← 标题
├────────────────────────────────┤
│ 📍 深圳市南山区望海路1187号     │ ← 地址
│ 💰 预计: ¥0                    │ ← 花费
│ ⏱ 预计: 30分钟                 │ ← 时长
├────────────────────────────────┤
│ [发现笔记]                      │ ← AI 生成的描述
│ 推开玻璃门，海风混着书页的...    │ ← 打字机效果
├────────────────────────────────┤
│ 📋 任务：找到心形雕塑，合影打卡  │
├────────────────────────────────┤
│ [换一个]        [已到达·签到]   │
│ (换5次上限)                    │
└────────────────────────────────┘
```

**发现笔记打字机效果：** 50ms/字

**换一个功能：**
- 预置同类型地点池，点击后随机替换
- 过渡动画：节点闪烁 1s + "AI重新规划..." 文字
- 最多换 3 次

**签到流程：**
```javascript
onCheckin() {
  // 1. 弹出确认
  showConfirm('确认已到达【XX】？');
  // 2. 确认后
  setState({ clearedStages: [..., currentIndex] });
  // 3. HP -= 20, coin += stageCost
  // 4. 通关小动画（1.5s）
  // 5. 检查彩蛋触发（第2关通关后）
  // 6. navigate('map')
}
```

**返回按钮：** navigate('map')

---

### 3.6 彩蛋触发（第2关通关后）

**触发条件：** `clearedStages.length === 2 && easterEggEnabled`

**动画序列：**
```
1. 第2关通关动画结束
2. 屏幕橙红闪烁 3次（每次0.2s）
3. 弹窗从中心 scale 弹出
4. 隐藏关卡信息打字机效果
```

**弹窗内容：**
```
╔════════════════════════════╗
║ ⚠ 发现隐藏密令！⚠          ║
║ ─────────────────────────  ║
║ 地点：老陈红烧肉（隐藏关）   ║
║ 任务：点一份招牌红烧肉       ║
║ 奖励：¥80 + 美食猎人徽章    ║
║ ─────────────────────────  ║
║ [接受挑战]     [跳过]       ║
╚════════════════════════════╝
```

**接受：** 隐藏关卡插入 map，标记为当前
**跳过：** 不插入，继续主线

---

### 3.7 P5: clear STAGE CLEAR 通关页

**动画序列（总时长 5-8s，可跳过）：**

| 时间 | 内容 |
|------|------|
| 0-0.5s | 黑场 |
| 0.5-2s | "STAGE CLEAR!" 从上下弹入（step 动画） |
| 2-3s | 像素碎片飞散（20个粒子） |
| 3-4s | "ALL STAGES CLEARED!" + 冒险标题 |
| 4-6s | 数据逐行点亮（STAGES/TIME/BUDGET/SECRETS） |
| 6-7s | 评级 S/A/B/C + 星星 |
| 7-8s | 按钮出现：[生成分享卡片] [再来一局] |

**跳过：** 右上角 `[跳过]` 按钮，点击直接到按钮状态

**数据计算：**
```javascript
const stats = {
  stagesCleared: clearedStages.length,
  totalStages: totalStagesCount,
  timeSpent: calculateTime(startTime, now),
  budgetUsed: totalBudgetUsed,
  secretsFound: easterEggFound ? 1 : 0,
  rank: calculateRank(clearedStages, secretsFound, budgetUsed)
};
```

**再来一局：** 清空状态，回到 home

---

### 3.8 P6: share 分享卡片页

**3套模板切换器：**
```html
<div class="template-selector">
  <button class="template-btn active" data-template="pixel">像素复古</button>
  <button class="template-btn" data-template="modern">现代简约</button>
  <button class="template-btn" data-template="literary">文艺清新</button>
</div>
```

**卡片预览区：**
- Canvas 尺寸：540×960px（9:16，缩放显示）
- 实际生成：1080×1920px

**Canvas 绘制函数：**
```javascript
function drawShareCard(ctx, template, data) {
  if (template === 'pixel') drawPixelCard(ctx, data);
  else if (template === 'modern') drawModernCard(ctx, data);
  else if (template === 'literary') drawLiteraryCard(ctx, data);
}
```

**下载按钮：**
```javascript
function downloadCard() {
  const dataURL = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `weekend-missions-${themeId}-${Date.now()}.png`;
  a.click();
}
```

**返回按钮：** navigate('clear')

---

## 4. 数据结构

### 4.1 预置主题数据

```javascript
const presetThemes = {
  'shenzhen-couple': {
    id: 'shenzhen-couple',
    title: '深圳·情侣甜蜜大作战',
    city: '深圳',
    groupSize: 2,
    budget: 200,
    themeColor: '#FD79A8',
    briefing: [...],  // AI 对话文案数组
    stages: [
      {
        index: 0,
        name: '海上世界文化艺术中心',
        address: '深圳市南山区望海路1187号',
        type: 'park',
        activity: '找到心形雕塑，合影打卡',
        note: '推开玻璃门，海风混着书页的香气扑面而来...',
        cost: 0,
        duration: '30分钟',
        replacePool: ['华侨城湿地公园', '深圳湾公园']
      },
      {
        index: 1,
        name: '南海意馆咖啡',
        address: '深圳市南山区工业六路4号',
        type: 'cafe',
        activity: '点一杯「孤独的星球」，拍照打卡',
        note: '这家藏在巷子里的咖啡馆...',
        cost: 45,
        duration: '1小时',
        replacePool: ['鹿鸣咖啡', 'MANNER咖啡(深圳湾店)']
      },
      // ... 共5个关卡
    ],
    hiddenStage: {
      name: '老陈红烧肉（隐藏关）',
      address: '深圳市南山区某小巷',
      type: 'restaurant',
      activity: '向老板点一份招牌红烧肉',
      note: '这家店没有招牌，藏在老陈的私房菜单里...',
      cost: 80
    }
  },
  'hangzhou-solo': { ... },
  'shanghai-friends': { ... }
};
```

### 4.2 全局状态

```javascript
const state = {
  // 导航
  currentPage: 'boot',
  
  // 当前主题
  currentTheme: null,
  currentThemeId: null,
  
  // 进度
  currentStageIndex: 0,
  clearedStages: [],      // 已通关索引数组
  replacedStages: {},      // { stageIndex: replaceCount }
  
  // 彩蛋
  easterEggEnabled: true,
  easterEggAccepted: false,
  easterEggCompleted: false,
  
  // 数值
  hp: 100,
  budgetUsed: 0,
  startTime: null,
  
  // UI
  shareTemplate: 'modern'
};
```

### 4.3 localStorage 结构

```javascript
// 存档
localStorage.setItem('wm_progress', JSON.stringify({
  themeId: 'shenzhen-couple',
  clearedStages: [0, 1],
  currentStageIndex: 2,
  budgetUsed: 45,
  easterEggAccepted: false,
  easterEggCompleted: false,
  updatedAt: Date.now()
}));

// 设置
localStorage.setItem('wm_settings', JSON.stringify({
  easterEggEnabled: true,
  demoMode: false
}));
```

---

## 5. 组件清单

### 5.1 像素按钮组件

```css
.pixel-btn-a { background: #E74C3C; border: 4px solid; border-color: #ff8a80 #8b0000 #8b0000 #ff8a80; }
.pixel-btn-b { background: #3B5998; border: 4px solid; border-color: #6d8cc4 #1a2f5a #1a2f5a #6d8cc4; }
.pixel-btn-start { background: #F1C40F; border: 4px solid; border-color: #fff #555 #555 #fff; }
```

### 5.2 状态条组件

```css
.hp-bar { background: #000; border: 4px solid; border-color: #555 #fff #fff #555; }
.hp-fill { height: 100%; transition: width 0.5s step-end; }
.hp-fill.green { background: #27AE60; }
.hp-fill.yellow { background: #F1C40F; }
.hp-fill.red { background: #E74C3C; }

.coin-bar { /* 同上 */ }
.coin-fill { background: #F1C40F; }
```

### 5.3 对话框组件

```css
.dialog-box {
  background: #000;
  border: 4px solid;
  border-color: #fff #555 #555 #fff;
  padding: 16px;
}
.dialog-arrow { animation: blink 1.2s step-end infinite; }
```

### 5.4 关卡节点组件

```css
.stage-node {
  width: 48px; height: 48px;
  border: 4px solid;
  display: flex; align-items: center; justify-content: center;
}
.stage-node.locked { border-color: #555; background: #1A1A2E; }
.stage-node.current { border-color: #00D2D3; animation: pulse 1s infinite; }
.stage-node.cleared { border-color: #27AE60; background: #27AE60; }
.stage-node.boss { width: 60px; height: 60px; border-color: #E74C3C; }
.stage-node.hidden { border-color: #8E44AD; animation: blink 1.2s infinite; }
```

### 5.5 彩蛋弹窗组件

```css
.easter-egg-modal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.easter-egg-content {
  background: #0F0F0F;
  border: 4px solid #E67E22;
  padding: 20px;
  max-width: 300px;
  text-align: center;
}
```

### 5.6 分享卡片 Canvas 绘制

**模板 A - 像素复古：**
- 黑色背景 + 扫描线
- 像素边框
- Press Start 2P 字体
- 星星闪烁动画（CSS）

**模板 B - 现代简约：**
- 白色渐变背景
- 几何色块
- Sans-serif 字体
- 微妙阴影

**模板 C - 文艺清新：**
- 米白渐变背景
- 樱花装饰元素
- Serif/手写体
- 大圆角

---

## 6. CSS 变量定义

```css
:root {
  /* NES 经典配色 */
  --nes-black: #0F0F0F;
  --nes-dark: #1A1A2E;
  --nes-gray: #2D2D3F;
  --nes-white: #FCFCFC;
  --nes-blue: #3B5998;
  --nes-red: #E74C3C;
  --nes-green: #27AE60;
  --nes-yellow: #F1C40F;
  --nes-cyan: #00D2D3;
  --nes-purple: #8E44AD;
  --nes-orange: #E67E22;
  --nes-pink: #FD79A8;
  
  /* 主题色（动态切换） */
  --theme-color: var(--nes-cyan);
  
  /* 字体 */
  --font-pixel: 'Press Start 2P', monospace;
  --font-modern: sans-serif;
  --font-literary: serif;
  
  /* 动画 */
  --blink: blink 1.2s step-end infinite;
  --pulse: pulse 1s ease-in-out infinite;
}
```

---

## 7. JavaScript 模块划分

### 7.1 状态管理

```javascript
// state.js
const state = { ... };
const listeners = [];

function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach(fn => fn(state));
}

function subscribe(fn) {
  listeners.push(fn);
  return () => listeners.splice(listeners.indexOf(fn), 1);
}
```

### 7.2 路由/导航

```javascript
// router.js
const PAGES = ['boot', 'home', 'dialog', 'map', 'stage-detail', 'clear', 'share'];

function navigate(page, params = {}) {
  PAGES.forEach(p => {
    document.getElementById(`page-${p}`)?.classList.toggle('hidden', p !== page);
  });
  setState({ currentPage: page, ...params });
}
```

### 7.3 打字机效果

```javascript
// effects.js
async function typewriter(element, text, speed = 50) {
  element.textContent = '';
  for (let i = 0; i < text.length; i++) {
    element.textContent += text[i];
    await sleep(speed);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 7.4 音频（可选）

```javascript
// audio.js
function playBeep(freq = 440, duration = 100) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  osc.start();
  setTimeout(() => { osc.stop(); ctx.close(); }, duration);
}

function playClearSound() {
  playBeep(880, 80);
  setTimeout(() => playBeep(1100, 80), 100);
  setTimeout(() => playBeep(1320, 200), 200);
}
```

### 7.5 分享卡片 Canvas

```javascript
// share-card.js
function drawPixelCard(ctx, data) {
  // 模板A：像素复古风
  ctx.fillStyle = '#0F0F0F';
  ctx.fillRect(0, 0, 540, 960);
  // ... 扫描线、边框、文字
}

function drawModernCard(ctx, data) {
  // 模板B：现代简约
  // ...
}

function drawLiteraryCard(ctx, data) {
  // 模板C：文艺清新
  // ...
}
```

---

## 8. 开发优先级

### Phase 1: 核心循环（目标：可运行）
| 顺序 | 功能 | 预计行数 |
|------|------|---------|
| 1 | HTML 骨架 + CSS 变量 + 页面结构 | ~200 |
| 2 | 状态管理 + 路由 | ~100 |
| 3 | home 页（静态） | ~150 |
| 4 | dialog 页（打字机 + 加载） | ~150 |
| 5 | map 页（节点 + 状态条） | ~200 |
| 6 | stage-detail 页（详情 + 签到） | ~200 |
| 7 | clear 页（动画序列） | ~300 |
| 8 | share 页（Canvas 模板A） | ~250 |
| 9 | 预置数据（3套主题） | ~300 |
| 10 | localStorage 存档 | ~100 |

### Phase 2: 视觉强化
| 顺序 | 功能 |
|------|------|
| 11 | boot 开机仪式动画 |
| 12 | HP/金币条状态变化动画 |
| 13 | 彩蛋触发动画 |
| 14 | 模板B/C 分享卡片 |
| 15 | 演示模式面板 |

### Phase 3: 打磨
| 顺序 | 功能 |
|------|------|
| 16 | 音效（可选） |
| 17 | 桌面端 NES 屏幕框架 |
| 18 | 多浏览器测试 |

---

## 9. 文件结构

```
weekend-missions/
├── index.html                    # 主应用（单文件，包含所有 HTML/CSS/JS）
├── docs/
│   ├── Weekend-Missions-PRD.md
│   ├── Weekend-Missions-技术架构文档.md
│   ├── Weekend-Missions-交互流程文档.md
│   ├── Weekend-Missions-UI设计规范.md
│   ├── Weekend-Missions-视觉风格指南.html   ← 已创建
│   └── Weekend-Missions-开发规格说明书.md   ← 本文件
└── README.md
```

**index.html 结构：**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <title>Weekend Missions - 周末密令</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    /* ===== CSS 变量 ===== */
    /* ===== 通用样式（reset, scanlines, page框架）===== */
    /* ===== 组件样式（buttons, bars, nodes, dialogs）===== */
    /* ===== 页面样式（boot, home, dialog, map, stage-detail, clear, share）===== */
    /* ===== 动画关键帧 ===== */
  </style>
</head>
<body>
  <div id="app">
    <!-- 7个页面容器 -->
    <div id="page-boot" class="page"></div>
    <div id="page-home" class="page hidden"></div>
    <!-- ... -->
  </div>
  
  <script>
    // ===== 预置数据 =====
    // ===== 状态管理 =====
    // ===== 工具函数 =====
    // ===== 路由/导航 =====
    // ===== 页面渲染函数 =====
    // ===== 事件处理 =====
    // ===== 初始化 =====
  </script>
</body>
</html>
```

---

## 10. 验收标准

### 功能验收
- [ ] boot 开机动画 0.8s 后自动跳转 home
- [ ] 3 张主题卡可点击并进入对应 dialog
- [ ] AI 对话打字效果完整播放约 7s
- [ ] 跳过按钮立即跳转到 map
- [ ] 地图显示 5 个关卡节点 + HP/金币条
- [ ] 点击当前关卡进入 stage-detail
- [ ] 签到后状态更新，HP -20，金币增加
- [ ] 第2关通关后触发彩蛋弹窗
- [ ] 彩蛋接受后隐藏关卡插入地图
- [ ] 最终关卡通关触发 STAGE CLEAR 动画
- [ ] 冒险总结数据正确显示
- [ ] 3 套分享卡片模板可切换
- [ ] 下载 PNG 功能正常
- [ ] localStorage 存档和恢复正常
- [ ] 演示模式跳关/切换主题正常

### 视觉验收
- [ ] 全屏扫描线覆盖
- [ ] 开机动画：CRT 滚动 + 标题 fade-in
- [ ] PRESS START 闪烁
- [ ] 当前关卡节点有像素小人巡逻
- [ ] HP 变化时颜色/图标变化
- [ ] STAGE CLEAR 有碎片飞散
- [ ] 彩蛋触发时屏幕橙红闪
- [ ] 3 套分享卡片视觉差异明显
- [ ] 所有动画使用 step-end

### 性能验收
- [ ] 单文件大小 < 2MB
- [ ] 首屏加载 < 2s
- [ ] 动画流畅无卡顿

---

## 11. 技术限制

- **无网络依赖**：单文件运行，不请求外部 API
- **字体**：Google Fonts 首次加载后缓存，离线可用
- **图片**：全部用 CSS 绘制或 SVG 内联，无外部图片
- **音频**：Web Audio API 生成 8-bit 音效，无外部音频文件
- **localStorage**：所有现代浏览器支持，隐私模式下可能不可用（有降级提示）

---

> **文档结束**
> 下一阶段：开始编写 index.html 实际代码
