# 关卡流程扩展设计文档（Spec）

> **创建日期：** 2026-06-23
> **范围：** FC 开场界面 + 第 2-4 关流程扩展 + js 模块结构搭建
> **状态：** 待实施

---

## 一、目标

在已完成的第 1 关（`preview/stage-1-flow.html`）基础上，建立可复用的 js 模块结构，扩展到全部 4 关，每关包含完整的「FC 开场 → 行进场景 → 转场 → 关底场景 → 通关动画」流程。前 3 关通关后直接进入下一关，BOSS 关（第 4 关）通关后触发总通关动画。

**不在本次范围**：主应用 index.html 集成（首页/主题选择/AI对话/分享卡片/存档）留到下一个 spec。

---

## 二、背景与约束

### 已有基础
- `preview/stage-1-flow.html`：第 1 关完整流程，纯 Canvas 2D 单文件，已验证可行
- `docs/maps/routes.json`：4 条 GPS 路线数据
- `docs/maps/shenzhen_full.png`：深圳南山地图大图（共用）

### 技术约束
- **必须 `file://` 协议可用**：评委双击 HTML 即运行，不能起服务
- **不能用 ES module**（`import/export`）：`file://` 下浏览器拦截，用普通 `<script>` 标签
- **不能用 fetch**：`file://` 下 CORS 拦截，路线数据需内联到 JS
- **纯 Canvas 2D**：已弃用 Phaser.js，手写瓦片渲染和精灵动画
- **零外部依赖**：所有代码和素材本地化

### 关卡规划（4 关）

| 关 | 关卡名 | 路线 | 行进风格 | 关底类型 | 任务 |
|----|--------|------|----------|----------|------|
| 1 | 南海意馆 | 海上世界→南海意馆 | 城市街道 | coffee | 点一杯「孤独的星球」 |
| 2 | 南山书城 | 南海意馆→南山书城 | 林荫道 | bookstore | 找一本关于旅行的书 |
| 3 | 海岸城 | 南山书城→海岸城 | 商业区 | mall | 拍一张城市俯瞰照 |
| 4 | 深圳湾公园 | 海岸城→深圳湾公园 | 海边栈道 | park (BOSS) | 在海边长椅坐10分钟 |

---

## 三、架构设计

### 3.1 模块结构

```
preview/
├── stages-preview.html          # 预览入口（加载所有 js，串联 4 关）
└── js/
    ├── core.js                  # 全局状态、主循环、调色板、输入分发
    ├── textures.js              # 通用纹理生成（玩家、瓦片、星星、旗子）
    ├── map.js                   # 真实地图绘制（共用大图+路线聚焦）
    ├── flow.js                  # 通用流程引擎（状态机切换）
    ├── stages.js                # 4 关配置数据 + 内联路线
    └── scenes/
        ├── intro.js             # FC 开场界面
        ├── walk.js              # 行进场景（配置驱动视差层+动态元素）
        ├── transition.js        # 转场动画
        ├── clear.js             # 通关动画
        ├── finale.js            # 总通关动画（仅 BOSS 关后）
        └── endings/
            ├── base.js          # 关底基类（自动移动+弹窗+任务动画框架）
            ├── coffee.js        # 咖啡店（第1关）
            ├── bookstore.js     # 书店（第2关）
            ├── mall.js          # 商场顶楼（第3关）
            └── park.js          # 海边公园（第4关，BOSS，覆盖交互）
```

### 3.2 模块职责边界

| 模块 | 职责 | 不负责 |
|------|------|--------|
| `core.js` | 全局状态 `WM.state`、主循环 `gameLoop`、调色板 `PAL`、输入监听分发 | 场景内部逻辑 |
| `textures.js` | 一次性生成所有纹理并缓存到 `WM.tex` | 纹理如何使用 |
| `map.js` | 接收 stageIndex，绘制对应关地图 | 路线数据来源 |
| `flow.js` | 状态机切换（intro→walk→...→clear→next/finale） | 场景内部渲染 |
| `stages.js` | 4 关纯配置数据 | 任何逻辑 |
| `scenes/intro.js` | FC 开场动画 | 其他场景 |
| `scenes/walk.js` | 行进场景渲染（视差层+动态元素+小人+终点旗） | 关底场景 |
| `scenes/transition.js` | 黑条合拢+任务文字+展开 | 其他动画 |
| `scenes/clear.js` | 闪白+黑边+STAGE CLEAR+任务回顾 | 总通关 |
| `scenes/finale.js` | ALL STAGES CLEARED+4关回顾+评级 | 单关通关 |
| `endings/base.js` | 关底基类：自动移动+弹窗+任务动画框架 | 具体装饰物和任务动画 |
| `endings/{coffee,bookstore,mall,park}.js` | 各关底差异部分（装饰物、路径、任务动画） | 通用框架 |

