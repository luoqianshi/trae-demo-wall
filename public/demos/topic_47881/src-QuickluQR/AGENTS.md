# AGENTS.md

本文件为在本仓库中工作的 AI 代理（Claude Code、Cursor、Copilot 等）提供协作指引。

## 语言约定

**重要**：请使用中文与用户交流。所有解释、评论和沟通都应当使用中文。技术术语、代码标识符、命令行保持原有英文形式。

## 常用命令

| 命令              | 用途                                  | 备注                                              |
| ----------------- | ------------------------------------- | ------------------------------------------------- |
| `npm run dev`     | 启动开发服务器（HMR）                 | http://localhost:5173，`strictPort: true` 不可更改 |
| `npm run build`   | 生产构建                              | 先 `tsc -b` 类型检查，再 `vite build`，产物在 `dist/` |
| `npm run preview` | 本地预览生产构建                      | —                                                 |
| `npm run lint`    | ESLint 代码检查                       | 平面配置，含 react-hooks / react-refresh 规则      |

未配置测试框架。TypeScript 类型检查内置于 `build` 命令。

## 架构概览

### 技术栈定位

- **双平台桌面/Web 应用**：React 19 + TypeScript ~6.0 + Vite 8 + Electron 42
- 支持 **Electron 桌面应用**（Windows 可打包为安装包/便携版）和 **纯 Web 应用**（可部署到静态服务器）双模式
- Electron 架构包含完整的 main/preload 进程,实现文件系统历史记录存储
- Web 模式使用 localStorage 存储历史记录,两种模式自动检测适配
- 启用了 **React Compiler**（`vite.config.ts` 中通过 `@rolldown/plugin-babel` + `babel-plugin-react-compiler` 接入）
- 构建产物使用相对路径（`base: './'`），Web 模式可部署到任意静态资源子路径

### 关键文件

