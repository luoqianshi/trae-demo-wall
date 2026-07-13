# CLAUDE.md

本项目为 Claude Code 提供开发指引。

---

## 一、项目概览

| 属性 | 值 |
|------|-----|
| 名称 | Cryodream 项目模板 |
| 类型 | 通用前后端开发脚手架 |
| 前端 | React 19 + TanStack Router/Query + shadcn/ui + Tailwind v4 |
| 后端 | Spring Boot 2.7.2 + MyBatis-Plus + MySQL 8 + JWT |

### 目录结构

```
<project-root>/
├── .claude/skills/ai-dev-assistant/    # 项目技能
├── client/                              # React 前端
├── service/                             # Spring Boot 后端
├── docs/
│   ├── 03-模板中心/templates/           # 开发模板（单一来源）
│   └── 04-开发计划/                     # 进度与架构
└── CLAUDE.md                            # 本文件
```

---

## 二、技能调用

### 项目级技能（默认）

本项目专属技能 `.claude/skills/ai-dev-assistant/`，在项目内工作时自动调用。

```
用户："我要开发用户管理模块"
AI：自动读取模板 → 输出开发计划
```

---

## 三、模块开发流程

### 步骤概览

```
1. 需求理解 → 2. 选模板组合 → 3. 数据库设计 → 4. 后端开发 → 5. 前端开发 → 6. 联调
```

### 模板按需组合

| 开发场景 | 需要读取 | 跳过 |
|----------|----------|------|
| 前端列表页 | common-api + frontend-base + frontend-table | backend-*、frontend-form |
| 前端表单弹窗 | common-api + frontend-base + frontend-form | backend-*、frontend-table |
| 后端 CRUD | common-api + backend-base + backend-crud + db-schema | frontend-* |
| 全栈新模块 | 全部模板 | — |

### 详细流程

#### 1. 需求理解

```
用户："我要开发帖子管理模块"
AI：
- 理解需求：帖子 CRUD + 标签
- 确认范围：前端列表页 + 表单弹窗 + 后端 CRUD
- 选择模板：db-schema + backend-crud + frontend-table + frontend-form
```

#### 2. 数据库设计

```
AI：读取 docs/03-模板中心/templates/db-schema.md
输出：
  CREATE TABLE `post` (
    `id` BIGINT NOT NULL COMMENT '主键',
    `title` VARCHAR(256) NOT NULL COMMENT '标题',
    `content` TEXT COMMENT '内容',
    `user_id` BIGINT NOT NULL COMMENT '用户 id',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_delete` TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
  );
用户确认 → 执行建表
```

#### 3. 后端开发

```
AI：读取 docs/03-模板中心/templates/backend-base.md + backend-crud.md
生成：
  - Entity: Post.java
  - Mapper: PostMapper.java + PostMapper.xml
  - Service: PostService.java + PostServiceImpl.java
  - Controller: PostController.java
  - DTO: PostAddRequest/PostUpdateRequest/PostQueryRequest
  - VO: PostVO.java
```

#### 4. 前端开发

```
AI：读取 docs/03-模板中心/templates/frontend-base.md + frontend-table.md + frontend-form.md
生成：
  - Schema: features/posts/data/schema.ts
  - API: features/posts/api.ts
  - 路由: routes/_authenticated/posts/index.tsx
  - 表格: features/posts/components/posts-table.tsx + posts-columns.tsx
  - 弹窗: features/posts/components/posts-provider.tsx + posts-dialogs.tsx + posts-action-dialog.tsx
  - i18n: locales/zh.json + en.json
  - 导航: sidebar-data.ts
