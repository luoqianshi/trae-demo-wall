# AgentTrace

AI Agent 工作复盘与成本分析系统

> 让 AI Agent 的每一次工作都有迹可循

## 功能特性

- 📋 **项目信息录入**：记录项目名称、任务目标、使用工具、模型、时间等
- 📝 **工作记录粘贴**：粘贴 AI Agent 的对话记录、命令行输出、报错信息
- 🚀 **自动复盘生成**：自动识别阶段、问题、文件变更、关键操作
- 💰 **成本与效率分析**：Token 统计、成本计算、模型表现评分
- ⚠️ **常见问题提取**：自动识别错误并给出解决方案建议
- 📥 **多格式导出**：支持导出 Markdown 日志、问题清单、JSON 数据
- 💾 **本地存储**：自动保存会话，刷新页面不丢失
- 📱 **响应式设计**：适配桌面和移动端

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录，可以部署到 Vercel、Netlify、GitHub Pages 等静态托管平台。

### 预览构建结果

```bash
npm run preview
```

## 使用说明

1. 点击 **"📋 载入示例"** 快速体验完整功能
2. 或手动填写项目信息、Token 成本数据
3. 在 AI 工作记录区域粘贴你的 Agent 日志
4. 点击 **"🚀 生成复盘"** 查看分析结果
5. 使用导出按钮下载报告文件

## 技术栈

- React 18
- TypeScript
- Vite
- 原生 CSS
- localStorage

## 项目结构

```
src/
  main.tsx              # 入口文件
  App.tsx               # 主应用组件
  styles.css            # 全局样式
  types/
    index.ts            # TypeScript 类型定义
  data/
    sampleTranscript.ts # 内置示例数据
  utils/
    parser.ts           # 日志解析逻辑
    reportGenerator.ts  # 报告生成
    cost.ts             # 成本计算与评分
    exporter.ts         # 文件导出
    storage.ts          # 本地存储
  components/
    Header.tsx          # 页面头部
    ProjectForm.tsx     # 项目信息表单
    CostForm.tsx        # 成本表单
    TranscriptInput.tsx # 日志输入区
    ReportPanel.tsx     # 报告展示
    IssueList.tsx       # 问题列表
    ExportButtons.tsx   # 导出按钮
```

## 识别的关键词

**错误关键词**：error、failed、exception、timeout、404、400、permission、not found、module not found、EPERM、symlink、报错、失败、无法、找不到、权限、中断

**动作关键词**：created、updated、modified、fixed、implemented、added、removed、refactored、创建、修改、修复、实现、新增、删除、重构

## 许可证

MIT