**前端核心文件**
- [main.tsx](file:///d:/codes/React/QuicklyQR/src/main.tsx) — React 入口，使用 `StrictMode` 挂载到 `#root`
- [App.tsx](file:///d:/codes/React/QuicklyQR/src/App.tsx) — 根组件，直接渲染 `HomePage`
- [HomePage.tsx](file:///d:/codes/React/QuicklyQR/src/components/HomePage.tsx) — **核心业务组件**，二维码生成器的全部 UI 与逻辑（含内联 `<style>`）
- [ErrorBoundary.tsx](file:///d:/codes/React/QuicklyQR/src/components/ErrorBoundary.tsx) — React 错误边界，兜底捕获 QR 编码渲染异常
- [Toast.tsx](file:///d:/codes/React/QuicklyQR/src/components/Toast.tsx) — 轻量 Toast 通知组件（订阅模式）
- [toastStore.ts](file:///d:/codes/React/QuicklyQR/src/components/toastStore.ts) — Toast 状态管理（发布订阅，供组件外调用 `showToast`）
- [useHistory.ts](file:///d:/codes/React/QuicklyQR/src/hooks/useHistory.ts) — 历史记录 Hook，实现 Electron/Web 双平台存储适配
- [qr.ts](file:///d:/codes/React/QuicklyQR/src/utils/qr.ts) — QR 相关工具函数（字节长度计算、容量常量、SVG→PNG 转换、复制、下载）
- [index.css](file:///d:/codes/React/QuicklyQR/src/index.css) — 全局样式与 CSS 自定义属性（浅色/深色双主题、渐变背景装饰）

**Electron 架构文件**
- [electron/main.ts](file:///d:/codes/React/QuicklyQR/electron/main.ts) — Electron 主进程，创建窗口、IPC 通信、文件系统历史记录管理
- [electron/preload.ts](file:///d:/codes/React/QuicklyQR/electron/preload.ts) — Preload 脚本，通过 `contextBridge` 安全暴露 Electron API 给渲染进程
- [electron/types.ts](file:///d:/codes/React/QuicklyQR/electron/types.ts) — 共享类型定义（HistoryItem 接口）
- [electron-env.d.ts](file:///d:/codes/React/QuicklyQR/src/electron-env.d.ts) — TypeScript 全局类型声明，为 window.electronAPI 提供类型支持

**配置文件**
- [vite.config.ts](file:///d:/codes/React/QuicklyQR/vite.config.ts) — `base: './'`、`server.port: 5173`、`strictPort: true`，启用 React Compiler + Electron 插件
- [eslint.config.js](file:///d:/codes/React/QuicklyQR/eslint.config.js) — 平面配置，仅对 `**/*.{ts,tsx}` 应用规则
- [tsconfig.electron.json](file:///d:/codes/React/QuicklyQR/tsconfig.electron.json) — Electron 主进程 TypeScript 配置

### 核心业务逻辑

#### 文本长度校验（RangeError 防护）

`RangeError: Data too long` 已通过三层防护修复：

1. **预校验**：`handleGenerateQR` 在生成前使用 `TextEncoder` 计算 UTF-8 字节长度，与当前纠错等级的最大容量比较，超长时通过 Toast 提示并阻止生成。
2. **UI 反馈**：实时显示字节计数和容量进度条（绿→黄→红），超限禁用生成按钮、输入框标红。
3. **ErrorBoundary 兜底**：即使预校验遗漏（如库版本变化导致容量表不准），ErrorBoundary 会渲染友好错误提示而非白屏崩溃。

容量常量定义在 [qr.ts](file:///d:/codes/React/QuicklyQR/src/utils/qr.ts) 的 `QR_CAPACITY` 中，对应 QR 码 Version 40 字节模式各容错等级的保守上限：

| 等级 | 最大字节 | 警告阈值 | 说明                |
| ---- | -------- | -------- | ------------------- |
| L    | 2900     | 2300     | ~7% 纠错，最大容量  |
| M    | 2280     | 1800     | ~15% 纠错，默认等级 |
| Q    | 1620     | 1300     | ~25% 纠错           |
| H    | 1240     | 950      | ~30% 纠错，最强容错 |

#### 图像导出

`svgToPngBlob(svg, scale=4)` 将 SVG 序列化为 Blob → 绘制到 Canvas（4x 缩放获得高清输出）→ 转为 PNG Blob。`copySvgAsPng` 和 `downloadSvgAsPng` 基于此实现，使用 `navigator.clipboard.write` 和 `<a download>` 触发下载。失败时通过 Toast 而非 `alert` 提示。

#### 纠错等级选择器

用户可在 L/M/Q/H 之间切换，切换时容量条自动更新，生成按钮的禁用状态也同步变化。当内容超长时，用户可降低纠错等级（如从 M 降到 L）以容纳更多数据。

#### 快捷键

`Ctrl/Cmd + Enter` 在文本框中可直接触发生成。

#### 历史记录功能

项目已实现完整的历史记录系统,支持双平台存储:

1. **Electron 桌面应用模式**:历史记录存储在文件系统 `data/history/records.json`,通过 Electron IPC 通信实现主进程与渲染进程的数据同步。历史记录在打包后的便携版中存储在便携版可执行文件所在目录。

2. **Web 浏览器模式**:历史记录存储在 `localStorage`,键名为 `quicklyqr-history`,最多保留 1000 条记录。

3. **自动环境检测**:`useHistory` Hook 通过检查 `window.electronAPI` 是否存在自动判断运行环境,并选择相应的存储策略。

4. **功能特性**:
   - 自动保存生成的二维码配置(内容、纠错等级、白色背景选项)
   - 10秒内重复生成自动去重
   - 支持历史记录搜索(关键词高亮匹配)
   - 支持删除单条记录和清空全部历史
   - 点击历史记录项可恢复配置并重新生成

5. **数据结构**:HistoryItem 包含 `id`、`content`、`ecLevel`、`whiteBg`、`createdAt` 字段,按创建时间倒序排列。

### 样式策略

- 全局主题：[index.css](file:///d:/codes/React/QuicklyQR/src/index.css) 中 `:root` 定义 CSS 自定义属性，`@media (prefers-color-scheme: dark)` 覆盖暗色变量
- 背景装饰：`body::before` / `body::after` 添加两个径向渐变光斑营造氛围（移动端隐藏）
- `HomePage.tsx` 内所有组件样式通过 `<style>` 标签内联注入（全局类名，非 CSS Modules）
- 断点：全局字号 1024px，HomePage 布局 768px（双栏→单栏）

## 编码与改动约定

### TypeScript

- `tsconfig.app.json` 启用了 `noUnusedLocals`、`noUnusedParameters`、`verbatimModuleSyntax`、`erasableSyntaxOnly`
- 未使用的参数需以 `_` 前缀标记
- 导入类型时使用 `import type`

### React

- 函数组件 + Hooks，无 class 组件
- React Compiler 已启用，**不要**手动使用 `useMemo` / `useCallback` 进行微优化；但可在需要引用稳定性时合理使用（当前 `useCallback` 用法是符合规范的——编译器不会替代所有引用稳定需求）
- 遵守 `eslint-plugin-react-hooks` 规则
- **不要**在同一文件中同时导出 React 组件和非组件值（会触发 `react-refresh/only-export-components` 规则）；非组件逻辑请抽到独立文件（参考 `Toast.tsx` / `toastStore.ts` 的分离模式）

### 修改建议清单

| 改动                                | 注意事项                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| 修改二维码尺寸 / 容错等级           | 同步更新 `QR_CAPACITY` 容量表和 `QRCodeSVG` 的 `size` / `level` props；导出 PNG 的 `scale` 参数也可能需要调整 |
| 调整容量阈值                        | 修改 [qr.ts](file:///d:/codes/React/QuicklyQR/src/utils/qr.ts) 中的 `QR_CAPACITY`，注意这是保守上限，实际极限受库实现影响 |
| 添加 Logo / 内嵌图片                | `qrcode.react` 支持 `imageSettings` prop，可在 QR 码中心嵌入 Logo，注意会降低有效纠错能力        |
| 增强历史记录功能                    | 已实现基础历史记录（Electron 文件系统/Web localStorage 双平台存储），可扩展：收藏/分组/标签功能、数据导出导入 |
| 添加测试                            | 当前无测试框架，推荐引入 Vitest（与 Vite 集成最佳）                                            |
| 删除内联 `<style>`                  | 迁移到 CSS Modules 或独立 CSS 文件时注意类名作用域问题                                         |
| 新增 Toast 类型/动画                | 修改 [toastStore.ts](file:///d:/codes/React/QuicklyQR/src/components/toastStore.ts) 和 [Toast.tsx](file:///d:/codes/React/QuicklyQR/src/components/Toast.tsx) |
| Electron 打包配置                   | 修改 [package.json](file:///d:/codes/React/QuicklyQR/package.json) 中 `build` 字段,调整目标平台、安装选项、文件关联等 |

## 不要做的事

- 不要修改 `.gitignore` 中已存在的忽略规则
- 不要在 `package.json` 中升级 major 版本而不验证（React 19 / Vite 8 / TypeScript 6 均为前沿版本）
- 不要在组件文件中同时导出组件和非组件常量/函数（react-refresh 规则）
- 不要使用 `alert()` / `confirm()` 等原生弹窗，使用 `showToast()` 代替
- 不要为兼容旧浏览器而引入 polyfill 而不先确认目标浏览器范围
- 不要在未运行 `npm run lint` 与 `npm run build` 验证的情况下提交代码变更
