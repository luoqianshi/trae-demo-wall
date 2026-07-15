# AI 编程助手项目上下文提示词模板

> 将本文件内容作为 System Prompt 或项目上下文提供给 AI 编程助手（如 Cursor、GitHub Copilot Chat、Claude、ChatGPT 等），使其快速理解项目的完整背景、设计需求、技术选型、开发计划和文件结构。

---

## 模板使用方式

在对话中将以下内容复制给 AI 编程助手，或保存为项目根目录的 `.cursorrules` / `.github/copilot-instructions.md` / `CLAUDE.md` 文件：

---

# 项目上下文

## 项目名称
多模态视频智能解析与创作辅助系统 (Smart Video Analysis, 简称 SVA)

## 项目概述
基于 AI 的多模态视频智能解析与创作辅助平台。用户可上传视频或粘贴链接，系统自动进行音视频分离、逐帧画面识别、文案提取；支持多视频融合创作方案生成、以图搜视频检索、基于 ComfyUI 的帧级画面创作、基于 TTS/歌声合成的音频创作，以及专业多轨道在线视频剪辑与导出。

## 核心功能模块 (7 个页面)
1. **视频上传解析页** — 上传视频（链接输入 + 文件拖拽）、批量上传、触发 AI 智能解析
2. **解析结果详情页** — 视频预览播放、音频转写文案（带时间轴）、逐帧画面分析（关键帧 + 场景标签 + 提示词）、导出文案/提示词
3. **多视频融合创作页** — 选择多个已解析视频、选择融合方向（脚本取长补短/镜头风格融合/内容整合重构）、生成融合创作方案（脚本大纲 + 镜头建议）
4. **以图搜视频检索页** — 上传场景照片或人脸图片、AI 检索匹配视频片段、展示相似度/匹配时间点/视频标题
5. **帧级创作工作台页** — ComfyUI 服务配置、视频时间轴与帧列表（单帧/首尾帧/时间段选择）、生成模式（单帧重绘/首尾帧融合/片段重制/多片段融合）、参数设置、结果预览
6. **音频创作工作台页** — TTS/歌声合成服务配置、音频波形时间轴（选取片段）、生成模式（人声克隆入库/文案重配音/歌声音色转换）、音色选择、参数调节（语速/语调/情感）、生成音频列表与播放
7. **在线剪辑工作台页** — 专业三段式布局：左侧素材库（按类型分类，自动同步所有页面生成的素材）、中间视频预览 + 多轨道时间轴（视频轨/音频轨分层）、右侧属性面板（片段时长/音量/转场效果）、AI 一键分析、导出成片

---

## 技术选型

### 后端
| 组件 | 选型 | 版本 |
|------|------|------|
| 语言 | Java | 17 (LTS) |
| 框架 | Spring Boot | 3.2.x |
| ORM | MyBatis-Plus | 3.5.x |
| 数据库 | MySQL | 8.0 |
| 缓存/队列 | Redis | 7.x (Spring Data Redis + Redisson + Redis Stream) |
| 对象存储 | MinIO | latest (Java SDK + 预签名 URL) |
| 构建 | Maven | 3.9+ |
| 安全 | Spring Security + JWT | — |
| API 文档 | Knife4j | — |
| 数据库迁移 | Flyway | — |
| 实时通信 | WebSocket (Spring WebSocket) | — |

### 前端
| 组件 | 选型 | 版本 |
|------|------|------|
| 框架 | Vue 3 (Composition API + `<script setup>`) | 3.4+ |
| 构建 | Vite | 5.x |
| UI 组件 | Element Plus | latest |
| 路由 | Vue Router 4 | — |
| 状态管理 | Pinia | — |
| HTTP | Axios | — |
| 视频播放 | Video.js / xgplayer | — |
| 音频波形 | Wavesurfer.js | — |
| CSS 方案 | UnoCSS / Tailwind CSS | — |