```

#### 5. 联调测试

```
AI：
- 启动后端：java -jar target/*.jar --server.port=8111
- 启动前端：cd client && npm run dev
- 验证：列表 → 新增 → 编辑 → 删除
```

---

## 四、关键约定

### 前后端协作

| 约定 | 前端 | 后端 |
|------|------|------|
| ID 类型 | `string` | `Long`（JsonConfig 转 String） |
| 统一响应 | `ApiResponse<T>` | `BaseResponse<T>` |
| 认证头 | `Authorization: Bearer {token}` | Session + JWT |
| 请求方式 | 查询也用 POST | `@PostMapping` |

### 错误码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 40000 | 参数错误 |
| 40100 | 未登录 |
| 40101 | 无权限 |
| 40400 | 数据不存在 |
| 50000 | 系统错误 |

### 端口

| 服务 | 端口 |
|------|------|
| 后端 Spring Boot | 8111 (context-path `/api`) |
| 前端 Vite (electron dev) | 49217 (strictPort，代理 `/api` → 8111) |
| MySQL | 3306 |
| Redis | 6379 |

### 通知（Toast）规范

**全局 Sonner Toaster**，位置**固定右上角**，配置在 [`client/src/components/ui/sonner.tsx`](client/src/components/ui/sonner.tsx)，挂载点 [`client/src/routes/__root.tsx`](client/src/routes/__root.tsx)。**禁止**在业务模块中重新挂载 `<Toaster />`。

固定配置：`position='top-right'` + `richColors` + `closeButton` + `expand` + `duration=6000`。

调用时遵循：

| 场景 | API | 建议 duration |
|------|-----|--------------|
| 成功（简单） | `toast.success(t('...'))` | 默认 6s |
| 成功（有 warning） | `toast.warning(title, { description, duration: 15000 })` | 15s |
| 业务错误 | `toast.error(title, { description: 'code=X\n...', duration: 10000 })` | 10s |
| 关键错误（含诊断） | `toast.error(msg, { duration: 20000 })` | 20s |
| 长任务 | `const id = toast.loading(...)`，完成后 `toast.dismiss(id)` | — |

**规则**：
1. 所有文案必须走 `t()`（i18n）
2. 抛 `error`/`warning` 的同时用 `[<module>]` 前缀 `console.error/warn` 写完整对象
3. 错误码/详情放 `description`，不要挤在标题
4. 完整规范：[docs/03-模板中心/templates/frontend-base.md §六 Toast 通知规范](docs/03-模板中心/templates/frontend-base.md)

---

## 五、模板索引

所有模板位于 `docs/03-模板中心/templates/`：

| 模板 | 内容 |
|------|------|
| [common-api.md](docs/03-模板中心/templates/common-api.md) | 前后端协作约定 |
| [frontend-base.md](docs/03-模板中心/templates/frontend-base.md) | 前端目录/技术栈/规范 / **Toast 通知规范** |
| [frontend-table.md](docs/03-模板中心/templates/frontend-table.md) | 数据表组件 |
| [frontend-form.md](docs/03-模板中心/templates/frontend-form.md) | 表单弹窗 |
| [backend-base.md](docs/03-模板中心/templates/backend-base.md) | 后端包结构/分层 |
| [backend-crud.md](docs/03-模板中心/templates/backend-crud.md) | CRUD 模板 |
| [db-schema.md](docs/03-模板中心/templates/db-schema.md) | 建表规范 |

---

## 六、常用命令

### 启动项目（统一用 electron）

```bash
cd client && npm run dev:electron
```

**规则**：项目启动必须使用 `npm run dev:electron`，由 electron 的 sidecar 自动启动后端（mvnw spring-boot:run）并注入工作区路径（`comfyui.output-dir` / `input-cache-dir` / `workspace.path`，从 `workspace-config.json` 读取）。

**严禁**手动用 `mvnw spring-boot:run` 单独启动后端——否则工作区路径不注入，会导致画布图片等静态资源加载失败（后端会用默认的 `./uploads/comfyui` 而非工作区的 `canvas` 目录）。

端口分配：
- 前端 Vite：49217（strictPort，代理 `/api` → `localhost:8111`）
- 后端 Spring Boot：8111（context-path `/api`）

### 其他命令

```bash
# 构建
cd client && npm run build           # 前端
cd service && ./mvnw package          # 后端
java -jar target/*.jar               # 运行打包产物（生产模式）

# 文档
npm run docs:dev                     # 预览模板
```

---

## 七、PowerShell 中文编码问题（重要）

**问题**：Windows PowerShell 的 `Invoke-RestMethod` / `ConvertTo-Json` 默认使用系统编码（GBK），向 API 发送含中文的 JSON 时，中文会变成 `???`。这会导致：
- 工作流图 JSON 中的中文节点名/描述/模板内容全部损坏
- 歌词内容变成 `???`
- 数据库中存储乱码数据

**正确做法**：所有含中文的 API 请求必须通过 **Node.js** 发送（Node.js 默认 UTF-8）：

```javascript
// 1. 把数据写成 .js 文件
const http = require('http');
const body = JSON.stringify({ /* 含中文的数据 */ });
const req = http.request({
  hostname: 'localhost', port: 8111,
  path: '/api/xxx', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>console.log(d)); });
req.write(body); req.end();