### 3.3 全局通信

所有模块挂载到全局对象 `window.WM`：

```js
window.WM = {
  state: { phase, stageIndex, progress, ... },  // 全局状态
  STAGES: [...],                                 // 4关配置（stages.js 填充）
  ROUTES: {...},                                 // 内联路线数据（stages.js 填充）
  tex: {...},                                    // 纹理缓存（textures.js 填充）
  scenes: { intro, walk, transition, clear, finale },  // 场景模块
  endings: { coffee, bookstore, mall, park },    // 关底模块
  walkEffects: { lamp_glow, leaf_fall, ... },    // 行进动态元素
  flow: { enterIntro, enterWalk, ... },          // 流程切换函数
  mapImgLoaded: false,                           // 地图大图加载状态
};
```

### 3.4 场景统一接口

每个场景模块实现统一接口，由 `flow.js` 调用：

```js
WM.scenes.intro = {
  init(stageConfig) {},      // 进入场景时初始化
  update(dt) {},             // 每帧更新（dt 毫秒）
  draw(ctx) {},              // 每帧绘制到游戏画布
  handleInput(action, data) {},  // 处理输入（action: 'space'/'click'）
  isDone() {},               // 是否完成，flow.js 据此切换状态
};
```

---

## 四、流程状态机

### 4.1 顶层状态机

```
intro → walk → arrived → transition → ending → clear → next intro (前3关)
                                                    └→ finale (BOSS关后)
```

| 状态 | 持续时间 | 触发下一状态 | 场景模块 |
|------|----------|-------------|----------|
| intro | ~3.5秒或用户跳过 | 用户按 Space/点击 | `scenes/intro.js` |
| walk | ~6秒（进度100%） | 进度到100% | `scenes/walk.js` |
| arrived | 0.6秒 | 自动 | `scenes/walk.js`（静态） |
| transition | ~1.7秒 | 自动 | `scenes/transition.js` |
| ending | 任务完成 | 任务动画结束回调 | `endings/{type}.js` |
| clear | ~2.5秒 | 自动 | `scenes/clear.js` |
| next | 立即 | 自动（前3关） | 切到下一关 intro |
| finale | 等待用户 | 用户按 Enter 重玩 | `scenes/finale.js` |

### 4.2 状态切换逻辑（flow.js）

```js
WM.flow = {
  enterIntro(stageConfig) {
    WM.state.phase = 'intro';
    WM.scenes.intro.init(stageConfig);
  },
  enterWalk(stageConfig) {
    WM.state.phase = 'walk';
    WM.scenes.walk.init(stageConfig);
  },
  arriveDestination() {
    WM.state.phase = 'arrived';
    setTimeout(() => WM.flow.enterTransition(), 600);
  },
  enterTransition() {
    WM.state.phase = 'transition';
    WM.scenes.transition.init(WM.currentStage);
  },
  enterEnding(stageConfig) {
    WM.state.phase = 'ending';
    const endingType = stageConfig.ending.type;
    WM.currentEnding = WM.endings[endingType];
    WM.currentEnding.init(stageConfig);
  },
  onEndingComplete() {
    WM.flow.enterClear();
  },
  enterClear() {
    WM.state.phase = 'clear';
    WM.scenes.clear.init(WM.currentStage);
  },
  onClearDone() {
    if (WM.state.stageIndex < 3) {
      WM.state.stageIndex++;
      WM.currentStage = WM.STAGES[WM.state.stageIndex];
      WM.flow.enterIntro(WM.currentStage);
    } else {
      WM.state.phase = 'finale';
      WM.scenes.finale.init();
    }
  },
};
```

### 4.3 输入分发（core.js）

