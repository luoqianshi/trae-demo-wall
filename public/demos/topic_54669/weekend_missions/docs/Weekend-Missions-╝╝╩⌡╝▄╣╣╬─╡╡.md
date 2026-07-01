# Weekend Missions · 周末密令 — 技术架构文档

> **文档版本：** v1.1  
> **最后更新：** 2026-06-22  
> **产品形态：** 离线 H5 单文件应用  
> **核心技术栈：** 纯 HTML5 + CSS3 + 原生 JavaScript（无框架）

---

> ## ⚠️ 实现现状变更说明（2026-06-24）
>
> 本文档为实现前的早期架构设计，下方正文部分内容已与实际实现不符。**以本框内说明为准**，正文作为概念参考保留。最新实现细节见 [项目进度记录.md](../项目进度记录.md)。
>
> ### 已落地实现（preview/stages-preview.html + preview/js/）
> | 维度 | 早期设计（正文） | 实际实现 |
> |------|------------------|----------|
> | 整体形态 | 单文件 HTML（所有 JS 内联） | HTML + **多个 JS 文件**（`preview/js/` 下 15 个），普通 `<script>` 标签按序加载 |
> | 模块化 | IIFE 或 `<script type="module">` | **禁用 ES module**（`file://` 下被浏览器拦截），用普通 script + 全局对象 `window.WM` 通信 |
> | 游戏画面 | 纯 CSS 绘制 + 极少 SVG | **纯 Canvas 2D 手写渲染**（纹理代码生成），本地地图用 PNG |
> | 状态管理 | 发布订阅 emitter + setState | **`window.WM` 全局对象 + 状态机 `WM.flow`**（无发布订阅） |
> | 数据模型 | presetMissions（3城市主题/stages/hiddenStage） | **`WM.ROUTES`（4条真实路线内联）+ `WM.STAGES`（4关配置）**，由 `generate-stages.js` 生成，内联不 fetch |
> | 地图/定位 | Demo 不使用 | **使用本地地图底图 `shenzhen_full.png` + 真实 GPS 路线投影**（中心 113.945129/22.500940、zoom14、cover 填充） |
> | 关卡流程 | 地图→关卡详情页→签到按钮 | **intro(FC开场)→walk(行进)→transition(转场)→ending(关底)→clear(通关)→finale(总通关评级)** |
>
> ### 仍有效（待集成）
> - 单文件离线、`localStorage` 存档、Canvas 分享卡片、打字机效果、七页框架（boot/home/dialog/map/stage/clear/share）等，属**主应用 index.html 集成阶段**的目标，尚未实现。
> - 多城市主题、彩蛋关、演示模式、"换一个"等为**复赛/完整版规划**，Demo 未实现。
>
> ### 关键约定（勿违反）
> - 不用 ES module、不用 fetch（`file://` 兼容）；尺寸常量挂 `WM.VIEW_W/H/TILE`；地图投影勿改回 zoom15（会导致非首关黑屏）。

---

## 1. 技术选型总览

| 层级 | 技术方案 | 说明 |
|------|----------|------|
| **整体形态** | 单文件 HTML | 一个 `.html` 文件包含所有 HTML/CSS/JS，可双击离线运行 |
| 视图层 | 原生 HTML5 + CSS3 | 无框架，BEM 命名规范，CSS 变量管理主题 |
| 逻辑层 | 原生 JavaScript（ES6+） | 模块化用 IIFE 或 `<script type="module">` |
| 状态管理 | 原生对象 + 简单发布订阅 | Demo 规模无需引入框架 |
| 样式方案 | CSS 变量 + 手写 NES 像素组件 | 全部内联在 `<style>` 标签中 |
| 数据存储 | `localStorage` | 离线持久化进度、事件埋点 |
| 动画 | CSS `@keyframes` + `transform` | 性能优于 JS 动画，符合像素风"step"动画特性 |
| Canvas 绘图 | 浏览器原生 Canvas API | 分享卡片 3 套模板渲染 |
| 像素字体 | Google Fonts (Press Start 2P) | 经典 NES 字体，离线缓存后无外部依赖 |
| 资源 | 纯 CSS 绘制 + 极少 SVG | 避免外部图片依赖，单文件分发 |
| AI 能力 | **Demo 阶段：预置数据** | 模拟 AI 打字效果保留概念 |
| 地图/定位 | **Demo 阶段：不使用** | 手动点击模拟"到达" |
| 部署 | 单文件 HTML + 国内静态服务 | 火山引擎 / 腾讯云 COS / localtunnel |

