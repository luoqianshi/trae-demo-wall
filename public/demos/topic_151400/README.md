<p align="center">
  <img src="preview.png" alt="Mycelium Preview" width="100%">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue?style=flat-square" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license">
  <img src="https://img.shields.io/badge/Three.js-R160-orange?style=flat-square" alt="renderer">
  <img src="https://img.shields.io/badge/143_roots-613_words-00ff9a?style=flat-square" alt="data">
  <img src="https://img.shields.io/badge/zero_dependencies-100%25_local-success?style=flat-square" alt="deps">
</p>

# Mycelium — 菌丝词源

> **以菌丝之网，解构英语之源**
>
> 一个沉浸式的 3D 英语词根学习工具，用生物荧光菌丝网络可视化词根之间的深层关联。覆盖初高中英语核心词根，支持交互式探索、学习进度追踪与多维度可视化。

---

# Mycelium — Root Universe

> **Deconstruct the origins of English through a mycelium network**
>
> An immersive 3D English etymology learning tool that visualizes deep connections between word roots through a bioluminescent mycelium network. Covers core roots for middle and high school English, with interactive exploration, learning progress tracking, and multi-dimensional visualization.

---

## [中文] 功能特性

### 3D 词根星系

- **143 个词根节点** 分布在 3D 球面空间中，按 7 个语义菌落聚类
- Three.js WebGL 渲染：发光球体节点、星尘粒子背景、半透明菌丝连线
- 360° 自由旋转 — 鼠标拖拽旋转视角，滚轮缩放，右键平移
- 自动缓慢旋转展示全景，交互时自动暂停

### 交互体验

- **悬停放大** — 鼠标悬停时节点平滑放大 1.4x，发光增强，标签同步放大
- **标签自适应** — 标签字号根据相机距离动态缩放（0.5x ~ 2.5x），远近皆清晰
- **高分辨率文字** — Canvas 纹理支持 devicePixelRatio，长词根动态适配画布宽度
- **点击选中** — 高亮关联网络，其余节点变暗，详情面板从右侧滑入
- **搜索定位** — 实时搜索词根或单词，点击飞行定位
- **图例筛选** — 按词源（Latin / Greek / Mixed）过滤显示
- **移动端触控** — 单指旋转，双指缩放，点击选中

### 学习追踪

- **4 级掌握度可视化** — 未学 / 初识 / 熟悉 / 掌握，3D 节点亮度随学习进度变化
- **悬停进度提示** — 悬停时显示学习进度（如 `3/8 已学 38%`）
- **星标标记** — 详情面板中点击星标标记单词为"已学"
- **本地持久化** — 学习数据通过 localStorage 保存，无需账号
- **详情面板** — 词根含义、词源、关联词根、派生词完整列表

---

## [English] Features

### 3D Root Galaxy

- **143 root nodes** distributed in 3D spherical space, clustered by 7 semantic colonies
- Three.js WebGL rendering: glowing sphere nodes, stardust particle background, translucent mycelium connections
- 360° free rotation — drag to rotate, scroll to zoom, right-click to pan
- Auto-rotate for panoramic showcase, pauses on interaction

### Interactive Experience

- **Hover Zoom** — Nodes smoothly scale 1.4x on hover with enhanced glow and synchronized label enlargement
- **Adaptive Labels** — Label font size dynamically scales with camera distance (0.5x ~ 2.5x), readable at any zoom
- **High-Resolution Text** — Canvas textures support devicePixelRatio, dynamic canvas width for long root names
- **Click to Select** — Highlights connected network, dims unrelated nodes, slides in detail panel
- **Search & Navigate** — Real-time search for roots or words, click to fly-to location
- **Legend Filter** — Filter by etymology (Latin / Greek / Mixed)
- **Mobile Touch** — One-finger rotate, two-finger zoom, tap to select

### Learning Tracking

- **4-Level Mastery Visualization** — Unknown / Familiar / Proficient / Mastered, node brightness reflects learning progress
- **Hover Progress** — Tooltip shows learning progress (e.g., `3/8 learned 38%`)
- **Star Marking** — Mark words as learned in the detail panel
- **Local Persistence** — Learning data saved via localStorage, no account needed
- **Detail Panel** — Root meaning, etymology, connected roots, full derivation list