```js
window.addEventListener('keydown', e => {
  if (e.key === ' ') {
    WM.scenes[WM.state.phase]?.handleInput('space');
    e.preventDefault();
  }
  if (e.key === 'Enter' && WM.state.phase === 'finale') {
    WM.scenes.finale.handleInput('enter');
  }
});
gameCanvas.addEventListener('click', e => {
  const { x, y } = toGameCoord(e);
  WM.scenes[WM.state.phase]?.handleInput('click', { x, y });
});
```

---

## 五、4 关配置数据结构（stages.js）

### 5.1 配置结构

```js
WM.STAGES = [
  {
    index: 0,                    // 0-based
    name: "南海意馆",
    color: "#6B4423",            // 主色调
    route: WM.ROUTES[1],         // 引用内联路线
    task: {
      title: "点一杯「孤独的星球」",
      cost: "¥45",
      duration: "1h",
      hp: "-20",
    },
    walk: {
      style: "city",             // 行进风格标识
      skyColor: "#1a2a4a",
      midColor: "#2a3a5a",
      groundColor: "#3a3a3a",
      dynamicElements: ["lamp_glow"],  // 动态元素标识数组
    },
    ending: {
      type: "coffee",            // 对应 endings/coffee.js
      taskPoint: { x: 80, y: 176 },   // 任务点坐标（画布坐标）
      path: [...],               // 自动移动路径点
    },
  },
  // 第2-4关类似结构，差异见下表
];
```

### 5.2 4 关差异配置

| 关 | walk.style | walk.dynamicElements | ending.type | ending 特殊 |
|----|-----------|---------------------|-------------|-------------|
| 1 南海意馆 | city | ["lamp_glow"] | coffee | 无 |
| 2 南山书城 | forest | ["leaf_fall", "light_spot"] | bookstore | 无 |
| 3 海岸城 | commercial | ["neon_flicker", "pedestrian"] | mall | 无 |
| 4 深圳湾公园 | seaside | ["wave_scroll", "seagull"] | park | BOSS：10秒倒计时 |

### 5.3 内联路线数据格式

```js
WM.ROUTES = {
  1: { from:"海上世界", to:"南海意馆", pts:[[lng,lat],[lng,lat],...] },
  2: { from:"南海意馆", to:"南山书城", pts:[[lng,lat],...] },
  3: { from:"南山书城", to:"海岸城", pts:[[lng,lat],...] },
  4: { from:"海岸城", to:"深圳湾公园", pts:[[lng,lat],...] },
};
```

- `pts` 是 `[lng, lat]` 二元数组（比对象省字符）
- 去重相邻重复点
- 由实施计划中脚本从 `docs/maps/routes.json` 生成，避免手抄

---

## 六、场景视觉设计

### 6.1 FC 开场（intro.js）

**时间轴**（总约 3.5 秒，可按 Space 跳过）：

| 时间 | 内容 |
|------|------|
| 0.0s | 黑屏 |
| 0.2s | "STAGE X" 大字弹出（黄色，Press Start 2P 24px），闪烁2次 |
| 1.2s | 关卡名从下滑入（白色，16px，如"南海意馆"） |
| 1.8s | 任务简报淡入（青色，10px，如"任务：点一杯「孤独的星球」"） |
| 2.4s | "PRESS SPACE" 闪烁（黄色，8px） |
| 用户操作 | 按 Space/点击 → 进入 walk |

**视觉**：纯黑背景 + 扫描线 + 像素字体，无场景元素。跳过时直接进 walk。

**跳过防抖**：intro 阶段首次按 Space 后设置 `skipped=true`，后续按 Space 无效。

### 6.2 行进场景（walk.js）

**通用元素**（4关都有）：
- 上半部分：真实地图（当前关路线聚焦）
- 下半部分：像素横版滚动场景
- 小人（侧面2帧走路，16×16）
- 终点旗（固定在右侧 78%，小人从 15% 走到 75%）
- 进度条（底部）

**4 种风格视觉差异**：