---

## 2. 项目结构

```
weekend-missions/
├── index.html                      # 主入口（单文件应用）
├── README.md                       # 项目说明
├── docs/                           # 设计文档
│   ├── Weekend-Missions-PRD.md
│   ├── Weekend-Missions-技术架构文档.md
│   ├── Weekend-Missions-交互流程文档.md
│   ├── Weekend-Missions-UI设计规范.md
│   └── Weekend-Missions-周末密令-创意提案.html
└── assets/                         # 可选：独立资源（开发用）
    ├── fonts/                      # 离线字体文件
    └── audio/                      # 音效（可选）
```

**单文件组织方式（index.html）：**

```html
<!DOCTYPE html>
<html>
<head>
  <meta>
  <title>...</title>
  <style> /* 全部 CSS（约 1500-2000 行） */ </style>
</head>
<body>
  <!-- 多个页面容器，通过 JS 切换 display -->
  <div id="page-home" class="page"></div>
  <div id="page-dialog" class="page hidden"></div>
  <div id="page-map" class="page hidden"></div>
  <div id="page-stage-detail" class="page hidden"></div>
  <div id="page-clear" class="page hidden"></div>
  <div id="page-share" class="page hidden"></div>

  <script>
    // 数据层：预置 3 套主题数据
    // 状态层：全局 state 对象 + 事件订阅
    // 视图层：render 函数
    // 控制器：事件处理
  </script>
</body>
</html>
```

---

## 3. 数据模型

### 3.1 主题数据（presetMissions）

Demo 阶段预置 3 套主题，每套包含 5 个关卡 + 1 个隐藏关卡候选。

```javascript
const presetMissions = [
  {
    id: 'shenzhen-couple',
    title: '深圳·情侣甜蜜大作战',
    theme: 'romance',
    city: '深圳',
    groupSize: 2,
    budget: 200,
    estimatedDuration: '4小时',
    briefing: '特工，本次任务：穿越南山区，打卡 5 个甜蜜坐标，找到那家只卖红烧肉的小店。',
    stages: [
      {
        stageIndex: 0,
        status: 'current',
        type: 'park',
        name: '海上世界文化艺术中心',
        address: '深圳市南山区望海路1187号',
        activityDesc: '在海边栈道找到心形雕塑，合影打卡',
        estimatedCost: 0,
        estimatedDuration: '30分钟',
        discoveryNote: '推开玻璃门，海风混着书页的香气扑面而来。这里的海不像海南那样汹涌，更像是一个被驯服的、可以对话的邻居。',
        pixelIcon: 'park',
        hasReplace: true,           // 是否可"换一个"
        replacePool: ['华侨城湿地公园', '深圳湾公园']
      },
      // ... 4 more stages
    ],
    hiddenStage: {
      stageIndex: 5,
      type: 'restaurant',
      name: '老陈红烧肉（隐藏关）',
      activityDesc: '向老板点一份招牌红烧肉，听他讲 20 年前开店的故事',
      discoveryNote: '这家店没有招牌，藏在老陈的私房菜单里。',
      estimatedCost: 80,
    }
  },
  {
    id: 'hangzhou-solo',
    title: '杭州·独居时光漫步',
    // ...
  },
  {
    id: 'shanghai-friends',
    title: '上海·兄弟聚会闯关',
    // ...
  }
];
```

### 3.2 全局状态（state）

