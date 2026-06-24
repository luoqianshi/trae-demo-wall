# AI 立体回忆馆

> 拍照生成 3D 纪念模型与数字展柜。上传照片，AI 自动生成可旋转、可下载的 3D 模型，放入个人数字展柜永久收藏。

## 功能亮点

- **照片转 3D 模型**：支持单张照片上传，AI 自动识别主体并生成 3D 几何体。
- **多引擎支持**：内置模拟模式（零配置体验），同时预留腾讯混元 3D、Meshy AI、Tripo3D API 接入能力。
- **3D 在线预览**：基于 Three.js 的交互式 3D 查看器，支持旋转、缩放、线框模式、自动旋转、灯光调节。
- **多种导出格式**：OBJ、GLB、STL 一键下载，支持 3D 打印、游戏开发、AR/VR 等后续工作流。
- **数字展柜**：按主题（家人/宠物/旅行/物品）整理模型，支持网格视图和展柜视图。
- **完整单页应用**：首页、生成页、展示页、展柜页、设置页，响应式设计，支持桌面和移动端。

## 技术栈

- 前端：HTML5 + CSS3 + Vanilla JavaScript + Three.js
- 后端（可选）：Node.js + Express（API 代理）
- 3D 渲染：Three.js (WebGL)

## 快速开始（纯前端模式）

无需任何后端或 API Key，直接打开 `index.html` 即可体验完整流程：

1. 用浏览器打开 `index.html`
2. 点击「开始生成 3D 模型」
3. 上传一张照片，选择「模拟模式」，点击「开始生成」
4. 在展示页旋转查看模型，点击导出 OBJ / GLB / STL

> 模拟模式会从照片提取色彩与轮廓，生成风格化 3D 几何体（雕塑/体素/Low Poly/浮雕），无需调用任何外部 API。

## 接入真实 AI 引擎（后端部署）

### 1. 安装后端依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# 腾讯混元 3D（推荐国内用户）
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key

# Meshy AI
MESHY_API_KEY=your_meshy_key

# Tripo3D
TRIPO_API_KEY=your_tripo_key
```

- **混元 3D**：在 [腾讯云控制台](https://console.cloud.tencent.com/cam/capi) 获取 SecretId 和 SecretKey，并开通混元 3D 服务。
- **Meshy AI**：在 [Meshy API](https://www.meshy.ai/zh/api) 页面获取 API Key（需要专业版或更高版本）。
- **Tripo3D**：在 [Tripo3D 文档](https://docs.tripo3d.ai/) 获取 API Key。

### 3. 启动服务器

```bash
cd server
npm start
```

服务器运行在 `http://localhost:3000`。访问该地址即可使用完整的前端 + 后端功能。

前端会自动将 API 请求通过代理发送到后端，避免密钥泄露和跨域问题。

## 项目结构

```
ai-3d-memory-gallery/
├── index.html           # 主入口（单页应用）
├── css/
│   └── style.css        # 全局样式
├── js/
│   ├── utils.js         # 工具函数
│   ├── api-config.js    # API 配置与客户端工厂
│   ├── mock-generator.js # 模拟 3D 生成器
│   ├── 3d-viewer.js     # Three.js 场景管理器
│   ├── gallery.js       # 数字展柜数据管理
│   └── app.js           # 主应用逻辑、路由、事件绑定
├── server/
│   ├── package.json
│   └── server.js        # Express 代理服务器
└── README.md
```

## 部署上线

### 纯前端静态部署

将以下文件上传到任意静态托管平台（Vercel、Netlify、GitHub Pages、Cloudflare Pages、腾讯云 COS 等）：

- `index.html`
- `css/style.css`
- `js/` 目录下所有文件

> 纯前端模式下，模拟功能完全可用，无需服务器。

### 全栈部署（含后端代理）

适合需要接入真实 3D 生成 API 的场景：

1. 部署 Node.js 后端到云服务器（阿里云、腾讯云、AWS、Vercel Functions 等）
2. 配置环境变量（API Keys）
3. 将前端静态文件配置为后端服务的静态目录（`server.js` 已内置 `express.static`）

示例（PM2）：

```bash
cd server
npm install
pm2 start server.js --name "ai-3d-gallery"
```

## 使用说明

### 模拟模式

- **无需 API Key**，直接体验从照片到 3D 的完整流程
- 提供 4 种风格：立体雕塑、体素风格、Low Poly、浮雕风格
- 生成的模型支持 3D 预览和 OBJ/GLB/STL 导出

### 腾讯混元 3D

- 国内领先的 3D 生成大模型
- 支持图片转 3D、文生 3D
- 输出格式：OBJ、GLB、STL、USDZ、FBX、MP4
- 需要腾讯云账号并开通服务

### Meshy AI

- 全球领先的 AI 3D 生成平台
- 生成速度快（约 1 分钟），纹理质量高
- 支持 OBJ、GLB、FBX、STL、USDZ、BLEND、3MF 导出
- 需要订阅专业版才能使用 API

### Tripo3D

- 操作友好的 AI 建模平台
- 支持图片和文本生成 3D
- 生成速度快，拓扑结构良好
- 提供免费试用积分

## 安全说明

- 所有 API Key 仅保存在浏览器本地存储（`localStorage`），不会上传到我们的服务器
- 只有在配置了后端代理的情况下，API Key 才会通过环境变量安全地存储在服务器端
- 清除浏览器数据或点击「设置」页中的「清除所有 API Key」即可删除本地保存的密钥

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要支持 WebGL 2.0 的浏览器以获得最佳 3D 渲染效果。

## 开源协议

MIT License

---

**AI 立体回忆馆** — 让照片变成可以触摸的回忆。
