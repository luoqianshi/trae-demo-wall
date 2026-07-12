# TRAE Session Prompts

Use one prompt per TRAE Session. These Session IDs can later be listed in the competition post.

Before each session, set the workspace to:

`E:\learning\Trae比赛\workspace-control-contest-copy`

## Shared Guardrail Block

Paste this block at the top of every TRAE task:

```text
你只能在 E:\learning\Trae比赛\workspace-control-contest-copy\contest\game-demo 下新增或修改文件。

不要修改原运行目录：
E:\learning\新建文件夹\workspace-control

不要执行 PowerShell。
不要关闭真实窗口。
不要切换真实虚拟桌面。
不要修改 PowerToys 配置。
不要读取真实浏览器 URL。
不要访问外部 CDN。
不要使用 npm 或构建工具。
不要虚构链接、截图或 Session ID。

本 Demo 是纯 HTML/CSS/JS 前端模拟，用来让评委体验 Workspace Switcher 的完整流程。真实执行能力由录屏、实验报告和截图证明。
```

## Session 1: Create Offline Demo Skeleton

```text
你现在开始实现 Workspace Switcher 的参赛交互 Demo。请先创建离线静态骨架。

目标：
在 contest/game-demo 下创建一个可双击打开的 HTML Demo 骨架。

请创建：
- index.html
- README.md
- package-note.md
- assets/css/style.css
- assets/js/app.js
- assets/js/demo-data.js
- assets/js/scenes.js
- assets/img/.gitkeep
- docs/acceptance-checklist.md
- docs/post-materials-template.md
- docs/session-notes-template.md

页面必须包含：
1. 标题：Workspace Switcher 游戏化交互 Demo
2. 明显声明：这是模拟演示，不会操作真实系统。
3. 顶部 HUD：当前关卡、任务进度、模拟状态。
4. 主视觉占位：4 个虚拟桌面、2 块屏幕、28 个窗口的概念展示。
5. 控制按钮：开始任务、扫描工作区、保存快照、进入游戏/专注模式、恢复工作区、查看实验报告、重新开始。
6. 右侧或底部事件日志区域，日志行必须带 `[SIMULATED]`。

demo-data.js 先写入这些实验指标：
- Desktops before: 4
- Screens: 2
- Baseline visible windows: 28
- Game mode exit code: 0
- Desktops after game mode: 1
- Residual configured and managed close targets: 0
- Minimized snapshot entries excluded: 2
- Restore exit code: 0
- Desktops after restore: 4
- Browser args using --new-window: 8/8
- PowerToys duplicate app entries: 0
- Hard Failures: None

scenes.js 先定义 5 个场景：
1. Briefing
2. Diagnose Chaos
3. Save Snapshot
4. Game / Focus Mode
5. Restore Workspace
6. Verification Report

README.md 说明如何双击打开、为什么这是模拟 Demo、真实能力如何由录屏和实验报告证明。

docs/post-materials-template.md 必须包含不少于 3 个开发过程截图占位和不少于 3 个真实 TRAE Session ID 占位，并明确提醒不要虚构。

完成后列出新增文件和本地打开方式。
```

## Session 2: Implement Mission State Machine

```text
请继续实现 contest/game-demo 的任务状态机。

目标：
让评委能按顺序完成：
欢迎 -> 扫描工作区 -> 保存快照 -> 进入游戏/专注模式 -> 恢复工作区 -> 查看实验报告。

请修改：
- assets/js/scenes.js
- assets/js/app.js
- index.html
- assets/css/style.css

要求：
1. scenes.js 中每个场景包含 id、title、progress、statusText、description、metrics、tips。
2. app.js 实现状态机和按钮可用/禁用逻辑。
3. 每次状态变化都追加一条 `[SIMULATED]` 日志。
4. 进度从 0% 到 100%。
5. 未完成前置步骤时，后续按钮禁用。
6. 每个场景显示对应指标。
7. 报告阶段显示完整指标表。
8. 页面始终可见“模拟演示，不操作真实系统”的提示。

状态指标要求：
- Diagnose: desktops 4, screens 2, windows 28
- Snapshot: minimized snapshot entries excluded 2
- Game mode: exit code 0, desktops after game mode 1, residual close targets 0
- Restore: restore exit code 0, desktops after restore 4, browser args 8/8, duplicate app entries 0
- Report: Hard Failures None

不要添加任何真实系统操作代码。
```

## Session 3: Build Desktop, Screen, Window, and Browser Visual Simulator

