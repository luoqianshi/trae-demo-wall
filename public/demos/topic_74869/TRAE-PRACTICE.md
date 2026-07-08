# 援力通 2.0 · TRAE 实践过程详细记录

> 本文档记录援力通 2.0 全程使用 TRAE IDE + TRAE Work 开发的完整过程，作为初赛 Demo 作品帖「TRAE 实践过程」部分的补充材料。
> 用于证明作品由 TRAE 完成，并提供可追溯的关键步。

---

## 一、开发工具与版本

| 工具 | 用途 | 版本 |
|---|---|---|
| TRAE IDE | 后端/前端/Demo 代码开发 | 最新版 |
| TRAE Work | 需求梳理、架构设计、方案讨论 | 最新版 |
| Go | 后端微服务 | 1.25.0+ |
| Node.js | 前端构建 | 20+ |
| Flutter | APP 开发 | 3.44.3 |
| Docker | 容器化 | 24+ |
| K8s | 编排部署 | 1.28+ |

---

## 二、开发流程时间线（7 个阶段）

### 阶段 1：需求调研与创意立项

**目标：** 梳理民间救援队管理痛点，确定三端协同方案。

**TRAE 运用：** 在 TRAE Work 中输入民间救援队现状描述，AI 帮助梳理出 5 大痛点（报警无门、调度混乱、过程黑盒、资源失控、对接困难），并建议三端协同架构。

**产出：** 需求文档、痛点清单、三端协同方案。

### 阶段 2：架构设计

**目标：** 拆分 11 微服务 + 3 BFF + 三前端，定义 proto 契约。

**TRAE 运用：** 用 TRAE IDE 智能体规划架构，AI 输出微服务拆分方案：
- 11 微服务：auth、equipment、gov-bridge、logistics、push、gis-analysis、task、sos-service、ai-vision、training、message
- 3 BFF：app-bff（APP 网关）、taro-bff（小程序网关）、admin-bff（管理后台网关）
- 3 前端：admin（Vue3）、miniapp（Taro）、app（Flutter）

**产出：** 架构图、proto 定义文件、服务依赖关系图。

### 阶段 3：后端微服务开发

**目标：** 实现 11 个 Go 微服务。

**TRAE 运用：** 用 TRAE IDE 逐个生成微服务代码，包括：
- proto 定义与 gRPC 实现
- 数据库模型与 Repository 层
- Service 层业务逻辑
- 鉴权、审计、错误处理中间件
- Dockerfile 与 K8s 部署清单

**验证：** 每个服务通过 `go build ./... && go vet ./...` 检查。

### 阶段 4：三前端开发

**目标：** Vue3 Web 管理后台 + Taro 小程序 + Flutter APP 三端并行开发。

**TRAE 运用：**
- **Web（Vue3 + Element Plus）：** 17 个页面（指挥中心、任务、SOS、GIS、队伍、装备、培训等）
- **小程序（Taro）：** 8 个页面（首页、紧急求助、科普知识、避难场所、志愿者招募等）
- **APP（Flutter）：** 18 个页面（救援人员端、队长端、飞手端）

**验证：** `vue-tsc` 类型检查通过、`flutter analyze` 0 issues。

### 阶段 5：BFF 网关对接

**目标：** 3 个 BFF 网关拨号 RPC + 鉴权 + 审计。

**TRAE 运用：** TRAE 生成 BFF 层代码，包括：
- gRPC 客户端拨号
- JWT 鉴权中间件
- 审计日志记录
- 字段映射（proto ↔ 前端 DTO）
- 错误透传

### 阶段 6：Demo 制作

**目标：** 用 TRAE 生成纯前端交互式 Demo，整合三端界面与流程演示。

