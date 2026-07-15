# app/CHANGELOG.md

## v0.4 · M2c step 4 · 2026-07-12

**sprite sheet 动画 + 环境层水位背景**

消费 DS 方向 A+ 交付资产：5 段 sprite sheet + 5 档水位背景 + `sheet-meta.json` v0.2 · 契约来源 `assets/pet/animations.md` v0.3 §4.2 sprite sheet 消费策略 + §4.5 环境层水位状态机。

- **`app/sprite-renderer.js` v0.4**（**重写**）：
  - 异步 `init()` 加载 `sheet-meta.json` + 预加载全部 5 张 sheet PNG（1.15 MB）
  - CSS `background-image` + `background-position`（百分比切帧）+ setTimeout 驱动 · 每 sheet 独立循环调度
  - loop 语义严格按 meta：`greet/happy loop=false`（末帧驻留） · `idle/thirsty loop=true`（永久循环）
  - `satisfied` 变体沿用 M1a `happy-satisfied.png` 单帧（sheet-meta.json v0.2 未拆变体 sheet）
  - `triggerParticles()` 消费 `particles-sheet-8f.png` · JS setInterval 8 帧 × 125ms 切帧 · CSS opacity 5600ms 独立叠加
  - **fallback 机制**：`sheet-meta.json` 加载失败或缺 key → 自动回退 M1a 独立 PNG（保 Demo "能拍"底线）· `badge-step` 显示 "M2c step 4 (fallback)"
  - 预加载所有 sheet + 兜底静态资源
  - `_shouldPlayPreReact` 4×4 矩阵不变（animations §5.2）
  - `IDLE_BLINK_MIN/MAX/MS` 眨眼参数不变
- **`app/water-bg.js`**（**新增**）：
  - `pickWaterLevel(totalMl)` 严格按 animations §4.5.3 公式 `Math.min(4, Math.floor(totalMl / 1500 * 4))`
  - `WaterBg` 类：`preload()` 预加载 5 档背景 · `update(totalMl)` 幂等更新 body background-image · `reset()` 跨零点切回 000
  - 挂 `document.body.style.backgroundImage`（默认）或指定容器（便于测试）
- **`app/styles.css`**：
  - **移除** `@keyframes dp-thirsty-breath`（thirsty 呼吸改由 sheet 4 帧驱动 · animations §4.1 v0.3 版本）
  - `.dp-pet__sprite` 移除固定 `background-size` · 由 JS 动态设 `(frames × 100%) × 100%`
  - `body` 加水位背景层：`background-size: cover` + `background-attachment: fixed` + `transition: background-image 300ms ease-out`（animations §4.5.5）
  - `.dp-fx-particles` 保留 opacity keyframe 5600ms · 加 `.sheet-mode` class 供 JS 覆盖 background-size
- **`app/index.html` v0.4**：
  - 引入 `WaterBg` 模块 · 启动时预加载 + 根据 `today_total_ml` 初始化档位
  - `sprite.init().then(...)` 异步启动 · badge 显示 "M2c step 4 (sheet ✓)" 或 "(fallback)"
  - `renderKPI()` 每次调用同步 `waterBg.update(today_total_ml)`（drink 事件驱动 · animations §4.5.4）
  - `Storage.onRollover` 触发 `waterBg.reset()`（跨零点切 000）
  - **顺手修复**：`onRollover` 首次同步调用可能在 `pushStream/waterBg/renderKPI` 定义前触发 TDZ · 加 try/catch 保护
  - `triggerParticles()` 委托 `sprite.triggerParticles()` · 8 帧 sheet 播放

**验收标准 10 项全部通过**：
1. ✅ sprite-renderer 消费 sheet-meta.json · loop 语义符合 meta
2. ✅ 达标粒子 particles-sheet-8f.png · 8 帧 × 125ms · 5600ms 生命周期
3. ✅ body 背景动态引用 bg-desktop-water-XXX.png · today_total 驱动切档 · refill 不切
4. ✅ 消费公式 `min(4, floor(today_total/1500 * 4))` 严格实现
5. ✅ fallback 机制（sheet 加载失败回退 M1a）
6. ✅ 台词库继续消费 `assets/pet/index.md`（PRD F-APP-9 未破坏）
7. ✅ README + CHANGELOG bump 到 v0.4
8. ✅ 浏览器脱机 server log 全 200：sheet-meta.json + 5 sheet + 5 水位背景 + happy-satisfied fallback + idle-blink · 无 JS 错误
9. ✅ dev-off (`?dev=0`) 视觉完美 · 无水平滚动 · 无空白列（P6/P15/P16 v0.3 修复保留）
10. ✅ 追加 comm-log ANNOUNCE