```javascript
const state = {
  // 当前主题
  currentTheme: null,             // 当前选中的主题对象

  // 进度
  currentStageIndex: 0,           // 当前关卡索引
  clearedStages: [],              // 已通关关卡索引数组
  replaceCount: {},               // { stageIndex: replaceCount }
  secretFound: false,             // 是否发现彩蛋
  secretAccepted: false,          // 是否接受彩蛋

  // 数值
  hp: 100,                        // 体力值
  budgetUsed: 0,                  // 已花费
  startTime: null,                // 冒险开始时间

  // 演示模式
  demoMode: false,
  easterEggEnabled: true,

  // UI
  currentPage: 'home',            // home/dialog/map/stage-detail/clear/share
  shareTemplate: 'modern',        // pixel/modern/literary
};
```

### 3.3 埋点事件（events）

```javascript
const events = [];  // 存储在 localStorage.wm_events

function track(eventId, params = {}) {
  const event = {
    id: eventId,
    timestamp: Date.now(),
    params
  };
  events.push(event);
  if (DEV_MODE) console.log('[track]', event);
  saveEvents();
}
```

### 3.4 localStorage 结构

```javascript
// 存档
{
  'wm_progress': {
    themeId: 'shenzhen-couple',
    clearedStages: [0, 1],
    currentStageIndex: 2,
    budgetUsed: 80,
    secretFound: true,
    updatedAt: 1719038400000
  },
  'wm_events': [
    { id: 'E-001', timestamp: 1719038400000, params: {} }
  ],
  'wm_settings': {
    demoMode: false,
    easterEggEnabled: true
  }
}
```

---

## 4. 核心模块设计

### 4.1 状态管理（极简发布订阅）

```javascript
// 简单 EventEmitter
const emitter = {
  listeners: {},
  on(event, fn) { (this.listeners[event] ||= []).push(fn); },
  emit(event, data) { (this.listeners[event] || []).forEach(fn => fn(data)); }
};

// 状态变更时触发
function setState(patch) {
  Object.assign(state, patch);
  emitter.emit('stateChange', state);
  saveProgress();
}

// 视图订阅
emitter.on('stateChange', (state) => {
  if (state.currentPage === 'map') renderMap();
  if (state.currentPage === 'stage-detail') renderStageDetail();
  // ...
});
```

### 4.2 路由（页面切换）

```javascript
const pages = ['home', 'dialog', 'map', 'stage-detail', 'clear', 'share'];

function navigate(page, params = {}) {
  pages.forEach(p => {
    document.getElementById(`page-${p}`)?.classList.toggle('hidden', p !== page);
  });
  setState({ currentPage: page, ...params });
  track('page_view', { page });
}
```

### 4.3 打字机效果

```javascript
function typewriter(element, text, speed = 50) {
  return new Promise(resolve => {
    let i = 0;
    element.textContent = '';
    const timer = setInterval(() => {
      element.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

// 用法
await typewriter(element, '特工，欢迎回来。今天想执行什么类型的密令？');
```

### 4.4 像素风动画（CSS keyframes）

```css
/* 闪烁 */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.blink { animation: blink 1.2s step-end infinite; }

/* 脉冲 */
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,210,211,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(0,210,211,0); }
}
.pulse { animation: pulse 1s ease-in-out infinite; }

/* 通关弹入 */
@keyframes stage-clear {
  0% { transform: scale(0) translateY(-200%); }
  60% { transform: scale(1.2) translateY(0); }
  100% { transform: scale(1) translateY(0); }
}
```

### 4.5 分享卡片生成（Canvas）

```javascript
function generateShareCard(template, data) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  if (template === 'pixel') {
    drawPixelTemplate(ctx, data);
  } else if (template === 'modern') {
    drawModernTemplate(ctx, data);
  } else if (template === 'literary') {
    drawLiteraryTemplate(ctx, data);
  }

  return canvas.toDataURL('image/png');
}

function downloadCard(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  a.click();
}
```

---

## 5. 关键技术点

### 5.1 单文件分页架构

所有页面用 `<div class="page">` 容器管理，通过 `hidden` class 切换显示：

```html
<div id="page-home" class="page">...</div>
<div id="page-dialog" class="page hidden">...</div>
<!-- ... -->
```

```css
.page { display: block; }
.page.hidden { display: none; }
```