| 关 | 天空层 | 中景层 | 地面层 | 动态元素 |
|----|--------|--------|--------|----------|
| 1 城市 | 深蓝渐变 | 砖墙建筑剪影 | 沥青路面+路灯 | 路灯暖光呼吸 |
| 2 林荫道 | 浅蓝渐变 | 树木轮廓（深绿） | 石板路+树影 | 树叶飘落+地面光斑闪烁 |
| 3 商业区 | 紫红渐变 | 霓虹招牌剪影 | 玻璃幕墙地面 | 霓虹色块闪烁+行人剪影走过 |
| 4 海边栈道 | 橙红日落渐变 | 海平面+远山 | 木栈道 | 海浪线条滚动+海鸥剪影飞过 |

**动态元素接口**：

```js
WM.walkEffects = {
  lamp_glow: {
    init() {},           // 初始化粒子状态
    update(dt) {},       // 每帧更新
    draw(ctx) {},        // 每帧绘制
  },
  leaf_fall: { ... },
  light_spot: { ... },
  neon_flicker: { ... },
  pedestrian: { ... },
  wave_scroll: { ... },
  seagull: { ... },
};
```

`walk.js` 根据 `stageConfig.walk.dynamicElements` 数组，每帧调用对应 effect 的 update/draw。

**粒子数限制**：树叶≤15、海鸥≤3、行人≤5、光斑≤10。

### 6.3 转场动画（transition.js）

沿用第 1 关已验证逻辑：
- phase 0：黑条合拢（400ms）
- phase 1：全黑+任务文字（900ms，中途初始化关底场景，用 `coffeeInited` 标志防重复）
- phase 2：黑条展开（400ms）→ 进入 ending

**坑点**：不能用 `else if` 链判断 phase 1 的两个时间点，用独立 `if` + 标志位。

### 6.4 关底场景（endings/）

**base.js 基类提供**：

```js
WM.endings.base = {
  init(stageConfig) {
    this.config = stageConfig;
    this.player = { x, y, dir, frame, moving, animTimer, speed, holding };
    this.phase = 'auto_move';  // auto_move / popup / task_anim / done
    this.path = stageConfig.ending.path;
    this.pathIdx = 0;
  },
  updateAutoMove(dt) { ... },     // 沿 path 逐点移动
  drawPopup() { ... },            // 通用弹窗（标题/任务/按钮）
  confirmTask() {                 // 触发任务动画
    this.phase = 'task_anim';
    this.playTaskAnim();          // 子类覆盖
  },
  playTaskAnim() {                // 基类默认空，子类覆盖
    setTimeout(() => this.onAnimDone(), 2000);
  },
  onAnimDone() {
    this.phase = 'done';
    WM.flow.onEndingComplete();
  },
  drawPlayer() { ... },
  drawLighting() { ... },
  handleInput(action, data) { ... },  // 弹窗按钮点击/Space确认
};
```

**4 个子模块覆盖差异**：

| 模块 | 装饰物 | playTaskAnim | 特殊 |
|------|--------|-------------|------|
| coffee.js | 咖啡机/吧台/桌椅/吊灯/菜单板 | 蒸汽粒子2.5秒→持杯 | 无 |
| bookstore.js | 书架×5/阅读桌/收银台/绿植 | 书架抖动→书本滑出→持书 | 无 |
| mall.js | 玻璃护栏/长椅/售货机/远景建筑 | 镜头拉近→闪光→照片框 | 无 |
| park.js | 长椅/路灯/树/海面/日落 | 坐下→10秒倒计时→日落渐变 | BOSS：覆盖 confirmTask |

**BOSS 关（park.js）倒计时细节**：
- `confirmTask()` 被覆盖：弹窗确认后，玩家精灵替换为坐下姿态
- 屏幕下方出现 10 秒进度条（像素风，每秒一格）
- 背景天空从橙红渐变到深紫（日落）
- 倒计时结束 → `onAnimDone()` → 通关

### 6.5 通关动画（clear.js）

沿用第 1 关已验证逻辑：
- 闪白（100ms）
- 黑边合拢（300ms）
- "STAGE CLEAR" 像素文字弹出（500ms）
- 任务回顾淡入（任务名/花费/HP变化，300ms）
- 2.5秒后自动 `onClearDone()`

### 6.6 总通关（finale.js，仅 BOSS 关后）

