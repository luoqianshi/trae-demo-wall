<div align="center">

# YaraFlow

基于 Go + React 的智能 QQ 机器人框架

多模型 LLM 调度 · 插件扩展 · 记忆系统 · 实时 Web 仪表盘

<p>
  <img src="https://img.shields.io/badge/Go-1.25+-00ADD8" alt="Go Version">
  <img src="https://img.shields.io/badge/React-18-61DAFB" alt="React">
  <img src="https://img.shields.io/github/license/TayunStarry/Lunar-Astral-Agents?label=License" alt="License">
  <img src="https://img.shields.io/badge/Status-In%20Development-yellow" alt="Status">
</p>

</div>

<img src="docs/avatar.png" align="right" width="40%" alt="语瞳" style="margin-left: 20px; margin-bottom: 20px; border-radius: 12px;">

## 特性一览

- **多轮推理决策** — 规划器自主决定调用工具、等待或直接回复
- **联网搜索** — 百度/搜狗/Bing/DuckDuckGo 多引擎级联，支持简易/常规/深度三种模式
- **群级串行处理** — 每群独立串行，群间完全并行，消息不串不丢
- **多模型角色分工** — Planner / Replyer / ToolUse / Embedding / VLM 各司其职，池化 + 熔断
- **记忆系统** — 向量检索 + 知识图谱 + 人物画像 + 全局记忆，融合排序（RRF）
- **TimingGate** — LLM 评估是否适合插话，避免不合时宜的回复
- **插件系统** — Goja 沙箱，JS 编写，支持热加载 / 热重载 / 权限控制
- **黑话学习** — 自动识别未知词汇，LLM 推断词义并记录
- **Web 仪表盘** — 实时消息流、Prompt 预览、插件管理、模型配置、记忆调试

## 消息处理管线

```
消息进入 → 去重 → 预处理 → 门控 → 回复 → 消息发出
                    │          │
              图片/语音/表情   触发检查 → 过滤 → 命令
              视觉分析/ASR     TimingGate → 记忆检索 → 决策推理
                               ↓
                          Planner（多轮推理）
                          → 工具调用 / 联网搜索
                          → Replyer（回复生成 + 记忆摄入）
```

## 记忆系统

| 类型 | 说明 |
|------|------|
| 向量记忆 | Embedding 语义检索，hybrid / vector / keyword 三种模式 |
| 图谱记忆 | 自动提取实体与关系，构建知识图谱 |
| 人物画像 | 自动建立群成员画像，周期性 LLM 同步 |
| 全局记忆 | 跨会话共享的长期记忆 |
| 权重衰减 | 模仿遗忘曲线，记忆随时间衰减，访问增强 |

## 插件系统

基于 Goja（Go 实现的 ES5.1 引擎），六种插件类型：

| 类型 | 用途 |
|------|------|
| Command | 正则匹配指令（如 `/help`） |
| Tool | 模型自主调用的工具（如天气查询） |
| Hook | 消息处理链的拦截/观察 |
| EventHandler | 生命周期事件处理 |
| API | 跨插件调用接口 |
| LLM Provider | 自定义模型接入 |

支持热加载、配置热重载、权限控制、安全沙箱隔离。详见 [插件开发指南](docs/PLUGIN_DEV_GUIDE.md)。

## Web 仪表盘

| 页面 | 功能 |
|------|------|
| 首页 | 运行状态、消息统计、LLM 调用统计 |
| 聊天与监控 | 按群分组的实时消息流 + Prompt 预览 |
| 插件管理 | 插件列表、加载/卸载/重载 |
| 模型配置 | LLM 模型与 API Provider 管理 |
| Bot 配置 | 机器人行为参数配置 |
| 适配器配置 | 平台适配器设置 |
| 备忘录 | 知识库条目管理 |
| 记忆管理 | 记忆片段查看与调试 |
| 规则管理 | 用户规则配置 |
| 日志查看 | 实时日志流 |
| 黑话词典 | 已学词汇列表与统计 |

