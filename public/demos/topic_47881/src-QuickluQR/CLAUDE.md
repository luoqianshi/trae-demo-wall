# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Setting

**重要**: 请使用中文与用户交流。所有解释、评论和沟通都应当使用中文。技术术语和代码标识符保持原有形式。

## Commands

### Development
- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

### Testing & Quality
- No test framework configured yet - add Jest/Vitest if needed
- TypeScript checks are built into the `build` command

## Code Architecture

### Project Structure
这是一个Electron + React + TypeScript + Vite项目，具有以下关键组件：

**核心文件:**
- `src/main.tsx` - React应用程序入口点，使用StrictMode
- `src/App.tsx` - 主应用程序组件（包含QR码生成器）
- `src/components/HomePage.tsx` - 主页组件，包含QR码生成功能
- `src/index.css` - 全局CSS，使用CSS自定义属性进行主题化
- `src/App.css` - 组件特定样式，使用CSS嵌套语法

**资产:**
- `src/assets/` - 图像资源 (hero.png, react.svg, vite.svg)

**配置:**
- `main.js` - Electron主进程文件
- `preload.js` - Electron预加载脚本
- `vite.config.ts` - Vite配置
- `package.json` - 项目依赖和脚本配置
- `tsconfig.json` & related - TypeScript配置
- `eslint.config.js` - ESLint规则

### Key Technologies
- **React 19** with TypeScript and React Compiler enabled
- **Vite 8** as build tool with HMR support
- **Modern CSS** with custom properties and dark mode support
- **ESLint** with TypeScript support and React hooks plugins

### Current State
This project appears to be a template/starting point for a Picture Editor application. Currently contains:
- Basic starter UI with React and Vite branding
- Responsive design with dark mode support
- Counter functionality example
- Documentation and community links

The actual picture editing functionality would need to be implemented by adding image processing libraries, canvas manipulation, or other editor features.

### Styling Approach
- Uses CSS custom properties (`:root`) for consistent theming
- Responsive design with mobile breakpoints at 1024px
- Dark mode auto-detection via `prefers-color-scheme`
- Modern layout with CSS Grid/Flexbox
- CSS nesting syntax (likely processed by a preprocessor)