**TRAE 运用：** 在 TRAE Work 中描述 Demo 需求，AI 生成：
- 主入口 HTML（三端切换器 + 导航 + 模态框）
- 状态管理 + 模拟数据库（内存 CRUD）
- 图表组件（纯 SVG/CSS，无第三方依赖）
- 三端页面（Web 17 + 小程序 8 + APP 18）
- 端到端流程演示（8 步可交互推进）
- 三端协同分屏演示（11 事件联动）
- 参赛评审页面（作品总览 + 创作者故事 + TRAE 实践）

### 阶段 7：静态走查与上线检查

**目标：** 全量静态检查通过。

**TRAE 运用：** TRAE IDE 执行命令并修复发现的问题：
- `go build ./... && go vet ./...`（11 服务全部通过）
- `flutter analyze`（0 issues）
- `vue-tsc --noEmit`（类型检查通过）
- 检查并修复：Go 工具链版本不匹配、Flutter iOS 工程缺失、3 处 service RPC 缺失

---

## 三、关键步骤截图清单（≥3 张）



---

## 四、关键任务 Session ID 清单（≥3 个）

| 序号 | 开发阶段 | 任务描述 | Session ID | 时间 |
|---|---|---|---|---|
| 1 | 架构设计 | 11 微服务 + 3 BFF + 三前端架构拆分 | S1 | 2026/6/23 20:06:15 |
| 2 | 后端+前端开发 | auth/task/sos 等服务 + Vue3/Taro/Flutter 三端 | S2 | 2026/6/28 13:03:34 |
| 3 | Demo 制作 | 端到端流程演示 + 三端协同分屏 | S3 | 2026/7/5 06:29:08 |
| 4 | 静态走查与修复 | go vet/build + flutter analyze + vue-tsc + 语法修复 | S4 | 2026/7/6 06:42:43 |

**完整 Session ID：**

- **S1**：`.3986199057545075:fb57d6d811eef7ec6be380d058ddc8b2_6a39d2eb7e1bcb164bb4abfe.6a3a76b70d9502b6eb359d17.6a3a76b679d9adc11afd18be:Trae CN.T(2026/6/23 20:06:15)`
- **S2**：`.3986199057545075:8c3f4f461c51728c5b082b49b1164607_6a40ab23d7d19cdf6b736191.6a40ab26d7d19cdf6b736193.6a40ab264200565aca8dd1b8:Trae CN.T(2026/6/28 13:03:34)`
- **S3**：`.3986199057545075:1cddaa24f1417ecaccbb2e851c174249_6a490610325b775fbbd1384c.6a4989342513b2bcb0b33594.6a4989344f9b951772198ab7:Trae CN.T(2026/7/5 06:29:08)`
- **S4**：`.3986199057545075:f8295d46bdec1e667a249c4487d7ecf3_6a4addca32e719bca8d18d2d.6a4adde332e719bca8d18d67.6a4adde307ea61538f9fdc1a:Trae CN.T(2026/7/6 06:42:43)`

---

## 五、关键 Prompt 片段

### 5.1 架构设计阶段

```
民间救援队伍数字化管理平台，需要支持市民小程序报警、Web 后台调度、救援人员 APP 执行三端协同。
请帮我拆分微服务架构，包含认证/任务/SOS/GIS/装备/物流/培训等核心模块，
用 Go + gRPC 实现，前端 Vue3 + Taro + Flutter。
```

### 5.2 后端服务开发

```
实现 task-service 任务服务，包含：
- 任务 CRUD（创建/查询/派发/完成/取消）
- 任务状态流转（pending→progress→done/cancelled）
- 队伍调度与资源分配
- 鉴权（JWT）+ 审计日志
- proto 定义 + gRPC 实现 + PostgreSQL 存储
```

### 5.3 流程演示页面

```
做一个端到端救援流程演示页面，8 个步骤：
SOS 接报→任务创建→队伍调度→途中追踪→到场处置→实时进展→任务完成→复盘报告。
每步可交互推进，含 GIS 定位、AI 建议、实时图传、资源监控。
```

### 5.4 三端协同分屏

