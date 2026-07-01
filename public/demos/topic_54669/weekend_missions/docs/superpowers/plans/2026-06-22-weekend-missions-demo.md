# Weekend Missions Demo 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个可运行的离线 H5 单文件 Demo，包含完整的游戏循环：开机仪式 → 主题选择 → AI对话 → 密令地图 → 关卡打卡 → 通关动画 → 分享卡片。

**Architecture:** 单文件 index.html，所有 HTML/CSS/JS 内联。使用 CSS 变量管理主题色，原生 JS 管理状态和路由，Canvas API 绘制分享卡片。预置 3 套主题数据，localStorage 存档。

**Tech Stack:** 纯 HTML5 + CSS3 + 原生 JavaScript（ES6+），Google Fonts (Press Start 2P)，Canvas API，localStorage，Web Audio API（可选）

---

## 文件结构

```
weekend-missions/
├── index.html                    # 主应用（本次开发目标）
├── docs/
│   ├── Weekend-Missions-开发规格说明书.md  # SPEC 参考
│   ├── Weekend-Missions-UI设计规范.md      # 视觉参考
│   └── Weekend-Missions-视觉风格指南.html  # 组件预览参考
└── README.md                     # 项目说明
```

---

## Phase 1: 基础框架（核心循环可运行）

### Task 1: HTML 骨架 + CSS 变量 + 页面容器

**Files:**
- Create: `e:\weekend_missions\index.html`

- [ ] **Step 1: 创建 HTML 基础结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Weekend Missions - 周末密令</title>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <style>
        /* CSS 将在后续步骤添加 */
    </style>
</head>
<body>
    <div id="app">
        <!-- 页面容器将在后续步骤添加 -->
    </div>
    <script>
        /* JavaScript 将在后续步骤添加 */
    </script>
</body>
</html>
```

- [ ] **Step 2: 添加 CSS 变量（NES 调色板）**

在 `<style>` 标签内添加：

```css
:root {
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
    --font-pixel: 'Press Start 2P', monospace;
}
```

- [ ] **Step 3: 添加通用样式（reset + body + scanlines）**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: var(--font-pixel);
    background-color: var(--nes-black);
    color: var(--nes-white);
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
}

.scanlines {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.15) 2px,
        rgba(0, 0, 0, 0.15) 4px
    );
    z-index: 9999;
}

.page { display: block; }
.page.hidden { display: none; }
```

- [ ] **Step 4: 添加 7 个页面容器**

在 `<div id="app">` 内添加：

```html
<div class="scanlines"></div>

<!-- P0: boot 开机仪式 -->
<div id="page-boot" class="page">
    <div class="boot-screen">
        <div class="boot-line"></div>
        <h1 class="boot-title">WEEKEND MISSIONS</h1>
    </div>
</div>

<!-- P1: home 首页 -->
<div id="page-home" class="page hidden">
    <div class="home-content">
        <h1 class="main-title">WEEKEND MISSIONS</h1>
        <h2 class="sub-title">周 末 密 令</h2>
        <p class="tagline">-- TRAE AI 创造力大赛参赛作品 --</p>
        <div id="theme-cards" class="theme-cards"></div>
        <div class="press-start blink">▶ PRESS START</div>
        <button id="continue-btn" class="continue-btn hidden">▶ 继续上局</button>
    </div>
    <div id="demo-toggle" class="demo-toggle">🎮 演示模式</div>
</div>

<!-- P2: dialog 主题确认 -->
<div id="page-dialog" class="page hidden">
    <div class="dialog-header">
        <h2 id="dialog-theme-title"></h2>
    </div>
    <div class="dialog-box">
        <div id="dialog-text" class="dialog-text"></div>
        <div class="dialog-arrow blink">▼</div>
    </div>
    <div id="loading-text" class="loading-text"></div>
    <button id="skip-dialog-btn" class="skip-btn">跳过</button>
</div>

<!-- P3: map 密令地图 -->
<div id="page-map" class="page hidden">
    <div class="status-bar">
        <span id="hp-icon" class="hp-icon">🧍</span>
        <div class="hp-bar"><div id="hp-fill" class="hp-fill hp-green"></div></div>
        <span id="hp-text">100%</span>
        <span>💰</span>
        <div class="coin-bar"><div id="coin-fill" class="coin-fill"></div></div>
        <span id="coin-text">¥0/200</span>
        <span id="map-theme-name"></span>
    </div>
    <div id="stage-nodes" class="stage-nodes"></div>
    <div id="demo-panel" class="demo-panel hidden">
        <button id="demo-clear-btn">一键通关</button>
        <select id="demo-theme-select">
            <option value="shenzhen-couple">深圳</option>
            <option value="hangzhou-solo">杭州</option>
            <option value="shanghai-friends">上海</option>
        </select>
    </div>
</div>

<!-- P4: stage-detail 关卡详情 -->
<div id="page-stage-detail" class="page hidden">
    <div class="stage-header">
        <h2 id="stage-title"></h2>
    </div>
    <div class="stage-info">
        <p id="stage-address">📍 地址</p>
        <p id="stage-cost">💰 预计花费</p>
        <p id="stage-duration">⏱ 预计时长</p>
    </div>
    <div class="stage-note-box">
        <p id="stage-note" class="stage-note"></p>
    </div>
    <p id="stage-task" class="stage-task">📋 任务</p>
    <div class="stage-buttons">
        <button id="replace-btn" class="pixel-btn-b">🔄 换一个</button>
        <button id="checkin-btn" class="pixel-btn-a">✅ 已到达·签到</button>
        <button id="back-map-btn" class="pixel-btn-b">返回地图</button>
    </div>
</div>

<!-- P5: clear 通关 -->
<div id="page-clear" class="page hidden">
    <div class="clear-screen">
        <h1 id="clear-title" class="clear-title hidden">STAGE CLEAR!</h1>
        <div id="clear-stats" class="clear-stats hidden"></div>
        <div id="clear-rank" class="clear-rank hidden"></div>
        <div class="clear-buttons hidden">
            <button id="share-btn" class="pixel-btn-start">生成分享卡片</button>
            <button id="restart-btn" class="pixel-btn-b">再来一局</button>
        </div>
    </div>
    <button id="skip-clear-btn" class="skip-clear-btn">跳过</button>
</div>

<!-- P6: share 分享卡片 -->
<div id="page-share" class="page hidden">
    <div class="template-selector">
        <button class="template-btn active" data-template="pixel">像素复古</button>
        <button class="template-btn" data-template="modern">现代简约</button>
        <button class="template-btn" data-template="literary">文艺清新</button>
    </div>
    <div class="card-preview">
        <canvas id="share-canvas" width="540" height="960"></canvas>
    </div>
    <div class="share-buttons">
        <button id="download-btn" class="pixel-btn-a">下载 PNG</button>
        <button id="switch-template-btn" class="pixel-btn-b">再换一张</button>
        <button id="back-clear-btn" class="pixel-btn-b">回到通关页</button>
    </div>
</div>

<!-- Modal: 彩蛋弹窗 -->
<div id="modal-easter-egg" class="modal hidden">
    <div class="easter-egg-content">
        <h2 class="easter-egg-title blink">⚠ 发现隐藏密令！⚠</h2>
        <p id="easter-egg-location"></p>
        <p id="easter-egg-task"></p>
        <div class="easter-egg-buttons">
            <button id="accept-easter-btn" class="pixel-btn-a">接受挑战</button>
            <button id="skip-easter-btn" class="pixel-btn-b">跳过</button>
        </div>
    </div>
</div>
```

