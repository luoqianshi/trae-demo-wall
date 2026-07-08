# WebMotion — 用代码做视频

> 基于 Web 的 MG 动画（Motion Graphics）生成工具，将文案脚本自动转化为带透明通道的动画素材，可直接叠加在视频上使用。

## 项目简介

WebMotion 是一个纯前端实现的 MG 动画制作工具，核心理念是**"用代码做视频"**。它类似于 Remotion，但专注于视频剪辑中的动画包装层生成。用户输入文案脚本后，系统自动分析语义、拆分场景、生成匹配的动画代码，并支持导出为带透明通道的视频素材（PNG 序列帧 / WebM VP9 Alpha / GIF），可直接在 Premiere、After Effects、剪映等视频软件中叠加使用。

### 核心能力

| 能力 | 说明 |
|------|------|
| 文案转动画 | 输入文案，AI 自动提取重点，生成匹配的 MG 动画 |
| 编程式控制 | 通过 `WebMotionAPI` 全局对象完全控制动画生成、编辑、预览、导出 |
| 双模式渲染 | 2D Canvas 模式 + 3D Three.js 模式（含 Bloom 后处理） |
| 透明通道导出 | PNG 序列帧（ZIP）、WebM（VP9 Alpha）、GIF 三种格式 |
| 设计系统 | 统一设计令牌（Token）系统，颜色/间距/字号/圆角全量管理 |
| 视觉套件 | 集成 GSAP、p5.js、D3.js、Anime.js、Flubber、Lottie 六大动画库 |
| 品牌套件 | 品牌色板、字体管理、一键换色 |
| MCP 协议 | 支持 MCP Server，让 AI Agent 通过协议操作动画生成 |

### 三种使用方式

**方式一：编程 Agent 直接编辑（推荐）**

编程 Agent 调用 `WebMotionAPI` 写代码编辑动画，每次根据文字内容定制独一无二的动画：

```javascript
// 添加自定义场景
WebMotionAPI.addScene({
  name: '标题动画',
  code: 'ctx.clearRect(0,0,width,height); ctx.fillStyle="#c9a96e"; ctx.font="bold 64px sans-serif"; ctx.textAlign="center"; ctx.fillText("Hello", width/2, height/2);',
  duration: 3
});

// 链式调用
WebMotionAPI.clearScenes()
  .addScene({ name: '场景A', code: '...', duration: 3 })
  .addScene({ name: '场景B', code: '...', duration: 4 })
  .play();

// 导出透明通道视频
const blob = await WebMotionAPI.exportWebM();
WebMotionAPI.download(blob, 'animation.webm');
```

**方式二：调用 AI API 生成**

1. 点击右上角「设置」，配置 AI API（支持 OpenAI 兼容接口）
2. 在左侧文案输入框粘贴脚本
3. 选择场景数和风格
4. 点击「生成 MG 动画」
5. 在预览区查看效果，支持对话式迭代修改
6. 点击「导出透明通道」导出素材

**方式三：手动写代码编辑**

在「代码编辑」面板中直接编写 JS 动画代码，支持 2D Canvas 和 3D Three.js 两种模式，实时预览渲染效果。

---

## 快速开始

### 环境要求

- 现代浏览器（Chrome 90+ / Edge 90+ / Firefox 88+）
- 支持 WebCodecs API 的浏览器（用于 WebM 导出，Chrome/Edge 优先）
- 本地 Web 服务器（可选，直接打开 index.html 也可运行）

### 启动方式

**方式 A：直接打开**

双击 `index.html` 即可在浏览器中运行。

**方式 B：本地服务器（推荐）**

```bash
# 使用 Python
python -m http.server 8080

# 或使用 Node.js
npx serve

# 然后在浏览器访问 http://localhost:8080
```

### 默认 Demo

打开后自动加载「浮空岛开放日」演示项目，包含 5 个场景、16 秒时长，展示完整的设计系统能力（粒子系统、光效、动态背景、缩放入场等）。

---

## 技术架构

### 技术栈

| 层级 | 技术 |
|------|------|
| 渲染核心 | Canvas 2D API + Three.js r128（含 EffectComposer / UnrealBloomPass 后处理） |
| 视觉套件 | GSAP 3.12、p5.js 1.9、D3.js 7.9、Anime.js 3.2、Flubber 0.4、Lottie 5.12 |
| 视频编码 | WebCodecs API（VideoEncoder + EncodedVideoChunk）+ webm-muxer 库 |
| 设计系统 | 自研 Token 系统（source.json → build.js → tokens.css + tokens.js） |
| 架构模式 | EventBus 中介者模式 + IIFE 模块化 + RuleEngine 运行时验证 |
| MCP 协议 | @modelcontextprotocol/sdk（Node.js MCP Server） |

