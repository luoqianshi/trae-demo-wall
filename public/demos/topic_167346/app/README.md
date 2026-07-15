# DrinkPet · Web Application

参赛项目 DrinkPet 的应用工程实现。消费 `firmware/protocol.md` v1.0 事件流，
渲染像素风电子宠物 UI，支持真机 Web Serial 直连与脱机 mock 回放。

## 启动方式

**从项目根目录**启本地静态服务器（`app/index.html` 用相对路径引用 `../assets/*` 与 `../data/*`）：

```powershell
cd d:\01_Dev\01_Projects\trae\solo_enhance_mode
python -m http.server 5173 --directory .
```

浏览器访问：

    http://localhost:5173/app/

隐藏调试面板（Demo 拍摄用）：

    http://localhost:5173/app/?dev=0

## 依赖

- **浏览器**：Chromium ≥ 89（Chrome / Edge），需支持 [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- **无构建工具**：单页 HTML + 原生 ES Module
- **无 npm 依赖**：全部原生 API

## 当前进度（M2c）

- ✅ **步 1 · Web Serial 桥 + mock 事件回放**（v0.1）
- ✅ **步 2 · pet-engine + storage**（v0.2）
- ✅ **步 3 · 视觉接线 + 真机联调**（v0.3）
- ✅ **步 4 · sprite sheet + 环境水位背景**（v0.4 · 本 commit）
  - `app/sprite-renderer.js` v0.4 · 消费 `assets/pet/sheet-meta.json` v0.2 · 5 段 sprite sheet 动画（greet/happy 6f 8fps · idle/thirsty 4f 4fps · particles 8f 8fps）· fallback M1a 单帧
  - `app/water-bg.js` **新增** · 5 档环境水位背景状态机（0/25/50/75/100% · animations §4.5 消费公式 `min(4, floor(today_total/1500 * 4))`）
  - `app/styles.css` · 移除 `@keyframes dp-thirsty-breath` CSS scale（呼吸改由 thirsty-sheet 4 帧驱动） · body background transition 300ms
  - `app/index.html` v0.4 · sprite init 异步 · KPI 变化触发 waterBg.update · 跨零点 waterBg.reset

## 文件结构

```
app/
├── index.html              # 主入口
├── tokens.css              # design-tokens CSS 变量（DS 权威）
├── styles.css              # 主样式
├── sprite-renderer.js      # 宠物 sprite 层
├── lines.js                # 台词库（DS 权威）
├── pet-engine.js           # 状态机（animations §1-§2）
├── storage.js              # LocalStorage 持久化
├── bridge/
│   ├── event-bus.js        # 发布订阅
│   ├── web-serial.js       # Web Serial 桥
│   └── mock-replay.js      # NDJSON 回放
├── README.md
└── CHANGELOG.md
```

## 冒烟测试（M2c step 3 验收 10 项）

1. `http://localhost:5173/app/`
2. **验收 1/2 · sprite 真渲染**：应看到 idle 态宠物（坐姿 · 眨眼）· 而非彩色方块
3. **验收 3 · design-tokens 接线**：全局米黄背景 · 像素字 · 硬阴影 · 无 blur / drop-shadow
4. **验收 4 · 达标粒子**：Debug → preset 1499 → inject drink 30ml → 达标粒子淡入 200ms + 停留 5s + 淡出 400ms
5. **验收 5 · 头顶气泡/符号**：inject drink → "+30 ml" 气泡；inject refill → "♥ +200 ml"；inject cup_placed → "!"；inject cup_changed → "?"
6. **验收 6 · 台词**：cup_placed 后看到 greet 台词；drink 后 happy 台词；达标 satisfied 台词；force thirsty 后 thirsty 台词
7. **验收 7 · 真机联调**：连 ESP32 → **Connect Serial** → 选 CP2102 端口 → 放/拿/加水 → 宠物实时切态 + KPI 累加
8. **验收 8 · Dev 面板可隐藏**：右上角 **Hide dev**；或 URL `?dev=0`
9. **验收 9 · 脱机 6/6 仍 PASS**：Load smoke → Play x10 → today_total 0→39.9，today_refill 0→199.9，宠物依次 idle→greet→happy
10. **验收 10 · Chrome/Edge 最新版**：本会话在 IDE 预览通过

## 状态机契约

严格按 [`assets/pet/animations.md`](../assets/pet/animations.md) v0.1：
- §1.1 4 态 `pet_state ∈ {greet, happy, thirsty, idle}`
- §1.3 STATE_PRIORITY: `abnormal > thirsty > satisfied > happy > greet > idle`
- §2.1 迁移矩阵 + §2.3 satisfied 回落规则
- §3.2 达标粒子 200+5000+400ms（CSS `@keyframes` 实现）
- §3.3 事件叠加动效表
- §4 主循环帧率总表（greet/happy 4fps · thirsty 2fps · idle 2.5fps + blink 120ms）
- §5.2 pre-react 4×4 适用矩阵（在 sprite-renderer `_shouldPlayPreReact` 实现）
- §6.1 台词库分组随机

## 协议契约

严格按 [`firmware/protocol.md`](../firmware/protocol.md) v1.0：
- §1.1 `\n` 分帧 UTF-8 JSON
- §2.2 seq wrap `(new - last) >>> 0` 三分支
- §3 20 类事件全部消费或明确忽略
- §4.6 malformed_line → 客户端 `error` 事件

## 视觉资产

不 copy 到 `app/`，用相对路径 `../assets/pet/*.png` / `../assets/ui/fonts/*` 引用。
资产权威来源：[`assets/pet/`](../assets/pet/) 与 [`assets/ui/`](../assets/ui/)。