## 快速开始

### 环境要求

- Go 1.25+
- Node.js 18+
- GCC（Windows 需 MinGW-w64 或 TDM-GCC，用于 CGO）
- rsrc（Windows 图标编译，构建脚本自动安装）

### 编译

```powershell
# Windows
.\build.ps1

# 指定平台
.\build.ps1 -TargetOS linux -TargetArch amd64
```

### 配置

1. 首次运行自动从模板生成 `configs/config.yaml`
2. 模型配置在 `local_data/lunar_config.json` 的 `yara_flow` 栏目下
3. Prompt 模板在 `configs/prompts/` 目录

```yaml
bot:
  qq: ""            # Bot QQ 号
  nickname: "语瞳"   # 机器人昵称

trigger:
  auto_reply: true
  base_frequency: 0.3  # 随机回复概率

memory:
  enabled: true
  search_mode: "hybrid"  # hybrid / vector / keyword
```

### 运行

```powershell
.\YaraFlow.exe
```

启动后：
- Web 仪表盘：`http://localhost:8088`
- Lunar HTTP 服务：`http://localhost:36789`
- WebSocket：`ws://localhost:36789/ws`
- 指标端点：`http://localhost:8088/debug/vars`
- pprof：`http://localhost:8088/debug/pprof/`

## 项目结构

```
YaraFlow/
├── cmd/
│   ├── agent/          # 主程序入口
│   └── plugin-host/    # 插件宿主（独立进程）
├── configs/
│   ├── prompts/        # Prompt 模板
│   ├── config_template.yaml
│   └── rules.json
├── docs/
│   ├── avatar.png
│   ├── PLUGIN_SYSTEM.md
│   ├── PLUGIN_DEV_GUIDE.md
│   ├── PLUGIN_AI_BOUNDARIES.md
│   └── frontend-development-guide.md
├── internal/
│   ├── browser/        # 浏览器/WebView 启动
│   ├── bus/            # 事件总线
│   ├── chat/           # 会话管理
│   ├── config/         # 配置加载与热更新
│   ├── dedupe/         # 消息去重
│   ├── emoji/          # 表情包管理
│   ├── hook/           # Hook 系统
│   ├── jargon/         # 黑话/新词学习
│   ├── knowledge/      # 备忘录/知识库
│   ├── llm/            # LLM Provider、池化、熔断
│   ├── logger/         # 日志系统
│   ├── memory/         # 记忆系统（向量/图谱/画像）
│   ├── metrics/        # 运行时指标
│   ├── monitor/        # SSE 监控数据
│   ├── personality/    # 情绪状态
│   ├── platform/       # 平台适配（Lunar Server）
│   ├── plugin/         # 插件系统引擎
│   ├── pool/           # HTTP 连接池
│   ├── processor/      # 消息处理管线（核心）
│   ├── rule/           # 规则引擎
│   ├── storage/        # 数据库与迁移
│   ├── tracing/        # 分布式追踪
│   ├── voice/          # 语音处理
│   └── webui/          # Web 仪表盘后端 API
├── proto/              # Protobuf 定义（gRPC）
├── webui/              # React 前端
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   └── lib/
│   └── embed.go
├── plugins/            # 插件目录
├── build.ps1
└── go.mod
```

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Go 1.25 |
| 前端 | React 18 + TypeScript + Vite 6 |
| 样式 | TailwindCSS 3 |
| 图表 | Recharts |
| 数据库 | SQLite |
| 配置 | Viper (YAML) |
| 日志 | Zap |
| 插件引擎 | Goja (ES5.1) |
| 通信 | REST API + SSE + WebSocket + gRPC |
| LLM | OpenAI 兼容 API |

## 配置热更新

修改 `configs/config.yaml` 后自动重载，无需重启。

## License

MIT