### 架构总览

```
                         ┌──────────────┐
                         │   EventBus   │  ← 中央事件总线
                         └──────┬───────┘
              ┌─────────────────┼─────────────────┐
              │                 │                 │
        ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
        │SceneCtrl  │    │RenderEng  │    │ UICtrl    │
        │(scene.js) │    │(render.js)│    │(app.js)   │
        └───────────┘    └───────────┘    └───────────┘
              │                 │                 │
        ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
        │Timeline   │    │RuleEngine │    │TokenSys   │
        │(timeline) │    │(rules.js) │    │(tokens.js)│
        └───────────┘    └───────────┘    └───────────┘
```

### 渲染管线

```
RenderEngine.renderFrame(globalTime)
  ├─ 1. 确定当前场景 + 局部时间
  ├─ 2. 绘制背景层（虚空底色 / 星场 / 光晕 / 暗角 / 胶片颗粒）
  ├─ 3. 绘制内容层（3D → ThreeRenderer / 2D → compileUserCode）
  ├─ 4. 绘制叠加层（HUD / 进度条 / 安全区指示）
  ├─ 5. RuleEngine.validate() ← 运行时设计规则检查
  └─ 6. EventBus.emit('render:frame')
```

预览与导出共享同一渲染管线，确保"所见即导出"。

### 设计令牌系统

```
tokens/
├── source.json    # 唯一事实来源（颜色/间距/字号/圆角/动画）
├── build.js       # 构建脚本：生成 CSS + JS
├── tokens.css     # CSS Custom Properties
└── tokens.js      # JS 模块（供动画代码引用）
```

所有视觉元素通过统一令牌管理，消除硬编码。切换分辨率（1920x1080 ↔ 1080x1920）时所有元素自动适配。

---

## 文件结构

```
WebMotion-Demo/
├── index.html              # 主入口页面
├── README.md               # 本文档
├── SKILL.md                # Skill 说明文档
├── spec.md                 # 底层重构规格书
│
├── css/
│   └── style.css           # 主样式表（基于 Token 系统）
│
├── js/                     # 27 个核心模块
│   ├── app.js              # 主应用控制器
│   ├── agent-api.js        # 编程式 API（WebMotionAPI 全局对象）
│   ├── ai.js               # AI 生成模块（对接 LLM API）
│   ├── scene.js            # 场景管理器
│   ├── preview.js          # 预览渲染
│   ├── exporter.js         # 导出模块（PNG/WebM/GIF）
│   ├── render-engine.js    # 统一渲染引擎
│   ├── rule-engine.js      # 设计规则验证引擎
│   ├── timeline.js         # 时间轴控制
│   ├── visual-editor.js    # 可视化渲染模块
│   ├── three-renderer.js   # 3D 渲染器（Three.js）
│   ├── typography.js       # 排版系统（fontSize 统一计算）
│   ├── element-registry.js # 元素注册表
│   ├── event-bus.js        # 事件总线
│   ├── templates.js        # 动画模板库
│   ├── default-project.js  # 默认演示项目
│   ├── brand-kit.js        # 品牌套件
│   ├── utils.js            # 工具函数集
│   ├── aesthetics.js       # 美学系统
│   ├── visual-fx.js        # 视觉特效
│   ├── noise-overlay.js    # 胶片噪点叠加
│   ├── ui-helpers.js       # UI 辅助函数
│   ├── editor.js           # 代码编辑器
│   ├── project-history.js  # 项目历史管理
│   ├── undo-manager.js     # 撤销/重做
│   ├── assets.js           # 资源管理
│   └── webm-muxer.min.js   # WebM 封装库（VP9 Alpha）
│
├── tokens/                 # 设计令牌系统
│   ├── source.json
│   ├── build.js
│   ├── tokens.css
│   └── tokens.js
│
├── skills/                 # 设计规则文档（AI 生成参考）
│   ├── SKILL.md
│   └── rules/
│       ├── code-quality.md     # 代码质量规则
│       ├── color-theory.md     # 配色理论
│       ├── composition.md      # 构图法则
│       ├── effects.md          # 特效指南
│       ├── shader-art.md       # Shader 艺术
│       ├── suites.md           # 视觉套件
│       ├── text-animations.md  # 文字动画
│       ├── timing.md           # 节奏控制
│       ├── transitions.md      # 转场效果
│       ├── video-layout.md     # 视频布局
│       └── visual-depth.md     # 视觉层次
│
└── mcp/                    # MCP Server（可选）
    ├── server.js           # MCP 服务端
    └── webmotion-mcp.json  # MCP 工具配置
```

