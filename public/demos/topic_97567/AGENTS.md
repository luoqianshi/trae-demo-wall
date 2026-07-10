<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 雪球日记项目文档

## 项目基本信息

- **项目名称**: 雪球日记
- **项目描述**: 一个通过记录微小成功、用"滚雪球"可视化成长轨迹的AI陪伴工具，帮助用户建立正向反馈循环
- **开发阶段**: V3.0 桌面应用版
- **当前状态**: 已打包为 Electron 桌面应用，用户双击即可启动，无需命令行操作

## 技术栈

### 前端

- **框架**: Next.js 16.2.4
- **UI库**: React 19.2.4
- **样式**: Tailwind CSS 4.2.2
- **动画**: Framer Motion 12.38.0
- **数据可视化**: Recharts 3.8.1
- **测试**: Vitest 4.1.5

### 桌面应用

- **运行时**: Electron 33
- **打包工具**: electron-builder 25
- **分发格式**: NSIS 安装包 + 便携版 exe
- **主进程**: TypeScript 编写，CommonJS 输出

### 后端

- **数据存储**: 本地 JSON 文件（三层架构：Storage → Repository → API）
- **存储原语**: 文件锁、WAL 恢复、原子写入、事务
- **认证**: 自动登录（本地模式）

### AI服务

- **主API**: 智谱AI GLM-4-Flash（国内免费服务）
- **Fallback**: OpenAI + 本地模板

## 架构分层

```
┌─────────────────────────────────┐
│  Electron 主进程 (electron/)    │  窗口管理、服务器启动、端口分配
├─────────────────────────────────┤
│  Next.js Server (standalone)    │  API 路由处理、SSR
├─────────────────────────────────┤
│  Repository 层 (lib/repositories/)│  领域逻辑、数据访问
├─────────────────────────────────┤
│  Storage 层 (lib/storage/)       │  JSON 持久化、锁、WAL
└─────────────────────────────────┘
```

## 设计规范（必须遵守）

### 全局样式

- 全局背景色：`bg-[#FFF8F0]`（暖奶油色），禁止使用 `bg-stone-50` 或其他冷灰色
- 卡片：`bg-white rounded-3xl shadow-lg border border-white/80`
- 渐变头部：`bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] rounded-3xl p-5 shadow-lg`
- 视图切换按钮：`p-1 bg-white/20 rounded-2xl`，选中 `bg-white text-[#FFB6C1]`
- 输入框：`bg-[#FFF8F0]/50 border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#FFB6C1]/50`
- 按钮：`bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB] text-white rounded-2xl`
- 背景装饰：`blur-3xl` 模糊圆形
- 进度条：`bg-gray-100 rounded-full h-2` + `bg-gradient-to-r from-[#FFB6C1] to-[#87CEEB]`
- 标签：`px-2.5 py-1 rounded-full text-xs font-medium`
- 卡片左侧装饰条：`border-l-4 border-l-[#FFB6C1]`（目标）/ `border-l-4 border-l-[#87CEEB]`（独立）

### 四象限颜色配置

- Q1（立即做）：`bg-red-50`
- Q2（计划做）：`bg-blue-50`
- Q3（委托）：`bg-orange-50`
- Q4（删除）：`bg-gray-100`

## 核心概念（必须理解）

### 任务分类逻辑

```
任务类型 (task_type):
├── quick   = 快速任务 → "⚡ 快速任务"分组
├── normal  = 普通任务 → "📋 普通任务"分组 或 按目标分组
├── big     = 长任务 = 目标本身 → 显示为自己的分组（标题就是目标名）
└── habit   = 习惯 → "🔄 习惯"分组

关联关系:
├── goal_id    → 关联到 goals 表中的目标（旧数据）
├── type=big   → 本身就是目标，不需要 goal_id
├── type=habit → 习惯，单独分组
└── type=quick → 快速任务，纯文本无属性
```

### 目标视图分组优先级