---

## 数据规模 / Data Scale

| 维度 / Dimension | 数量 / Count |
|---|---|
| 词根节点 / Root Nodes | 143 |
| 单词总数 / Total Words | 613 |
| 关联连线 / Connections | 298 |
| 词源类别 / Etymology Types | 5 (Latin / Greek / Old English / French / Mixed) |
| 语义菌落 / Semantic Colonies | 7 (action / thought / science / body / quantity / society / emotion) |

---

## 设计哲学 / Design Philosophy

### 中文

想象一片深夜的森林地表——黑暗之中，隐藏在地下的菌丝网络发出幽幽的生物荧光。每一个词根就是一朵发光的蘑菇，词根之间的语义关联就是连接它们的菌丝。当你触碰任意一朵蘑菇，神经信号沿着菌丝网络级联传播，点亮所有相关联的词根。

这就是 Mycelium 的设计哲学：**在黑暗与微光之间，发现英语词根之间隐藏的深层网络。**

### English

Imagine a dark forest floor at night—hidden beneath the surface, a mycelium network glows with bioluminescence. Each word root is a glowing mushroom, and the semantic connections between roots are the mycelium threads linking them. When you touch any mushroom, signals cascade through the network, illuminating all connected roots.

This is Mycelium's design philosophy: **Between darkness and faint light, discover the hidden deep network beneath English word roots.**

---

## 快速开始 / Quick Start

### 中文

本项目为纯静态前端，但必须通过 **HTTP 协议** 访问（不能直接双击 `index.html` 打开）。

**一键启动（推荐）：**

```bash
# macOS / Linux
chmod +x start.sh
./start.sh

# Windows
双击 start.bat
```

**Python 启动：**

```bash
python3 server.py          # 默认端口 8080
python3 server.py 3000     # 自定义端口
```

**Node.js 启动：**

```bash
node server.js             # 默认端口 8080
```

启动后自动打开浏览器访问 `http://localhost:8080`。服务器支持自动寻找可用端口。

### English

This is a static frontend project, but must be accessed via **HTTP protocol** (cannot open `index.html` directly with `file://`).

**One-click start (recommended):**

```bash
# macOS / Linux
chmod +x start.sh
./start.sh

# Windows
Double-click start.bat
```

**Python:**

```bash
python3 server.py          # Default port 8080
python3 server.py 3000     # Custom port
```

**Node.js:**

```bash
node server.js             # Default port 8080
```

The browser opens automatically at `http://localhost:8080`. The server auto-finds available ports.

---

## 技术架构 / Tech Stack

```
rootiverse/
├── index.html          # 单文件应用 / Single-file app (HTML + CSS + JS inline)
├── data.json           # 词根数据 / Root data (roots[] + connections[])
├── three.module.js     # Three.js R160 本地引用 / Local Three.js
├── OrbitControls.js    # 相机控制 / Camera controls
├── server.py           # Python 服务器 / Python server (recommended)
├── server.js           # Node.js 服务器 / Node.js server (alternative)
├── start.sh            # macOS / Linux 启动脚本
├── start.bat           # Windows 启动脚本
├── package.json        # Node.js 配置 / Node.js config
├── preview.png         # 项目预览图 / Project preview
└── README.md           # 本文件 / This file
```

**零外部网络依赖** — Three.js 和 OrbitControls 均为本地文件，无需 CDN，中国大陆可直接使用。
**Zero network dependencies** — Three.js and OrbitControls are local files, no CDN required, works in mainland China.

核心技术 / Core Technologies:

- **Three.js R160** — WebGL 场景、透视相机、发光材质、星尘粒子系统
- **OrbitControls** — 鼠标/触控旋转、缩放、平移控制，惯性阻尼
- **3D 球形布局** — 7 个语义菌落按球面分布，菌落内用黄金角度螺旋排列
- **Raycaster** — 3D 空间中的点击/悬停检测
- **CanvasTexture** — 动态画布纹理渲染高分辨率词根标签
- **Pointer Events** — 统一鼠标/触控事件处理，智能区分点击与拖拽