---

## API 参考

### 生成

| 方法 | 说明 |
|------|------|
| `WebMotionAPI.generateWithAI(script, options)` | 使用 AI API 生成动画（需配置 API Key） |
| `WebMotionAPI.generateScene(description, options)` | 生成单个场景代码 |

### 场景管理

| 方法 | 说明 |
|------|------|
| `WebMotionAPI.getScenes()` | 获取所有场景概览 |
| `WebMotionAPI.getScene(index)` | 获取场景详情（含完整代码） |
| `WebMotionAPI.selectScene(index)` | 选择活动场景 |
| `WebMotionAPI.addScene(data)` | 添加场景 |
| `WebMotionAPI.updateScene(index, data)` | 更新场景 |
| `WebMotionAPI.removeScene(index)` | 删除场景 |
| `WebMotionAPI.clearScenes()` | 清空所有场景 |
| `WebMotionAPI.moveScene(from, to)` | 移动场景顺序 |

### 代码编辑

| 方法 | 说明 |
|------|------|
| `WebMotionAPI.getCode(index)` | 获取场景代码 |
| `WebMotionAPI.setCode(index, code)` | 设置场景代码 |
| `WebMotionAPI.compile(code)` | 测试编译，返回 `{ valid, error }` |

### 预览控制

| 方法 | 说明 |
|------|------|
| `WebMotionAPI.play()` / `pause()` / `stop()` | 播放控制 |
| `WebMotionAPI.seekTo(time)` | 跳转到时间（秒） |
| `WebMotionAPI.getCurrentTime()` | 获取当前时间 |
| `WebMotionAPI.getDuration()` | 获取总时长 |
| `WebMotionAPI.renderFrame(time)` | 渲染指定帧 |
| `WebMotionAPI.getThumbnail()` | 获取当前帧截图 |
| `WebMotionAPI.setResolution(w, h)` | 设置分辨率 |

### 导出

| 方法 | 说明 |
|------|------|
| `WebMotionAPI.exportPNG(options)` | 导出 PNG 序列帧 ZIP |
| `WebMotionAPI.exportWebM(options)` | 导出 WebM 视频（带透明通道） |
| `WebMotionAPI.exportGIF(options)` | 导出 GIF 动图 |
| `WebMotionAPI.download(blob, filename)` | 下载文件 |

### 项目管理

| 方法 | 说明 |
|------|------|
| `WebMotionAPI.exportProject()` | 导出项目 JSON |
| `WebMotionAPI.loadProject(data)` | 加载项目 JSON |
| `WebMotionAPI.saveProject(key)` | 保存到 localStorage |
| `WebMotionAPI.loadSavedProject(key)` | 从 localStorage 加载 |

### 动画代码格式

**2D Canvas 模式（默认）**

```javascript
// 参数：ctx, t, width, height, utils
ctx.clearRect(0, 0, width, height);
const progress = utils.clamp(t / 0.5, 0, 1);
const scale = utils.lerp(0.3, 1, utils.ease.outBack(progress));
// ... 绘制逻辑
```

**3D Three.js 模式（设置 is3D: true）**

```javascript
// 参数：THREE, scene, camera, width, height, utils
// 需要 return 一个 animate(t) 函数
const cube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshPhongMaterial({color:0xc9a96e}));
scene.add(cube);
return function(t) {
  cube.rotation.x = t * 0.5;
  cube.rotation.y = t * 0.8;
};
```

### Utils 工具函数

| 函数 | 说明 |
|------|------|
| `utils.lerp(a, b, t)` | 线性插值 |
| `utils.clamp(v, min, max)` | 钳制范围 |
| `utils.map(v, min1, max1, min2, max2)` | 范围映射 |
| `utils.ease.*` | 25+ 缓动函数（outBack, outElastic, outExpo, bounce 等） |
| `utils.bezier(x1, y1, x2, y2)` | 三次贝塞尔曲线缓动 |
| `utils.spring(frame, fps, config)` | 物理弹簧动画 |
| `utils.interpolate(input, inputRange, outputRange, options)` | 多段插值 |
| `utils.color.*` | 颜色工具（hexToRgb, rgba, lerp） |
| `utils.registerElement(type, props)` | 注册可编辑元素 |
| `utils.fontSize(size, canvasWidth)` | 基于分辨率的字号计算 |