1. **🎯 长任务 (big)** → 每个 big task 显示为自己的分组，标题=任务标题
2. **🔄 习惯 (habit)** → 统一归入"🔄 习惯"分组
3. **⚡ 快速任务 (quick)** → 统一归入"⚡ 快速任务"分组
4. **📁 目标关联** → 关联到 goals 表的任务，按目标分组
5. **📋 普通任务** → 未关联目标的普通任务

## 项目结构

```
snowball-diary-new/
├── data/
│   └── local-db.json           # 本地数据库（开发环境）
├── electron/                   # Electron 主进程
│   ├── main.ts                 # 主进程入口（窗口管理、生命周期）
│   ├── server-manager.ts       # Next.js standalone 服务器管理
│   ├── port-manager.ts         # 动态端口分配（避免冲突）
│   ├── preload.ts              # 预加载脚本
│   ├── tsconfig.json           # Electron TS 编译配置（CommonJS）
│   └── icons/icon.ico          # 应用图标
├── scripts/
│   └── copy-standalone.js      # 构建辅助：清理 standalone + 复制静态资源
├── src/
│   ├── app/
│   │   ├── api/                # API 路由
│   │   │   ├── achievements/       # 成就
│   │   │   ├── ai/                 # AI（auto-tag/emotion/feedback/growth-report/question/step-breakdown/task-breakdown）
│   │   │   ├── analytics/          # 埋点
│   │   │   ├── auth/               # 认证（login/profile/register）
│   │   │   ├── challenges/         # 挑战
│   │   │   ├── encouragement/      # 鼓励墙
│   │   │   ├── growth/timeline/    # 成长时间线
│   │   │   ├── procrastination/    # 拖延干预
│   │   │   ├── records/            # 记录（含 follow-up）
│   │   │   ├── reminders/          # 提醒
│   │   │   ├── rewards/            # 奖励
│   │   │   ├── snowball/stats/     # 雪球统计
│   │   │   └── tasks/              # 任务（含 [id]/checkin、[id]/subtasks、big、quadrant、thresholds）
│   │   ├── components/
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── records/
│   │   ├── review/
│   │   ├── tasks/
│   │   └── page.tsx
│   ├── hooks/
│   ├── lib/
│   │   ├── data-models.ts          # 共享类型和常量
│   │   ├── local-db.ts             # 数据库入口（路由到 Repository）
│   │   ├── api-auth.ts             # 认证中间件
│   │   ├── quadrant-utils.ts       # 四象限计算
│   │   ├── score-engine.ts         # 分数引擎
│   │   ├── achievement-engine.ts   # 成就引擎
│   │   ├── repositories/           # Repository 层（13 个领域仓库 + base 基类）
│   │   ├── storage/                # Storage 层（json-storage/lock/wal/types）
│   │   └── types/entities.ts       # 实体类型定义
│   └── contexts/
├── docs/
└── package.json
```

## 开发命令

```bash
# Web 开发模式
npm run dev                      # 启动 Next.js 开发服务器（http://localhost:3000）

# Electron 桌面应用
npm run electron:dev             # 同时启动 Next.js + Electron 开发模式
npm run electron:compile         # 仅编译 Electron TypeScript
npm run electron:build:win       # 构建 Windows 桌面应用（安装包 + 便携版）

# 质量保证
npm run build                    # 构建 Next.js 生产版本
npm run test                     # 运行 Vitest 单元测试
npm run lint                     # 代码检查

# 测试缺口分析
npm run test:gap                 # 分析测试覆盖缺口
```

## 桌面应用构建

### 构建流程

`npm run electron:build:win` 串行执行：
1. `next build` — 构建 standalone 服务器包
2. `node scripts/copy-standalone.js` — 清理 standalone 不必要文件 + 复制静态资源
3. `tsc -p electron/tsconfig.json` — 编译 Electron TypeScript
4. `electron-builder --win` — 打包为 NSIS 安装包 + 便携版

### 关键技术点