**优点：** 无需路由库，状态切换简单，单文件可分发给评委。

### 5.2 离线字体加载

```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
```

首次加载需联网缓存字体，之后离线可用。如评委在完全无网环境使用，fallback 到 monospace。

### 5.3 演示模式实现

```javascript
function toggleDemoMode() {
  state.demoMode = !state.demoMode;
  // 演示模式开启：渲染额外的 UI
  document.getElementById('demo-panel').classList.toggle('hidden', !state.demoMode);
  track('demo_mode_toggle', { enabled: state.demoMode });
}

function demoSkipToStage(index) {
  if (!state.demoMode) return;
  state.clearedStages = Array.from({ length: index }, (_, i) => i);
  state.currentStageIndex = index;
  navigate('stage-detail');
}

function demoClearAll() {
  if (!state.demoMode) return;
  state.clearedStages = state.currentTheme.stages.map((_, i) => i);
  if (state.secretAccepted) state.clearedStages.push(state.currentTheme.hiddenStage.stageIndex);
  navigate('clear');
}
```

### 5.4 进度持久化

```javascript
function saveProgress() {
  if (state.demoMode) return; // 演示模式不存档
  localStorage.setItem('wm_progress', JSON.stringify({
    themeId: state.currentTheme?.id,
    clearedStages: state.clearedStages,
    currentStageIndex: state.currentStageIndex,
    budgetUsed: state.budgetUsed,
    secretFound: state.secretFound,
    secretAccepted: state.secretAccepted,
    updatedAt: Date.now()
  }));
}

function loadProgress() {
  const raw = localStorage.getItem('wm_progress');
  if (!raw) return null;
  return JSON.parse(raw);
}

function restoreProgress() {
  const data = loadProgress();
  if (!data) return;
  // 弹窗询问"是否继续上局冒险？"
  if (confirm('检测到未完成的冒险，是否继续？')) {
    const theme = presetMissions.find(m => m.id === data.themeId);
    state.currentTheme = theme;
    Object.assign(state, data);
    navigate('map');
  }
}
```

### 5.5 音效（可选）

使用 Web Audio API 生成简单的 8-bit 音效：

```javascript
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

// 用法
playBeep(880, 80);   // 通关音效
playBeep(220, 200);  // 彩蛋警报
```

---

## 6. Demo 阶段开发计划

### 6.1 技术简化策略

| 完整方案 | Demo 简化 | 说明 |
|----------|-----------|------|
| 真实 AI API 调用 | 预置 3 套主题数据 + 模拟打字 | 保留 AI 概念，零外部依赖 |
| 微信云开发数据库 | localStorage  | 满足离线持久化需求 |
| 腾讯位置服务 | 不使用 | 手动点击模拟签到 |
| 服务端 Canvas 渲染 | 浏览器 Canvas 渲染 | 分享卡片前端生成 |
| 真实 GPS 定位 | 手动点击 | 模拟"到达"动作 |
| 微信分享 | 下载 PNG | 评委可手动分享 |

### 6.2 开发里程碑（21 天）

**第 1-3 天：基础框架**
- 单文件 HTML 骨架，CSS 变量和 NES 主题
- 像素组件库（按钮、对话框、血条、金币条、关卡节点）
- 首页 Title Screen + 3 张主题卡

**第 4-7 天：AI 对话与地图**
- AI 指挥官打字机效果
- 加载动画（3 阶段文字）
- 像素密令地图页（5 关卡 + 路径）

**第 8-12 天：关卡推进核心**
- 关卡详情页（发现笔记打字机展开）
- 签到机制 + 通关小动画
- "换一个"关卡功能（含过渡动画）
- 彩蛋触发（隐藏关卡）

**第 13-16 天：通关与分享**
- STAGE CLEAR 动画
- 冒险总结数据页
- 分享卡片 3 套模板（Canvas 绘制）
- 下载 PNG 功能

**第 17-19 天：演示模式与打磨**
- 演示模式开关（跳关/切换主题）
- localStorage 进度存档
- 像素风动效打磨
- 边界场景处理

