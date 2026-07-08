# Citywalk 路线规划助手

基于 AI 分析攻略文字，自动生成最优 Citywalk 路线的 Web 应用。

## 功能特性

- 🏙️ 支持 18 个热门城市
- 🤖 AI 智能解析攻略文字（Ollama 本地大模型）
- 📍 自动识别地点、类型、游玩时长、亮点特色
- 🗺️ 地图可视化 + 路线规划
- 🔄 智能优化路线（顺路程度）
- 👆 拖拽排序 + 手动增删
- 🖼️ 每个地点可关联图片

## 快速开始

### 方式一：一键启动（推荐）

```bash
# 安装 Python 依赖
cd backend
pip install -r requirements.txt

# 启动（自动托管前端静态页面）
python app.py

# 浏览器访问 http://localhost:5000
```

### 方式二：前后端分离开发

```bash
# 后端
cd backend
pip install -r requirements.txt
python app.py  # http://localhost:5000

# 前端（另一个终端）
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## 启用 AI 分析（可选）

安装 Ollama 获得 AI 智能解析能力：

```bash
# 1. 安装 Ollama
# macOS: brew install ollama
# 或访问 https://ollama.com 下载

# 2. 下载模型
ollama pull qwen2.5:3b

# 3. 启动服务
ollama serve

# 4. 重启后端服务，自动启用 LLM 分析
```

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vue 3 + Vite | 响应式 UI |
| 地图 | Leaflet + OpenStreetMap | 免费地图渲染 |
| 后端 | Flask + Python | REST API |
| AI 分析 | Ollama + qwen2.5:3b | 本地 LLM（可选） |
| 路线规划 | Python itertools | 旅行商问题求解 |

## 支持城市

上海、北京、广州、深圳、杭州、南京、成都、重庆、苏州、武汉、西安、长沙、厦门、青岛、大理、丽江、三亚、拉萨

## 使用说明

1. 选择城市
2. 粘贴小红书/抖音攻略文字，或手动添加地点
3. 点击"识别地点"，AI 自动分析
4. 点击"智能优化路线"获得最优顺序
5. 拖拽列表手动调整顺序
6. 点击地点查看详情，可上传关联图片

## 项目结构

```
citywalk-agent/
├── backend/           # 后端
│   ├── app.py         # 主程序（含静态文件托管）
│   ├── xhs_parser.py  # 小红书解析（备用）
│   ├── requirements.txt
│   └── static/        # 前端 build 产物（一键启动用）
├── frontend/          # 前端源码
│   ├── src/
│   ├── dist/          # build 产物
│   └── package.json
└── README.md
```