- [ ] **Step 5: 添加页面样式（boot + home）**

```css
/* Boot 页 */
.boot-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--nes-black);
}
.boot-line {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 4px;
    background: var(--nes-white);
    animation: bootScroll 0.5s step-end forwards;
}
@keyframes bootScroll {
    0% { top: 0; }
    100% { top: 100%; }
}
.boot-title {
    font-size: 24px;
    color: var(--nes-yellow);
    opacity: 0;
    animation: fadeIn 0.3s step-end 0.5s forwards;
}
@keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
}

/* Home 页 */
.home-content {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.main-title {
    font-size: 20px;
    color: var(--nes-yellow);
    margin-bottom: 10px;
}
.sub-title {
    font-size: 14px;
    color: var(--nes-white);
    margin-bottom: 20px;
}
.tagline {
    font-size: 8px;
    color: var(--nes-gray);
    margin-bottom: 30px;
}
.theme-cards {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
    width: 100%;
    max-width: 300px;
}
.press-start {
    font-size: 12px;
    color: var(--nes-yellow);
    margin-top: 20px;
}
.blink {
    animation: blink 1.2s step-end infinite;
}
@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}
.continue-btn {
    font-size: 10px;
    padding: 10px 20px;
    background: var(--nes-green);
    color: var(--nes-black);
    border: 4px solid;
    border-color: #6ee7b7 #065f46 #065f46 #6ee7b7;
    margin-top: 10px;
}
.demo-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    font-size: 8px;
    padding: 8px 12px;
    background: var(--nes-dark);
    color: var(--nes-yellow);
    border: 2px solid var(--nes-yellow);
    cursor: pointer;
}
```

- [ ] **Step 6: 验证页面结构**

在浏览器中打开 `index.html`，确认：
- 黑屏显示（boot 页激活）
- 扫描线覆盖全屏
- 其他页面隐藏

---

### Task 2: 状态管理 + 路由系统

**Files:**
- Modify: `e:\weekend_missions\index.html` (script 部分)

- [ ] **Step 1: 添加全局状态对象**

在 `<script>` 标签内添加：

```javascript
// ===== 全局状态 =====
const state = {
    currentPage: 'boot',
    currentThemeId: null,
    currentTheme: null,
    currentStageIndex: 0,
    clearedStages: [],
    replacedStages: {},
    hp: 100,
    budgetUsed: 0,
    startTime: null,
    easterEggEnabled: true,
    easterEggAccepted: false,
    easterEggTriggered: false,
    shareTemplate: 'pixel',
    demoMode: false
};
```

- [ ] **Step 2: 添加路由函数**

```javascript
// ===== 路由系统 =====
const PAGES = ['boot', 'home', 'dialog', 'map', 'stage-detail', 'clear', 'share'];

function navigate(page, params = {}) {
    // 隐藏所有页面
    PAGES.forEach(p => {
        const el = document.getElementById(`page-${p}`);
        if (el) el.classList.toggle('hidden', p !== page);
    });
    
    // 更新状态
    Object.assign(state, params);
    state.currentPage = page;
    
    // 触发页面渲染
    if (page === 'home') renderHome();
    if (page === 'dialog') renderDialog();
    if (page === 'map') renderMap();
    if (page === 'stage-detail') renderStageDetail();
    if (page === 'clear') renderClear();
    if (page === 'share') renderShare();
    
    console.log(`Navigate to: ${page}`, params);
}
```

- [ ] **Step 3: 添加初始化函数**