**Log**：[2026-07-12 19:30] APP → DS + Arbiter ANNOUNCE M2c step 4 交付

## v0.3 · M2c step 3 · 2026-07-07

**视觉接线 · 像素风 UI · 真机联调就绪**

- 新增 `tokens.css` · 直接注入 [`assets/ui/design-tokens.md`](../assets/ui/design-tokens.md) v0.1 §9
  30+ CSS 变量（12 色 · 2 字体族 · 8 字号 · 3 圆角 · 7 间距 · 3 sprite 尺寸），
  含 `@font-face` 加载本地 `../assets/ui/fonts/press-start-2p.woff2`
- 新增 `styles.css` · 像素风主样式表（350+ 行）
  - `.dp-*` BEM 命名空间（design-tokens.md 要求）
  - 硬阴影 `2px 2px 0` · 无 blur · 无 drop-shadow · 圆角受限
  - `@keyframes dp-pre-react`（250ms ±1px）
  - `@keyframes dp-thirsty-breath`（1s ±2px scale）
  - `@keyframes dp-fx-particles`（5600ms opacity · 严格按 animations §3.2 时序 200+5000+400ms）
  - `@keyframes dp-bubble-float`（800ms 上浮 + 淡出）
  - `.dp-pet.satisfied` filter drop-shadow 高光
- 新增 `sprite-renderer.js` · 宠物 sprite 主循环层
  - 4 态 × 2 帧 + happy-satisfied 单帧 + idle-blink 插帧，全部预加载
  - 每态独立 `setTimeout` 循环（greet/happy 250ms · thirsty 500ms · idle 400ms）
  - idle 眨眼：3~5s 随机均匀分布触发 120ms
  - pre-react 4×4 矩阵 `_shouldPlayPreReact()`（对齐 animations §5.2 · thirsty 起始 / 目标跳过）
  - satisfied 变体使用 `happy-satisfied.png` 单帧驻留
- 新增 `lines.js` · 台词库
  - 严格来自 `assets/pet/index.md` §1.1~1.4（DS 权威）
  - greet 3 条常规 + 10% 概率彩蛋
  - happy 3 条 · satisfied 2 条 · thirsty 4 条 · idle 4 条
  - **禁自造**（PRD F-APP-9）
- `index.html` v0.3 · 全新主 UI 双栏
  - **左主舞台**：Header（+ badge · UA · last_date）+ Pet 卡片（sprite + say bubble + fx layer + 粒子层）+ KPI 卡片（today drink/refill + 进度条）+ Bridge 控制（Serial + Mock + Empty hint 引导）
  - **右调试面板** `.dp-devpanel`：Status + Debug preset/inject/force + Event stream；`Hide dev` 按钮 / `?dev=0` URL 隐藏
- 更新 README v0.3：M2c 步 3 全 10 项验收脚本

**脱机 6/6 冒烟仍 PASS**（M2c 步 2 全部验收在 step 3 视觉层上不回退）：
- ✅ smoke 回放 39.9 / 199.9 累加
- ✅ 1499 → drink 30 → satisfied 变体 + 粒子完整生命周期
- ✅ 页面重开 KPI 保留
- ✅ 跨零点清零
- ✅ cup_placed → GREET → 3s → IDLE
- ✅ force thirsty → THIRSTY（呼吸缩放）

**M2c 步 3 新增验收 4 项**：
- ✅ 4 态 sprite 真渲染（非彩色方块）
- ✅ design-tokens CSS 变量全接线
- ✅ 达标粒子 200+5000+400ms 完整生命周期
- ✅ 头顶气泡（drink / refill / cup_placed 感叹号 / cup_changed 问号）
- ✅ 台词 4 组随机
- ✅ Debug 面板可隐藏（`?dev=0`）
- ⏳ 真机联调（本 tick 交付浏览器已就绪；实际连接需在 ESP32 上电 + Chrome/Edge 用户端 Connect Serial 触发）

**Log**：[2026-07-07 23:20] APP → 全员 ANNOUNCE M2c step 3 交付

## v0.2 · M2c step 2 · 2026-07-07

**Pet Engine + LocalStorage 持久化** · 详见上一版本 CHANGELOG。

## v0.1 · M2c step 1 · 2026-07-06

**Web Serial 桥 + mock 事件回放** · 详见更早版本 CHANGELOG。
