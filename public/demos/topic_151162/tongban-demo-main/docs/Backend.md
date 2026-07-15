# 瞳伴 - AI视障出行助手 后端开发文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 产品名称 | 瞳伴 - AI视障出行助手 |
| 文档版本 | V1.0.0 |
| 文档日期 | 2026年7月5日 |
| 文档类型 | 后端开发设计文档（目标设计） |
| 适用阶段 | 从纯前端 Demo 演进到完整微服务后端 |
| 关联文档 | PRD.md（产品需求文档） |

---

## 目录

- [1. 概述](#1-概述)
- [2. 技术选型](#2-技术选型)
- [3. 微服务架构](#3-微服务架构)
- [4. 数据库设计](#4-数据库设计)
- [5. API设计规范](#5-api设计规范)
- [6. 安全设计](#6-安全设计)
- [7. 第三方服务集成](#7-第三方服务集成)
- [8. 部署方案](#8-部署方案)

---

## 1. 概述

### 1.1 项目背景

**瞳伴**是一款专为视障人士设计的智能出行导航 App，融合 AI 计算机视觉、语音交互和精准导航技术，帮助视障用户安全、便捷、独立地完成出行。

核心价值：

- **安全保障**：盲道偏离检测、障碍物识别、危险区域预警
- **便捷操作**：全手势交互、语音控制、一键紧急求助
- **智能导航**：多模式路线规划、实时语音指引、最后一公里精细导航
- **家人守护**：位置共享、安全围栏、紧急事件实时推送

### 1.2 双角色系统

系统服务两类核心用户：

| 角色 | 核心诉求 | 关键能力 |
|------|----------|----------|
| 视障用户 | 独立、安全出行 | AI 视觉识别、语音导航、社区求助、紧急求助 |
| 家人用户 | 远程守护视障家人 | 位置共享、安全围栏、围栏预警、紧急联络 |

一位家人用户可守护多位视障用户，一位视障用户也可被多位家人守护。两角色通过邀请码建立绑定关系。

### 1.3 后端目标

当前项目为**纯前端 Demo**，所有数据均在前端 Mock，无真实持久化与业务后端。后端开发目标：

1. **服务化拆分**：从单体 Mock 演进为 7 个职责清晰的微服务
2. **数据持久化**：用户、导航、社区、守护等核心数据落库
3. **AI 能力下沉**：将视觉识别、OCR、深度估计等模型从端侧迁移到云端 GPU 服务
4. **实时通信**：支持位置上报、围栏预警、紧急求助的实时推送
5. **可扩展可观测**：容器化部署、统一监控、日志聚合，具备水平扩展能力
6. **安全合规**：实名信息加密、位置脱敏、防误触、隐私保护

---

## 2. 技术选型

### 2.1 总体原则

- 业务服务优先 Node.js + TypeScript（与前端同语言生态，降低协作成本）
- AI 服务使用 Python（模型生态成熟，便于集成 YOLOv8 / MediaPipe / Tesseract）
- 数据库按数据特征分类存储，避免单一数据库承载异构负载
- 异步任务通过消息队列解耦，保障核心链路稳定性

### 2.2 技术栈清单

| 类别 | 技术 | 说明 |
|------|------|------|
| 业务后端语言 | Node.js (TypeScript) | 业务网关、用户、导航、社区、守护、消息服务 |
| AI 服务语言 | Python 3.10+ | 视觉识别、OCR、深度估计 |
| 业务框架 | Nest.js | 模块化、依赖注入、装饰器风格，适合中大型项目 |
| 轻量框架备选 | Express.js | 简单网关或边缘服务 |
| 主数据库 | PostgreSQL 15+ | 用户、导航、守护等关系型核心数据 |
| 缓存/队列 | Redis 7+ | 会话、限流、位置实时缓存、延迟队列 |
| 文档数据库 | MongoDB 6+ | 社区帖子、评论、Feed 流等弱结构化数据 |
| 消息队列 | RabbitMQ（默认）/ Kafka（高吞吐场景） | 异步任务、事件广播、位置流处理 |
| 对象存储 | AWS S3 / 阿里云 OSS | 用户头像、社区图片、AI 识别快照、OCR 结果 |
| 推送服务 | APNs (iOS) / FCM (Android) | 围栏预警、紧急求助、社区消息推送 |
| 地图服务 | 高德地图 API（主）/ 百度地图 API（备） | 路线规划、POI 搜索、实时路况、逆地理编码 |
| AI 模型 | YOLOv8（目标检测） | 障碍物、盲道、信号灯等识别 |
| AI 模型 | MediaPipe | 手部、姿态、人脸关键点 |
| AI 模型 | Tesseract OCR | 文字识别（路牌、店招、公交站牌） |
| API 网关 | Kong / Nginx + 自研 | 统一鉴权、限流、路由 |
| 服务发现 | Nacos / Consul | 服务注册与配置中心 |
| 链路追踪 | OpenTelemetry + Jaeger | 跨服务调用追踪 |
| 监控 | Prometheus + Grafana | 指标采集与告警 |
| 日志 | ELK Stack（Elasticsearch + Logstash + Kibana） | 日志聚合检索 |

---

## 3. 微服务架构

### 3.0 架构总览

```
                        ┌──────────────────────────┐
                        │      Mobile Client       │
                        └────────────┬─────────────┘
                                     │ HTTPS
                        ┌────────────▼─────────────┐
                        │       API Gateway        │
                        │  (鉴权 / 限流 / 路由)     │
                        └────────────┬─────────────┘
                ┌────────────────────┼────────────────────┐
                │                    │                    │
        ┌───────▼──────┐     ┌──────▼───────┐     ┌──────▼───────┐
        │  User Svc    │     │ Navigation Svc│     │  AI Vision   │
        └───────┬──────┘     └──────┬───────┘     └──────┬───────┘
                │                    │                    │
        ┌───────▼──────┐     ┌──────▼───────┐     ┌──────▼───────┐
        │ Community Svc│     │ Guardian Svc │     │ Message Svc  │
        └───────┬──────┘     └──────┬───────┘     └──────┬───────┘
                │                    │                    │
                └────────────────────┼────────────────────┘
                                     │
                            ┌────────▼─────────┐
                            │   Voice Service  │
                            └──────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
   ┌────▼─────┐   ┌──────────┐   ┌──▼──────┐   ┌──────────┐  ┌──▼──────┐
   │PostgreSQL│   │  Redis   │   │ MongoDB │   │ RabbitMQ │  │ S3/OSS  │
   └──────────┘   └──────────┘   └─────────┘   └──────────┘  └─────────┘
```

### 3.1 用户服务（User Service）

**职责**：账户体系、角色管理、实名认证、会话管理。

**技术栈**：Node.js + Nest.js + PostgreSQL + Redis（会话/验证码）。

**核心能力**：
- 多方式注册登录：手机号 + 验证码、密码、第三方 OAuth2
- 角色管理：视障用户、家人用户（可双角色）
- 实名认证：身份证 + 姓名 + 活体检测
- 个人信息管理：头像、昵称、紧急联系人、常用地址
- 会话管理：JWT 双 Token（Access + Refresh）
- 设备管理：多端登录控制

**API 列表**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册账号 |
| POST | `/api/auth/login` | 密码/验证码登录 |
| POST | `/api/auth/third-party` | 第三方 OAuth2 登录 |
| GET | `/api/user/profile` | 获取个人信息 |
| PUT | `/api/user/profile` | 更新个人信息 |
| POST | `/api/user/real-name` | 提交实名认证 |
| POST | `/api/auth/logout` | 退出登录 |
| POST | `/api/auth/refresh` | 刷新 Token |

### 3.2 导航服务（Navigation Service）

**职责**：路线规划、实时导航状态管理、危险标记管理。

**技术栈**：Node.js + Nest.js + PostgreSQL + Redis（实时状态）+ 高德地图 API。

**核心能力**：
- 4 种路线模式：步行、公交、打车、室内
- 实时导航状态管理（开始、进行中、暂停、结束）
- 路线偏离自动重算
- 最后一公里触发（距终点 ≤ 500m 切换精细导航）
- 室内楼层导航（多楼层路径）
- 危险标记查询与上报联动
- 导航记录归档（供社区路线分享）

**API 列表**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/nav/plan` | 路线规划 |
| POST | `/api/nav/start` | 开始导航 |
| GET | `/api/nav/status` | 查询导航状态 |
| POST | `/api/nav/reroute` | 触发路线重算 |
| POST | `/api/nav/end` | 结束导航 |
| GET | `/api/nav/floors` | 室内楼层信息 |
| GET | `/api/nav/danger-marks` | 路线沿途危险标记 |

### 3.3 AI视觉服务（AI Vision Service）

**职责**：环境识别、OCR、深度估计、危险预警。

**技术栈**：Python + FastAPI + PyTorch + YOLOv8 + MediaPipe + Tesseract，GPU 推理服务。

**核心能力**：
- 环境识别：30 种路况（红绿灯、斑马线、台阶、坑洼、施工围挡、水坑、电动车、共享单车、楼梯、电梯门、自动扶梯、十字路口、天桥、地下通道、障碍物、盲道、盲道占用、广告牌、电线杆、消防栓、垃圾桶、座椅、商铺招牌、公交站牌、地铁站口、出租车上下车点、商场入口、卫生间、扶手、坡道）
- 场景模式：步行、打车找车、公交上车、地铁入口、室内入口
- OCR 文字识别：路牌、店招、公交站牌、门牌号
- 深度估计：相对距离感知
- 危险预警分级：高（立即停下）、中（减速）、低（注意）
- 模型版本管理与热更新

**API 列表**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/recognize` | 环境识别 |
| POST | `/api/ai/ocr` | OCR 文字识别 |
| POST | `/api/ai/danger-alert` | 危险预警评估 |
| GET | `/api/ai/models` | 查询可用模型版本 |

### 3.4 社区服务（Community Service）

**职责**：社区内容、互动、危险标记上报。

**技术栈**：Node.js + Nest.js + MongoDB + Redis（点赞计数/Feed 缓存）。

**核心能力**：
- 帖子 CRUD（图文混排）
- 评论、点赞、分享
- 4 个分类 Tab：推荐、危险标记、路线分享、出行贴士
- 危险标记上报（含位置、类型、图片、严重程度）
- 危险标记审核与下发到导航服务
- Feed 流（关注 + 推荐）

**API 列表**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/community/feed` | 获取 Feed 流 |
| POST | `/api/community/post` | 发布帖子 |
| POST | `/api/community/comment` | 发布评论 |
| POST | `/api/community/like` | 点赞/取消点赞 |
| POST | `/api/community/share` | 分享帖子 |
| POST | `/api/community/danger-mark` | 上报危险标记 |

### 3.5 家人守护服务（Guardian Service）

**职责**：被监护人士管理、位置共享、安全围栏、预警。

**技术栈**：Node.js + Nest.js + PostgreSQL + Redis（位置实时缓存）+ RabbitMQ（位置流）。

**核心能力**：
- 被监护人士管理：一位家人可绑定多人
- 位置共享：实时上报 + 历史轨迹
- 安全围栏：圆形围栏、多边形围栏，支持增删改查、启停
- 围栏预警：越界（出围栏）、接近边界（即将越界）
- 守护设置：上报频率、预警灵敏度
- 邀请家人：邀请码绑定流程

**API 列表**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/guardian/wards` | 被监护人士列表 |
| POST | `/api/guardian/ward` | 添加被监护人士 |
| GET | `/api/guardian/location/:wardId` | 实时位置查询 |
| POST | `/api/guardian/fence` | 创建围栏 |
| PUT | `/api/guardian/fence/:id` | 更新围栏 |
| DELETE | `/api/guardian/fence/:id` | 删除围栏 |
| POST | `/api/guardian/invite` | 邀请家人 |
| GET | `/api/guardian/alerts` | 预警列表 |

### 3.6 消息服务（Message Service）

**职责**：推送通知、消息中心。

**技术栈**：Node.js + Nest.js + PostgreSQL + APNs / FCM + RabbitMQ（推送队列）。

**核心能力**：
- 推送通知：APNs（iOS）、FCM（Android）双通道
- 消息中心：列表、详情、已读、删除
- 消息分类：全部、预警、社区、系统
- 推送降级：推送失败时回退到站内信
- 推送频率控制：避免对用户骚扰

**API 列表**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/messages` | 消息列表 |
| GET | `/api/messages/:id` | 消息详情 |
| PUT | `/api/messages/:id/read` | 标记已读 |
| DELETE | `/api/messages/:id` | 删除消息 |
| POST | `/api/messages/push` | 触发推送（内部） |

### 3.7 语音服务（Voice Service）

**职责**：TTS、STT、唤醒词检测。

**技术栈**：Python + FastAPI + TTS 引擎（如 Edge-TTS / 讯飞）、Whisper（STT）、Porcupine（唤醒词）。

**核心能力**：
- TTS 语音合成：自然语音播报导航指引
- STT 语音识别：用户语音指令解析
- 唤醒词检测："你好，瞳伴"
- 语音队列管理：避免播报重叠，按优先级排序（紧急 > 危险 > 普通）
- 语速、音色、音量个性化

**API 列表**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/voice/tts` | 语音合成 |
| POST | `/api/voice/stt` | 语音识别 |
| POST | `/api/voice/wake-word` | 唤醒词检测 |

---

## 4. 数据库设计

### 4.1 数据库选型分布

| 数据库 | 承载表 |
|--------|--------|
| PostgreSQL | users、user_roles、real_name_auth、navigation_records、routes、danger_marks、wards、guardian_relations、fences、fence_alerts、emergency_contacts、emergency_events、messages、common_addresses、favorites、invite_codes |
| MongoDB | community_posts、community_comments |
| Redis | 会话、验证码、限流、位置实时缓存、Feed 缓存 |
| S3/OSS | 头像、社区图片、AI 识别快照、OCR 结果 |

### 4.2 PostgreSQL 表结构

#### 4.2.1 users（用户表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| phone | VARCHAR(20) | 手机号（加密存储） | UNIQUE, NOT NULL |
| phone_hash | VARCHAR(64) | 手机号哈希（用于查询） | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | 密码哈希（bcrypt） | NULLABLE |
| nickname | VARCHAR(50) | 昵称 | NOT NULL |
| avatar_url | VARCHAR(500) | 头像 URL | NULLABLE |
| gender | SMALLINT | 性别（0 未知 1 男 2 女） | DEFAULT 0 |
| birthday | DATE | 生日 | NULLABLE |
| email | VARCHAR(100) | 邮箱 | NULLABLE |
| status | SMALLINT | 状态（0 禁用 1 正常 2 封禁） | DEFAULT 1 |
| last_login_at | TIMESTAMPTZ | 最后登录时间 | NULLABLE |
| last_login_ip | VARCHAR(45) | 最后登录 IP | NULLABLE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 更新时间 | DEFAULT NOW() |

#### 4.2.2 user_roles（角色表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| user_id | BIGINT | 用户 ID | FK -> users.id, NOT NULL |
| role | VARCHAR(20) | 角色类型（VISUALLY_IMPAIRED / GUARDIAN） | NOT NULL |
| is_primary | BOOLEAN | 是否主角色 | DEFAULT FALSE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

约束：UNIQUE(user_id, role)。

#### 4.2.3 real_name_auth（实名认证表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| user_id | BIGINT | 用户 ID | FK -> users.id, UNIQUE, NOT NULL |
| real_name | VARCHAR(100) | 真实姓名（加密） | NOT NULL |
| id_card_no | VARCHAR(255) | 身份证号（AES-256 加密） | NOT NULL |
| id_card_hash | VARCHAR(64) | 身份证号哈希 | UNIQUE, NOT NULL |
| front_image_url | VARCHAR(500) | 身份证正面照 | NOT NULL |
| back_image_url | VARCHAR(500) | 身份证反面照 | NOT NULL |
| liveness_video_url | VARCHAR(500) | 活体检测视频 | NOT NULL |
| status | SMALLINT | 状态（0 待审核 1 通过 2 驳回） | DEFAULT 0 |
| reject_reason | VARCHAR(255) | 驳回原因 | NULLABLE |
| verified_at | TIMESTAMPTZ | 认证通过时间 | NULLABLE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 更新时间 | DEFAULT NOW() |

#### 4.2.4 navigation_records（导航记录表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| user_id | BIGINT | 用户 ID | FK -> users.id, NOT NULL |
| start_name | VARCHAR(200) | 起点名称 | NOT NULL |
| start_lng | NUMERIC(10,7) | 起点经度 | NOT NULL |
| start_lat | NUMERIC(10,7) | 起点纬度 | NOT NULL |
| end_name | VARCHAR(200) | 终点名称 | NOT NULL |
| end_lng | NUMERIC(10,7) | 终点经度 | NOT NULL |
| end_lat | NUMERIC(10,7) | 终点纬度 | NOT NULL |
| mode | VARCHAR(20) | 模式（WALK/BUS/TAXI/INDOOR） | NOT NULL |
| status | VARCHAR(20) | 状态（PLANNING/ACTIVE/PAUSED/COMPLETED/CANCELED） | NOT NULL |
| distance_m | INTEGER | 距离（米） | NULLABLE |
| duration_s | INTEGER | 预计时长（秒） | NULLABLE |
| started_at | TIMESTAMPTZ | 开始时间 | NULLABLE |
| ended_at | TIMESTAMPTZ | 结束时间 | NULLABLE |
| route_snapshot | JSONB | 路线快照 | NULLABLE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 更新时间 | DEFAULT NOW() |

#### 4.2.5 routes（路线表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| nav_record_id | BIGINT | 导航记录 ID | FK -> navigation_records.id, NOT NULL |
| mode | VARCHAR(20) | 出行模式 | NOT NULL |
| polyline | TEXT | 编码路线（高德 encoded polyline） | NOT NULL |
| steps | JSONB | 分步指引 | NOT NULL |
| distance_m | INTEGER | 距离（米） | NOT NULL |
| duration_s | INTEGER | 预计时长（秒） | NOT NULL |
| is_selected | BOOLEAN | 是否被选中 | DEFAULT FALSE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

#### 4.2.6 danger_marks（危险标记表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| lng | NUMERIC(10,7) | 经度 | NOT NULL |
| lat | NUMERIC(10,7) | 纬度 | NOT NULL |
| type | VARCHAR(30) | 类型（PIT/CONSTRUCTION/WATER/STAIRS/BLIND_PATH_BLOCKED 等） | NOT NULL |
| severity | SMALLINT | 严重程度（1 低 2 中 3 高） | NOT NULL |
| description | VARCHAR(500) | 描述 | NULLABLE |
| image_url | VARCHAR(500) | 现场图片 | NULLABLE |
| address | VARCHAR(200) | 地址描述 | NULLABLE |
| reporter_id | BIGINT | 上报用户 ID | FK -> users.id, NULLABLE |
| source | VARCHAR(20) | 来源（COMMUNITY / SYSTEM） | NOT NULL |
| status | SMALLINT | 状态（0 待审核 1 已确认 2 已撤销） | DEFAULT 0 |
| valid_until | TIMESTAMPTZ | 失效时间 | NULLABLE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

索引：`(lng, lat)` GIST 空间索引；`(status)`。

#### 4.2.7 community_posts（社区帖子表 - MongoDB）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| _id | ObjectId | 主键 | PK |
| author_id | Long | 作者用户 ID | NOT NULL, INDEX |
| category | String | 分类（RECOMMEND/DANGER_MARK/ROUTE_SHARE/TRAVEL_TIP） | NOT NULL, INDEX |
| title | String | 标题 | NOT NULL |
| content | String | 正文 | NOT NULL |
| images | Array&lt;String&gt; | 图片 URL 列表 | NULLABLE |
| route_snapshot | Object | 路线快照（ROUTE_SHARE 专用） | NULLABLE |
| danger_mark_id | Long | 关联的危险标记 ID | NULLABLE |
| tags | Array&lt;String&gt; | 标签 | NULLABLE |
| like_count | Long | 点赞数 | DEFAULT 0 |
| comment_count | Long | 评论数 | DEFAULT 0 |
| share_count | Long | 分享数 | DEFAULT 0 |
| status | Integer | 状态（0 草稿 1 正常 2 隐藏 3 删除） | DEFAULT 1 |
| location | Object | 发布位置（含坐标） | NULLABLE |
| created_at | Date | 创建时间 | DEFAULT NOW(), INDEX |
| updated_at | Date | 更新时间 | DEFAULT NOW() |

#### 4.2.8 community_comments（评论表 - MongoDB）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| _id | ObjectId | 主键 | PK |
| post_id | ObjectId | 帖子 ID | NOT NULL, INDEX |
| author_id | Long | 作者用户 ID | NOT NULL |
| parent_id | ObjectId | 父评论 ID（回复） | NULLABLE |
| content | String | 评论内容 | NOT NULL |
| like_count | Long | 点赞数 | DEFAULT 0 |
| status | Integer | 状态（1 正常 3 删除） | DEFAULT 1 |
| created_at | Date | 创建时间 | DEFAULT NOW() |
| updated_at | Date | 更新时间 | DEFAULT NOW() |

#### 4.2.9 wards（被监护人士表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| user_id | BIGINT | 视障用户 ID（自身账户） | FK -> users.id, NOT NULL |
| nickname | VARCHAR(50) | 家人对其的昵称 | NOT NULL |
| avatar_url | VARCHAR(500) | 头像 URL | NULLABLE |
| last_lng | NUMERIC(10,7) | 最新经度 | NULLABLE |
| last_lat | NUMERIC(10,7) | 最新纬度 | NULLABLE |
| last_location_at | TIMESTAMPTZ | 位置最后更新时间 | NULLABLE |
| report_frequency_s | INTEGER | 上报频率（秒） | DEFAULT 30 |
| sensitivity | SMALLINT | 灵敏度（1 低 2 中 3 高） | DEFAULT 2 |
| status | SMALLINT | 状态（0 未激活 1 正常 2 暂停） | DEFAULT 1 |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 更新时间 | DEFAULT NOW() |

#### 4.2.10 guardian_relations（守护关系表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| guardian_user_id | BIGINT | 家人用户 ID | FK -> users.id, NOT NULL |
| ward_id | BIGINT | 被监护人士 ID | FK -> wards.id, NOT NULL |
| relation | VARCHAR(20) | 关系（PARENT/CHILD/SPOUSE/SIBLING/OTHER） | NOT NULL |
| status | SMALLINT | 状态（0 待确认 1 已绑定 2 已解绑） | DEFAULT 0 |
| bound_at | TIMESTAMPTZ | 绑定时间 | NULLABLE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

约束：UNIQUE(guardian_user_id, ward_id)。

#### 4.2.11 fences（围栏表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| ward_id | BIGINT | 被监护人士 ID | FK -> wards.id, NOT NULL |
| guardian_user_id | BIGINT | 家人用户 ID | FK -> users.id, NOT NULL |
| name | VARCHAR(50) | 围栏名称 | NOT NULL |
| type | VARCHAR(10) | 类型（CIRCLE / POLYGON） | NOT NULL |
| center_lng | NUMERIC(10,7) | 圆心经度（圆形围栏） | NULLABLE |
| center_lat | NUMERIC(10,7) | 圆心纬度（圆形围栏） | NULLABLE |
| radius_m | INTEGER | 半径（米，圆形围栏） | NULLABLE |
| polygon_points | JSONB | 多边形顶点坐标（多边形围栏） | NULLABLE |
| alert_on_exit | BOOLEAN | 越界预警 | DEFAULT TRUE |
| alert_on_approach | BOOLEAN | 接近边界预警 | DEFAULT TRUE |
| approach_threshold_m | INTEGER | 接近阈值（米） | DEFAULT 50 |
| is_active | BOOLEAN | 是否启用 | DEFAULT TRUE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | 更新时间 | DEFAULT NOW() |

#### 4.2.12 fence_alerts（围栏预警表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| fence_id | BIGINT | 围栏 ID | FK -> fences.id, NOT NULL |
| ward_id | BIGINT | 被监护人士 ID | FK -> wards.id, NOT NULL |
| alert_type | VARCHAR(20) | 类型（EXIT / APPROACH） | NOT NULL |
| lng | NUMERIC(10,7) | 事件位置经度 | NOT NULL |
| lat | NUMERIC(10,7) | 事件位置纬度 | NOT NULL |
| distance_m | INTEGER | 距边界距离（米） | NULLABLE |
| message | VARCHAR(500) | 预警描述 | NOT NULL |
| is_read | BOOLEAN | 是否已读 | DEFAULT FALSE |
| occurred_at | TIMESTAMPTZ | 发生时间 | NOT NULL |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

#### 4.2.13 emergency_contacts（紧急联系人表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| user_id | BIGINT | 用户 ID（视障用户） | FK -> users.id, NOT NULL |
| contact_user_id | BIGINT | 联系人用户 ID（已注册） | FK -> users.id, NULLABLE |
| contact_name | VARCHAR(50) | 联系人姓名 | NOT NULL |
| contact_phone | VARCHAR(20) | 联系人手机号（加密） | NOT NULL |
| relation | VARCHAR(20) | 关系 | NOT NULL |
| priority | SMALLINT | 优先级（1 最高） | DEFAULT 1 |
| is_auto_share_location | BOOLEAN | 紧急时自动共享位置 | DEFAULT TRUE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

#### 4.2.14 emergency_events（紧急求助事件表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| user_id | BIGINT | 求助用户 ID | FK -> users.id, NOT NULL |
| trigger_type | VARCHAR(20) | 触发方式（SOS_BUTTON / VOICE / FALL_DETECT） | NOT NULL |
| lng | NUMERIC(10,7) | 事件位置经度 | NOT NULL |
| lat | NUMERIC(10,7) | 事件位置纬度 | NOT NULL |
| address | VARCHAR(200) | 地址描述 | NULLABLE |
| status | VARCHAR(20) | 状态（ACTIVE / HANDLING / RESOLVED / CANCELED） | DEFAULT 'ACTIVE' |
| audio_url | VARCHAR(500) | 录音文件 URL | NULLABLE |
| shared_contact_ids | BIGINT[] | 已通知的联系人 ID 列表 | NULLABLE |
| resolved_at | TIMESTAMPTZ | 解决时间 | NULLABLE |
| resolved_by | BIGINT | 解决人 ID | NULLABLE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

#### 4.2.15 messages（消息表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| user_id | BIGINT | 接收用户 ID | FK -> users.id, NOT NULL, INDEX |
| category | VARCHAR(20) | 分类（ALERT / COMMUNITY / SYSTEM） | NOT NULL |
| title | VARCHAR(100) | 标题 | NOT NULL |
| content | TEXT | 内容 | NOT NULL |
| ref_type | VARCHAR(30) | 关联类型（FENCE_ALERT / EMERGENCY / POST / COMMENT） | NULLABLE |
| ref_id | BIGINT | 关联 ID | NULLABLE |
| push_status | SMALLINT | 推送状态（0 未推送 1 已推送 2 失败） | DEFAULT 0 |
| is_read | BOOLEAN | 是否已读 | DEFAULT FALSE, INDEX |
| read_at | TIMESTAMPTZ | 已读时间 | NULLABLE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW(), INDEX |

#### 4.2.16 common_addresses（常用地址表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| user_id | BIGINT | 用户 ID | FK -> users.id, NOT NULL |
| name | VARCHAR(100) | 地址名称（家、公司） | NOT NULL |
| address | VARCHAR(200) | 详细地址 | NOT NULL |
| lng | NUMERIC(10,7) | 经度 | NOT NULL |
| lat | NUMERIC(10,7) | 纬度 | NOT NULL |
| tag | VARCHAR(20) | 标签（HOME / WORK / OTHER） | NULLABLE |
| sort_order | INTEGER | 排序 | DEFAULT 0 |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

#### 4.2.17 favorites（收藏表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| user_id | BIGINT | 用户 ID | FK -> users.id, NOT NULL |
| ref_type | VARCHAR(20) | 收藏类型（POST / ADDRESS / ROUTE / POI） | NOT NULL |
| ref_id | VARCHAR(64) | 收藏对象 ID | NOT NULL |
| snapshot | JSONB | 收藏快照 | NULLABLE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

约束：UNIQUE(user_id, ref_type, ref_id)。

#### 4.2.18 invite_codes（邀请码表）

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | BIGSERIAL | 主键 ID | PK, 自增 |
| code | VARCHAR(32) | 邀请码 | UNIQUE, NOT NULL |
| inviter_user_id | BIGINT | 邀请人（家人）用户 ID | FK -> users.id, NOT NULL |
| invitee_phone_hash | VARCHAR(64) | 被邀请人手机号哈希 | NULLABLE |
| ward_id | BIGINT | 目标被监护人士 ID | FK -> wards.id, NULLABLE |
| role | VARCHAR(20) | 邀请目标角色（GUARDIAN） | NOT NULL |
| status | SMALLINT | 状态（0 待使用 1 已使用 2 已过期 3 已撤销） | DEFAULT 0 |
| expires_at | TIMESTAMPTZ | 过期时间 | NOT NULL |
| used_at | TIMESTAMPTZ | 使用时间 | NULLABLE |
| created_at | TIMESTAMPTZ | 创建时间 | DEFAULT NOW() |

---

## 5. API设计规范

### 5.1 RESTful 规范

- 资源用名词复数：`/api/users`、`/api/messages`
- HTTP 动词语义：GET 查询、POST 创建、PUT 全量更新、PATCH 部分更新、DELETE 删除
- 路径层级表示从属关系：`/api/guardian/fence/:id`
- 查询参数：分页、排序、过滤
- 版本化：URL 前缀 `/api/v1`，本文档省略版本号

### 5.2 统一响应格式

所有接口返回统一 JSON 结构：

```json
{
  "code": 0,
  "message": "success",
  "data": { },
  "requestId": "uuid-v4"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | Number | 业务码，0 表示成功，非 0 表示业务错误 |
| message | String | 提示消息，面向终端用户可读 |
| data | Object/Array/null | 业务数据 |
| requestId | String | 请求追踪 ID，便于排查 |

### 5.3 错误码定义

| 范围 | 含义 |
|------|------|
| 0 | 成功 |
| 1xxx | 通用错误（参数、限流、服务器错误） |
| 2xxx | 用户/认证相关 |
| 3xxx | 导航相关 |
| 4xxx | AI 视觉相关 |
| 5xxx | 社区相关 |
| 6xxx | 守护相关 |
| 7xxx | 消息/推送相关 |
| 8xxx | 语音相关 |

常见错误码：

| code | HTTP | 含义 |
|------|------|------|
| 0 | 200 | 成功 |
| 1001 | 400 | 参数错误 |
| 1002 | 401 | 未认证 |
| 1003 | 403 | 无权限 |
| 1004 | 404 | 资源不存在 |
| 1005 | 409 | 资源冲突 |
| 1006 | 429 | 请求过于频繁（限流） |
| 1007 | 500 | 服务器内部错误 |
| 2001 | 400 | 手机号格式错误 |
| 2002 | 400 | 验证码错误或已过期 |
| 2003 | 401 | 用户名或密码错误 |
| 2004 | 403 | 账号已被禁用 |
| 2005 | 401 | Token 已过期 |
| 3001 | 400 | 不支持的出行模式 |
| 3002 | 404 | 路线规划无解 |
| 6001 | 403 | 非被监护人的家人 |
| 6002 | 400 | 围栏顶点数不足 |

### 5.4 分页规范

请求参数：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| page | Number | 1 | 页码，从 1 开始 |
| pageSize | Number | 20 | 每页条数，最大 100 |
| sortBy | String | - | 排序字段 |
| order | String | desc | 排序方向（asc/desc） |

响应结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [ ],
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 5.5 认证方式

- 认证协议：Bearer Token（JWT）
- 请求头：`Authorization: Bearer <accessToken>`
- Access Token 有效期：2 小时
- Refresh Token 有效期：30 天
- 双 Token 刷新：Access 过期后用 Refresh 调用 `/api/auth/refresh`

### 5.6 限流策略

| 维度 | 阈值 | 说明 |
|------|------|------|
| 全局 | 10000 QPS | 网关级 |
| 单 IP | 100 QPS | 防爬虫 |
| 单用户 | 60 QPS | 防滥用 |
| 登录接口 | 5 次/分钟 | 防爆破 |
| 发送验证码 | 1 次/分钟，10 次/天 | 防骚扰 |
| AI 识别接口 | 10 QPS/用户 | GPU 资源限制 |

---

## 6. 安全设计

### 6.1 JWT 认证流程

```
Client                Gateway             User Service           Redis
  │  1.登录请求         │                      │                    │
  ├──────────────────► │  2.转发              │                    │
  │                    ├────────────────────► │  3.校验账号         │
  │                    │                      │  4.生成Access+Refresh
  │                    │                      ├──────────────────► │  5.缓存会话
  │                    │  6.返回双Token       │                    │
  │  7.返回Token       ◄┤◄────────────────────┤                    │
  │                    │                      │                    │
  │  8.业务请求+Token   │  9.校验JWT           │                    │
  ├──────────────────► │ 10.查Redis会话        │                    │
  │                    ├──────────────────────────────────────────► │
  │                    │◄──────────────────────────────────────────┤
  │  11.返回数据       ◄┤                                          │
```

要点：
- Access Token 携带 `userId`、`roles`、`deviceId`
- Refresh Token 仅用于刷新，不参与业务请求
- 退出登录时主动删除 Redis 会话
- 修改密码、解绑设备时使所有 Token 失效

### 6.2 OAuth2 第三方登录流程

支持微信、Apple ID、QQ、支付宝、微博 5 个渠道。

```
Client            Gateway         User Service        OAuth Provider
  │ 1.选择渠道       │                 │                     │
  ├───────────────► │ 2.获取授权URL    │                     │
  │◄───────────────┤◄────────────────┤                     │
  │ 3.跳转授权页     │                 │                     │
  ├─────────────────────────────────────────────────────────► │
  │ 4.用户授权       │                 │                     │
  │◄─────────────────────────────────────────────────────────┤
  │ 5.回调code       │                 │                     │
  ├───────────────► │ 6.转发code      │                     │
  │                 ├───────────────► │ 7.换access_token    │
  │                 │                 ├────────────────────► │
  │                 │                 │◄────────────────────┤
  │                 │                 │ 8.拉取用户信息        │
  │                 │                 ├────────────────────► │
  │                 │                 │◄────────────────────┤
  │                 │                 │ 9.查找/创建用户       │
  │                 │ 10.返回双Token  │                     │
  │◄───────────────┤◄────────────────┤                     │
```

绑定逻辑：
- 首次 OAuth 登录：若手机号已存在，要求确认绑定；否则创建新用户
- 多渠道绑定：一个用户可同时绑定多个第三方账号
- 解绑限制：至少保留一种登录方式

### 6.3 手机号脱敏规则

- **存储**：明文手机号使用 AES-256 加密存储，额外存储 `phone_hash`（SHA-256）用于查询
- **展示**：脱敏为 `138****1234`（保留前 3 位和后 4 位）
- **日志**：禁止打印明文手机号，统一脱敏后输出
- **传输**：仅 HTTPS 传输，禁止明文出现在 URL Query

### 6.4 位置数据隐私保护

- 实时位置仅缓存在 Redis，TTL = 上报频率 × 3
- 历史轨迹仅保留最近 30 天，超期自动归档并脱敏
- 位置共享仅在守护关系存在且被监护人同意时启用
- 位置数据不向第三方共享、不用于广告
- 用户可随时关闭位置上报
- 紧急求助结束后，参与者需主动确认是否保留位置共享

### 6.5 实名信息加密存储

- 身份证号、真实姓名采用 AES-256-GCM 加密存储，密钥由 KMS 管理
- 同时存储 `id_card_hash`（SHA-256 + Salt）用于唯一性校验
- 身份证照片存对象存储私有桶，URL 采用临时签名（5 分钟过期）
- 实名信息访问需二次鉴权 + 审计日志
- 数据库备份同样加密，密钥与数据分离存储

### 6.6 紧急求助安全

- **防误触**：SOS 按钮需长按 3 秒或连续点击 3 次确认
- **位置自动共享**：触发后自动向所有紧急联系人推送位置（含经纬度、地址）
- **自动录音**：触发后自动开启 30 秒录音并上传，作为求助凭证
- **状态机**：ACTIVE → HANDLING → RESOLVED，避免遗漏
- **超时升级**：5 分钟无响应时自动报警（需用户在隐私协议中授权）
- **可撤销**：误触发可在 10 秒内撤销

---

## 7. 第三方服务集成

### 7.1 高德地图 API

| 接口 | 用途 |
|------|------|
| 地理编码 / 逆地理编码 | 地址 ↔ 坐标互转 |
| POI 搜索 | 目的地搜索、周边兴趣点 |
| 步行路线规划 | 步行模式路线 |
| 公交路线规划 | 公交模式路线 |
| 驾车路线规划 | 打车模式参考路线 |
| 实时路况 | 路况查询、ETA 调整 |
| 行政区域查询 | 围栏、地址解析辅助 |

集成要点：
- API Key 服务端调用，不暴露给客户端
- 调用结果缓存（Redis，5 分钟），降低成本
- 失败重试 3 次，超过则降级到百度地图 API
- 调用配额监控，超过 80% 阈值告警

### 7.2 短信服务

支持阿里云短信、腾讯云短信双通道，互为备份：

| 场景 | 模板类型 | 频率限制 |
|------|----------|----------|
| 注册验证码 | 验证码模板 | 1 次/分钟，10 次/天 |
| 登录验证码 | 验证码模板 | 1 次/分钟，10 次/天 |
| 围栏预警 | 通知模板 | 不限 |
| 紧急求助 | 紧急通知模板 | 不限 |
| 邀请家人 | 邀请通知模板 | 1 次/分钟 |

集成要点：
- 主通道失败自动切换备通道
- 验证码 5 分钟内有效，错误 5 次锁定
- 短信下发后异步更新发送状态

### 7.3 推送服务（APNs / FCM）

| 平台 | 服务 | 鉴权 |
|------|------|------|
| iOS | APNs | Token（JWT） |
| Android | FCM | OAuth2 Service Account |

消息类型：
- **预警类**（围栏、危险）：高优先级，立即推送
- **社区类**（评论、点赞）：普通优先级，可聚合
- **系统类**（公告、版本）：低优先级，可延迟

降级策略：
- 推送失败入消息中心
- 推送失败 3 次标记设备失效，下次登录前重新校验

### 7.4 对象存储（S3 / OSS）

用途：头像、社区图片、AI 识别快照、OCR 结果、紧急录音。

策略：
- 私有桶 + 临时签名 URL（5 分钟过期）
- 公开桶仅放静态公共资源（如系统图标）
- 图片自动缩略图、压缩、WebP 转换
- 上传走预签名 URL 直传，不经过业务服务

### 7.5 AI 模型服务（YOLOv8 部署）

- **部署形态**：Triton Inference Server + GPU 节点
- **模型版本**：通过 `/api/ai/models` 管理，支持灰度发布
- **推理流程**：客户端上传图片 → 网关 → AI 服务预处理 → 推理 → 后处理 → 返回结构化结果
- **资源调度**：单图推理 ≤ 200ms；高峰期排队，超时降级到端侧轻量模型
- **结果缓存**：相同图片哈希 60 秒内复用结果
- **模型监控**：推理延迟、QPS、显存使用率、错误率

---

## 8. 部署方案

### 8.1 Docker 容器化

每个微服务独立 Dockerfile：

```dockerfile
# 业务服务示例（Node.js）
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

镜像规范：
- 基础镜像：node:20-alpine / python:3.10-slim
- 多阶段构建，减小镜像体积
- 镜像标签：`<service>:<git-sha>` 或 `<service>:<version>`
- 镜像仓库：私有 Harbor

### 8.2 Kubernetes 编排

```
┌─────────────────────────────────────────────────┐
│              Kubernetes Cluster                │
│                                                │
│  namespace: tongban-prod                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │user-svc │ │nav-svc   │ │ai-svc(GPU)│      │
│  │(3 pods) │ │(3 pods)  │ │(2 pods)   │      │
│  └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │community│ │guardian  │ │message   │      │
│  │(2 pods) │ │(2 pods)  │ │(2 pods)  │      │
│  └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐                                 │
│  │voice-svc│                                 │
│  │(2 pods) │                                 │
│  └──────────┘                                 │
│                                                │
│  namespace: tongban-infra                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │gateway │ │redis   │ │rabbitmq│ │jaeger  │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ │
│  ┌────────┐ ┌────────┐ ┌────────┐            │
│  │prom    │ │grafana │ │kibana  │            │
│  └────────┘ └────────┘ └────────┘            │
└─────────────────────────────────────────────────┘
```

关键 K8s 资源：
- Deployment：无状态服务
- StatefulSet：Redis、RabbitMQ（生产建议使用托管服务）
- HPA：基于 CPU/QPS 自动扩缩
- ConfigMap + Secret：配置与密钥分离
- Ingress：统一入口与 TLS 终结
- PodDisruptionBudget：保障最小可用副本

### 8.3 CI/CD 流水线

```
  Git Push      Build           Test          Push Image      Deploy
   │             │               │              │              │
   ▼             ▼               ▼              ▼              ▼
 GitHub ──► Docker Build ──► Unit Test ──► Harbor ──► K8s Dev
 /GitLab           │           Lint              │            │
                   │           E2E               │            ▼
                   ▼                              │       K8s Staging
              Trivy 扫描                          │            │
                                                      ▼            │
                                                 Manual Approval │
                                                      ▼            ▼
                                                  K8s Prod ◄──────┘
```

工具链：
- 代码仓库：GitHub / GitLab
- CI：GitHub Actions / GitLab CI
- 镜像仓库：Harbor
- 部署：Helm + ArgoCD（GitOps）
- 制品扫描：Trivy

### 8.4 监控告警（Prometheus + Grafana）

核心监控指标：

| 服务 | 指标 |
|------|------|
| 全局 | QPS、错误率、P95/P99 延迟 |
| 网关 | 限流命中、路由延迟 |
| 用户 | 登录成功率、注册转化 |
| 导航 | 路线规划延迟、导航成功率 |
| AI | 推理延迟、GPU 利用率、模型版本分布 |
| 守护 | 位置上报频率、围栏预警数 |
| 数据库 | 连接数、慢查询、主从延迟 |
| Redis | 命中率、内存、慢日志 |
| 消息队列 | 队列堆积、消费延迟 |

告警分级：
- **P0**：服务宕机、核心接口错误率 > 5%、紧急求助链路异常 → 电话+短信+IM
- **P1**：错误率 > 1%、延迟 P99 > 5s、磁盘 > 90% → 短信+IM
- **P2**：错误率 > 0.5%、缓存命中率 < 80%、队列堆积 > 阈值 → IM

### 8.5 日志收集（ELK Stack）

```
 微服务日志 → Filebeat → Logstash → Elasticsearch → Kibana
                                    │
                                    └─► 告警规则（Watcher）
```

日志规范：
- JSON 结构化输出，包含 `requestId`、`userId`、`service`、`timestamp`
- 敏感字段（手机号、身份证号）入库前自动脱敏
- 日志保留：在线 30 天，归档 90 天
- 索引按天分：`tongban-logs-YYYY.MM.dd`

关键查询场景：
- 通过 `requestId` 串联一次请求的全部日志
- 通过 `userId` 查询用户行为链路
- 错误日志聚合统计（按服务、错误码）

---

## 附录 A：服务间通信约定

| 场景 | 协议 | 说明 |
|------|------|------|
| 同步调用 | HTTP/gRPC | 用户校验、导航规划 |
| 异步事件 | RabbitMQ Topic | 围栏预警、社区动态 |
| 实时推送 | WebSocket | 位置共享、紧急求助 |
| 数据流 | Kafka | 高吞吐位置流（多端订阅） |

## 附录 B：版本演进路线

| 版本 | 目标 |
|------|------|
| v0.1 | 用户服务 + 数据库落地，前端接入登录注册 |
| v0.2 | 导航服务 + 高德地图集成，路线规划上线 |
| v0.3 | AI 视觉服务上线（基础识别 + OCR） |
| v0.4 | 社区服务 + 守护服务（位置 + 围栏） |
| v0.5 | 消息服务 + 推送（围栏预警、社区通知） |
| v0.6 | 语音服务 + 紧急求助全链路 |
| v1.0 | 完整微服务上线、监控告警、压测达标 |

---

> 本文档为后端开发**目标设计文档**，将随开发迭代持续更新。当前阶段所有 API、数据库结构、安全策略均为设计目标，待实现验证。