在浏览器控制台输入 `WebMotionAPI.help()` 可查看完整 API 文档。

---

## MCP Server（可选）

WebMotion 提供 MCP（Model Context Protocol）Server，让 AI Agent 通过协议操作动画生成。

### 启动 MCP Server

```bash
cd mcp
npm install @modelcontextprotocol/sdk
node server.js
```

### 可用工具

| 工具 | 说明 |
|------|------|
| `generate_animation` | 根据文案生成 MG 动画场景 |
| `list_templates` | 列出所有可用动画模板 |
| `get_template` | 获取指定模板代码 |
| `validate_code` | 验证动画代码语法 |

---

## 设计规则系统

`skills/rules/` 目录包含 11 个设计规则文档，涵盖：

- **配色理论**（color-theory.md）— 渐变色停数量、对比度、配色方案
- **构图法则**（composition.md）— 三分法、黄金比例、视觉重心
- **文字动画**（text-animations.md）— 入场出场、缓动选择、节奏控制
- **转场效果**（transitions.md）— 场景过渡、时间控制
- **视频布局**（video-layout.md）— 安全区、分辨率适配
- **视觉层次**（visual-depth.md）— 景深、光影、层次
- **特效指南**（effects.md）— 粒子、光效、噪声
- **节奏控制**（timing.md）— 动画节奏、时间分配
- **视觉套件**（suites.md）— 六大动画库使用指南
- **Shader 艺术**（shader-art.md）— GLSL 着色器
- **代码质量**（code-quality.md）— 代码规范

这些规则通过 `RuleEngine` 在运行时进行验证，确保生成的动画符合设计标准。

---

## 场景类型

本地生成器自动分析文案，生成以下类型的场景：

| 类型 | 触发条件 | 动画效果 |
|------|----------|----------|
| title | 第一句 | 大字标题 + 缩放入场 + 装饰线 |
| data | 包含数字 | 数字计数动画 + 圆环装饰 |
| statement | 普通陈述 | 文字卡片 + 滑入 + 关键词高亮 |
| closing | 最后一句（短） | 脉冲文字 + 光晕背景 |
| atmosphere | 每隔3个 | 3D 粒子球 + 文字叠加 |

## 配色方案

推荐配色：`#c9a96e`（金）、`#fb7185`（玫）、`#a78bfa`（紫）、`#22c55e`（绿）、`#f59e0b`（黄）

---

## 功能特性

- **AI 文案转动画**：粘贴文案脚本，自动生成多场景 MG 动画
- **对话式迭代**：输入自然语言指令修改动画（如"文字改大，加辉光"）
- **代码编辑**：三标签页（JS / HTML / CSS）直接编辑动画代码
- **实时预览**：30/60fps 实时渲染，支持逐帧查看
- **多场景管理**：场景时间轴，拖拽排序，添加/删除/复制
- **分辨率切换**：1920x1080（横屏）↔ 1080x1920（竖屏）一键切换
- **品牌套件**：品牌色板管理、一键换色、品牌字体设置
- **项目历史**：自动保存历史项目，支持导入导出
- **撤销/重做**：完整操作历史，Ctrl+Z / Ctrl+Y
- **特效开关**：胶片噪点、辉光效果、动态配色一键切换
- **多格式导出**：PNG 序列帧（ZIP）、WebM（VP9 Alpha 透明通道）、GIF
- **3D 模式**：Three.js 3D 动画，含 Bloom 后处理

---

## 参赛信息

**项目名称**：WebMotion — 用代码做视频

**参赛赛道**：TRAE AI 创意赛

**项目定位**：基于 Web 的 MG 动画包装层生成工具，将文案脚本自动转化为带透明通道的视频素材。

**核心价值**：
1. 降低 MG 动画制作门槛 — 文案直接生成动画，无需专业设计技能
2. 编程式控制 — Agent 通过 API 完全控制动画生成，实现自动化工作流
3. 透明通道导出 — 生成的动画可直接叠加在视频上，无缝接入剪辑工作流
4. 设计系统驱动 — 统一令牌系统确保视觉一致性，规则引擎保证设计质量

**纯前端实现**：无需后端服务，所有渲染在浏览器完成，开箱即用。
