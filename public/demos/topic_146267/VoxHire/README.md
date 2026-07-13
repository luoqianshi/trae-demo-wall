# VoxHire

VoxHire 是一个面向中文软件开发求职者的 AI 语音模拟面试 Demo。用户填写目标岗位、经验与技术栈后，可完成一场 5 题模拟面试，并获得技术准确性、项目深度、问题分析、系统设计、表达清晰度、沟通协作和改进建议七维报告。

当前版本以验证“配置 -> 面试 -> 复盘”的可体验闭环为目标。企业题库、账号体系、历史云端存储、在线编程、企业端筛选和生产级部署仍未实现。

## 功能

- 演示数据模式：无需密钥、模型或语音设备，即可体验完整的面试与报告页面。
- 本地语音模式：中文 Paraformer ASR、本地 speech-to-speech 网关、OpenAI 兼容 LLM 与 Edge TTS 语音播放。
- 面试流程：5 道岗位相关问题；按住说话，松开后提交本轮回答；每轮完成后推进进度。
- 隐私：简历、JD、音频仅用于当前会话，后端不做持久化；已完成记录仅保存在浏览器 IndexedDB。

## 技术栈

- 前端：React 19、Vite、TypeScript、Lucide
- 后端：FastAPI、Pydantic、pypdf
- 语音网关：[huggingface/speech-to-speech](https://github.com/huggingface/speech-to-speech) 的 OpenAI Realtime WebSocket 协议
- 语音：Paraformer 中文 ASR、Edge TTS 中文语音
- 测试：pytest、Playwright

## 环境要求

- Windows 10/11（当前脚本已在 Windows 环境开发）
- Node.js 20 或更高版本
- Python 3.12
- [uv](https://docs.astral.sh/uv/)
- 真实语音模式还需要可用麦克风、网络，以及一个 OpenAI Chat Completions 兼容的 LLM API

GPU 不是必需条件。CPU 是默认且已验证的路径；`RTX 3050 4GB` 可使用实验性 CUDA 环境加速 ASR，但 Edge TTS 仍通过网络服务合成语音。

## 快速开始

### 1. 安装依赖

在项目根目录执行：

```powershell
npm install
uv sync
npx playwright install chromium
```

### 2. 启动演示数据模式

分别打开两个 PowerShell 窗口：

```powershell
# 终端 1：FastAPI 后端
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

```powershell
# 终端 2：Vite 前端
npm run dev
```

打开 http://127.0.0.1:5173。默认是“演示数据模式”，无需 `.env`、LLM 密钥或语音网关。

### 3. 启动真实本地语音模式（可选）

先复制并编辑环境变量文件：

```powershell
Copy-Item .env.example .env
```

在 `.env` 中填写以下三项，不要将 `.env` 提交到 Git：

```dotenv
VOXHIRE_LLM_BASE_URL=https://api.example.com/v1
VOXHIRE_LLM_API_KEY=replace-with-your-api-key
VOXHIRE_LLM_MODEL=your-model-name
```

再打开第三个 PowerShell 窗口启动语音网关：

```powershell
# CPU 默认路径
.\scripts\start-gateway.ps1
```

网页中切换为“本地语音模式”，点击“测试连通性”确认 LLM 配置，再开始面试。网关地址默认为 `ws://127.0.0.1:8765/v1/realtime`；如需覆盖，设置前端环境变量 `VITE_SPEECH_GATEWAY_URL`。

首次启动真实语音模式会下载 Paraformer 相关模型到 `.cache/`，请预留网络和磁盘空间。Edge TTS 不下载模型，但需要访问微软的语音服务。

### GPU 实验路径

确认 NVIDIA 驱动和 CUDA 运行环境可用后执行：

```powershell
.\scripts\setup-gpu.ps1
.\scripts\start-gateway-gpu.ps1
```

该路径使用独立的 `.venv-gpu`，不会覆盖 CPU 环境。若 GPU 初始化失败，请回退到 CPU 启动命令。

## 常用命令

```powershell
# 前端开发与生产构建
npm run dev
npm run build

# 后端单元测试
.\.venv\Scripts\python.exe -m pytest

# 浏览器端到端测试
npm run test:browser
```


## 项目结构

```text
src/                 React 前端、面试流程和 WebSocket 客户端
backend/             FastAPI 会话、简历提取、LLM 连通性和报告接口
scripts/             语音网关、Edge TTS 适配与 GPU 环境脚本
tests/               Python 单元测试
e2e/                 Playwright 端到端测试
public/              静态资源与录音 AudioWorklet
```

