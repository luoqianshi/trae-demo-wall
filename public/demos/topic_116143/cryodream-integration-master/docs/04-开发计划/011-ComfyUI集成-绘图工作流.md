# RAG 之外模块：ComfyUI 集成（绘图工作流）

## 当前状态

- 状态：第一阶段已完成（文生图端到端打通：扫描→导入→参数提取→出图→画布展示）
- 进度：60%
- 计划开始时间：2026-06-21
- 计划结束时间：2026-06-26
- 实际开始时间：2026-06-21
- 负责人：
- 前置依赖：工作流设计器、模型设置模块

### 第一阶段已完成（2026-06-21）

- 后端配置：`ComfyUIConfig`（`comfyui.base-url/workflow-dir/output-dir/timeout-seconds`）。
- 静态资源映射：`StaticResourceConfig` 把 `output-dir` 暴露为 `/api/comfyui-output/**`（实测图片 URL 200 可访问）。
- 建表迁移：`ComfyUISchemaMigration` 启动时幂等建 `comfyui_workflow` 表（不改用户原文件，存变量化副本）。
- 实体/Mapper/Service/Impl：`ComfyUIWorkflow` 全套。
- 核心转换器 `ComfyUIWorkflowConverter`：① 提取可变参数 schema（默认暴露提示词/尺寸/采样参数，**不暴露模型加载类**）；② UI 格式 → ComfyUI API 格式（还原 links 连线引用、处理 seed 的 control_after_generate 占位）。
- 执行客户端 `ComfyUIClient`：`/prompt` 提交 + `/history` 轮询 + `/view` 下载图片到本地输出目录。
- 业务服务 `ComfyUIService`：扫描本地目录、导入工作流、执行出图。
- 接口 `ComfyUIController`：`/comfyui/scan|import|list|get|run`。
- 前端独立画布 `features/comfyui/`：白底点阵画布、紫色渐变工作流节点（参数表单内嵌：提示词文本域 + 尺寸/采样小字段 + 运行按钮）、绿色结果卡片（图片展示+下载）、顶部 icon 工作流条、左侧对话框、路由 `/comfyui`、侧边栏「绘图工作流」入口。
- **实测**：`01-Turbo文生图` 扫描到 11 个工作流 → 导入提取 13 个参数 → 真实出图成功 → 图片 URL 200 可访问。

### 待开发（后续阶段）

- 逐个转化其余工作流（图片编辑、三视图、文生视频等）
- 视频结果展示、批量出图、生成历史记录
- 对话框驱动：自然语言 → 填充工作流参数 → 执行

## 需求背景（用户原始诉求）

1. ComfyUI 模块拥有**独立画布**（节点可通用，但样式单独写）。
2. 后端读取本地 ComfyUI 工作流目录：`F:\ComfyUI-aki-XZG\ComfyUI-aki-XZG\ComfyUI\user\default\workflows\00-应用案例`，并支持将工作流**转化为参数**。
3. 画布风格：**白色背景**、炫酷优雅的节点；**一个工作流作为一个节点**；生成的提示词/图片/视频都展示在画布上；**画布左侧是对话框**，**顶部是节点（小 icon）**。
4. 现有工作流**没有参数**，需要一个目录用于"设置节点和参数"。上传/读取工作流时**不修改原文件**，而是创建一个"变量化的工作流"副本，一个一个工作流来转化。
5. 首个转化目标：`00-应用案例\01-Turbo文生图.json`。
6. 本期就接入 **ComfyUI 真实执行**（默认 `127.0.0.1:8188`，已确认运行中）。

## 关键技术认知

- 本地工作流是 ComfyUI **UI 格式**（`nodes[]` 含 `pos/size/widgets_values/links`），而 ComfyUI 执行接口 `/prompt` 需要 **API 格式**（`{nodeId: {class_type, inputs}}`）。后端需做 **UI → API 格式转换**。
- 可变参数来自各节点的 `widgets_values`（按 `inputs[].widget.name` 顺序对应）。以 `01-Turbo文生图.json` 为例：
  - `PrimitiveStringMultiline`(id=11) → 正面提示词
  - `PrimitiveStringMultiline`(id=12) → 负面提示词
  - `EmptySD3LatentImage`(id=8) → 宽/高/批量
  - `KSampler`(id=5) → 种子/步数/cfg/采样器/调度器/denoise
  - `SaveImage`(id=10) → 文件名前缀
- 执行流程：`POST /prompt`（提交 API 格式 + clientId）→ 轮询 `GET /history/{promptId}` → 从输出节点拿到图片文件名 → `GET /view?filename=...` 取图。

## 功能范围与阶段

### 第一阶段（本期）：文生图端到端打通

- [ ] 后端 ComfyUI 配置：服务地址、本地工作流根目录（写入配置）
- [ ] 扫描/读取本地工作流接口（递归列出 .json，读取单个工作流原文）
- [ ] 工作流参数提取：解析 UI JSON，输出可变参数表（节点→widget→当前值/类型）
- [ ] 变量化工作流存储：`comfyui_workflow` 表（源文件路径、原始 graphJson、参数 schema、参数当前值），**不改原文件**
- [ ] UI→API 格式转换 + 参数回填
- [ ] ComfyUI 执行：`/prompt` 提交 + `/history` 轮询 + `/view` 取图，图片落地/回传
- [ ] 脚本验证 `01-Turbo文生图` 端到端出图
- [ ] 前端独立 ComfyUI 画布：白底 + 优雅节点 + 顶部 icon 节点条 + 左侧对话框 + 结果卡片（图片展示在画布上）

### 后续阶段

- 逐个转化其余工作流（图片编辑、三视图、文生视频等）
- 视频结果展示、批量出图、历史记录
- 对话框驱动：自然语言 → 填充工作流参数 → 执行

## 设计要点

- 模块目录：前端 `features/comfyui/`，后端 `controller/ComfyUIController` + `service` + `integration/comfyui`。
- 节点粒度：**一工作流 = 一画布节点**，节点内部把参数 schema 渲染为表单。
- 不修改用户原始 `.json`：读取后在我方库中创建变量化副本，转化逐个进行。