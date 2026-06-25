# AI 知识图谱教程网站 — Code Wiki

> 一个包含**手势追踪变花互动页面**（`index.html`）与**AI 知识图谱教程主页**（`ai-knowledge-intro.html`）的纯前端静态项目。
> 所有页面采用原生 HTML5 + CSS3 + JavaScript 编写，通过 CDN 引入依赖，无需构建步骤。

---

## 1. 项目整体架构

### 1.1 目录结构

```
AI知识图谱教程网站/
├── .trae/
│   └── documents/
│       ├── PRD.md                       # 产品需求文档
│       └── Technical-Architecture.md    # 技术架构设计文档
├── index.html                           # 页面 1：手势追踪变花（3D 互动）
├── ai-knowledge-intro.html              # 页面 2：AI 知识图谱教程主页（营销 + 导航）
└── CODE_WIKI.md                         # 本文件：代码 Wiki 文档
```

### 1.2 技术架构图

```
┌────────────────────────────────────────────────────────────┐
│                       浏览器运行时 (Browser)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    页面层 (Page Layer)                 │  │
│  │   ┌──────────────┐          ┌──────────────────┐      │  │
│  │   │  index.html  │          │ ai-knowledge-   │      │  │
│  │   │  (手势互动)  │          │  intro.html      │      │  │
│  │   │  3D+计算机视觉 │          │ (营销教程主页)    │      │  │
│  │   └──────┬───────┘          └──────────────────┘      │  │
│  └──────────┼──────────────────────────────────────────────┘  │
│             ┌┴────────────────────┐                          │
│             │    外部 CDN 依赖     │                          │
│             └┬────────────────────┘                          │
│  ┌──────────┼──────────────┬────────────────────────────────┐ │
│  │   Three.js 0.160.0     │  MediaPipe Hands 0.4.1675466160│ │
│  │   (3D 渲染引擎)         │  (手部关键点检测 / 计算机视觉) │ │
│  └─────────────────────────┴────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                原生浏览器 API                          │ │
│  │  navigator.mediaDevices.getUserMedia (摄像头)         │ │
│  │  Canvas 2D API / WebGL                                │ │
│  │  requestAnimationFrame / DOM Events / CSS             │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 1.3 架构风格

- **零构建（Zero-Build）**：无 Node.js / 包管理工具依赖，直接双击 HTML 即可在浏览器打开。
- **CDN 引入依赖**：Three.js 与 MediaPipe Hands 均通过 unpkg / jsDelivr CDN 引入。
- **单文件组件化**：每个 `.html` 文件为独立单页应用，CSS 与 JS 均内联在 `<style>` 与 `<script>` 中。
- **渐进式交互**：核心互动依赖摄像头/HTTPS，但主页（`ai-knowledge-intro.html`）在无权限情况下仍可完整浏览。

---

## 2. 主要模块职责

### 2.1 页面模块概览

| 模块 | 所在文件 | 职责 |
|------|---------|------|
| 手势互动主页 | [index.html](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html) | 全屏 WebGL 3D 场景 + 摄像头手部追踪 + 花朵/粒子动画 |
| 知识图谱教程主页 | [ai-knowledge-intro.html](file:///e:/2_code/tmp/AI知识图谱教程网站/ai-knowledge-intro.html) | 营销导航页：Hero、功能卡片、技术栈、Demo、实践过程 |
| 需求文档 | [PRD.md](file:///e:/2_code/tmp/AI知识图谱教程网站/.trae/documents/PRD.md) | 产品需求与功能规划 |
| 技术架构文档 | [Technical-Architecture.md](file:///e:/2_code/tmp/AI知识图谱教程网站/.trae/documents/Technical-Architecture.md) | 架构设计、依赖、核心模块、数据模型 |

### 2.2 页面一：`index.html` 内部模块

| 模块 | 职责 | 关键实现 |
|------|------|---------|
| **入口与初始化** | 等待 `window.load` 后启动 `initApp()`，绑定按钮、初始化场景 | `window.addEventListener('load', initApp)` |
| **Three.js 场景** | 创建 `Scene / Camera / Renderer / Lights`，设置响应式 | `setupThreeJS()` |
| **背景粒子系统** | Canvas 2D 绘制深色渐变背景 + 紫色漂浮粒子 | `BackgroundParticle` 类 |
| **花朵 3D 模型** | 程序化生成花瓣（球+缩放）、花心、茎、叶、辉光 | `Flower` 类 |
| **3D 粒子系统** | 花朵绽放或消失时喷出的粒子效果 | `ParticleSystem` 类 |
| **摄像头 & 权限** | 通过 `getUserMedia` 获取 720p 视频流并请求权限 | `startCamera()` |
| **MediaPipe 手部追踪** | 加载 MediaPipe 模型，每帧发送视频，输出 21 个关键点 | `setupHandTracking()` |
| **坐标映射 & 平滑** | 将归一化坐标 `(0-1)` 转换到 Three.js 世界坐标 `(-1.5 ~ 1.5)`，并做 `lerp` 平滑 | `onResults(results)` |
| **主循环** | `requestAnimationFrame` 驱动，负责背景 / 花朵 / 粒子 / 渲染 | `animate()` |

### 2.3 页面二：`ai-knowledge-intro.html` 内部模块

| 模块 | 职责 | 关键实现 |
|------|------|---------|
| **Hero 区** | 渐变背景 + 标题 + 双按钮，营造营销页氛围 | `<header class="hero">` |
| **Demo 简介** | 3 个功能卡片，解释模块化知识卡片、游乐场、知识图谱 | `<section class="features">` |
| **创作思路** | 3 步流程卡（灵感来源 / 解决的问题 / 方向选择） | `<section class="process">` |
| **技术栈** | 6 个技术图标卡片网格 | `<section class="tech-stack">` |
| **Demo 体验** | 深色区域，预告下载 ZIP 体验包 | `<section id="demo" class="demo">` |
| **TRAE 实践过程** | 3 步流程卡（需求规划 / 代码实现 / 调试优化） | `<section class="process">` |
| **响应式** | `@media (max-width: 768px)` 断点适配移动端 | `style` 末尾媒体查询 |

---

## 3. 关键类与函数说明

### 3.1 `BackgroundParticle` — 背景粒子（2D Canvas）

> 位置：[index.html#L287-L343](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html#L287-L343)

**构造器签名**：
```javascript
new BackgroundParticle(canvas: HTMLCanvasElement)
```

**成员**：
| 属性 | 类型 | 说明 |
|------|------|------|
| `canvas` | `HTMLCanvasElement` | 绑定的 Canvas DOM |
| `ctx` | `CanvasRenderingContext2D` | 2D 上下文 |
| `particles` | `Array<Particle>` | 粒子数组，每粒子含 `x/y/size/speedX/speedY/opacity` |

**方法**：
| 方法 | 说明 |
|------|------|
| `resize()` | 让 Canvas 匹配 `window.innerWidth/Height` |
| `initParticles()` | 随机生成 50 个粒子，位置、速度、透明度均随机 |
| `update()` | 每帧清除画布 → 绘制径向渐变背景 → 更新 + 绘制粒子（`rgba(196,76,255,?)`） |

**设计要点**：
- 背景为径向渐变 `#1a0a2e → #2a1050`，营造深空/霓虹氛围。
- 粒子使用屏幕边缘 wrap（超过画布从对侧再次进入），避免粒子流失。

