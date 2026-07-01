# AI 指挥官对话式生成实施计划

> **For agentic workers:** 按任务逐个实施，完成后用 checkbox 标记。

**Goal:** 把 home 从"选卡菜单"改为"AI 指挥官对话式生成"，新增 ai-chat（chip输入）+ ai-generating（AI思考动画）两个页面，恢复"描述意图→AI理解→生成密令"链路。

**Spec:** [2026-06-24-ai-commander-dialog-design.md](file:///e:/weekend_missions/docs/superpowers/specs/2026-06-24-ai-commander-dialog-design.md)

---

## 任务列表

### A. 数据扩展

- [ ] **A1** `generate-stages.js`：`shenzhen-couple` 主题增加 `scene: { label:'情侣约会', city:'深圳南山' }`，重新生成 `js/stages.js`。

### B. index.html 结构 + CSS

- [ ] **B1** 移除 `#page-home` 的选卡结构，改为 `#page-ai-chat`（AI头像+开场白+三组chip+生成按钮）。
- [ ] **B2** 新增 `#page-ai-generating`（AI头像+动态回应+四步思考动画+进入任务按钮）。
- [ ] **B3** 新增对应 CSS：AI头像/对话气泡/chip样式/思考步骤动画，保持像素风。
- [ ] **B4** `pages` 数组在 app.js 里更新为含 `ai-chat`、`ai-generating`。

### C. app.js 逻辑

- [ ] **C1** `renderAiChat`：渲染三组 chip（场景/预算/人数），管理选中状态；AI 开场白打字效果；"生成密令"按钮启用条件。
- [ ] **C2** `startAiGenerating`：动态拼接 AI 回应文案（引用用户选择）；四步思考动画依次亮起（每步0.6s）；完成后自动进 dialog。
- [ ] **C3** 修改 `init`：boot → ai-chat（替代 home）。
- [ ] **C4** 修改 `restart`：回 ai-chat（替代 home）。

### D. 验证

- [ ] **D1** file:// 双击：boot → ai-chat → chip选择 → ai-generating → dialog → 引擎 → result → share 全线打通。
- [ ] **D2** AI 回应文案正确引用用户选择；四步动画依次亮起；新页面在外壳内风格统一。

---

> **文档结束** — 待确认后实施。
