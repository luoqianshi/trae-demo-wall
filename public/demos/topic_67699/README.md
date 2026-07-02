# 味忆 FlavorMemo - 基于多模态 AI 的家乡菜还原平台

> 上传一张家乡菜照片，AI 自动识别菜品并生成完整菜谱与烹饪指南

## 快速开始

### 1. 安装 Python 依赖

确保已安装 Python 3.8+，然后运行：

```bash
pip install -r requirements.txt
```

### 2. 安装 Ollama

前往 [ollama.com](https://ollama.com) 下载并安装 Ollama（本地 AI 模型运行工具）。

安装完成后，打开终端确认 Ollama 正在运行：

```bash
ollama --version
```

### 3. 拉取 AI 模型

```bash
# 多模态模型（推荐，可识别图片中的菜品）
ollama pull llava

# 文本模型（备用，根据文字描述生成菜谱）
ollama pull qwen2.5
```

### 4. 启动后端服务

```bash
python app.py
```

服务启动后，控制台会显示连接状态和可用模型信息。

- 健康检查：http://localhost:5000/api/health
- 分析接口：http://localhost:5000/api/analyze

### 5. 打开前端页面

双击 `index.html` 文件在浏览器中打开即可开始体验。

> 即使不启动后端服务，前端也可以在**演示模式**下运行（使用内置菜谱数据）。
> 启动后端并安装 Ollama 模型后，可获得真实的 AI 识别能力。

## 功能说明

- **图片上传**：支持拖拽或点击上传菜品图片（JPG/PNG/WebP，最大 10MB）
- **文字描述**：可选填辅助描述，帮助 AI 更准确地识别菜品
- **AI 识别**：使用 LLaVA 多模态模型识别图片中的菜品
- **菜谱生成**：自动生成包含食材、步骤、贴士的完整菜谱
- **演示模式**：后端不可用时自动切换为演示模式，展示内置菜谱数据

## 技术栈

- **前端**：HTML5 + CSS3 + 原生 JavaScript（单文件，自包含）
- **后端**：Python + Flask + Flask-CORS
- **AI 模型**：Ollama（LLaVA 多模态 / Qwen2.5 文本）

## 项目结构

```
初赛/
├── index.html          # 前端页面（单文件，内联所有 CSS 和 JS）
├── app.py              # 后端 Flask API 服务
├── requirements.txt     # Python 依赖
├── README.md           # 本文件
├── fonts/              # 字体文件
│   ├── InstrumentSans-Regular.ttf
│   ├── InstrumentSans-Bold.ttf
│   ├── IBMPlexSerif-Regular.ttf
│   └── IBMPlexSerif-Bold.ttf
└── assets/             # 图片资源
    ├── hero_1280x720.jpg
    ├── feature_recognize_1024x576.jpg
    ├── feature_shopping_1024x576.jpg
    ├── feature_voice_1024x576.jpg
    └── feature_community_1024x576.jpg
```

## 常见问题

**Q: 前端打开后提示"演示模式"怎么办？**
A: 这说明后端服务未启动或 Ollama 未安装。按上述步骤启动后端并安装模型即可。

**Q: Ollama 拉取模型很慢怎么办？**
A: 可以设置国内镜像加速，或使用较小的模型替代。

**Q: 不安装 Ollama 能用吗？**
A: 可以。前端自带演示模式，后端也有内置兜底菜谱数据，但无法获得真实的 AI 识别功能。
