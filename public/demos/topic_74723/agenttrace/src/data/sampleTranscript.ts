export const sampleTranscript = `[任务目标]
使用 TRAE / Codex 实现一个 AI 文档排版助手的前端 Demo，要求包含文件上传区域、规则检查区域和导出报告按钮。

[阶段 1]
AI 创建了 Vite + React + TypeScript 项目。
Command: npm create vite@latest docpilot -- --template react-ts
Command: npm install
Created src/App.tsx
Created src/styles.css
Created src/components/UploadPanel.tsx

[阶段 2]
AI 实现了基础页面，但运行时出现报错。
Error: Module not found: Can't resolve './components/Uploadpanel'
可能原因：文件名大小写不一致，UploadPanel.tsx 被错误引用为 Uploadpanel。

[阶段 3]
AI 修改了导入路径。
Fixed src/App.tsx import path.
Command: npm run dev
页面可以正常打开。

[阶段 4]
AI 尝试添加文件读取功能，但浏览器控制台出现 permission 相关报错。
Exception: Permission denied when reading local file path.
原因：浏览器不能直接读取用户本地绝对路径，必须通过 input file 由用户选择文件。

[阶段 5]
AI 改为使用 input type="file" 和 FileReader。
Updated src/components/UploadPanel.tsx
Implemented FileReader text preview.
Command: npm run build
Build success.

[阶段 6]
本次任务部分完成。核心页面和文件读取流程已跑通，但还没有实现真正的 Word 格式检查，只做了文本预览和模拟报告。`;

export const sampleProjectMeta = {
  projectName: "DocPilot - AI 文档排版助手",
  taskGoal: "实现一个 AI 文档排版助手的前端 Demo，包含文件上传、规则检查和导出报告功能",
  tool: "TRAE" as const,
  modelName: "Claude 3.5 Sonnet",
  startTime: "2024-01-15 14:00",
  endTime: "2024-01-15 14:45",
  durationMinutes: 45,
  status: "partial" as const,
};

export const sampleCostMeta = {
  inputTokens: 12500,
  outputTokens: 4200,
  cacheHitTokens: 3800,
  totalCost: 0.32,
  currency: "USD" as const,
  retries: 2,
  interruptions: 1,
};
