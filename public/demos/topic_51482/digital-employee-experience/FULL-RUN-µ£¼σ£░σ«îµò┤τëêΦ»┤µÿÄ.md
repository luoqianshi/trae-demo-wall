# 本地完整版运行说明

完整能力需要启动 Python Sidecar：

```bash
npm install
npm run setup:bridge
npm run dev:all
```

浏览器打开：

```text
http://localhost:5173
```

启动 Sidecar 后，可以体验：

- 本地 CLI 探测与 persona 注入；
- 多员工会话；
- Job 创建、澄清、规划、执行、汇总；
- Markdown 报告、脚本和文档类产物生成；
- 实验模式下的项目文件写入确认流程。

当前演示版主要复用 Claude Code CLI 内核做多 persona 调度；架构已经保留多 CLI adapter 扩展位，后续可接入 Gemini CLI、Codex、Cursor CLI、Trae CLI、Qoder CLI、OpenClaw、Hermes 等本地 Agent 内核。