**第 20-21 天：测试与提交**
- 多浏览器兼容测试（Chrome/Safari/Edge）
- 移动端适配测试
- 流程走查 + Bug 修复
- 撰写初赛提交帖

### 6.3 单文件大小控制

- 目标：< 2MB（含所有内联资源）
- HTML 主体：~1500 行
- CSS：~2000 行
- JavaScript：~1500 行
- 字体：Google Fonts 缓存后 < 50KB
- 图片资源：尽量用 CSS 绘制，必要时用 SVG 内联

---

## 7. 部署方案

### 7.1 方案对比

| 方案 | 国内访问 | 部署难度 | 适合阶段 |
|------|---------|---------|---------|
| **单文件离线运行** | ✅ 完全无网 | 双击即用 | Demo 主方案 |
| **localtunnel 临时公网链接** | ✅ 国内可访问 | 1 条命令 | 临时演示 |
| **火山引擎静态托管** | ✅ 字节系，速度快 | 中等 | Phase 1 |
| **腾讯云 COS + CDN** | ✅ 稳定 | 中等 | Phase 1 |
| **Vercel/Netlify** | ⚠️ 国内访问慢 | 简单 | 海外演示 |
| **GitHub Pages** | ⚠️ 国内不稳定 | 简单 | 海外演示 |

### 7.2 推荐方案

**Demo 阶段（当前）：**
1. **主方案**：单文件 HTML，评委双击离线运行
2. **辅助方案**：用 localtunnel 生成临时公网链接
   ```bash
   npx localtunnel --port 8080 --subdomain weekend-missions
   # 生成 https://weekend-missions.loca.lt/
   ```

**Phase 1：**
- 部署到火山引擎静态托管，生成正式链接
- 域名：`weekend-missions.byteva.cn`（示例）

### 7.3 离线 HTML 分发

```bash
# 打包成 zip 方便评委下载
zip weekend-missions.zip index.html
# 体积：~500KB - 2MB
```

---

## 8. 浏览器兼容性

| 维度 | 要求 |
|------|------|
| Chrome | >= 80 ✅ |
| Safari | >= 13 ✅ |
| Edge | >= 80 ✅ |
| Firefox | >= 75 ✅（次要支持） |
| iOS Safari | >= 13 ✅ |
| Android Chrome | >= 8.0 ✅ |
| 屏幕宽度 | 320px - 1920px 自适应 |
| 网络 | 首次加载后可完全离线 |
| 协议 | `file://` 和 `https://` 均可 |

### 兼容性陷阱

1. **iOS Safari** 不支持 `backdrop-filter`，模糊效果降级
2. **file:// 协议** 下 `fetch` 不可用 → 不要用 fetch 加载资源
3. **Canvas 字体** 在不同系统上略有差异 → 关键文字用图片兜底
4. **localStorage** 在隐私模式下可能不可用 → 提供降级提示

---

## 9. 性能优化

| 优化点 | 策略 |
|--------|------|
| 首屏加载 | 内联 CSS 关键路径，字体异步加载 |
| 动画性能 | 使用 `transform` 和 `opacity`，避免重排重绘 |
| 像素动画 | 使用 `step-end` / `step-start` 而非 `ease` |
| 事件处理 | 事件委托，避免逐元素绑定 |
| Canvas 离屏渲染 | 分享卡片用 `OffscreenCanvas` 优化（如支持） |
| localStorage 写入 | 防抖 1 秒后批量写入 |

---

## 10. 安全与隐私

- **无网络请求**：单文件运行，不收集任何数据
- **localStorage 数据**：仅本地保存，不上传
- **无第三方追踪**：不接入任何分析 SDK
- **无 Cookie**：纯静态页面

---

## 11. Demo 提交物清单

1. **`index.html`** - 单文件应用（核心交付物）
2. **`weekend-missions.zip`** - 打包后的 HTML（备选）
3. **`README.md`** - 打开说明
4. **`docs/`** - 完整设计文档
5. **演示视频** - 3 分钟完整流程录屏
6. **创意提案 HTML** - 现有 `Weekend-Missions-周末密令-创意提案.html`

---

> **文档结束**