| 时间 | 内容 |
|------|------|
| 0.0s | 黑屏 |
| 0.5s | "ALL STAGES CLEARED!" 弹入（黄色大字） |
| 1.5s | 4关路线总览地图淡入（全部标绿） |
| 3.0s | 冒险总结：通关数 4/4 / 总花费 / 总HP消耗 |
| 4.0s | 评级显示（S/A/B/C，基于剩余HP） |
| 5.0s | "PRESS ENTER 重玩" 闪烁 |

**评级规则**：
- S：剩余 HP ≥ 40
- A：剩余 HP ≥ 20
- B：剩余 HP ≥ 1
- C：剩余 HP = 0

---

## 七、地图绘制（map.js）

### 7.1 共用大图 + 路线聚焦

```js
WM.map = {
  draw(stageIndex) {
    const route = WM.ROUTES[stageIndex + 1];
    const points = route.pts.map(([lng, lat]) => lngLatToPixel(lng, lat));
    // 计算 bounding box
    let minX, maxX, minY, maxY;
    points.forEach(p => { /* 更新 min/max */ });
    // 加 padding，计算缩放和偏移使路线居中
    const scale = Math.min(cw/routeW * 0.8, ch/routeH * 0.8);
    const offX = cw/2 - centerX * scale;
    const offY = ch/2 - centerY * scale;
    // 绘制大图（若加载成功）或网格背景
    if (WM.mapImgLoaded) {
      ctx.drawImage(mapImg, offX, offY, MAP_W * scale, MAP_H * scale);
    } else {
      drawGridBackground(ctx);
    }
    // 绘制路径、起点、终点、移动标记
    drawRoute(ctx, points, scale, offX, offY);
    drawMarkers(ctx, route, scale, offX, offY, stageIndex);
  },
};
```

### 7.2 地图图片加载

```js
const mapImg = new Image();
mapImg.onload = () => { WM.mapImgLoaded = true; };
mapImg.onerror = () => { WM.mapImgLoaded = false; };
mapImg.src = '../docs/maps/shenzhen_full.png';  // 相对 preview/ 目录
// 不设 crossOrigin（file:// 下会失败）
```

### 7.3 finale 阶段全路线总览

`finale.js` 调用 `WM.map.drawAll()`，绘制全部 4 条路线（已通关标绿），不聚焦单条路线，而是显示整体范围。

---

## 八、错误处理与性能

### 8.1 错误处理

| 场景 | 处理 |
|------|------|
| 地图图片加载失败 | 降级深色网格背景，路径和标记照常 |
| 路线数据缺失 | 控制台警告，跳过该关地图绘制 |
| 纹理生成失败 | 用纯色矩形兜底 |
| intro 快速连按 Space | 首次后设 `skipped=true`，后续无效 |
| BOSS 关倒计时中刷新 | 倒计时重置（不持久化，符合 Demo 定位） |

### 8.2 性能考虑

- 纹理在 `textures.js` 加载时一次性生成，缓存到 `WM.tex`
- 视差层用离屏 canvas 预渲染，每帧只 drawImage
- 动态元素粒子数限制（树叶≤15、海鸥≤3、行人≤5、光斑≤10）
- 帧率 60fps，dt 上限 50ms 防卡顿跳跃

---

## 九、预览入口（stages-preview.html）

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weekend Missions · 4关流程预览</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>/* 布局：上半地图 + 下半游戏画布，3倍放大 */</style>
</head>
<body>
  <canvas id="mapCanvas" width="480" height="180"></canvas>
  <canvas id="gameCanvas" width="480" height="270"></canvas>
  <div id="status">STAGE 1 · 南海意馆</div>

  <!-- 按 script 标签顺序加载，非 ES module -->
  <script src="js/core.js"></script>
  <script src="js/textures.js"></script>
  <script src="js/map.js"></script>
  <script src="js/stages.js"></script>
  <script src="js/scenes/intro.js"></script>
  <script src="js/scenes/walk.js"></script>
  <script src="js/scenes/transition.js"></script>
  <script src="js/scenes/clear.js"></script>
  <script src="js/scenes/finale.js"></script>
  <script src="js/scenes/endings/base.js"></script>
  <script src="js/scenes/endings/coffee.js"></script>
  <script src="js/scenes/endings/bookstore.js"></script>
  <script src="js/scenes/endings/mall.js"></script>
  <script src="js/scenes/endings/park.js"></script>
  <script src="js/flow.js"></script>
  <script>
    // 启动
    WM.textures.init();
    WM.map.init();
    WM.state.stageIndex = 0;
    WM.currentStage = WM.STAGES[0];
    WM.flow.enterIntro(WM.currentStage);
    requestAnimationFrame(WM.core.gameLoop);
  </script>