---

## 项目状态与扩展计划 / Project Status & Roadmap

### 中文

当前版本（v4.0）**主要定位为可视化展示工具**，已覆盖初高中英语核心词根（143 个词根、613 个单词）。项目数据结构开放，你可以轻松扩充词库：

- **增加单词量** — 在 `data.json` 中为已有词根添加更多 `words` 即可，页面自动渲染
- **增加词根** — 在 `roots` 数组中新增词根对象，按语义分配 `category`，页面自动布局到对应菌落
- **建立新关联** — 在 `connections` 中添加词根间的关系连线，3D 网络自动更新

无需修改任何代码，只需编辑 `data.json` 即可扩展。详见下方扩展指南。

### English

The current version (v4.0) is **primarily a visualization and demonstration tool**, covering core roots for middle and high school English (143 roots, 613 words). The data structure is open—you can easily expand the vocabulary:

- **Add words** — Simply add more `words` to existing roots in `data.json`, the page auto-renders
- **Add roots** — Add new root objects to the `roots` array with a `category`, the 3D layout auto-assigns to the correct colony
- **Add connections** — Add relationship entries to `connections`, the 3D network auto-updates

No code changes needed—just edit `data.json`. See the extension guide below.

---

## 扩展指南 / Extension Guide

### 添加新词根 / Adding New Roots

在 `data.json` 的 `roots` 数组中新增：

```json
{
  "id": "vac",
  "root": "vac/van",
  "meaning": "空；空虚 / empty; void",
  "origin": "Latin",
  "category": "thought",
  "words": [
    {
      "word": "vacant",
      "phonetic": "/ˈveɪkənt/",
      "definition": "not filled or occupied",
      "definitionCn": "空的；空闲的"
    }
  ]
}
```

### 建立关联 / Adding Connections

```json
{
  "from": "vac",
  "to": "van",
  "type": "shared_origin",
  "note": "vac 与 van 是同一词根的不同拼写变体"
}
```

### 字段说明 / Field Reference

| 字段 / Field | 说明 / Description |
|---|---|
| `id` | 唯一标识，英文小写 / Unique ID, lowercase |
| `origin` | Latin / Greek / Old English / French / Mixed |
| `category` | action / thought / science / body / quantity / society / emotion |
| `type` | related / shared_origin / compounding / shared_concept / opposite |

---

## 常见问题 / FAQ

**Q: 双击 index.html 打开为什么空白？ / Why is the page blank when opening index.html directly?**

A: 浏览器禁止 `file://` 协议下的 AJAX 请求。请使用 HTTP 服务器启动。
A: Browsers block AJAX requests under `file://` protocol. Use an HTTP server.

**Q: 提示 WebGL 不支持怎么办？ / What if WebGL is not supported?**

A: 请使用最新版 Chrome、Safari 或 Firefox 浏览器，确保硬件加速已开启。
A: Use the latest Chrome, Safari, or Firefox, and ensure hardware acceleration is enabled.

**Q: 端口被占用怎么办？ / What if the port is occupied?**

A: 服务器会自动寻找可用端口，也可以手动指定：`python3 server.py 3000`
A: The server auto-finds available ports, or specify manually: `python3 server.py 3000`

---

## 浏览器兼容性 / Browser Compatibility

| 浏览器 / Browser | 支持状态 / Status |
|---|---|
| Chrome 90+ | 完全支持 / Full support |
| Safari 15+ | 完全支持 / Full support |
| Firefox 90+ | 完全支持 / Full support |
| Edge 90+ | 完全支持 / Full support |
| 移动端 Safari / Chrome | 支持触控 / Touch supported |

---

## 开源协议 / License

本项目基于 [MIT License](LICENSE) 开源。
This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <em>以菌丝之网，解构英语之源</em><br>
  <em>Deconstruct the origins of English through a mycelium network</em>
</p>