```javascript
// ===== 初始化 =====
function init() {
    // 检查存档
    const saved = localStorage.getItem('wm_progress');
    if (saved) {
        document.getElementById('continue-btn').classList.remove('hidden');
    }
    
    // 0.8秒后跳转到首页
    setTimeout(() => {
        navigate('home');
    }, 800);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 4: 验证路由**

在浏览器中打开，确认：
- 0.8秒后自动跳转到 home 页
- home 页显示标题和 PRESS START

---

### Task 3: 预置数据（3套主题）

**Files:**
- Modify: `e:\weekend_missions\index.html` (script 部分)

- [ ] **Step 1: 添加预置主题数据**

在 `<script>` 内，state 定义之前添加：

```javascript
// ===== 预置数据 =====
const presetThemes = {
    'shenzhen-couple': {
        id: 'shenzhen-couple',
        title: '深圳·情侣甜蜜大作战',
        city: '深圳',
        groupSize: 2,
        budget: 200,
        themeColor: '#FD79A8',
        briefing: [
            '特工，密令已下达。',
            '本次任务：深圳·情侣甜蜜大作战',
            '作战时间：今日 10:00 - 19:00',
            '作战预算：¥200',
            '作战人数：2 人',
            '任务：穿越南山区，打卡 5 个甜蜜坐标。'
        ],
        stages: [
            {
                index: 0,
                name: '海上世界文化艺术中心',
                address: '深圳市南山区望海路1187号',
                type: 'park',
                activity: '找到心形雕塑，合影打卡',
                note: '推开玻璃门，海风混着书页的香气扑面而来。这里的海不像海南那样汹涌，更像是一个被驯服的、可以对话的邻居。',
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
                note: '这家藏在巷子里的咖啡馆，墙上贴满了旅行者留下的明信片。每一张都是一个故事。',
                cost: 45,
                duration: '1小时',
                replacePool: ['鹿鸣咖啡', 'MANNER咖啡(深圳湾店)']
            },
            {
                index: 2,
                name: '南山书城',
                address: '深圳市南山区南海大道2748号',
                type: 'culture',
                activity: '在角落找到一本喜欢的书，拍照分享',
                note: '书城的二楼有一个安静的角落，阳光从落地窗洒进来。在这里，时间会慢下来。',
                cost: 0,
                duration: '45分钟',
                replacePool: ['蛇口图书馆', '华侨城创意园书店']
            },
            {
                index: 3,
                name: '海岸城购物中心',
                address: '深圳市南山区文心五路',
                type: 'shop',
                activity: '逛逛精品店，找一个小礼物',
                note: '海岸城的顶层有一个观景台，可以俯瞰整个南山。傍晚时分，夕阳会把整个城市染成金色。',
                cost: 50,
                duration: '1小时',
                replacePool: ['万象天地', '益田假日广场']
            },
            {
                index: 4,
                name: '深圳湾公园（BOSS关）',
                address: '深圳市南山区滨海大道',
                type: 'park',
                activity: '在海边栈道散步，看日落',
                note: '这里是今天的压轴。当夕阳落下，整个海湾会被染成橙红色。牵着她的手，慢慢走完这段栈道。',
                cost: 0,
                duration: '1小时',
                isBoss: true,
                replacePool: []
            }
        ],
        hiddenStage: {
            name: '老陈红烧肉（隐藏关）',
            address: '深圳市南山区某小巷',
            type: 'restaurant',
            activity: '向老板点一份招牌红烧肉，听他讲故事',
            note: '这家店没有招牌，藏在老陈的私房菜单里。据说老板年轻时是个厨师，这道红烧肉是他毕生的心血。',
            cost: 80
        }
    },
    'hangzhou-solo': {
        id: 'hangzhou-solo',
        title: '杭州·独居时光漫步',
        city: '杭州',
        groupSize: 1,
        budget: 150,
        themeColor: '#00D2D3',
        briefing: [
            '特工，密令已下达。',
            '本次任务：杭州·独居时光漫步',
            '作战时间：今日 10:00 - 19:00',
            '作战预算：¥150',
            '作战人数：1 人',
            '任务：一个人，一座城，发现杭州的小众浪漫。'
        ],
        stages: [
            { index: 0, name: '西湖边的小茶馆', address: '杭州市西湖区龙井路', type: 'cafe', activity: '点一杯龙井，发呆一小时', note: '推开那扇绿色铁门，你会看到一个被爬山虎包围的天井院子...', cost: 30, duration: '1小时', replacePool: ['猫空咖啡馆', '西湖边的茶室'] },
            { index: 1, name: '河坊街老面馆', address: '杭州市上城区河坊街', type: 'restaurant', activity: '吃一碗片儿川', note: '这家店没有招牌，只有门口飘着的面香...', cost: 25, duration: '30分钟', replacePool: ['知味观', '新白鹿餐厅'] },
            { index: 2, name: '中国美术学院南山校区', address: '杭州市西湖区南山路', type: 'culture', activity: '在校园里走走，看看学生作品', note: '美院的墙上有学生留下的涂鸦，每一幅都是一个故事...', cost: 0, duration: '45分钟', replacePool: ['浙江美术馆', '西湖博物馆'] },
            { index: 3, name: '南宋御街', address: '杭州市上城区中山中路', type: 'shop', activity: '逛逛小店，找一个纪念品', note: '这条街保留着南宋时期的格局，走在这里像穿越...', cost: 40, duration: '1小时', replacePool: ['武林夜市', '湖滨银泰'] },
            { index: 4, name: '宝石山日落（BOSS关）', address: '杭州市西湖区宝石山', type: 'park', activity: '爬上山顶，看西湖日落', note: '这是今天的压轴。站在宝石山顶，整个西湖在脚下...', cost: 0, duration: '1.5小时', isBoss: true, replacePool: [] }
        ],
        hiddenStage: {
            name: '隐藏茶室（隐藏关）',
            address: '杭州市西湖区某小巷',
            type: 'cafe',
            activity: '找到这家只有三张桌子的茶室',
            note: '据说这家茶室的老板是个退休的书法家...',
            cost: 50
        }
    },
    'shanghai-friends': {
        id: 'shanghai-friends',
        title: '上海·兄弟聚会闯关',
        city: '上海',
        groupSize: 4,
        budget: 500,
        themeColor: '#F1C40F',
        briefing: [
            '特工，密令已下达。',
            '本次任务：上海·兄弟聚会闯关',
            '作战时间：今日 10:00 - 19:00',
            '作战预算：¥500',
            '作战人数：4 人',
            '任务：魔都美食探店，比比谁更会吃！'
        ],
        stages: [
            { index: 0, name: '武康路咖啡', address: '上海市徐汇区武康路', type: 'cafe', activity: '打卡网红咖啡店，拍照发朋友圈', note: '武康路的梧桐树下，藏着上海最文艺的咖啡馆...', cost: 80, duration: '1小时', replacePool: ['衡山路酒吧', '永嘉路咖啡'] },
            { index: 1, name: '老上海本帮菜', address: '上海市黄浦区福州路', type: 'restaurant', activity: '点一份红烧肉，一份糖醋排骨', note: '这家店开了三十年，老板是个上海老阿姨...', cost: 150, duration: '1.5小时', replacePool: ['老正兴', '德兴馆'] },
            { index: 2, name: '田子坊艺术区', address: '上海市黄浦区泰康路', type: 'culture', activity: '逛逛画廊，看看街头艺术', note: '田子坊的巷子里藏着无数惊喜...', cost: 0, duration: '1小时', replacePool: ['M50创意园', '1933老场坊'] },
            { index: 3, name: '南京路步行街', address: '上海市黄浦区南京路', type: 'shop', activity: '逛逛老字号，买点特产', note: '南京路是上海最热闹的地方...', cost: 100, duration: '1小时', replacePool: ['淮海路', '新天地'] },
            { index: 4, name: '外滩夜景（BOSS关）', address: '上海市黄浦区中山东一路', type: 'park', activity: '在外滩看夜景，拍合影', note: '这是今天的压轴。站在外滩，对面是陆家嘴的灯火...', cost: 0, duration: '1小时', isBoss: true, replacePool: [] }
        ],
        hiddenStage: {
            name: '深夜烧烤摊（隐藏关）',
            address: '上海市静安区某小巷',
            type: 'restaurant',
            activity: '找到这家只开夜市的烧烤摊',
            note: '据说这家烧烤摊的老板是个退役的厨师...',
            cost: 120
        }
    }
};
```

- [ ] **Step 2: 验证数据结构**

在浏览器控制台输入：
```javascript
console.log(presetThemes['shenzhen-couple'].stages[0].name);
```
预期输出：`海上世界文化艺术中心`

---

### Task 4: home 页渲染 + 主题卡交互

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加 renderHome 函数**

```javascript
// ===== 页面渲染函数 =====
function renderHome() {
    const container = document.getElementById('theme-cards');
    container.innerHTML = '';
    
    Object.values(presetThemes).forEach(theme => {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.style.background = `linear-gradient(135deg, ${theme.themeColor}, ${theme.themeColor}88)`;
        card.innerHTML = `
            <div class="theme-title">${theme.title}</div>
            <div class="theme-info">👥 ${theme.groupSize}人 | 💰 ¥${theme.budget}</div>
        `;
        card.onclick = () => selectTheme(theme.id);
        container.appendChild(card);
    });
}
```

- [ ] **Step 2: 添加主题卡样式**

```css
/* 主题卡样式 */
.theme-card {
    padding: 20px;
    border: 4px solid;
    border-color: var(--nes-white) var(--nes-gray) var(--nes-gray) var(--nes-white);
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s;
}
.theme-card:hover {
    transform: scale(1.05);
}
.theme-title {
    font-size: 12px;
    color: var(--nes-white);
    text-shadow: 2px 2px 0 var(--nes-black);
    margin-bottom: 10px;
}
.theme-info {
    font-size: 8px;
    color: rgba(255,255,255,0.9);
}
```

- [ ] **Step 3: 添加 selectTheme 函数**

```javascript
function selectTheme(themeId) {
    state.currentThemeId = themeId;
    state.currentTheme = presetThemes[themeId];
    state.startTime = Date.now();
    navigate('dialog');
}
```

- [ ] **Step 4: 验证主题卡点击**

在浏览器中：
- 点击深圳主题卡
- 确认跳转到 dialog 页
- 控制台输出：`Navigate to: dialog`

---

### Task 5: dialog 页打字机效果 + 加载动画

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加打字机效果函数**

```javascript
// ===== 工具函数 =====
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function typewriter(element, text, speed = 50) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await sleep(speed);
    }
}
```

- [ ] **Step 2: 添加 renderDialog 函数**

```javascript
async function renderDialog() {
    const theme = state.currentTheme;
    const titleEl = document.getElementById('dialog-theme-title');
    const textEl = document.getElementById('dialog-text');
    const loadingEl = document.getElementById('loading-text');
    
    titleEl.textContent = theme.title;
    textEl.textContent = '';
    loadingEl.textContent = '';
    
    // 打字机效果显示 briefing
    for (const line of theme.briefing) {
        await typewriter(textEl, line, 50);
        await sleep(800);
        textEl.textContent = '';
    }
    
    // 加载动画
    const loadingLines = [
        '正在扫描区域情报...',
        '规划潜入路线...',
        '密令生成完毕！'
    ];
    for (const line of loadingLines) {
        loadingEl.textContent = line;
        await sleep(600);
    }
    
    // 自动跳转到地图
    await sleep(500);
    navigate('map');
}
```

- [ ] **Step 3: 添加 dialog 页样式**

```css
/* Dialog 页样式 */
.dialog-header {
    padding: 20px;
    text-align: center;
}
#dialog-theme-title {
    font-size: 14px;
    color: var(--nes-yellow);
}
.dialog-box {
    background: var(--nes-black);
    border: 4px solid;
    border-color: var(--nes-white) var(--nes-gray) var(--nes-gray) var(--nes-white);
    padding: 20px;
    margin: 20px;
    min-height: 100px;
}
.dialog-text {
    font-size: 10px;
    color: var(--nes-cyan);
    line-height: 1.8;
}
.dialog-arrow {
    text-align: center;
    color: var(--nes-cyan);
    margin-top: 10px;
}
.loading-text {
    font-size: 10px;
    color: var(--nes-yellow);
    text-align: center;
    margin: 20px;
}
.skip-btn {
    font-size: 8px;
    padding: 10px 20px;
    background: var(--nes-gray);
    color: var(--nes-white);
    border: 4px solid;
    border-color: var(--nes-white) var(--nes-gray) var(--nes-gray) var(--nes-white);
    display: block;
    margin: 20px auto;
    cursor: pointer;
}
```

- [ ] **Step 4: 添加跳过按钮事件**

```javascript
document.getElementById('skip-dialog-btn').onclick = () => {
    navigate('map');
};
```

- [ ] **Step 5: 验证打字机效果**

在浏览器中：
- 选择深圳主题
- 观察打字机效果逐字显示
- 等待自动跳转到地图页
- 点击跳过按钮确认立即跳转

---

### Task 6: map 页关卡节点 + 状态条

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加 renderMap 函数**

```javascript
function renderMap() {
    const theme = state.currentTheme;
    const nodesContainer = document.getElementById('stage-nodes');
    const themeNameEl = document.getElementById('map-theme-name');
    
    themeNameEl.textContent = theme.title;
    
    // 更新状态条
    updateStatusBar();
    
    // 渲染关卡节点
    nodesContainer.innerHTML = '';
    theme.stages.forEach((stage, i) => {
        const node = createStageNode(stage, i);
        nodesContainer.appendChild(node);
    });
    
    // 如果有隐藏关卡且已接受
    if (state.easterEggAccepted) {
        const hiddenNode = createHiddenNode();
        nodesContainer.appendChild(hiddenNode);
    }
    
    // 演示模式面板
    if (state.demoMode) {
        document.getElementById('demo-panel').classList.remove('hidden');
    }
}