---

### 3.2 `Flower` — 3D 花朵模型

> 位置：[index.html#L346-L494](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html#L346-L494)

**构造器签名**：
```javascript
new Flower(scene: THREE.Scene, position: THREE.Vector3)
```

**成员**：
| 属性 | 类型 | 说明 |
|------|------|------|
| `scene` | `THREE.Scene` | 所属场景，用于 add/dispose |
| `group` | `THREE.Group` | 花朵整体容器（花瓣 + 花心 + 茎 + 叶 + 辉光） |
| `color` | `{ r, g, b }` | 随机从 5 种粉色系中选取的主色调 |
| `scale / targetScale` | `number` | 当前/目标缩放，0→1 代表盛开 |
| `swayPhase / swaySpeed` | `number` | 摇曳动画相位与速度 |
| `growthSpeed` | `number` | 生长速度，默认 `0.03` |
| `opacity` | `number` | 整体透明度 |
| `center / stem / glow` | `THREE.Mesh` | 花心 / 茎 / 辉光球引用 |

**方法**：
| 方法 | 说明 |
|------|------|
| `createFlower()` | 程序化组装：5~8 个花瓣（Sphere+非等比缩放）+ 黄色花心 + 绿色圆柱茎 + 3 片叶子 + 外层辉光球 |
| `update(time)` | 弹性生长到 `targetScale`，正弦波驱动摇曳，辉光呼吸 |
| `easeOutElastic(x)` | 弹性缓动公式 `pow(2, -10x) · sin((10x-0.75)·c4) + 1` |
| `setTargetScale(scale)` | 设定目标缩放（0=消失, 1=盛开） |
| `setOpacity(opacity)` | 遍历 `group` 设置所有 `child.material.opacity` |
| `dispose()` | 从 `scene` 移除并释放 geometry/material，避免内存泄漏 |

**设计要点**：
- 花朵模型由 `THREE.SphereGeometry` + `THREE.CylinderGeometry` 非等比缩放组成，不依赖外部模型文件。
- 材质使用 `MeshStandardMaterial`（PBR）+ 环境光 + 点光源组合，呈现柔和高光。
- `dispose` 保证在花朵消失时释放 GPU 资源，是 WebGL 场景长期运行的关键。

---

### 3.3 `ParticleSystem` — 3D 粒子特效

> 位置：[index.html#L497-L545](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html#L497-L545)

**构造器签名**：
```javascript
new ParticleSystem(scene: THREE.Scene)
```

**方法**：
| 方法 | 说明 |
|------|------|
| `emit(position, color, count=20)` | 在位置处喷出 `count` 个粒子，速度 y≥0（向上扩散） |
| `update()` | 每帧更新位置 / 重力衰减 / 生命周期 / 透明度 / 缩放；过期粒子从 `scene` 移除并释放 |

**设计要点**：
- 每个粒子都是独立 `THREE.Mesh`（小 Sphere + BasicMaterial），对小规模粒子数量足够。
- 若后续需要上千粒子，建议替换为 `THREE.Points` + `BufferGeometry` 以提升性能。

---

### 3.4 `setupThreeJS()` — Three.js 初始化

> 位置：[index.html#L548-L585](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html#L548-L585)

**创建内容**：
- `PerspectiveCamera(75°, aspect, 0.1, 1000)`，`z=2`。
- `WebGLRenderer({ alpha: true, antialias: true })` — 透明背景便于与下层 2D 画布叠加。
- 限制 `pixelRatio` ≤ 2，防止 Retina 屏性能过度消耗。
- 两盏点光源（粉色 `#ff6b9d` + 紫色 `#c44cff`）+ 环境光，呈现霓虹风格。
- 监听 `resize`，自动更新相机 aspect 与 renderer 尺寸。

---

### 3.5 `startCamera()` & `setupHandTracking()` — 摄像头与手部追踪

> 位置：[index.html#L595-L646](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html#L595-L646)

**流程**：
```
用户点击"开始体验"
   ↓
隐藏 permission-prompt，显示 loading
   ↓
setupHandTracking()
   ├─ new Hands({ locateFile: ... })   ← MediaPipe 模型 URL
   ├─ hands.setOptions({ maxNumHands: 1, ... })
   ├─ hands.onResults(onResults)
   ├─ navigator.mediaDevices.getUserMedia({ video: { facingMode:'user', 1280x720 } })
   └─ new Camera(video, { onFrame: async () => await hands.send({ image: video }) }).start()
   ↓
加载完成 → 显示 flower-hint 3s
   ↓
错误 → alert 用户并回到 permission 页面
```

**MediaPipe 配置参数**：
| 参数 | 值 | 作用 |
|------|---|------|
| `maxNumHands` | `1` | 同时最多检测一只手（降低开销，且项目仅用单朵花） |
| `modelComplexity` | `1` | 0=Lite / 1=Full / 2=Heavy |
| `minDetectionConfidence` | `0.7` | 首次检测置信度阈值 |
| `minTrackingConfidence` | `0.5` | 后续追踪置信度阈值 |

---

### 3.6 `onResults(results)` — 手部坐标处理核心

> 位置：[index.html#L649-L696](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html#L649-L696)

**处理逻辑**：
```
拿到 results.multiHandLandmarks
   ├─ 有手：
   │   ├─ landmarks[0] 为手腕（手掌锚点）
   │   ├─ x = (1 - palm.x) * 2 - 1   → 镜像后映射到 [-1, 1]
   │   ├─ y = -(palm.y * 2 - 1)       → 翻转 Y（屏幕坐标系→世界坐标系）
   │   ├─ handPosition = Vector3(x*1.5, y*1.2, 0)
   │   ├─ lastHandPosition → lerp(0.3) 平滑
   │   ├─ 无 flower 则创建 + emit 粒子
   │   └─ flower.group.position.copy(handPosition)
   │
   └─ 无手：
        handNotVisibleCount++
        >30 帧 → flower.setTargetScale(0) → setTimeout 0.5s 后 dispose
```

**设计要点**：
- `1 - palm.x` 水平镜像：视频中用户的右手在画面左侧，镜像后手自然移动到世界右侧，符合直觉。
- `lerp` 平滑避免 MediaPipe 抖动。
- 30 帧防抖（约 0.5s）避免手部短暂离开画面时花朵反复出现/消失。

---

### 3.7 `animate()` — 主循环

> 位置：[index.html#L699-L716](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html#L699-L716)

每帧执行：
1. `time += 0.016`（~60fps 计时）
2. `backgroundParticles.update()`
3. 若 `flower` 存在则 `flower.update(time)`；若 `scale` 与 `targetScale` 均为 0，渐隐透明度。
4. `particleSystem.update()`
5. `renderer.render(scene, camera)`

---

### 3.8 `initApp()` — 入口函数

> 位置：[index.html#L268-L725](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html#L268-L725)

按顺序：
1. 绑定 DOM 引用（video / canvas / prompt / btn...）
2. 声明全局状态 `scene/camera/renderer/particleSystem/flower/hands/...`
3. 定义 `BackgroundParticle / Flower / ParticleSystem` 三类
4. `setupThreeJS()` + `setupParticles()`
5. `startBtn.addEventListener('click', startCamera)`
6. 启动 `animate()`

---

## 4. 依赖关系

### 4.1 外部依赖（CDN）

| 依赖 | 版本 | 来源 URL | 作用 |
|------|------|---------|------|
| Three.js | `0.160.0` | `https://unpkg.com/three@0.160.0/build/three.min.js` | 3D 渲染 |
| MediaPipe Hands | `0.4.1675466160` | `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675466160/` | 手部关键点检测 |
| MediaPipe Camera Utils | `0.3.1675466862` | `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/` | 视频帧采集循环 |

**依赖方向（无环）**：
```
window.load
   ↓
initApp
   ├─ setupThreeJS()        → 需要 THREE 全局对象 (CDN)
   ├─ setupParticles()      → 需要 bg-canvas DOM
   └─ startBtn click -> startCamera()
                           └─ setupHandTracking()
                                 ├─ 需要 Hands / Camera (CDN)
                                 └─ 需要 navigator.mediaDevices (浏览器 API)
```

### 4.2 内部依赖（`index.html`）

```
animate()
   ├─ BackgroundParticle.update()
   ├─ Flower.update() / dispose()
   ├─ ParticleSystem.update()
   └─ renderer.render()

startCamera()
   └─ setupHandTracking()
         └─ onResults(results)
               ├─ 创建 / 移动 Flower
               └─ 调用 ParticleSystem.emit()

Flower
   ├─ 使用 THREE.Scene / Group / Mesh / Material
   └─ 由 onResults 创建，由 animate 驱动动画
```

### 4.3 `ai-knowledge-intro.html` 依赖

- **无 JavaScript 外部依赖**：纯 CSS + HTML。
- 使用 Unicode Emoji 作为图标（`📚 🧠 🎮 🕸️ ⚛️ 📊 🎨 ⚡ 📝 🔧`）。
- 使用内联 SVG data-URI 作为 Hero 背景纹理（无外部图片资源）。

---

## 5. 项目运行方式

### 5.1 方式一：本地直接打开（最简单）

```bash
# 进入项目目录
cd e:\2_code\tmp\AI知识图谱教程网站

# 直接双击 index.html 或 ai-knowledge-intro.html
# Windows: start index.html
```

⚠️ **特别说明（`index.html`）**：
- 由于摄像头 API (`getUserMedia`) 在现代浏览器中**只在 HTTPS 或 `localhost`** 下可用，**直接双击打开 `index.html` 时摄像头/手势追踪功能将无法使用**（但页面视觉元素仍可浏览背景粒子）。
- **`ai-knowledge-intro.html` 可正常浏览，无需权限。**

### 5.2 方式二：本地 HTTP 服务器（推荐，用于手势互动页面）

任选一条命令执行，然后访问 `http://localhost:8080/`：

**Python（推荐）**：
```bash
cd e:\2_code\tmp\AI知识图谱教程网站
python -m http.server 8080
# 浏览器打开 http://localhost:8080/ 或 http://localhost:8080/ai-knowledge-intro.html
```

**Node.js（若已装）**：
```bash
npx serve .
# 或
npx http-server -p 8080
```

**VS Code Live Server 插件**：右键 HTML → "Open with Live Server"。

### 5.3 方式三：部署到静态托管

```bash
# 将整个目录上传到以下任一平台即可（无需构建）
# - Vercel: vercel --prod
# - Netlify: 拖拽目录到 https://app.netlify.com/drop
# - GitHub Pages: push 到仓库后在 Settings → Pages 启用
# - Cloudflare Pages: 连接 Git 仓库，Framework preset = "None"
```

### 5.4 浏览器兼容性

| 特性 | 要求 |
|------|------|
| 3D 渲染 | WebGL 1.0 支持（所有现代浏览器） |
| 摄像头 | 需 Chrome / Edge / Safari / Firefox 最新版，且允许 HTTPS 或 `localhost` |
| MediaPipe | 依赖 WASM + WebGL，不支持非常旧的浏览器（建议 Chrome ≥ 80） |
| 响应式布局 | 移动端浏览器也可访问，但手势追踪需配合前置摄像头 |

### 5.5 常见问题

| 现象 | 原因 | 解决 |
|------|------|------|
| 点击"开始体验"无反应或弹错 `无法访问摄像头` | 非 `localhost` / 非 HTTPS 环境，或权限被拒 | 用 `python -m http.server` 启动；在浏览器设置中允许摄像头 |
| 花朵一直不出现 | MediaPipe 未检测到手 | 将手掌面向摄像头，保证光照充足 |
| 画面卡顿明显 | 摄像头分辨率过高或设备 GPU 较弱 | 可修改 `setupHandTracking` 中 `width/height` 为 640×480 |
| 首次加载较慢 | CDN 需下载 MediaPipe WASM 模型 | 属于正常首次加载，后续有浏览器缓存 |

---

## 6. 数据模型

### 6.1 手部关键点（`landmarks`）

MediaPipe 返回 21 个 3D 关键点，归一化坐标 `(x, y, z) ∈ [0,1]`：
```javascript
[
  { x: 0.42, y: 0.71, z: 0.01 },  // 0 手腕（本项目取此点作为手掌锚点）
  { x: ... , y: ... , z: ... },   // 1 拇指根部
  ...                               // 20 小拇指指尖
]
```
参考：[MediaPipe Hands 关键点图示](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)

### 6.2 花朵实例状态

```javascript
{
  position: THREE.Vector3,   // 跟随手部
  scale: number,             // 当前缩放 0-1
  targetScale: number,       // 目标缩放
  swayPhase: number,         // 摇曳相位
  swaySpeed: number,         // 摇曳速度
  color: { r, g, b },        // 主色（5 种粉色系随机）
  opacity: number,           // 当前透明度
  growthSpeed: 0.03          // 生长速度
}
```

### 6.3 粒子实例状态

```javascript
{
  velocity: THREE.Vector3,   // 速度 (随机向上扩散)
  life: number,              // 当前生命
  decay: number,             // 每帧衰减量
  color: { r, g, b }         // 颜色来自花朵主色
}
```

---

## 7. 样式 / 视觉主题

### 7.1 `index.html` — 霓虹深空主题

```css
:root {
  --bg-deep: #1a0a2e;        /* 背景深色 */
  --neon-pink:  #ff6b9d;     /* 粉色点光源 / 文字 */
  --neon-purple:#c44cff;     /* 紫色点光源 / 边框 */
  --neon-blue:  #4cc9ff;     /* 备用蓝色 */
}
```
背景粒子颜色：`rgba(196, 76, 255, ?)`

### 7.2 `ai-knowledge-intro.html` — 现代渐变主题

```css
:root {
  --primary:      #6366f1;
  --primary-dark: #4f46e5;
  --secondary:    #8b5cf6;
  --accent:       #06b6d4;
  --bg-light:     #f8fafc;
  --bg-white:     #ffffff;
  --text-dark:    #1e293b;
  --text-gray:    #64748b;
  --border:       #e2e8f0;
}
```
Hero 背景：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

---

## 8. 未来扩展建议

| 方向 | 建议 |
|------|------|
| **多花 / 多手** | 当前 `maxNumHands=1`，可改为 2，并在 `onResults` 中遍历多只手创建多朵花 |
| **手势识别** | 利用 MediaPipe 21 个关键点做简单的手势分类（握拳 = 花朵消失，张开 = 绽放） |
| **音频反馈** | 使用 `Web Audio API` 加入花朵绽放的音效 |
| **性能优化** | 将粒子系统改为 `THREE.Points` + `BufferGeometry`，支持上千粒子 |
| **知识图谱可视化** | `ai-knowledge-intro.html` 目前仅静态文案，可引入 [D3.js](https://d3js.org/) 实现真正的力导向知识图谱 |
| **游乐场模块** | 接入真实 LLM API（如 OpenAI / Claude）替代"模拟响应"，需后端服务或 Edge Function |
| **路由** | 若项目继续扩大，可考虑迁移至 Vite + React / Vue，以支持组件拆分与路由 |
| **自动化测试** | 为纯逻辑函数（`easeOutElastic` / `lerp` 计算）添加 Vitest 单测 |
| **部署** | 迁移到 Vercel / Cloudflare Pages，获得 HTTPS + CDN 自动 HTTPS，解决本地摄像头权限问题 |

---

## 9. 阅读路线建议

1. **先看文档**：[PRD.md](file:///e:/2_code/tmp/AI知识图谱教程网站/.trae/documents/PRD.md) 与 [Technical-Architecture.md](file:///e:/2_code/tmp/AI知识图谱教程网站/.trae/documents/Technical-Architecture.md) 了解项目目标。
2. **浏览主页**：[ai-knowledge-intro.html](file:///e:/2_code/tmp/AI知识图谱教程网站/ai-knowledge-intro.html) 查看整体视觉与内容。
3. **体验互动页**：用 `python -m http.server` 启动后打开 [index.html](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html)，在浏览器中体验手势追踪。
4. **研读核心代码**：按 `initApp → setupThreeJS → setupParticles → setupHandTracking → onResults → animate → Flower / ParticleSystem` 的顺序阅读 `index.html` 脚本。

---

*本文档基于 [index.html](file:///e:/2_code/tmp/AI知识图谱教程网站/index.html) 与 [ai-knowledge-intro.html](file:///e:/2_code/tmp/AI知识图谱教程网站/ai-knowledge-intro.html) 实际代码自动梳理，如有变更请同步更新本 Wiki。*
