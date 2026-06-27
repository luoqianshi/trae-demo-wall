# QuicklyQR

一个基于 React 19 + TypeScript + Vite 8 的二维码生成器 Web 应用。输入文本或网址，即可生成二维码，并支持复制到剪贴板或下载为高清 PNG 图片。

## 功能特性

- 文本 / 网址输入并生成二维码（240×240，支持 L/M/Q/H 四级容错等级切换）
- **长文本保护**：实时字节计数 + 容量进度条，超长时禁用生成并给出友好提示，三层防护杜绝 `RangeError: Data too long` 崩溃
- 可选「折叠多余空白」：将连续空白字符合并为单个空格后再生成
- **纠错等级选择器**：L（最大容量）/ M（默认推荐）/ Q / H（最强容错）四级切换，自动适配容量上限
- 复制二维码图像到系统剪贴板（PNG 格式，4x 高清输出）
- 下载二维码为 `qrcode.png`（高清 PNG）
- **Toast 通知**替代原生 alert，操作反馈更优雅
- **快捷键支持**：`Ctrl/Cmd + Enter` 快速生成
- **ErrorBoundary** 兜底：即使编码异常也不会白屏
- 一键清空输入与生成结果
- 双栏卡片布局，响应式设计，移动端自动切换为单栏
- 自动适配浅色 / 深色主题（基于 `prefers-color-scheme`）
- 渐变背景装饰、毛玻璃卡片、流畅交互动效

## 技术栈

| 类别       | 选型                                                              |
| ---------- | ----------------------------------------------------------------- |
| 框架       | React 19                                                          |
| 语言       | TypeScript ~6.0                                                   |
| 构建工具   | Vite 8                                                            |
| 二维码库   | [qrcode.react](https://github.com/zpao/qrcode.react) ^4.0.0       |
| 编译器     | React Compiler（通过 `babel-plugin-react-compiler` 启用）          |
| 代码规范   | ESLint + typescript-eslint + react-hooks + react-refresh 插件      |

## 项目结构

```
QuicklyQR/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/                # 静态图片资源
│   ├── components/
│   │   ├── HomePage.tsx       # 二维码生成器主页面（含内联样式与逻辑）
│   │   ├── ErrorBoundary.tsx  # React 错误边界，兜底 QR 编码异常
│   │   ├── Toast.tsx          # Toast 通知组件
│   │   └── toastStore.ts      # Toast 发布订阅状态管理
│   ├── utils/
│   │   └── qr.ts              # QR 工具函数（字节长度、容量常量、SVG→PNG、复制/下载）
│   ├── App.tsx                # 应用根组件，渲染 HomePage
│   ├── App.css                # （未使用，模板遗留）
│   ├── index.css              # 全局样式与 CSS 自定义属性（主题变量、渐变背景）
│   └── main.tsx               # React 入口，挂载到 #root
├── index.html                 # HTML 模板（title: QuicklyQR - 快速二维码生成器）
├── vite.config.ts             # Vite 配置（base: './', 端口 5173 严格模式）
├── tsconfig.json              # TypeScript 配置根
├── tsconfig.app.json          # 应用代码 TS 配置
├── tsconfig.node.json         # Node 端 TS 配置
├── eslint.config.js           # ESLint 平面配置
└── package.json
```

## 快速开始

### 环境要求

- Node.js（建议 18+）
- npm（或 pnpm / yarn）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认在 http://localhost:5173 启动（`strictPort: true`，端口被占用会直接报错而非切换）。

### 构建生产版本

```bash
npm run build
```

构建流程为 `tsc -b` 类型检查 + `vite build` 打包，产物输出到 `dist/`。

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 使用说明

1. 在文本框中输入要生成二维码的内容（文本或网址）。
2. （可选）选择纠错等级：L 级容纳最多数据，H 级容错能力最强，默认 M 级适合大多数场景。
3. （可选）勾选「折叠多余空白」以压缩连续空白字符。
4. 点击「生成二维码」按钮（或按 `Ctrl/Cmd + Enter`），二维码将显示在右侧。
5. 点击「复制图像」将高清 PNG 复制到剪贴板，或点击「下载 PNG」保存图片。
6. 当输入内容接近或超过容量上限时，进度条和字数提示会变色提醒，超长时生成按钮自动禁用。

> - 复制图像功能依赖浏览器 `ClipboardItem` API，请在现代浏览器（如最新版 Chrome / Edge / Firefox）中使用；非 HTTPS 环境下可能限制剪贴板写入，此时请改用下载功能。
> - 中文等多字节字符占用更多字节空间（每个中文字符约 3 字节），实际可容纳字数少于英文字符。

## QR 容量参考（字节数）

| 纠错等级 | 最大字节 | 适合场景                |
| -------- | -------- | ----------------------- |
| L        | ~2900    | 长文本、长网址          |
| M（默认）| ~2280    | 日常使用，平衡容错与容量 |
| Q        | ~1620    | 需要中等容错的场景      |
| H        | ~1240    | 印刷、易污损环境        |

## 部署说明

`vite.config.ts` 中设置了 `base: './'`，产物使用相对路径，可直接部署到任意静态资源目录（包括子路径），无需修改配置即可托管在 GitHub Pages、Netlify、Vercel、对象存储等平台。

## 许可证

私有项目，未声明开源许可证。