function createStageNode(stage, index) {
    const node = document.createElement('div');
    node.className = 'stage-node';
    node.dataset.index = index;
    
    // 状态判断
    if (state.clearedStages.includes(index)) {
        node.classList.add('cleared');
        node.innerHTML = '✓';
    } else if (index === state.currentStageIndex) {
        node.classList.add('current');
        node.innerHTML = index + 1;
        // 添加巡逻小人
        const char = document.createElement('span');
        char.className = 'patrol-char';
        char.innerHTML = '🧍';
        node.appendChild(char);
    } else if (stage.isBoss) {
        node.classList.add('boss');
        node.innerHTML = '★';
    } else {
        node.classList.add('locked');
        node.innerHTML = '?';
    }
    
    node.onclick = () => onNodeClick(index);
    return node;
}

function createHiddenNode() {
    const node = document.createElement('div');
    node.className = 'stage-node hidden';
    node.innerHTML = '?';
    node.onclick = () => onNodeClick('hidden');
    return node;
}

function onNodeClick(index) {
    if (index === 'hidden') {
        if (state.easterEggAccepted) {
            navigate('stage-detail', { stageIndex: 'hidden' });
        }
    } else if (state.clearedStages.includes(index)) {
        // 已通关，显示提示
        console.log('已通关');
    } else if (index === state.currentStageIndex) {
        navigate('stage-detail', { stageIndex: index });
    } else {
        console.log('LOCKED');
    }
}
```

- [ ] **Step 2: 添加状态条更新函数**

```javascript
function updateStatusBar() {
    const theme = state.currentTheme;
    const hpFill = document.getElementById('hp-fill');
    const hpText = document.getElementById('hp-text');
    const hpIcon = document.getElementById('hp-icon');
    const coinFill = document.getElementById('coin-fill');
    const coinText = document.getElementById('coin-text');
    
    // HP
    const hpPercent = state.hp;
    hpFill.style.width = hpPercent + '%';
    hpText.textContent = hpPercent + '%';
    
    if (hpPercent > 60) {
        hpFill.className = 'hp-fill hp-green';
        hpIcon.textContent = '🧍';
    } else if (hpPercent > 30) {
        hpFill.className = 'hp-fill hp-yellow';
        hpIcon.textContent = '😓';
    } else {
        hpFill.className = 'hp-fill hp-red';
        hpIcon.textContent = '😰';
    }
    
    // 金币
    const budgetPercent = (state.budgetUsed / theme.budget) * 100;
    coinFill.style.width = Math.min(budgetPercent, 100) + '%';
    coinText.textContent = `¥${state.budgetUsed}/${theme.budget}`;
    
    if (state.budgetUsed > theme.budget) {
        coinFill.style.background = 'var(--nes-red)';
        coinFill.classList.add('blink');
    }
}
```

- [ ] **Step 3: 添加关卡节点样式**

```css
/* Map 页样式 */
.status-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px;
    background: var(--nes-dark);
    border-bottom: 4px solid var(--nes-gray);
    font-size: 8px;
}
.hp-bar, .coin-bar {
    width: 80px;
    height: 16px;
    background: var(--nes-black);
    border: 2px solid;
    border-color: var(--nes-gray) var(--nes-white) var(--nes-white) var(--nes-gray);
}
.hp-fill, .coin-fill {
    height: 100%;
    transition: width 0.5s step-end;
}
.hp-green { background: var(--nes-green); }
.hp-yellow { background: var(--nes-yellow); }
.hp-red { background: var(--nes-red); }
.coin-fill { background: var(--nes-yellow); }

