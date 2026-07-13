<div align="center">
    <h1>❄️ admin-react-shadcn</h1>
</div>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/) [![Vite](https://img.shields.io/badge/Vite-7.3-646cff.svg)](https://vitejs.dev/)

</div>

<div align="center">

[English](README_EN.md) • [中文](README.md)

</div>

---

## 📖 介绍

**admin-react-shadcn** 是一个使用 Vite、React、TypeScript 和 Shadcn UI 构建的现代化管理后台模板。

> 基于 [shadcn-admin](https://github.com/satnaing/shadcn-admin) 的优秀作品，作者 [@satnaing](https://github.com/satnaing)

## ✨ 功能特性

- 🌓 明暗模式切换
- 📱 完全响应式
- ♿ 无障碍支持（WCAG 标准）
- 🌐 RTL 支持
- 🧩 50+ 组件
- 🔍 全局搜索
- 🎯 TypeScript 支持
- ⚡ Vite 快速开发

## 🛠️ 技术栈

- **UI:** [Shadcn UI](https://ui.shadcn.com) (TailwindCSS + RadixUI)
- **构建:** [Vite](https://vitejs.dev/)
- **路由:** [TanStack Router](https://tanstack.com/router/latest)
- **类型检查:** [TypeScript](https://www.typescriptlang.org/)
- **图标:** [Lucide Icons](https://lucide.dev/icons/)

## 📦 安装

```bash
# 克隆项目（公开仓库）
git clone https://github.com/ice-deep-dream/admin-react-shadcn.git


# 进入项目目录
cd admin-react-shadcn

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

## 🚀 常用命令

```bash
pnpm run dev      # 启动开发服务器
pnpm run build    # 构建生产版本
pnpm run lint     # 运行代码检查
pnpm run typecheck # 运行类型检查
```

## 📁 项目结构

### 核心目录

```
admin-react-shadcn/
├── src/
│   ├── components/        # 可复用组件
│   │   ├── ui/           # Shadcn UI 基础组件（已定制 RTL 支持）
│   │   ├── layout/       # 布局组件（Header, Main, Sidebar 等）
│   │   └── ...           # 其他通用组件
│   ├── features/          # 功能模块（按业务模块组织）
│   │   ├── dashboard/    # 仪表盘功能（4 个标签页：概览/架构/模板/依赖）
│   │   ├── tasks/        # 任务管理功能
│   │   └── templates/    # 开发模板和示例（核心）
│   │       ├── layout/   # 4 种布局模板
│   │       │   ├── standard-layout.tsx         # 标准布局
│   │       │   ├── standard-list-layout.tsx    # 标准列表布局
│   │       │   ├── top-nav-layout.tsx          # 顶部导航布局
│   │       │   └── tab-layout.tsx              # 标签页布局
│   │       └── components/ # 示例组件
│   │           ├── user-search.tsx             # 用户搜索示例
│   │           └── basic-components.tsx        # 基础组件示例
│   ├── routes/            # 路由定义（基于文件路由）
│   │   └── _authenticated/ # 认证后路由
│   │       ├── dashboard/  # 仪表盘路由
│   │       ├── tasks/      # 任务路由
│   │       └── templates/  # 模板路由（开发规范示例）
│   ├── lib/              # 工具函数和配置
│   ├── locales/          # 国际化文件（zh.json, en.json）
│   └── hooks/            # 自定义 React Hooks
├── docs/                 # 项目文档
│   └── template/         # 开发规范文档
│       └── 通用开发规范.md  # 核心开发规范（中文，必看）
├── public/               # 静态资源
└── package.json          # 依赖配置
```

### 核心特点

#### 1️⃣ **功能模块化的文件组织**
- ✅ **`features/` 按业务模块组织**：每个功能模块独立，便于维护和扩展
- ✅ **`routes/` 基于文件路由**：TanStack Router 自动路由，类型安全
- ✅ **`components/` 分层管理**：基础组件 vs 业务组件分离

#### 2️⃣ **开发模板系统**（核心优势）
- ✅ **4 种标准布局模板**：覆盖常见管理后台场景
  - 标准布局：适合表单、数据录入页面
  - 标准列表布局：适合列表、表格页面
  - 顶部导航布局：适合多级导航场景
  - 标签页布局：适合多标签切换场景（如仪表盘）
- ✅ **示例组件参考**：提供用户搜索、基础组件等实战示例
- ✅ **开发规范文档**：详细的 [通用开发规范](docs/template/通用开发规范.md)，包含：
  - 文件结构规范
  - 开发流程（4 步快速上手）
  - 布局规范（固定 Header + Main）
  - 组件使用规范
  - 国际化规范
  - 代码规范
  - 检查清单

#### 3️⃣ **灵活的布局系统**
- ✅ **项目自有布局系统**：主题配置、导航系统、用户菜单一体化
- ✅ **Header 内容可灵活配置**：可以不加按钮组，只保留核心功能
- ✅ **标题区域可定制**：根据业务需求简化或完整版
- ✅ **内容区域统一处理**：`faded-bottom no-scrollbar overflow-auto` 滚动优化

#### 4️⃣ **最佳实践集成**
- ✅ **TypeScript 全面支持**：类型安全，减少运行时错误
- ✅ **国际化支持**：i18n 多语言，RTL 从右到左语言支持
- ✅ **响应式设计**：移动优先，适配所有设备
- ✅ **无障碍支持**：WCAG 标准，ARIA 标签
- ✅ **主题切换**：明暗模式一键切换

### 快速上手路径

1. **阅读开发规范**：[docs/template/通用开发规范.md](docs/template/通用开发规范.md)
2. **参考布局模板**：[src/features/templates/layout/](src/features/templates/layout/)
3. **查看示例组件**：[src/features/templates/components/](src/features/templates/components/)
4. **复制模板代码**：使用规范中的快速开始模板

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 🙏 鸣谢

本项目基于 [Sat Naing](https://github.com/satnaing) 的 [shadcn-admin](https://github.com/satnaing/shadcn-admin) 项目。特别感谢提供的优秀基础！

---

<div align="center">

**Made with ❤️**

</div>
