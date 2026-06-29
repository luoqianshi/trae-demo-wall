# 研易记 - 论文公式提取与复刻助手

基于大模型的沉浸式论文公式提取与复刻工具，支持从 PDF/Word 文档中自动识别数学公式，输出标准 LaTeX 代码。

---

## 项目结构

```
yanyiji/
├── backend/              # Python FastAPI 后端
│   ├── app/
│   │   ├── api/          # REST API 路由
│   │   │   ├── recognize.py    # 公式识别接口
│   │   │   ├── formulas.py     # 公式库 CRUD 接口
│   │   │   └── system.py       # 系统状态接口
│   │   ├── services/     # 核心服务
│   │   │   ├── recognizer.py         # VLM 多模态识别器
│   │   │   ├── latex_processor.py    # LaTeX 清理与验证
│   │   │   └── document_parser.py    # PDF/Word 文档解析器
│   │   ├── config.py     # 配置管理
│   │   └── main.py       # 应用入口
│   ├── data/             # 公式库 JSON 持久化
│   ├── requirements.txt  # Python 依赖
│   ├── Dockerfile
│   └── docker-compose.yml
├── web/                  # React 前端 (Vite + TypeScript)
│   ├── src/
│   │   ├── components/   # 组件 (Header, ResultCard, Starfield)
│   │   ├── context/      # 全局状态 (RecognitionContext)
│   │   ├── pages/        # 页面 (HomePage, UploadPage, MyLibraryPage)
│   │   └── services/     # API 调用层
│   ├── package.json
│   └── vite.config.ts
└── desktop/              # Electron 桌面端
    ├── main.js
    └── package.json
```

---

## 环境要求

| 软件 | 版本要求 |
|------|---------|
| Python | >= 3.10 |
| Node.js | >= 18 |
| npm | >= 9 |

---

## 快速部署

### 1. 后端部署

```bash
# 进入后端目录
cd yanyiji/backend

# 创建虚拟环境（推荐）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key（见下方配置说明）
```

### 2. 配置 API Key（核心）

编辑 `backend/.env`，选择一种 VLM 供应商填入 API Key：

```env
# --- 方式一：OpenAI 官方 ---
OPENAI_API_KEY=sk-你的key
OPENAI_BASE_URL=https://api.openai.com/v1
VLM_MODEL=gpt-4o

# --- 方式二：DeepSeek（国内推荐，便宜好用）---
# OPENAI_API_KEY=sk-你的key
# OPENAI_BASE_URL=https://api.deepseek.com/v1
# VLM_MODEL=deepseek-chat

# --- 方式三：阿里云百炼 ---
# OPENAI_API_KEY=sk-你的key
# OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
# VLM_MODEL=qwen-vl-max

# --- 方式四：智谱 GLM-4V ---
# OPENAI_API_KEY=你的key
# OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
# VLM_MODEL=glm-4v
```

### 3. 启动后端

```bash
cd yanyiji/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问 http://localhost:8000/docs 可查看 API 文档。

### 4. 启动前端

```bash
cd yanyiji/web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 即可使用。

### 5. （可选）Electron 桌面端

```bash
cd yanyiji/desktop
npm install
npm start
```

---

## Docker 部署（推荐）

```bash
cd yanyiji/backend

# 先配置 .env 文件
cp .env.example .env
# 编辑 .env 填入 API Key

# 启动服务
docker compose up -d
```

---

## 功能说明

### 上传识别页

| 功能 | 操作 | 说明 |
|------|------|------|
| 图片识别 | 拖拽/点击上传图片 | 调用 VLM 识别公式 → 输出 LaTeX |
| 文档识别 | 上传 PDF/Word | 自动提取所有公式并批量识别 |
| 重新识别 | 点击「重新识别」按钮 | 对同一张图重新调用 VLM |
| 快捷键复制 | `Ctrl+C` | 复制最新识别结果 |
| 保存到公式库 | 点击「保存」按钮 | 将结果存入公式库 |

### 公式库

- 按文档来源自动分组
- 可折叠/展开各分组
- 支持复制单个公式的 LaTeX 代码

### 后台识别

- 切换页面不会中断正在进行的识别任务
- 导航栏显示当前识别任务状态

---

## API 接口速览

启动后端后访问 http://localhost:8000/docs 查看完整文档。

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/recognize/image` | POST | 单张图片公式识别 |
| `/api/v1/recognize/images` | POST | 批量图片识别 |
| `/api/v1/recognize/document` | POST | 文档识别（PDF/Word） |
| `/api/v1/recognize/rerender` | POST | 重新识别（传入原图 base64） |
| `/api/v1/formulas` | GET | 获取公式库列表 |
| `/api/v1/formulas` | POST | 保存公式到公式库 |
| `/api/v1/formulas/{id}` | DELETE | 删除公式 |
| `/api/v1/system/health` | GET | 健康检查 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | FastAPI (Python) |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 桌面端 | Electron |
| 文档解析 | PyMuPDF (PDF) + python-docx (Word) |
| VLM 调用 | OpenAI 兼容 API |
| 图像处理 | Pillow + OpenCV |
| 状态管理 | React Context API |

---

## 常见问题

**Q: 启动后端报错 "OPENAI_API_KEY is not configured"？**
A: 需要编辑 `backend/.env` 填入有效的 API Key。支持 OpenAI、DeepSeek、阿里云百炼、智谱等供应商。

**Q: 识别出的公式包含中文文字？**
A: 后端已内置 `LatexOptimizer` 清理管线，会自动剥离 `\text{}` 包裹的中文描述。如果仍有残留，可点击「重新识别」重试。

**Q: Word 文档公式无法识别？**
A: 本项目支持 Word 原生 OMML 公式的直接转换，无需截图。如果遇到特殊结构，可尝试导出为 PDF 后上传。

**Q: 如何修改前端 API 地址？**
A: 编辑 `web/src/services/api.ts`，修改 `BASE_URL` 变量。