.stage-nodes {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 40px 20px;
}

.stage-node {
    width: 48px;
    height: 48px;
    border: 4px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    position: relative;
    cursor: pointer;
}
.stage-node.locked {
    border-color: var(--nes-gray);
    background: var(--nes-dark);
    color: var(--nes-gray);
}
.stage-node.current {
    border-color: var(--nes-cyan);
    background: var(--nes-dark);
    color: var(--nes-cyan);
    animation: pulse 1s infinite;
}
@keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,210,211,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(0,210,211,0); }
}
.stage-node.cleared {
    border-color: var(--nes-green);
    background: var(--nes-green);
    color: var(--nes-black);
}
.stage-node.boss {
    width: 60px;
    height: 60px;
    border-color: var(--nes-red);
    background: var(--nes-dark);
    color: var(--nes-red);
}
.stage-node.hidden {
    border-color: var(--nes-purple);
    background: var(--nes-dark);
    color: var(--nes-purple);
    animation: blink 1.2s infinite;
}
.patrol-char {
    position: absolute;
    font-size: 12px;
    animation: patrol 2s infinite;
}
@keyframes patrol {
    0%, 100% { left: 4px; }
    50% { left: 24px; }
}

.demo-panel {
    position: fixed;
    top: 80px;
    right: 20px;
    background: var(--nes-dark);
    border: 2px solid var(--nes-yellow);
    padding: 10px;
    font-size: 8px;
}
.demo-panel button, .demo-panel select {
    font-size: 8px;
    margin: 5px;
}
```

- [ ] **Step 4: 验证地图页**

在浏览器中：
- 完成 dialog 页流程
- 确认地图页显示 5 个关卡节点
- 第一个节点有巡逻小人动画
- 点击当前节点跳转到详情页

---

### Task 7: stage-detail 页 + 签到逻辑

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加 renderStageDetail 函数**

```javascript
async function renderStageDetail() {
    const theme = state.currentTheme;
    const stageIndex = state.stageIndex;
    
    let stage;
    if (stageIndex === 'hidden') {
        stage = theme.hiddenStage;
    } else {
        stage = theme.stages[stageIndex];
    }
    
    document.getElementById('stage-title').textContent = 
        `STAGE ${stageIndex === 'hidden' ? 'H' : stageIndex + 1}: ${stage.name}`;
    document.getElementById('stage-address').textContent = `📍 ${stage.address}`;
    document.getElementById('stage-cost').textContent = `💰 预计: ¥${stage.cost}`;
    document.getElementById('stage-duration').textContent = `⏱ 预计: ${stage.duration}`;
    document.getElementById('stage-task').textContent = `📋 ${stage.activity}`;
    
    // 发现笔记打字机效果
    const noteEl = document.getElementById('stage-note');
    noteEl.textContent = '';
    await typewriter(noteEl, stage.note, 50);
}
```

- [ ] **Step 2: 添加签到函数**

```javascript
function onCheckin() {
    const theme = state.currentTheme;
    const stageIndex = state.stageIndex;
    
    let stage;
    if (stageIndex === 'hidden') {
        stage = theme.hiddenStage;
        state.easterEggTriggered = true;
    } else {
        stage = theme.stages[stageIndex];
    }
    
    // 更新状态
    state.clearedStages.push(stageIndex);
    state.hp -= 20;
    state.budgetUsed += stage.cost;
    
    // 保存进度
    saveProgress();
    
    // 检查彩蛋触发（第2关通关后）
    if (state.clearedStages.length === 2 && state.easterEggEnabled && !state.easterEggAccepted) {
        showEasterEggModal();
        return;
    }
    
    // 检查是否通关
    const totalStages = theme.stages.length + (state.easterEggAccepted ? 1 : 0);
    if (state.clearedStages.length >= totalStages) {
        navigate('clear');
    } else {
        // 更新当前关卡索引
        state.currentStageIndex = getNextStageIndex();
        navigate('map');
    }
}

function getNextStageIndex() {
    const theme = state.currentTheme;
    for (let i = 0; i < theme.stages.length; i++) {
        if (!state.clearedStages.includes(i)) {
            return i;
        }
    }
    if (state.easterEggAccepted && !state.clearedStages.includes('hidden')) {
        return 'hidden';
    }
    return null;
}
```

- [ ] **Step 3: 添加存档函数**

```javascript
function saveProgress() {
    const data = {
        themeId: state.currentThemeId,
        clearedStages: state.clearedStages,
        currentStageIndex: state.currentStageIndex,
        budgetUsed: state.budgetUsed,
        hp: state.hp,
        startTime: state.startTime,
        easterEggAccepted: state.easterEggAccepted,
        updatedAt: Date.now()
    };
    localStorage.setItem('wm_progress', JSON.stringify(data));
}

function loadProgress() {
    const raw = localStorage.getItem('wm_progress');
    if (!raw) return null;
    return JSON.parse(raw);
}
```

- [ ] **Step 4: 添加按钮事件**

```javascript
document.getElementById('checkin-btn').onclick = () => {
    if (confirm('确认已到达？')) {
        onCheckin();
    }
};

document.getElementById('back-map-btn').onclick = () => {
    navigate('map');
};

