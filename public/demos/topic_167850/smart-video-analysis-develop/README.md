# 多模态视频智能解析与创作辅助系统

基于 AI 的多模态视频智能解析与创作辅助平台，涵盖视频上传解析、多视频融合创作、以图搜视频检索、帧级画面创作、音频创作、在线剪辑等核心功能模块，提供视频分析 → 创作 → 剪辑一站式能力。

## 功能模块

| 模块 | 说明 |
|------|------|
| 视频上传解析 | 上传视频（链接输入 + 文件拖拽），AI 自动进行音视频分离、逐帧画面识别、文案提取 |
| 解析结果详情 | 视频预览播放、音频转写文案（带时间轴）、逐帧画面分析（关键帧 + 场景标签 + 提示词）、文案/提示词导出 |
| 多视频融合创作 | 选择多个已解析视频，AI 智能融合创作新内容方案（脚本取长补短 / 镜头风格融合 / 内容整合重构） |
| 以图搜视频检索 | 上传场景照片或人脸图片，在海量视频中检索匹配片段，展示相似度、匹配时间点、视频标题 |
| 帧级创作工作台 | 对接 ComfyUI，支持单帧重绘、首尾帧融合生成、片段视频重制、多片段融合 |
| 音频创作工作台 | 对接 TTS/歌声合成，支持人声克隆入库、片段文案重配音、歌声音色转换 |
| 在线剪辑工作台 | 专业三段式布局，多轨道时间轴编辑，素材联动管理，AI 辅助分析，导出成片 |

## 技术栈

**后端:** Java 17 + Spring Boot 3.2 + MyBatis-Plus + MySQL 8.0 + Redis 7.x + MinIO

**前端:** Vue 3 + Vite 5 + Element Plus + Pinia + Vue Router 4 + Axios

**AI 服务:** ComfyUI / Whisper / GPT-SoVITS / RVC（通过 HTTP API 对接）

**部署:** Docker Compose（开发环境一键启动中间件，生产环境全栈容器化部署）

详细技术选型参见 [技术选型方案.md](./技术选型方案.md)。

## 快速开始

### 环境要求

- Docker Desktop（含 docker compose）
- JDK 17（已配置 JAVA_HOME）
- Maven 3.9+（已配置 PATH）
- Node.js + npm（已配置 PATH）

### 启动中间件

```bash
docker compose -f docker-compose.dev.yml up -d
```

启动后本地服务：

| 服务 | 地址 | 账号 |
|------|------|------|
| MySQL | localhost:3306 | root / root123 |
| Redis | localhost:6379 | 密码 redis123 |
| MinIO API | localhost:9000 | minioadmin / minioadmin123 |
| MinIO Console | localhost:9001 | 同上 |

### 启动后端

```bash
cd smart-video-analysis-server
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

API 文档: http://localhost:8080/doc.html

### 启动前端

```bash
cd smart-video-analysis-web
npm install
npm run dev
```

访问: http://localhost:5173

## 项目结构

```
smart-video-analysis/
├── docker-compose.dev.yml            # 开发环境中间件编排
├── docker-compose.prod.yml           # 生产环境全栈编排
├── smart-video-analysis-server/      # 后端 Spring Boot 工程
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/sva/
│       ├── config/                   # MinIO、Redis、Security、CORS 配置
│       ├── common/                   # 统一响应体、异常处理、枚举、工具类
│       ├── controller/               # 接口控制器
│       ├── service/                  # 业务逻辑层
│       │   └── ai/                   # AI 服务客户端 (ComfyUI、Whisper、TTS、RVC)
│       ├── mapper/                   # MyBatis-Plus Mapper
│       ├── entity/                   # 数据库实体
│       ├── dto/                      # 请求/响应 DTO
│       └── websocket/                # WebSocket 任务进度推送
├── smart-video-analysis-web/         # 前端 Vue 3 工程
│   ├── src/
│   │   ├── api/                      # Axios 请求封装（按模块拆分）
│   │   ├── views/                    # 7 个功能页面视图
│   │   ├── components/               # 公共组件（播放器、波形、时间轴等）
│   │   ├── stores/                   # Pinia 状态管理
│   │   ├── router/                   # 路由配置
│   │   └── layouts/                  # 全局布局
│   └── vite.config.ts
├── pages/                            # UI 设计原型（7 个高保真 HTML 页面）
├── index.html                        # 设计原型入口页
├── colors_and_type.css               # 品牌设计变量
├── 技术选型方案.md                    # 详细技术选型文档
├── 开发计划.md                        # 12 周开发计划
└── AI_PROMPT_TEMPLATE.md             # AI 编程助手提示词模板
```

## 设计原型

项目包含 7 个高保真 HTML 原型页面，可直接在浏览器中打开查看：

- 打开 `index.html` 查看系统总览和功能导航
- 进入 `pages/` 目录查看各功能页面的详细设计

## 开发计划

项目分 9 个 Phase，共 12 周完成：

| 阶段 | 名称 | 周期 |
|------|------|------|
| Phase 0 | 项目脚手架搭建 | 第 1 周 |
| Phase 1 | 用户系统 + 基础框架 | 第 2 周 |
| Phase 2 | 视频上传与解析 | 第 3–4 周 |
| Phase 3 | 解析结果 + 以图搜视频 | 第 5 周 |
| Phase 4 | 多视频融合创作 | 第 6–7 周 |
| Phase 5 | 帧级创作工作台 | 第 8 周 |
| Phase 6 | 音频创作工作台 | 第 9 周 |
| Phase 7 | 在线剪辑工作台 | 第 10–11 周 |
| Phase 8 | 联调测试 + 优化部署 | 第 12 周 |

每个 Phase 含详细的前后端任务清单和验收标准，参见 [开发计划.md](./开发计划.md)。

## 文档索引

| 文档 | 说明 |
|------|------|
| [技术选型方案.md](./技术选型方案.md) | 技术栈详解、数据库设计、Docker 配置、后端工程结构、关键流程设计 |
| [开发计划.md](./开发计划.md) | 9 个 Phase 的详细任务拆分、前后端分工、验收标准、里程碑 |
| [AI_PROMPT_TEMPLATE.md](./AI_PROMPT_TEMPLATE.md) | AI 编程助手项目上下文提示词模板，用于快速同步项目信息 |

## License

MIT
