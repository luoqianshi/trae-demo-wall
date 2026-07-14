# Auto-Decision Agent

基于 LLM 的智能决策系统 — 面向运筹优化场景，自动完成意图识别、数学建模、算法选择与求解。

> **比赛提交说明**：本系统无需配置 API Key 即可完整运行演示。下载解压后双击 `start.bat` 即可使用。

---

## 功能特性

- **意图识别** — LLM 自动理解业务人员的自然语言需求
- **自动建模** — 生成标准数学模型描述（变量、目标函数、约束）
- **模型验证** — 自动检查模型合理性，发现问题自动修正
- **智能算法路由** — 根据问题规模自动选择精确算法或启发式算法（ALNS / 遗传 / A*）
- **求解验证** — 验证解的合理性，失败时自动反馈修正（最多 2 次自动重试）
- **流式输出** — 前端实时展示 7 步决策流程的每一步执行状态

---

## 项目结构

```
auto-decision-agent/
├── backend/
│   ├── main.py              # FastAPI 入口（SSE 流式接口）
│   ├── llm_service.py       # LLM 服务（国产模型 + Mock 演示模式）
│   ├── model_builder.py     # 模型描述与合理性验证
│   ├── solver_router.py     # 算法路由与模拟求解
│   └── validator.py         # 解验证与反馈循环
├── frontend/
│   └── index.html           # 科幻风格前端页面
├── config/
│   └── config.yaml          # 配置文件
├── start.bat                # Windows 一键启动（推荐）
├── start.py                 # Python 启动脚本
├── Dockerfile               # Docker 容器化部署
├── docker-compose.yml       # Docker Compose 配置
├── package.bat              # 打包脚本（生成发布 zip）
├── requirements.txt         # Python 依赖
└── README.md                # 本文件
```

---

## 快速开始

### 方式一：Windows 一键启动（推荐 — 评委首选）

**评委使用说明：**

1. 确保电脑已安装 **Python 3.8+**（未安装请从 https://www.python.org/downloads/ 下载，安装时勾选 "Add Python to PATH"）
2. 解压项目 zip 文件
3. 双击 **`start.bat`**
4. 脚本会自动安装依赖、启动服务，并在浏览器中打开页面
5. 在左侧输入框中描述您的优化问题，点击发送即可体验完整流程

> 无需配置任何 API Key，系统自动使用 Mock 演示模式，展示完整的 7 步决策流程。

### 方式二：Docker 部署（需要有 Docker 环境）

```bash
# 构建并启动
docker-compose up -d

# 或手动构建
docker build -t auto-decision-agent .
docker run -p 8000:8000 auto-decision-agent

# 浏览器访问 http://localhost:8000
```

### 方式三：手动启动

```bash
pip install -r requirements.txt
python start.py
```

---

## 决策流程

| 步骤 | 名称 | 说明 |
|------|------|------|
| 1 | 意图识别 | LLM 理解用户需求，识别问题类型 |
| 2 | 模型描述 | 自动生成数学模型（变量、目标、约束） |
| 3 | 合理性判断 | 验证模型完整性，发现问题自动修正 |
| 4 | 算法选择 | 根据规模选择精确算法或启发式算法 |
| 5 | 求解执行 | 执行求解，带反馈循环 |
| 6 | 结果验证 | 验证解的质量 |
| 7 | 输出 | 生成结果和可下载附件 |

---

## 配置 LLM API（可选）

不配置时系统自动使用 Mock 演示模式。如需接入真实 LLM，编辑 `config/config.yaml`：

```yaml
llm:
  api_key: "您的 API Key"
  base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1"  # 模型服务商地址
  model: "qwen-max"  # 模型名称
```

支持：阿里云通义千问、百度文心一言、智谱 GLM、月之暗面 Kimi 等国产模型。

---

## 技术栈

- **后端**：Python + FastAPI
- **LLM**：OpenAI 兼容接口（支持国产大模型 / Mock 演示模式）
- **前端**：原生 HTML + SSE 流式输出
- **求解**：模拟求解器（Demo 级别，展示完整 workflow）

---

## 比赛提交指引

### 提交前准备

1. 在项目根目录双击 **`package.bat`**，自动生成发布 zip 包
2. 发布包位于项目根目录上一级，命名为 `auto-decision-agent-v1.0.0.zip`
3. 提交该 zip 文件即可

### 裁判运行说明

裁判收到 zip 文件后：
1. 解压到任意目录
2. 双击 `start.bat`（需安装 Python 3.8+）
3. 浏览器自动打开 http://localhost:8000
4. 输入问题即可体验

### 评分亮点

- **零配置运行**：无需 API Key、无需联网、双击即用
- **完整 workflow**：7 步决策流程在页面上实时展示
- **反馈循环**：自动验证-修正-再求解的闭环机制
- **界面专业**：科幻风格 UI，组件锋利，交互流畅
- **可扩展**：配置真实 LLM 后即可展示真实 AI 能力