document.getElementById('replace-btn').onclick = () => {
    // 换一个功能（简化版）
    console.log('换一个');
};
```

- [ ] **Step 5: 添加 stage-detail 样式**

```css
/* Stage Detail 页样式 */
#page-stage-detail {
    padding: 20px;
}
.stage-header {
    text-align: center;
    margin-bottom: 20px;
}
#stage-title {
    font-size: 12px;
    color: var(--nes-yellow);
}
.stage-info {
    font-size: 8px;
    color: var(--nes-white);
    margin-bottom: 20px;
}
.stage-info p {
    margin: 5px 0;
}
.stage-note-box {
    background: var(--nes-black);
    border: 4px solid;
    border-color: var(--nes-white) var(--nes-gray) var(--nes-gray) var(--nes-white);
    padding: 15px;
    margin-bottom: 20px;
}
.stage-note {
    font-size: 10px;
    color: var(--nes-cyan);
    line-height: 1.8;
}
.stage-task {
    font-size: 10px;
    color: var(--nes-yellow);
    margin-bottom: 20px;
}
.stage-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.pixel-btn-a, .pixel-btn-b {
    font-size: 10px;
    padding: 12px 20px;
    border: 4px solid;
    cursor: pointer;
}
.pixel-btn-a {
    background: var(--nes-red);
    color: var(--nes-white);
    border-color: #ff8a80 #8b0000 #8b0000 #ff8a80;
}
.pixel-btn-a:active {
    border-color: #8b0000 #ff8a80 #ff8a80 #8b0000;
}
.pixel-btn-b {
    background: var(--nes-blue);
    color: var(--nes-white);
    border-color: #6d8cc4 #1a2f5a #1a2f5a #6d8cc4;
}
```

- [ ] **Step 6: 验证签到流程**

在浏览器中：
- 点击关卡节点进入详情页
- 确认发现笔记打字机效果
- 点击签到按钮
- 确认确认弹窗
- 确认返回地图页后状态更新（HP减少，金币增加）

---

### Task 8: 彩蛋触发弹窗

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加彩蛋弹窗显示函数**

```javascript
function showEasterEggModal() {
    const theme = state.currentTheme;
    const modal = document.getElementById('modal-easter-egg');
    
    document.getElementById('easter-egg-location').textContent = 
        `地点：${theme.hiddenStage.name}`;
    document.getElementById('easter-egg-task').textContent = 
        `任务：${theme.hiddenStage.activity}`;
    
    modal.classList.remove('hidden');
    
    // 添加闪烁效果
    modal.style.animation = 'alertFlash 0.3s step-end 3';
}

function hideEasterEggModal() {
    document.getElementById('modal-easter-egg').classList.add('hidden');
}
```

- [ ] **Step 2: 添加彩蛋按钮事件**

```javascript
document.getElementById('accept-easter-btn').onclick = () => {
    state.easterEggAccepted = true;
    hideEasterEggModal();
    saveProgress();
    navigate('map');
};

document.getElementById('skip-easter-btn').onclick = () => {
    hideEasterEggModal();
    state.currentStageIndex = getNextStageIndex();
    navigate('map');
};
```

- [ ] **Step 3: 添加彩蛋弹窗样式**

```css
/* 彩蛋弹窗样式 */
.modal {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}
@keyframes alertFlash {
    0%, 100% { background: rgba(0,0,0,0.8); }
    50% { background: rgba(230,126,34,0.8); }
}
.easter-egg-content {
    background: var(--nes-black);
    border: 4px solid var(--nes-orange);
    padding: 30px;
    max-width: 300px;
    text-align: center;
}
.easter-egg-title {
    font-size: 14px;
    color: var(--nes-yellow);
    margin-bottom: 20px;
}
#easter-egg-location, #easter-egg-task {
    font-size: 10px;
    color: var(--nes-white);
    margin: 10px 0;
}
.easter-egg-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    justify-content: center;
}
```

- [ ] **Step 4: 验证彩蛋触发**

在浏览器中：
- 通关前2关
- 确认彩蛋弹窗出现
- 点击接受确认隐藏关卡插入地图
- 点击跳过确认继续主线

---

### Task 9: clear 页通关动画

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加 renderClear 函数**

```javascript
async function renderClear() {
    const theme = state.currentTheme;
    const titleEl = document.getElementById('clear-title');
    const statsEl = document.getElementById('clear-stats');
    const rankEl = document.getElementById('clear-rank');
    const buttonsEl = document.querySelector('.clear-buttons');
    
    // 重置显示
    titleEl.classList.add('hidden');
    statsEl.classList.add('hidden');
    rankEl.classList.add('hidden');
    buttonsEl.classList.add('hidden');
    
    // 黑场
    await sleep(500);
    
    // STAGE CLEAR! 弹入
    titleEl.classList.remove('hidden');
    titleEl.style.animation = 'popIn 0.5s step-end';
    
    // 等待
    await sleep(1500);
    
    // 数据统计
    const stats = calculateStats();
    statsEl.innerHTML = `
        <p>STAGES CLEARED: ${stats.stagesCleared}/${stats.totalStages}</p>
        <p>TIME SPENT: ${stats.timeSpent}</p>
        <p>BUDGET USED: ¥${stats.budgetUsed}</p>
        <p>SECRETS FOUND: ${stats.secretsFound}</p>
    `;
    statsEl.classList.remove('hidden');
    
    await sleep(1000);
    
    // 评级
    const rank = calculateRank(stats);
    rankEl.innerHTML = `<span class="rank-letter">${rank}</span>`;
    rankEl.classList.remove('hidden');
    
    await sleep(500);
    
    // 按钮
    buttonsEl.classList.remove('hidden');
}

function calculateStats() {
    const theme = state.currentTheme;
    const totalStages = theme.stages.length + (state.easterEggAccepted ? 1 : 0);
    const timeMs = Date.now() - state.startTime;
    const hours = Math.floor(timeMs / 3600000);
    const minutes = Math.floor((timeMs % 3600000) / 60000);
    
    return {
        stagesCleared: state.clearedStages.length,
        totalStages,
        timeSpent: `${hours}h${minutes}m`,
        budgetUsed: state.budgetUsed,
        secretsFound: state.easterEggAccepted ? 1 : 0
    };
}

function calculateRank(stats) {
    if (stats.stagesCleared >= stats.totalStages && stats.secretsFound > 0) {
        return 'S';
    } else if (stats.stagesCleared >= stats.totalStages) {
        return 'A';
    } else if (stats.stagesCleared >= stats.totalStages * 0.5) {
        return 'B';
    }
    return 'C';
}
```

- [ ] **Step 2: 添加跳过和按钮事件**

```javascript
document.getElementById('skip-clear-btn').onclick = () => {
    document.getElementById('clear-title').classList.remove('hidden');
    document.getElementById('clear-stats').classList.remove('hidden');
    document.getElementById('clear-rank').classList.remove('hidden');
    document.querySelector('.clear-buttons').classList.remove('hidden');
};

document.getElementById('share-btn').onclick = () => {
    navigate('share');
};

document.getElementById('restart-btn').onclick = () => {
    // 清空状态
    localStorage.removeItem('wm_progress');
    state.clearedStages = [];
    state.currentStageIndex = 0;
    state.hp = 100;
    state.budgetUsed = 0;
    state.easterEggAccepted = false;
    state.easterEggTriggered = false;
    navigate('home');
};
```

- [ ] **Step 3: 添加 clear 页样式**

```css
/* Clear 页样式 */
.clear-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.clear-title {
    font-size: 24px;
    color: var(--nes-yellow);
    margin-bottom: 30px;
}
@keyframes popIn {
    0% { transform: scale(0) translateY(-100px); }
    50% { transform: scale(1.2) translateY(0); }
    100% { transform: scale(1) translateY(0); }
}
.clear-stats {
    font-size: 10px;
    color: var(--nes-cyan);
    text-align: center;
    margin-bottom: 20px;
}
.clear-stats p {
    margin: 5px 0;
}
.clear-rank {
    margin-bottom: 30px;
}
.rank-letter {
    font-size: 48px;
    color: var(--nes-yellow);
}
.clear-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.pixel-btn-start {
    font-size: 12px;
    padding: 15px 30px;
    background: var(--nes-yellow);
    color: var(--nes-black);
    border: 4px solid;
    border-color: #fff #555 #555 #fff;
    cursor: pointer;
    width: 200px;
}
.skip-clear-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    font-size: 8px;
    padding: 8px 12px;
    background: var(--nes-gray);
    color: var(--nes-white);
    border: 2px solid var(--nes-gray);
    cursor: pointer;
}
```

- [ ] **Step 4: 验证通关动画**

在浏览器中：
- 通关所有关卡
- 确认 STAGE CLEAR 动画播放
- 确认数据统计显示
- 确认评级显示
- 点击跳过确认立即显示结果

---

### Task 10: share 页 Canvas 分享卡片

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加 renderShare 函数**

```javascript
function renderShare() {
    drawShareCard(state.shareTemplate);
}