### AI 服务对接 (HTTP API，不内置模型)
| 服务 | 用途 | 部署 |
|------|------|------|
| ComfyUI | 帧级画面生成、重绘、插帧、风格迁移 | Docker 容器 |
| Whisper | 语音转文字、音频转写 | Docker 容器 (可选 GPU) |
| GPT-SoVITS | TTS 语音合成、人声克隆 | Docker 容器 |
| RVC | 歌声音色转换 | Docker 容器 |

### 部署
| 组件 | 选型 |
|------|------|
| 容器编排 | Docker Compose |
| 开发环境 | docker-compose.dev.yml (MySQL + Redis + MinIO) |
| 生产环境 | docker-compose.prod.yml (全栈 + 中间件 + AI 服务) |
| 反向代理 | Nginx (前端静态 + API 代理) |
| 静态资源 | MinIO (视频/图片/音频分 Bucket 存储) |

---

## 本地开发环境

### 已安装工具
- **操作系统**: Windows
- **Docker Desktop**: 已安装，docker 和 docker compose 均可用
- **JDK**: 17，已配置 JAVA_HOME
- **Maven**: 已安装，已配置 M2_HOME 和 PATH
- **Node.js + npm**: 已安装，已配置 PATH

### 开发环境启动方式
使用 `docker-compose.dev.yml` 先启动中间件：
```bash
docker compose -f docker-compose.dev.yml up -d
```
启动后本地可用服务：
- MySQL: `localhost:3306` (root / root123, 数据库: smart_video_analysis)
- Redis: `localhost:6379` (密码: redis123)
- MinIO API: `localhost:9000` (minioadmin / minioadmin123)
- MinIO Console: `localhost:9001`

后端和前端在本地 IDE 中直接运行，连接上述 Docker 中的中间件。

### 端口规划
| 服务 | 端口 |
|------|------|
| 前端 (Vite dev) | 5173 |
| 后端 (Spring Boot) | 8080 |
| MySQL | 3306 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |
| ComfyUI | 8188 |
| Whisper | 9002 |

---

## 开发计划

项目分 9 个 Phase，每 Phase 有明确的任务清单和验收标准：

| 阶段 | 名称 | 周期 | 核心交付 |
|------|------|------|---------|
| Phase 0 | 项目脚手架搭建 | 第 1 周 | 后端 Spring Boot 工程 + 前端 Vue 3 工程 + Docker Compose 中间件 + Flyway 初始化 + MinIO/Redis 配置 |
| Phase 1 | 用户系统 + 基础框架 | 第 2 周 | 注册/登录/JWT 认证/项目 CRUD/MinIO 文件上传 + 前端登录页/路由守卫/布局组件 |
| Phase 2 | 视频上传与解析 | 第 3–4 周 | MinIO 预签名上传/Whisper 转写/FFmpeg 关键帧提取/Redis Stream 异步任务/WebSocket 进度推送 |
| Phase 3 | 解析结果 + 以图搜视频 | 第 5 周 | 结果展示(转写+关键帧)/文案导出(TXT/SRT/JSON)/图片上传检索/向量匹配 |
| Phase 4 | 多视频融合创作 | 第 6–7 周 | 多视频选择/三种融合模式(AI生成方案)/脚本大纲+镜头建议展示 |
| Phase 5 | 帧级创作工作台 | 第 8 周 | ComfyUI 对接/四种生成模式(单帧重绘/首尾融合/片段重制/多片段融合)/参数设置 |
| Phase 6 | 音频创作工作台 | 第 9 周 | TTS/RVC 对接/三种模式(人声克隆/重配音/音色转换)/音色选择/波形时间轴 |
| Phase 7 | 在线剪辑工作台 | 第 10–11 周 | 三段式布局/多轨道时间轴/素材联动/属性面板/AI分析/FFmpeg导出成片 |
| Phase 8 | 联调测试 + 优化部署 | 第 12 周 | 全流程联调/性能优化/Dockerfile + docker-compose.prod.yml 生产部署 |

