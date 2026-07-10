# 雪球日记 ❄️

一个通过记录微小成功、用"滚雪球"可视化成长轨迹的 AI 陪伴工具，帮助用户建立正向反馈循环。

## 特性

- 📝 **3秒记录法**：快速记录小成功，AI 自动打标签
- ❄️ **雪球成长系统**：记录越多，雪球越大，从雪粒变成雪人
- 🎯 **任务管理**：四象限优先级、习惯打卡、长任务分解
- 🏆 **成就系统**：37 个成就等你解锁
- 🤖 **AI 陪伴**：智能反馈、每日提问、拖延急救
- 🎨 **精美动画**：Framer Motion 驱动的流畅交互

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

开发模式下数据存储在 `data/local-db.json`，删除该文件可重置数据。

## 桌面应用（推荐）

项目已打包为独立的 Windows 桌面应用，用户无需安装 Node.js 或执行任何命令，双击即可使用。

### 两种分发方式

| 类型 | 文件名 | 大小 | 说明 |
|------|--------|------|------|
| 安装包 | `雪球日记 Setup 1.0.0.exe` | ~177 MB | 安装到电脑，自动创建桌面和开始菜单快捷方式 |
| 便携版 | `雪球日记 1.0.0.exe` | ~141 MB | 免安装，双击即用，解压到临时目录运行 |

### 使用方式

- **安装包**：双击 `雪球日记 Setup 1.0.0.exe`，按提示安装后从桌面快捷方式启动
- **便携版**：双击 `雪球日记 1.0.0.exe` 即可启动（首次启动需等待几秒自解压）

### 桌面应用数据存储

桌面应用的数据存储在用户目录下，与开发环境隔离：

- Windows: `%APPDATA%\雪球日记\data\local-db.json`
- 卸载应用不会删除用户数据
- 如需重置数据，删除上述文件即可

### 从源码构建桌面应用

```bash
# 构建 Windows 桌面应用（安装包 + 便携版）
npm run electron:build:win
```

构建产物在 `release/` 目录下。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 + React 19 |
| 桌面应用 | Electron 33 + electron-builder |
| 样式 | Tailwind CSS 4 |
| 动画 | Framer Motion |
| 数据存储 | 本地 JSON 文件 |
| AI 服务 | 智谱 AI GLM-4-Flash |
| 测试 | Vitest |

## 项目结构

```
snowball-diary-new/
├── data/
│   └── local-db.json       # 本地数据库（开发环境）
├── electron/               # Electron 主进程
│   ├── main.ts             # 主进程入口
│   ├── server-manager.ts   # Next.js 服务器管理
│   ├── port-manager.ts     # 动态端口分配
│   └── icons/              # 应用图标
├── scripts/
│   └── copy-standalone.js  # 构建辅助脚本
├── src/
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── components/     # 共享组件
│   │   ├── tasks/          # 任务页面
│   │   ├── records/        # 记录页面
│   │   └── ...
│   ├── hooks/              # React Hooks
│   ├── lib/                # 工具函数
│   │   ├── local-db.ts     # 数据持久化层
│   │   ├── data-models.ts  # 类型定义
│   │   └── ...
│   └── contexts/           # React Context
└── docs/                   # 项目文档
```

## 文档

- [项目状态](./docs/project-status.md) - 迭代记录和变更日志
- [项目复盘](./docs/项目复盘报告.md) - 错误分析和经验总结（中文版）
- [项目复盘英文版](./docs/project-retrospective-final.md) - 全周期系统性复盘（英文终版）
- [架构设计](./docs/architecture.md) - 系统架构和数据流
- [API 设计](./docs/api-design.md) - API 接口规范

## 开发命令

```bash
npm run dev              # 启动开发服务器（Web 模式）
npm run electron:dev     # 启动 Electron 开发模式（同时运行 Next.js + Electron）
npm run build            # 构建生产版本
npm run electron:build:win  # 构建 Windows 桌面应用（安装包 + 便携版）
npm run test             # 运行测试
npm run lint             # 代码检查
```

## 环境变量（可选）

如需使用 AI 功能，创建 `.env.local` 文件：

```env
ZHIPU_API_KEY=your_zhipu_api_key
OPENAI_API_KEY=your_openai_api_key  # fallback
```

## License

MIT