```text
请增强 contest/game-demo 的视觉模拟器。

目标：
让评委直观看到 4 个虚拟桌面、2 块屏幕、28 个窗口，以及恢复时 8/8 浏览器 URL 归位。

请在 assets/js/demo-data.js 中补充：
1. desktops: 4 个桌面
   - 桌面 1：开发主线
   - 桌面 2：资料检索
   - 桌面 3：文档记录
   - 桌面 4：沟通协作
2. screens: 主屏、副屏
3. windows: 28 个模拟窗口
   - 类型包含 TRAE/editor、Edge、Chrome、OneNote、File Explorer、Terminal、PowerToys、Docs、Chat
   - 每个窗口包含 id、title、app、desktopId、screenId、status、url 可选
4. browserUrls: 8 条模拟浏览器 URL 条目
   - 不要使用真实外部链接，可以使用 example.local 或 local-demo 路径

请在页面中实现：
1. Workspace Map: 4 个桌面卡片。
2. Dual Screen Simulator: 主屏/副屏两个屏幕面板。
3. Window Cards: 根据当前状态渲染窗口。
4. Browser Restore Panel: 显示 8 条 URL 恢复条目。

状态联动：
- Diagnose/Snapshot: 显示 4 桌面、2 屏、28 窗口。
- Game mode: 视觉上收缩为 1 桌面，工作窗口淡出。
- Restore/Report: 视觉上恢复 4 桌面、28 窗口、8/8 URL。

CSS 要有简洁动画：
- 窗口淡入淡出
- 桌面 active/sleeping/restored 状态
- URL saved/restored 状态

页面继续明确声明：这些窗口、桌面、URL 都是模拟对象。
```

## Session 4: Add Report Metrics and Debug Missions

```text
请继续完善 contest/game-demo 的验证报告和踩坑故事。

目标：
让 Demo 不只是演示流程，还能向评委说明为什么这个项目有真实工程价值。

请实现 REPORT 阶段的完整报告页：
1. 完整指标表：
   - Desktops before: 4
   - Screens: 2
   - Baseline visible windows: 28
   - Game mode exit code: 0
   - Desktops after game mode: 1
   - Residual configured and managed close targets: 0
   - Minimized snapshot entries excluded: 2
   - Restore exit code: 0
   - Desktops after restore: 4
   - Browser args using --new-window: 8/8
   - PowerToys duplicate app entries: 0
   - Hard Failures: None
2. 每项显示 PASS 或通过状态。
3. 标注指标来源：已提供实验报告关键指标，不是当前网页实时检测。

请添加 5 个可展开 Debug Mission 卡片：
1. 最小化窗口污染
   - 问题：最小化窗口进入快照会污染恢复结果。
   - 解决：排除最小化快照条目。
   - 指标：Minimized snapshot entries excluded: 2
2. Edge/Chrome URL 错位
   - 问题：浏览器 URL 恢复时容易落到错误窗口。
   - 解决：使用 --new-window 隔离恢复入口。
   - 指标：Browser args using --new-window: 8/8
3. OneNote/Edge 残留关闭
   - 问题：受管关闭目标可能残留。
   - 解决：关闭配置目标和工作区托管目标，并检查残留。
   - 指标：Residual configured and managed close targets: 0
4. 双屏坐标偏差
   - 问题：双屏布局下窗口位置容易偏移。
   - 解决：恢复时纳入屏幕和布局校验。
   - 指标：Screens: 2, Restore exit code: 0
5. Edge 延迟恢复旧标签
   - 问题：Edge 可能延迟恢复旧标签，干扰恢复窗口。
   - 解决：使用新窗口参数并做浏览器恢复校验。
   - 指标：Browser args using --new-window: 8/8

请更新 docs/post-materials-template.md：
- 加入截图占位不少于 3 个。
- 加入 Session ID 占位不少于 3 个。
- 明确提醒：最终发帖前必须由用户填入真实截图、真实链接、真实 Session ID。

不要虚构任何真实链接、截图或 Session ID。
```

## Session 5: Polish, Accessibility, and Package Notes

```text
请对 contest/game-demo 做最终打磨，让它达到可作为 TRAE 初赛 HTML zip 提交的状态。

目标：
离线可运行、流程清晰、样式稳定、文档完整、提交前检查明确。

请完成：

1. UI/UX 打磨
   - 首屏让评委立即理解这是 Workspace Switcher 的游戏化模拟 Demo。
   - 主要按钮清晰。
   - 当前任务、指标、日志、桌面模拟区层级清楚。
   - 最终 Victory/通关区显示：
     - 4 个桌面已恢复
     - 28 个窗口已恢复
     - 8/8 浏览器新窗口参数已使用
     - Hard Failures: None

2. 可访问性
   - 按钮有明确文字。
   - 重要区域有标题。
   - 不依赖 hover 才能看到关键信息。
   - 小屏幕可读。
   - 页面无明显横向溢出。
   - JS 失败时至少能看到基本说明。

3. 文档
   - README.md 更新运行方式和安全声明。
   - package-note.md 写明建议 zip 名称：workspace-switcher-game-demo.zip。
   - package-note.md 写明 zip 应包含 contest/game-demo 整个目录。
   - docs/acceptance-checklist.md 写明最终验收项。
   - docs/session-notes-template.md 写明如何记录 TRAE Session ID。

4. 代码整理
   - 清理无用样式。
   - 函数命名清晰。
   - 数据放 demo-data.js。
   - 场景放 scenes.js。
   - 交互逻辑放 app.js。

完成后请列出：
1. 修改文件列表。
2. 如何本地运行。
3. 如何打包 zip。
4. 用户还必须补充哪些真实材料，例如截图、视频链接、Session ID。

不要声称已经完成浏览器测试，除非你实际打开验证过。
```