---

## 项目目录结构 (当前与规划)

### 当前已有文件
```
smart-video-analysis/                    ← 项目根目录
├── index.html                           ← 前端设计原型入口页 (浏览器直接打开)
├── colors_and_type.css                  ← 品牌设计 CSS 变量
├── pages/                               ← 设计原型页面 (7个HTML高保真原型)
│   ├── video-upload.html                ← 视频上传解析页
│   ├── analysis-result.html             ← 解析结果详情页
│   ├── multi-fusion.html                ← 多视频融合创作页
│   ├── image-search.html                ← 以图搜视频检索页
│   ├── frame-workspace.html             ← 帧级创作工作台页
│   ├── audio-workspace.html             ← 音频创作工作台页
│   └── online-editor.html               ← 在线剪辑工作台页
├── partials/project-shell.html          ← 共享导航栏 HTML 片段
├── smart-video-analysis.design          ← 设计工程文件 (Trae Design Canvas)
├── 技术选型方案.md                       ← 技术选型详细文档
└── 开发计划.md                           ← 12周开发计划详细文档
```

### 规划中的工程结构 (待创建)
```
smart-video-analysis/
├── docker-compose.dev.yml               ← 开发环境中间件编排
├── docker-compose.prod.yml              ← 生产环境全栈编排
├── docker/                              ← Docker 相关配置
│   ├── mysql/init/                      ← MySQL 初始化 SQL
│   └── mysql/conf/                      ← MySQL 配置文件
│
├── smart-video-analysis-server/         ← 后端 Spring Boot 工程
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/
│       ├── java/com/sva/
│       │   ├── SvaApplication.java
│       │   ├── config/                  ← 配置类 (Minio, Redis, Security, CORS)
│       │   ├── common/                  ← 统一响应体、异常处理、枚举、工具类
│       │   │   ├── result/R.java
│       │   │   ├── exception/GlobalExceptionHandler.java
│       │   │   └── enums/TaskStatus.java
│       │   ├── controller/              ← 控制器层
│       │   │   ├── AuthController.java
│       │   │   ├── UserController.java
│       │   │   ├── VideoController.java
│       │   │   ├── FusionController.java
│       │   │   ├── SearchController.java
│       │   │   ├── FrameController.java
│       │   │   ├── AudioController.java
│       │   │   ├── EditorController.java
│       │   │   ├── FileController.java
│       │   │   └── AiServiceController.java
│       │   ├── service/                 ← 服务层
│       │   │   ├── VideoService.java
│       │   │   ├── FusionService.java
│       │   │   ├── ImageSearchService.java
│       │   │   ├── FrameGenerationService.java
│       │   │   ├── AudioCreationService.java
│       │   │   ├── EditorService.java
│       │   │   ├── ExportService.java
│       │   │   ├── TaskQueueService.java
│       │   │   └── ai/                   ← AI 服务客户端
│       │   │       ├── AiServiceClient.java
│       │   │       ├── ComfyUiClient.java
│       │   │       ├── WhisperClient.java
│       │   │       ├── TtsClient.java
│       │   │       └── RvcClient.java
│       │   ├── mapper/                  ← MyBatis-Plus Mapper
│       │   ├── entity/                  ← 数据库实体
│       │   ├── dto/                     ← 请求/响应 DTO
│       │   └── websocket/               ← WebSocket 处理器
│       │       └── TaskProgressHandler.java
│       └── resources/
│           ├── application.yml
│           ├── application-dev.yml
│           ├── application-prod.yml
│           └── db/migration/            ← Flyway SQL 迁移脚本
│               ├── V1__init_schema.sql
│               ├── V2__user_and_project.sql
│               └── V3__video_tables.sql
│
├── smart-video-analysis-web/            ← 前端 Vue 3 工程
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── nginx.conf                       ← Nginx 配置 (生产部署用)
│   └── src/
│       ├── api/                         ← API 请求模块
│       │   ├── request.ts               ← Axios 封装
│       │   ├── auth.ts
│       │   ├── video.ts
│       │   ├── fusion.ts
│       │   ├── search.ts
│       │   ├── frame.ts
│       │   ├── audio.ts
│       │   └── editor.ts
│       ├── views/                       ← 页面视图
│       │   ├── Login.vue
│       │   ├── VideoUpload.vue
│       │   ├── AnalysisResult.vue
│       │   ├── MultiFusion.vue
│       │   ├── ImageSearch.vue
│       │   ├── FrameWorkspace.vue
│       │   ├── AudioWorkspace.vue
│       │   └── OnlineEditor.vue
│       ├── components/                  ← 公共组件
│       │   ├── VideoPlayer.vue
│       │   ├── AudioWaveform.vue
│       │   ├── MultiTrackTimeline.vue
│       │   ├── TrackClip.vue
│       │   ├── FileUploader.vue
│       │   ├── VideoTimeline.vue
│       │   ├── PropertyPanel.vue
│       │   ├── EditorPreview.vue
│       │   ├── AiServiceConfig.vue
│       │   └── AppNavbar.vue
│       ├── stores/                      ← Pinia 状态管理
│       ├── router/                      ← Vue Router 路由
│       ├── layouts/                     ← 全局布局
│       ├── styles/                      ← 全局样式
│       └── utils/                       ← 工具函数
│
├── 技术选型方案.md                       ← (已有) 详细技术选型文档
├── 开发计划.md                           ← (已有) 详细开发计划文档
└── AI_PROMPT_TEMPLATE.md                ← (本文件) AI 提示词模板
```