```
做一个三端协同分屏演示，同一救援事件在 Web/小程序/APP 三端联动展示，
11 个事件，点击事件高亮三端对应变化，体现多端数据同步价值。
```

### 5.5 静态走查

```
对项目所有 Go 服务执行 go build ./... && go vet ./...，
对 Flutter APP 执行 flutter analyze，
对 Vue3 前端执行 vue-tsc --noEmit，
列出所有错误并逐一修复。
```

---

## 六、踩坑与解决方案

### 问题 1：Go 工具链版本不匹配

- **现象**：dockerfiles/go-service.Dockerfile 和 cicd/.gitlab-ci.yml 使用 golang:1.22，而项目要求 1.25.0+
- **影响**：部分新语法特性无法使用，CI 构建可能失败
- **解决**：通过 TRAE 让 AI 统一升级 Dockerfile 与 CI 镜像版本到 golang:1.25

### 问题 2：Flutter APP iOS 工程缺失

- **现象**：frontend/app 目录下无 Runner.xcodeproj/AppDelegate/Podfile 等 iOS 原生工程文件
- **影响**：无法构建 iOS IPA
- **解决**：用 TRAE 执行 `flutter create --platforms=ios .` 补齐 iOS 工程，手动创建 Podfile、Runner.entitlements，修改 Bundle ID 为 com.yuanlitong.yuanlitong_app

### 问题 3：3 处 service 层 RPC 缺失

- **现象**：
  - equipment-service 缺 SubmitInspection / CreateInspection
  - training-service 缺 EnrollTraining / CancelEnrollment
  - message-service 缺 gRPC DeleteAnnouncement
- **影响**：BFF 层调用失败，前端功能不可用
- **解决**：通过 TRAE 全链路补齐 service→BFF→前端透传，含 proto 定义、Repository 实现、Handler 透传

### 问题 4：三端契约一致性

- **现象**：初期三端字段命名不一致（如 taskId vs task_id vs taskCode），导致展示错乱
- **解决**：通过 TRAE 统一 proto 定义，BFF 层做字段映射，确保三端展示数据一致

### 问题 5：admin 前端 vue-tsc 报错

- **现象**：src/views/command/situation-3d/index.vue 有 17 个颜色常量未定义错误
- **解决**：补充颜色常量定义，vue-tsc 通过

### 问题 6：equipment-service 测试失败

- **现象**：handler 和 repository 包存在测试失败
- **解决**：修复测试用例与实现不匹配的问题

---

## 七、TRAE 能力运用总结

| TRAE 能力 | 运用场景 | 效果 |
|---|---|---|
| 智能体规划 | 架构设计、任务拆分 | 11 微服务拆分清晰 |
| 代码生成 | 后端/前端/Demo 全栈代码 | 全栈 1 万+ 行代码生成 |
| 命令执行 | go vet / flutter analyze / vue-tsc | 静态检查全量通过 |
| 错误修复 | 工具链版本、iOS 工程、RPC 缺失 | 6 大问题逐一解决 |
| 对话追溯 | Session ID 记录 | 全过程可追溯 |
| 多文件编辑 | 三端并行开发 | 三端契约一致 |

---

## 八、心得体会

1. **TRAE 适合复杂业务系统**：本作品 11 微服务 + 3 BFF + 三前端，TRAE 都能胜任，体现了 AI 在复杂业务系统中的应用深度。
2. **过程比结果重要**：评审最看重的是开发过程，Session ID 与截图是证明作品由 TRAE 完成的关键证据，必须保留。
3. **真实场景才有生命力**：没有追求技术炫技，而是扎根民间救援队这个真实痛点场景，所有功能都对应实际业务流程。
4. **三端协同是模式创新**：把「单端 + 后台」升级为「三端闭环」，是真正的模式创新而非功能堆砌。

---

**文档维护：** 援力通 2.0 项目组
**最后更新：** 2026-07-05