- **standalone 模式**: `next.config.ts` 中 `output: "standalone"` 输出独立服务器包
- **文件追踪排除**: `outputFileTracingExcludes` 防止 docs/scripts/electron/release 等目录被错误打包
- **ELECTRON_RUN_AS_NODE=1**: 生产模式下让 Electron 以纯 Node.js 模式运行 server.js（关键修复）
- **动态端口**: `port-manager.ts` 从 3000 开始寻找可用端口
- **数据隔离**: 生产环境数据存储在 `%APPDATA%/雪球日记/data/local-db.json`，通过 `LOCAL_DB_FILE` 环境变量指定

### 产物

| 类型 | 文件名 | 大小 |
|------|--------|------|
| 安装包 | `雪球日记 Setup 1.0.0.exe` | ~177 MB |
| 便携版 | `雪球日记 1.0.0.exe` | ~141 MB |

## 环境配置

### 环境变量（本地运行无需配置）

- **ZHIPU_API_KEY**: 智谱AI API密钥（GLM-4-Flash）
- **OPENAI_API_KEY**: OpenAI API密钥（fallback）

### 本地运行（Web 开发模式）

```bash
npm install
npm run dev
```

打开 http://localhost:3000 即可使用。数据自动保存到 `data/local-db.json`。

### 本地运行（Electron 开发模式）

```bash
npm run electron:dev
```

同时启动 Next.js 开发服务器和 Electron 窗口。

## 数据存储

### 三层架构

1. **Storage 层** (`lib/storage/`): JSON 文件持久化原语
   - `json-storage.ts` — 原子写入、事务支持
   - `lock.ts` — 文件锁（引用计数）
   - `wal.ts` — WAL（Write-Ahead Log）崩溃恢复
   - `types.ts` — 存储类型定义

2. **Repository 层** (`lib/repositories/`): 13 个领域仓库
   - `base.ts` — 基类
   - task / record / achievement / challenge / conversation / encouragement / growth / procrastination / reminder / score / threshold / user / user-settings

3. **API 层** (`app/api/`): Next.js Route Handlers

### 数据文件位置

- **开发环境**: `data/local-db.json`
- **桌面应用**: `%APPDATA%/雪球日记/data/local-db.json`

### 数据重置

删除对应 `local-db.json` 文件后重启应用，会自动创建默认数据。

## 注意事项

1. **数据存储**: 本地 JSON 文件，三层架构（Storage → Repository → API），支持事务和崩溃恢复
2. **桌面应用**: Electron + Next.js standalone，双击 exe 即可启动，无需 Node.js 环境
3. **构建产物**: standalone 模式输出独立服务器包，electron-builder 打包为安装包和便携版
4. **测试**: 742+ 单元测试，覆盖 Repository、Storage、API、引擎等各层
5. **Tailwind CSS**: 使用 v4 版本
6. **动态组件**: 使用 `next/dynamic` + `ssr: false` 加载动画组件
7. **AI服务**: 智谱AI GLM-4-Flash 为主，OpenAI 为 fallback
8. **文件追踪**: `next.config.ts` 中 `outputFileTracingExcludes` 排除不必要目录，防止包体积膨胀

---

*本文档更新于: 2026-07-10*

**更新历史**：
- **2026-07-10**: 桌面应用改造完成
  - 新增 Electron 主进程（main/server-manager/port-manager/preload）
  - 新增 `scripts/copy-standalone.js` 构建辅助脚本
  - `next.config.ts` 添加 `output: "standalone"` 和 `outputFileTracingExcludes`
  - `package.json` 新增 electron:dev / electron:compile / electron:build / electron:build:win 脚本
  - 打包为 NSIS 安装包（~177 MB）和便携版（~141 MB）
- **2026-07-09**: 后端系统重构
  - 新增 Storage 层（文件锁、WAL 恢复、原子写入、事务）
  - 新增 Repository 层（13 个领域仓库 + base 基类）
  - 新增 6 个原子方法（如 completeTaskWithScore）
  - 测试覆盖扩展至 742 个测试（含 21 个新边界测试）
  - 修复 9 个缺陷（H-1~H-7、M-1/M-5、createTask 字段覆盖 bug）
- **2026-05-20**: 项目文件夹整理
- **2026-05-16**: 完成 Supabase → 本地 JSON 文件持久化迁移