</body>
</html>
```

**注意**：Google Fonts 需要网络。最终交付时若需离线，需下载字体文件本地化。本次预览阶段先用 CDN。

---

## 十、验收标准

### 10.1 功能验收
- [ ] `stages-preview.html` 双击打开可运行（TRAE 内置浏览器 + 用户浏览器）
- [ ] 4 关完整流程：intro→walk→transition→ending→clear 串联
- [ ] 前 3 关通关后自动进入下一关 intro
- [ ] BOSS 关（第4关）有 10 秒倒计时特殊交互
- [ ] BOSS 关通关后触发总通关动画（finale）
- [ ] 总通关显示 4 关路线总览 + 总结 + 评级
- [ ] 按 Enter 可重玩

### 10.2 视觉验收
- [ ] FC 开场：STAGE X 闪烁 + 关卡名滑入 + 任务简报 + PRESS SPACE
- [ ] 4 种行进场景视觉差异明显（城市/林荫/商业/海边）
- [ ] 4 种动态元素正常（路灯/树叶/霓虹/海浪+海鸥）
- [ ] 4 种关底场景视觉差异明显（咖啡店/书店/商场/公园）
- [ ] BOSS 关倒计时进度条 + 日落渐变
- [ ] 转场动画流畅（黑条合拢+展开）
- [ ] 通关动画完整（闪白+黑边+STAGE CLEAR+任务回顾）

### 10.3 技术验收
- [ ] `file://` 协议下正常运行（不起服务）
- [ ] 地图图片加载失败时降级网格背景
- [ ] 路线数据内联，不 fetch
- [ ] 所有 JS 用普通 `<script>` 标签加载，无 ES module
- [ ] 帧率稳定 60fps

---

## 十一、后续延伸（不在本次范围）

- 主应用 `index.html` 集成：boot→home→dialog→map→stage→clear→share
- 主题选择（深圳/杭州/上海）
- AI 对话打字机效果
- 分享卡片生成
- localStorage 存档
- 字体本地化（离线运行）

---

## 十二、实施后调整（2026-06-24，基于试玩反馈）

实施完成并试玩后，针对视觉/布局做了以下迭代（不影响核心流程与状态机）：

### 1. 地图投影参数修正
- **问题**：实现 `map.js` 时沿用了「只画第1关」的 `stage-1-flow.html` 参数（中心 `113.920/22.484`、`zoom 15`），导致第 2-4 关路线点落在 `shenzhen_full.png`（800×600）范围外，地图黑屏。
- **修正**：改为覆盖全部 5 个地点的参数——中心 `113.945129 / 22.500940`、`zoom 14`、图片 `800×600`。5 个地点在 zoom14 下需 640×471px，正好装进 800×600。**勿改回 zoom15。**

### 2. FC 卡带屏外壳 + 布局自适应（方案A）
- 整体收进居中的「FC 卡带屏」容器（机身渐变/品牌条/POWER 灯/CRT 黑框/扫描线），超宽屏两侧是机身而非黑边。
- `.console-shell` 锁 `aspect-ratio:880/1102` + `height:96vh` + `max-width:96vw`，浏览器取小边整体等比缩放，任何屏幕完整显示，**不裁切、不滚动**。
- 内部用 flex 比例分配高度：地图 `flex:52` / 游戏 `flex:48`（不再各自 `aspect-ratio`，避免高度叠加溢出）。

### 3. 地图 cover 填充（消除黑边）
- 新增 `map.computeView()`：`max(coverScale, fitRouteScale)` 缩放铺满面板 + 边缘钳制（图片边缘永不进入面板），彻底消除黑边；各关统一缩放级别仅镜头平移。
- 新增 `map.syncSize()` + `core.fitGameCanvas` 缓存检测（每帧调用），面板尺寸随屏幕变化时自动重算；mapCanvas 按 DPR 设分辨率，高分屏清晰。

### 4. 行进时长延长
- `walk.js` 进度速率 `dt/25`（2.5秒）→ `dt/70`（约 7 秒）。
