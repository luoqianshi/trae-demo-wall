# 心镜 MindMirror — 多模态心理陪伴系统

基于多模态情绪感知的本地化心理陪伴网站系统。通过面部表情、语音语调、文字内容三路同时感知用户情绪，结合本地大模型提供 CBT（认知行为疗法）专业心理对话。

## 核心功能

- **多模态情绪识别**：DeepFace 面部表情 + SenseVoice 语音情绪 + 文本情感分析，三路融合
- **本地化心理对话**：Ollama Qwen2.5-7B-Instruct + 心理咨询师 System Prompt + CBT 策略库
- **流式响应+语音打断**：AI 回复逐字显示，用户说话可中断当前回复
- **情绪轨迹可视化**：会话内情绪变化按时间轴绘制

## 技术栈

| 模块 | 技术 | 说明 |
|------|------|------|
| 后端 | FastAPI + WebSocket | Python 3.10+ |
| 面部情绪 | DeepFace (FER2013) | opencv 检测器 |
| 语音识别+情绪 | SenseVoice-Small (FunASR) | ASR + 7类情感一体 |
| 心理对话 | Ollama + Qwen2.5-7B-Instruct | 本地 LLM，流式输出 |
| 前端 | 原生 JS + Web Audio API + AudioWorklet | 16kHz PCM 采集 |

## 部署步骤

### 环境要求

- **操作系统**：Windows 10/11（Mac/Linux 需调整路径）
- **Python**：3.10（推荐 3.10.x，不兼容 3.14）
- **内存**：≥ 16GB（7B 模型加载需要）
- **磁盘**：≥ 20GB（模型缓存）
- **CPU**：支持 AVX2 指令集（加速推理）

### 1. 安装 Ollama 并下载模型

从 https://ollama.com 下载安装 Ollama，然后拉取模型：

```bash
ollama pull qwen2.5:7b-instruct
```

模型约 4.7GB，下载完成后验证：

```bash
ollama list
```

### 2. 创建 Python 虚拟环境

```bash
# 进入项目目录
cd mindmirror-demo

# 创建虚拟环境（必须用 Python 3.10）
py -3.10 -m venv venv

# 激活虚拟环境
venv\Scripts\activate

# 确认 Python 版本
python --version  # 应显示 3.10.x
```

### 3. 安装 PyTorch CPU 版（必须先装）

```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
```

> **注意**：torch 和 torchaudio 必须从 CPU 索引安装，否则会下载 GPU 版本（体积大且无用）。

### 4. 安装其他依赖

```bash
pip install -r requirements.txt
```

### 5. 设置模型缓存路径（重要）

SenseVoice 模型默认缓存到用户目录。为避免中文路径问题，建议指定英文路径：

```bash
# Windows 永久环境变量（PowerShell 执行）
[Environment]::SetEnvironmentVariable("MODELSCOPE_CACHE", "D:\modelscope_cache", "User")

# 当前会话临时设置
$env:MODELSCOPE_CACHE = "D:\modelscope_cache"
```

> **已知问题**：sentencepiece C 库不支持中文路径，若缓存路径含中文会导致 bpe.model 加载失败。

### 6. 启动后端服务

```bash
# 确保 Ollama 服务已启动（默认开机自启）
# 启动后端
python app.py
```

首次启动会自动下载 SenseVoice-Small 模型（约 900MB），需要 1-2 分钟。看到以下日志表示就绪：

```
✅ SenseVoice 语音识别+情绪模型已加载
✅ DeepFace 情绪分析模型已加载
心镜 MindMirror 服务已启动 → http://localhost:8765
```

### 7. 浏览器访问

打开浏览器访问：**http://localhost:8765**

> **重要**：必须使用 localhost 访问，不能使用 IP。浏览器要求 localhost 或 HTTPS 才能授权摄像头/麦克风。

### 8. 开始使用

1. 点击"开启摄像头"授权面部识别
2. 点击"开启麦克风"授权语音采集
3. 点击"开始语音对话"进入持续对话模式
4. 说话即可自动识别文字+情绪，1.5秒无新文字自动发送
5. AI 回复期间说话可打断当前回复

## 目录结构

```
mindmirror-demo/
├── app.py                 # FastAPI 后端（WebSocket + REST API）
├── psychology.py          # 心理对话核心（Ollama + CBT 策略库）
├── session.py             # 会话管理（SQLite 存储）
├── requirements.txt       # Python 依赖
├── generate_icons.py      # Logo 图标生成脚本
├── static/
│   ├── index.html         # 主页面
│   ├── app.js             # 前端交互引擎（情绪融合+流式显示+打断）
│   ├── pcm-processor.js   # AudioWorklet PCM 采集
│   ├── style.css          # 样式
│   ├── logo.svg           # Logo 彩色版
│   ├── logo-light.svg     # Logo 深底版
│   ├── favicon.ico        # 浏览器图标
│   └── *.png              # 多尺寸图标
└── data/
    └── mindmirror.db      # SQLite 数据库（首次运行自动创建）
```

## 故障排查

### Q: 启动报错 "SenseVoice 加载失败: bpe.model No such file or directory"
**A**: 模型缓存路径含中文字符。设置 `MODELSCOPE_CACHE` 环境变量到英文路径（如 `D:\modelscope_cache`），删除旧缓存后重启。

### Q: 浏览器报错 "AudioWorkletNode cannot be created: The node name 'pcm-processor' is not defined"
**A**: 强制刷新浏览器（Ctrl+Shift+R）加载最新 pcm-processor.js。

### Q: 摄像头开启后面部情绪不识别
**A**: CPU 过载导致。关闭其他占用 CPU 的程序，或降低摄像头分辨率。

### Q: 语音识别无响应
**A**: 检查后端日志是否显示 "SenseVoice 语音识别+情绪模型已加载"。若未加载，检查 torch/torchaudio 是否安装（必须 CPU 版）。

### Q: AI 回复很慢
**A**: 7B 模型 CPU 推理较慢（首字约 3-5 秒）。已实现流式输出降低等待感知。如需更快可换用 `qwen2.5:3b`（修改 psychology.py 中 `OLLAMA_MODEL`）。

### Q: Ollama API 报连接错误
**A**: 确认 Ollama 服务已启动。运行 `ollama list` 验证，若无响应则手动启动 Ollama Desktop。

## 模型许可

| 模型 | 许可证 |
|------|--------|
| Qwen2.5-7B-Instruct | Apache 2.0 |
| SenseVoice-Small | Apache 2.0 |
| DeepFace (FER2013) | 学术研究用 |

## 开发工具

本项目全程使用 **TRAE IDE** 开发完成。