---

## 文件阅读导向

当 AI 助手需要了解项目时，按以下优先级阅读文件：

### 了解项目整体 (必读)
1. **`AI_PROMPT_TEMPLATE.md`** (本文件) — 项目概述、技术栈、开发计划总览
2. **`技术选型方案.md`** — 详细技术选型、数据库表设计、Docker Compose 配置、后端工程结构、配置文件示例、关键流程设计
3. **`开发计划.md`** — 9 个 Phase 的详细任务清单、每个任务的前后端拆分、验收标准、关键技术点
4. **`开发日志_20260712.md`** — 2026年7月12日开发日志，详细记录了 Phase 1~5 的开发过程、遇到的问题及解决方案、当前进度

### 了解 UI 设计需求 (开发前端时必读)
4. **`index.html`** — 设计原型入口页，展示 7 个功能模块的概览和系统架构流程图
5. **`pages/video-upload.html`** — 视频上传解析页的完整 HTML 原型（参照实现前端页面）
6. **`pages/analysis-result.html`** — 解析结果详情页原型
7. **`pages/multi-fusion.html`** — 多视频融合创作页原型
8. **`pages/image-search.html`** — 以图搜视频检索页原型
9. **`pages/frame-workspace.html`** — 帧级创作工作台页原型
10. **`pages/audio-workspace.html`** — 音频创作工作台页原型
11. **`pages/online-editor.html`** — 在线剪辑工作台页原型（深色主题专业编辑器）
12. **`colors_and_type.css`** — 品牌设计变量（颜色、字体、间距、圆角、阴影），前端需复用这些 CSS 变量

### 了解具体技术细节 (需要时查阅)
- 数据库表设计 → 阅读 `技术选型方案.md` 的 "五、数据库设计要点" 章节
- Docker Compose 配置 → 阅读 `技术选型方案.md` 的 "六、Docker Compose 编排" 章节
- 后端包结构 → 阅读 `技术选型方案.md` 的 "七、后端工程结构" 章节
- 配置文件示例 → 阅读 `技术选型方案.md` 的 "7.1 配置文件要点" 章节
- 当前 Phase 的详细任务 → 阅读 `开发计划.md` 对应 Phase 章节
- 异步任务流程 → 阅读 `技术选型方案.md` 的 "八、关键流程设计" 章节
- 时间轴数据结构 → 阅读 `开发计划.md` 的 "7.3 关键技术点" 章节

