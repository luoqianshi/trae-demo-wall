衡舟 - 源码版
================

完整项目源码，包含前后端。

环境要求：
- Node.js 18+
- npm 或 pnpm

启动方式：
1. 双击 start.bat （推荐，自动安装依赖+启动前后端，单窗口模式）
   或手动执行：
   npm install
   npm run dev:all

2. 浏览器自动打开 http://localhost:5173

API配置：
- 打开 .env 文件，填入你的 API Key
- DOUBAO_API_KEY: 火山方舟API Key（必填）
  获取：https://console.volcengine.com/ark/
- DEEPSEEK_API_KEY: DeepSeek API Key（可选）
  获取：https://platform.deepseek.com/

技术栈：
- 前端：React 19 + TypeScript + Vite + Tailwind CSS 4
- 后端：Node.js + Koa + 原生路由
- 存储：IndexedDB (Dexie.js) — 纯本地，无云端
- AI：豆包/火山方舟 + DeepSeek 双通道
- 检索：RAG + GraphRAG + Agentic RAG 三级架构

项目结构：
- src/components/    UI组件
- src/lib/           核心逻辑（RAG, GraphRAG, 记忆提取等）
- src/stores/        Zustand状态管理
- src/types/         TypeScript类型定义
- server/            后端代理服务
- start.bat          一键启动脚本