// 2. 执行：node tmp_fix.js
```

**禁止**：`Invoke-RestMethod -Body (含中文的JSON)` — 100% 会产生 `???`

---

## 八、工作流系统架构

### 核心理念
工作流是所有 AI 功能的执行引擎。每种 AI 能力 = 一个专用工作流 + 专用节点执行器。

### 节点执行器注册
1. 后端：实现 `FlowNodeExecutor` 接口，加 `@Component`，在 `supports()` 方法中匹配 `nodeType`
2. 前端：在 `client/src/features/flow/config/nodeTemplates.ts` 注册节点模板
3. 节点数据流：`FlowExecutionContext.currentText` 在节点间传递文本

### 现有节点类型
| 节点 | 类型标识 | 用途 |
|------|---------|------|
| 聊天输入 | `ChatInput` | 获取用户消息（简单对话场景） |
| 对象输入 | `ObjectInput` | 解析 JSON 为独立变量，存入 context.variables（结构化参数场景） |
| 提示模板 | `PromptTemplate` | 可复用提示词，支持 {{变量名}} 从 context.variables 引用 |
| 语言模型 | `LanguageModel` | 调用 LLM |
| 聊天输出 | `ChatOutput` | 显示结果 |
| 格式检验器 | `FormatValidator` | LLM 输出格式校验（支持 json_candidates/json_object/json_array/plain_list） |
| Agent | `Agent` | 智能体节点 |
| 知识库写入 | `KnowledgeBaseWriter` | 知识入库 |

### 变量传递机制
- **ObjectInput** 解析 JSON 输入后，将每个字段存入 `context.setVariable(key, value)`
- **PromptTemplate** 解析 `{{变量名}}` 时按优先级查找：1) 上游连线注入 2) `context.variables` 3) 节点配置 4) 兜底值
- **LanguageModel** 输入优先级：1) `input_value` 字段（连线注入）2) `currentText` 3) `inputValue` 4) 默认触发文本

### 入口节点推断
FlowGraphExecutor 按以下顺序推断入口节点：
1. 指定的 `startNodeId`
2. ObjectInput 类型节点
3. ChatInput 类型节点
4. 入度为 0 的节点

### AI 音乐模块工作流
- 工作流 ID：`c53cd46a867ef38b71de14cd778b130c`
- 流程：ObjectInput → PromptTemplate(系统消息) → LanguageModel → FormatValidator(json_candidates) → ChatOutput
- ObjectInput 接收 JSON：`{"selected_text":"...","instruction":"...","full_lyrics":"..."}`
- PromptTemplate 使用 `{{selected_text}}`、`{{instruction}}`、`{{full_lyrics}}` 变量
- 前端通过 `patchValidatorNode()` 在运行时注入 `context_text` 到 FormatValidator 节点

### 重要 API 区分
- `POST /api/workflow/update`：只更新元数据（name/description/tags），**不更新 graphJson**
- `POST /api/workflow/saveGraph`：更新 graphJson（节点和连线数据）

---

## 九、歌词数据结构

### 存储格式（双格式体系）

| 字段 | 格式 | 原因 |
|------|------|------|
| `ai_music_project.current_lyric` | JSON 行结构 | 给 LyricCanvas 用，按行 ID 定位选区 |
| `ai_music_lyric_version.content` | 纯文本（`\n` 分隔） | 给版本 diff 对比用 |

**项目 current_lyric** JSON 行结构示例：
```json
{"lines":[{"id":1,"text":"[Verse 1]"},{"id":2,"text":"夜色如水漫过心头"},{"id":3,"text":"潮起潮落 思念难收"}]}
```

**版本 content** 纯文本示例：
```
[Verse 1]
夜色如水漫过心头
潮起潮落 思念难收
```

### 设计原因
- 按行 ID 定位选区，避免全局字符偏移计算错误
- AI 替换用 `replaceLineText(data, lineId, start, end, newText)` 精准替换
- 版本 content 存纯文本，便于 `diff` 包做 Myers 算法行级 diff
- 前端 `parseLyricData()` 兼容旧纯文本格式（`\n` 分隔）

### 选区模型（支持多行选区）
```typescript
interface LyricSelection {
  lineId: number      // 起始行 ID
  startInLine: number // 行内起始偏移
  endInLine: number   // 行内结束偏移（多行选区时 = 起始行文本长度）
  text: string        // 选中的文字（可含 \n，表示多行）
}
```

### 版本编号
- 大版本：V1、V2（手动归档，显示为 V1.00、V2.00 存储）
- 小版本：V1.01、V1.02（AI 采纳候选 / 手动编辑）

### 版本 diff 对比
- 使用 `diff`（jsdiff）包的 `diffLines`，基于 Myers 算法（和 Git 相同的 LCS）
- 版本总览右栏始终显示选中版（或最新版）的完整歌词，差异行用颜色标注：
  - 红色删除线 = 被删除的行
  - 黄色 = 更换的行（旧行红色删除线 → 新行黄色）
  - 绿色 = 新增的行
- 歌词编辑器 LyricCanvas 用 `mapCurrentLinesToDiff` 按行索引映射 diff 状态

---

## 十、数据安全约定

**禁止直接读取或修改数据库中的用户业务数据**，包括但不限于：
- `ai_music_project`、`ai_music_lyric_version` 表中的歌词、版本内容
- `workflow` 表中的 `graph_json`
- 任何包含用户实际内容的字段

调试时需要确认数据状态，应**询问用户**而非直接查询数据库。如果问题可以通过代码逻辑分析解决，优先分析代码而非查看数据。