---

## 开发规范

### 后端
- 包名: `com.sva`
- Controller 层: 只做参数校验和路由转发，业务逻辑全部在 Service 层
- 统一返回体: `R<T>` (code, message, data)
- MyBatis-Plus: 自动填充 createTime/updateTime，逻辑删除 isDeleted，分页 PaginationInnerInterceptor
- 配置项: 通过 `@ConfigurationProperties` 管理，不硬编码
- API 路径: RESTful 风格，`/api/资源名` 格式
- 异常处理: `@RestControllerAdvice` 全局捕获

### 前端
- Vue 3 Composition API + `<script setup>` 语法
- 组件命名: PascalCase
- API 按模块拆分文件，函数名与后端接口对应
- Store 按业务域拆分
- 样式: UnoCSS / Tailwind CSS 原子化
- 用户提示: ElMessage / ElNotification

### Git 分支
- `main` → 稳定发布
- `develop` → 开发主分支
- `feature/phaseN-xxx` → 功能分支

---

## 快速启动检查清单

在开始任何 Phase 的开发之前，确认以下环境就绪：

```bash
# 1. Docker 中间件
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps   # 确认全部 healthy

# 2. 后端
cd smart-video-analysis-server
mvn clean compile                             # 编译通过
mvn spring-boot:run -Dspring-boot.run.profiles=dev  # 启动成功
# 访问 http://localhost:8080/doc.html 可见 API 文档

# 3. 前端
cd smart-video-analysis-web
npm install
npm run dev                                   # 启动成功
# 访问 http://localhost:5173 可见前端页面

# 4. MinIO Console
# 访问 http://localhost:9001 确认 Bucket 已创建
```

---

## 当前开发进度

**当前阶段: Phase 5 已完成（帧级创作工作台）**

已完成:
- [x] Phase 0: 项目脚手架搭建 — 后端 Spring Boot 工程 + 前端 Vue 3 工程 + Docker Compose 中间件 + Flyway 初始化 + MinIO/Redis 配置
- [x] Phase 1: 用户系统 + 基础框架 — 注册/登录/JWT 认证/项目 CRUD/MinIO 文件上传 + 前端登录页/路由守卫/布局组件
- [x] Phase 2: 视频上传与解析 — MinIO 预签名上传/FFmpeg 关键帧提取/异步任务/WebSocket 进度推送
- [x] Phase 3: 解析结果 + 以图搜视频 — 结果展示(转写+关键帧)/文案导出(TXT/SRT/JSON)/图片上传检索
- [x] Phase 4: 多视频融合创作 — 多视频选择/三种融合模式(脚本取长补短/镜头风格融合/内容整合重构)/脚本大纲+镜头建议展示
- [x] Phase 5: 帧级创作工作台 — ComfyUI 对接/四种生成模式(单帧重绘/首尾融合/片段重制/多片段融合)/参数设置

待开发:
- [ ] Phase 6: 音频创作工作台 — TTS/RVC 对接/三种模式(人声克隆/重配音/音色转换)/音色选择/波形时间轴
- [ ] Phase 7: 在线剪辑工作台 — 三段式布局/多轨道时间轴/素材联动/属性面板/AI分析/FFmpeg导出成片
- [ ] Phase 8: 联调测试 + 优化部署 — 全流程联调/性能优化/Dockerfile + docker-compose.prod.yml 生产部署

**关键问题记录**: 详见 `开发日志_20260712.md` 中的"问题与解决方案"章节

请根据 `开发计划.md` 中对应 Phase 的任务清单开始工作。每个子任务都有明确的产出物和验收标准。