function drawShareCard(template) {
    const canvas = document.getElementById('share-canvas');
    const ctx = canvas.getContext('2d');
    const stats = calculateStats();
    const theme = state.currentTheme;
    
    // 清空画布
    ctx.clearRect(0, 0, 540, 960);
    
    if (template === 'pixel') {
        drawPixelCard(ctx, stats, theme);
    } else if (template === 'modern') {
        drawModernCard(ctx, stats, theme);
    } else {
        drawLiteraryCard(ctx, stats, theme);
    }
}
```

- [ ] **Step 2: 添加像素复古模板绘制**

```javascript
function drawPixelCard(ctx, stats, theme) {
    // 背景
    ctx.fillStyle = '#0F0F0F';
    ctx.fillRect(0, 0, 540, 960);
    
    // 扫描线
    for (let y = 0; y < 960; y += 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, y, 540, 2);
    }
    
    // 标题
    ctx.fillStyle = '#F1C40F';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('WEEKEND MISSIONS', 270, 80);
    
    ctx.fillStyle = '#FCFCFC';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('周 末 密 令', 270, 110);
    
    // STAGE CLEAR
    ctx.fillStyle = '#F1C40F';
    ctx.font = '24px "Press Start 2P"';
    ctx.fillText('ALL STAGES', 270, 200);
    ctx.fillText('CLEARED!', 270, 240);
    
    // 冒险名称
    ctx.fillStyle = '#FCFCFC';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(theme.title, 270, 300);
    
    // 统计数据
    ctx.fillStyle = '#00D2D3';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`STAGES: ${stats.stagesCleared}/${stats.totalStages}`, 50, 400);
    ctx.fillText(`TIME: ${stats.timeSpent}`, 50, 430);
    ctx.fillText(`BUDGET: ¥${stats.budgetUsed}`, 50, 460);
    ctx.fillText(`SECRETS: ${stats.secretsFound}`, 50, 490);
    
    // 评级
    ctx.fillStyle = '#F1C40F';
    ctx.font = '48px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(calculateRank(stats), 270, 600);
    
    // 底部水印
    ctx.fillStyle = '#2D2D3F';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('TRAE AI 创造力大赛参赛作品', 270, 900);
}
```

- [ ] **Step 3: 添加模板切换事件**

```javascript
document.querySelectorAll('.template-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.shareTemplate = btn.dataset.template;
        drawShareCard(state.shareTemplate);
    };
});

document.getElementById('download-btn').onclick = () => {
    const canvas = document.getElementById('share-canvas');
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `weekend-missions-${state.currentThemeId}-${Date.now()}.png`;
    a.click();
};

document.getElementById('back-clear-btn').onclick = () => {
    navigate('clear');
};
```

- [ ] **Step 4: 添加 share 页样式**

```css
/* Share 页样式 */
.template-selector {
    display: flex;
    gap: 10px;
    padding: 15px;
    justify-content: center;
}
.template-btn {
    font-size: 8px;
    padding: 8px 12px;
    background: var(--nes-gray);
    color: var(--nes-white);
    border: 2px solid var(--nes-gray);
    cursor: pointer;
}
.template-btn.active {
    background: var(--nes-yellow);
    color: var(--nes-black);
    border-color: var(--nes-yellow);
}
.card-preview {
    display: flex;
    justify-content: center;
    padding: 20px;
}
#share-canvas {
    border: 4px solid var(--nes-gray);
    max-width: 100%;
    height: auto;
}
.share-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    justify-content: center;
}
```

- [ ] **Step 5: 验证分享卡片**

在浏览器中：
- 通关后点击生成分享卡片
- 确认 Canvas 绘制像素风格卡片
- 点击切换模板按钮
- 点击下载确认 PNG 文件生成

---

## Phase 2: 视觉强化

### Task 11: 演示模式功能

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加演示模式切换**

```javascript
document.getElementById('demo-toggle').onclick = () => {
    state.demoMode = !state.demoMode;
    if (state.demoMode) {
        document.getElementById('demo-panel').classList.remove('hidden');
        document.getElementById('demo-toggle').textContent = '🎮 演示模式: 开';
    } else {
        document.getElementById('demo-panel').classList.add('hidden');
        document.getElementById('demo-toggle').textContent = '🎮 演示模式';
    }
};

document.getElementById('demo-clear-btn').onclick = () => {
    // 一键通关
    const theme = state.currentTheme;
    state.clearedStages = theme.stages.map((_, i) => i);
    if (state.easterEggAccepted) {
        state.clearedStages.push('hidden');
    }
    state.hp = 20;
    state.budgetUsed = theme.budget;
    navigate('clear');
};

document.getElementById('demo-theme-select').onchange = (e) => {
    state.currentThemeId = e.target.value;
    state.currentTheme = presetThemes[e.target.value];
    state.clearedStages = [];
    state.currentStageIndex = 0;
    state.hp = 100;
    state.budgetUsed = 0;
    state.easterEggAccepted = false;
    navigate('map');
};
```

- [ ] **Step 2: 验证演示模式**

在浏览器中：
- 点击演示模式开关
- 确认演示面板出现
- 点击一键通关确认跳转到 clear 页
- 切换主题确认地图更新

---

### Task 12: 继续上局功能

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加继续上局逻辑**

```javascript
document.getElementById('continue-btn').onclick = () => {
    const saved = loadProgress();
    if (saved) {
        state.currentThemeId = saved.themeId;
        state.currentTheme = presetThemes[saved.themeId];
        state.clearedStages = saved.clearedStages;
        state.currentStageIndex = saved.currentStageIndex;
        state.budgetUsed = saved.budgetUsed;
        state.hp = saved.hp;
        state.startTime = saved.startTime;
        state.easterEggAccepted = saved.easterEggAccepted || false;
        navigate('map');
    }
};
```

- [ ] **Step 2: 验证存档恢复**

在浏览器中：
- 通关几关后刷新页面
- 确认继续上局按钮出现
- 点击确认恢复到上次进度

---

### Task 13: 现代简约 + 文艺清新模板

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 添加现代简约模板**

```javascript
function drawModernCard(ctx, stats, theme) {
    // 白色渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, 960);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, '#F8F9FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 540, 960);
    
    // 顶部色块
    ctx.fillStyle = theme.themeColor;
    ctx.fillRect(0, 0, 540, 60);
    
    // 标题
    ctx.fillStyle = '#6366F1';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Weekend Missions', 270, 100);
    
    ctx.fillStyle = '#1A1A1A';
    ctx.font = '14px sans-serif';
    ctx.fillText('周末密令', 270, 130);
    
    // STAGE CLEAR
    ctx.fillStyle = '#6366F1';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('✨ ALL STAGES CLEARED! ✨', 270, 220);
    
    // 冒险名称
    ctx.fillStyle = '#1A1A1A';
    ctx.font = '16px sans-serif';
    ctx.fillText(theme.title, 270, 280);
    
    // 统计数据（卡片式）
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(50, 350, 100, 80);
    ctx.fillRect(160, 350, 100, 80);
    ctx.fillRect(270, 350, 100, 80);
    ctx.fillRect(380, 350, 100, 80);
    
    ctx.fillStyle = '#1A1A1A';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${stats.stagesCleared}`, 100, 380);
    ctx.fillText('关卡', 100, 400);
    ctx.fillText(stats.timeSpent, 210, 380);
    ctx.fillText('耗时', 210, 400);
    ctx.fillText(`¥${stats.budgetUsed}`, 320, 380);
    ctx.fillText('花费', 320, 400);
    ctx.fillText(`${stats.secretsFound}`, 430, 380);
    ctx.fillText('彩蛋', 430, 400);
    
    // 评级
    ctx.fillStyle = '#6366F1';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText(calculateRank(stats), 270, 550);
    
    ctx.fillStyle = '#A1A1AA';
    ctx.font = '14px sans-serif';
    ctx.fillText('完美通关', 270, 590);
    
    // 底部水印
    ctx.fillStyle = '#A1A1AA';
    ctx.font = '10px sans-serif';
    ctx.fillText('TRAE AI 创造力大赛参赛作品', 270, 900);
}
```

- [ ] **Step 2: 添加文艺清新模板**

```javascript
function drawLiteraryCard(ctx, stats, theme) {
    // 米白渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, 960);
    gradient.addColorStop(0, '#FFF8F0');
    gradient.addColorStop(1, '#FFE8D6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 540, 960);
    
    // 标题
    ctx.fillStyle = '#FFB6C1';
    ctx.font = 'italic 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('✿ Weekend Missions ✿', 270, 80);
    
    ctx.fillStyle = '#5C4A3A';
    ctx.font = '14px serif';
    ctx.fillText('周末密令', 270, 110);
    
    // STAGE CLEAR
    ctx.fillStyle = '#FFB6C1';
    ctx.font = 'italic 28px serif';
    ctx.fillText('✿ ALL STAGES CLEARED! ✿', 270, 200);
    
    // 冒险名称
    ctx.fillStyle = '#5C4A3A';
    ctx.font = '16px serif';
    ctx.fillText(theme.title, 270, 260);
    
    // 关卡路线（樱花图标）
    ctx.fillStyle = '#5C4A3A';
    ctx.font = '12px serif';
    ctx.fillText('🌸 海上世界 🌸 南海意馆 🌸 南山书城', 270, 350);
    
    // 统计数据
    ctx.fillText(`${stats.stagesCleared}关通关 · ${stats.timeSpent} · ¥${stats.budgetUsed}`, 270, 450);
    
    // 评级
    ctx.fillStyle = '#FFB6C1';
    ctx.font = 'bold 72px serif';
    ctx.fillText(calculateRank(stats), 270, 550);
    
    ctx.fillStyle = '#A19A8E';
    ctx.font = '14px serif';
    ctx.fillText('完美通关', 270, 590);
    
    // 底部水印
    ctx.fillStyle = '#A19A8E';
    ctx.font = '10px serif';
    ctx.fillText('TRAE AI 创造力大赛参赛作品', 270, 900);
}
```

- [ ] **Step 3: 验证3套模板**

在浏览器中：
- 切换到现代简约模板
- 确认白色背景 + 几何色块
- 切换到文艺清新模板
- 确认米白背景 + 樱花装饰

---

## Phase 3: 打磨与测试

### Task 14: 最终整合测试

**Files:**
- Modify: `e:\weekend_missions\index.html`

- [ ] **Step 1: 完整流程测试**

测试清单：
- [ ] 打开文件，确认 boot 动画播放
- [ ] 0.8秒后自动跳转 home
- [ ] 点击深圳主题卡
- [ ] 确认 dialog 打字机效果
- [ ] 等待自动跳转或点击跳过
- [ ] 确认地图页显示5个节点
- [ ] 点击第1关节点
- [ ] 确认发现笔记打字机
- [ ] 点击签到
- [ ] 确认返回地图，HP减少
- [ ] 通关第2关
- [ ] 确认彩蛋弹窗出现
- [ ] 点击接受
- [ ] 确认隐藏关卡插入地图
- [ ] 通关所有关卡
- [ ] 确认 STAGE CLEAR 动画
- [ ] 点击生成分享卡片
- [ ] 切换3套模板
- [ ] 点击下载 PNG

- [ ] **Step 2: 演示模式测试**

- [ ] 开启演示模式
- [ ] 点击一键通关
- [ ] 切换主题
- [ ] 确认地图更新

- [ ] **Step 3: 存档测试**

- [ ] 通关几关后刷新页面
- [ ] 确认继续上局按钮出现
- [ ] 点击继续
- [ ] 确认恢复进度

---

## 验收标准

完成以下所有验收项后，Demo 即可提交：

### 功能验收
- [ ] boot 开机动画 0.8s 后自动跳转
- [ ] 3张主题卡可点击并进入对应 dialog
- [ ] AI 对话打字效果完整播放
- [ ] 跳过按钮立即跳转
- [ ] 地图显示5个关卡节点 + HP/金币条
- [ ] 点击当前关卡进入详情页
- [ ] 签到后状态更新
- [ ] 第2关通关后触发彩蛋
- [ ] 彩蛋接受后隐藏关卡插入
- [ ] 最终关卡通关触发 STAGE CLEAR
- [ ] 冒险总结数据正确
- [ ] 3套分享卡片模板可切换
- [ ] 下载 PNG 功能正常
- [ ] localStorage 存档恢复正常
- [ ] 演示模式跳关/切换主题正常

### 视觉验收
- [ ] 全屏扫描线覆盖
- [ ] 开机动画 CRT 滚动
- [ ] PRESS START 闪烁
- [ ] 当前关卡节点有巡逻小人
- [ ] HP 变化时颜色/图标变化
- [ ] 3套分享卡片视觉差异明显
- [ ] 所有动画使用 step-end

---

> **计划完成，保存至:** `docs/superpowers/plans/2026-06-22-weekend-missions-demo.md`