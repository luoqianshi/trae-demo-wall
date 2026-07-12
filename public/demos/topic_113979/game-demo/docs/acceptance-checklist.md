# Acceptance Checklist / 验收清单

> 本文件为 contest/game-demo 的最终验收项。Session 1 先建立清单，Session 5 做最终核对。

## 文件范围

- [ ] 所有新增 Demo 文件均位于 `contest/game-demo` 下。
- [ ] 未修改 `E:\learning\新建文件夹\workspace-control` 中的任何文件。
- [ ] 未修改任何原有自动化脚本（除非后续明确要求）。

## 离线运行

- [ ] `contest/game-demo/index.html` 可通过双击打开。
- [ ] Demo 无需联网即可运行。
- [ ] 不依赖 CDN、外部图片、npm、构建步骤或网络请求。
- [ ] 所有 CSS / JS 使用相对本地路径。

## 安全性

- [ ] 页面明确声明这是模拟演示。
- [ ] 不存在 PowerShell 执行。
- [ ] 不存在真实关闭窗口的逻辑。
- [ ] 不存在虚拟桌面 API 调用。
- [ ] 不存在 PowerToys 配置修改。
- [ ] 不存在读取用户真实浏览器 URL 的逻辑。

## 用户流程

- [ ] 评委可完成完整路径：`简报 -> 诊断 -> 快照 -> 游戏/专注模式 -> 恢复 -> 报告`。
- [ ] 有可见的任务进度指示。
- [ ] 未完成前置步骤时，后续按钮禁用。
- [ ] 事件日志带 `[SIMULATED]` 标记。
- [ ] 最终屏幕包含重新开始选项。

## 视觉模拟

- [ ] 诊断状态显示 4 个虚拟桌面。
- [ ] 诊断状态显示 2 块屏幕。
- [ ] 诊断状态展示 28 个可见窗口。
- [ ] 游戏/专注模式视觉收缩为 1 个桌面。
- [ ] 恢复状态视觉恢复为 4 个桌面。
- [ ] 浏览器恢复面板显示 8/8 条已恢复条目。

## 指标

- [ ] Desktops before: 4
- [ ] Screens: 2
- [ ] Baseline visible windows: 28
- [ ] Game mode exit code: 0
- [ ] Desktops after game mode: 1
- [ ] Residual configured and managed close targets: 0
- [ ] Minimized snapshot entries excluded: 2
- [ ] Restore exit code: 0
- [ ] Desktops after restore: 4
- [ ] Browser args using `--new-window`: 8/8
- [ ] PowerToys duplicate app entries: 0
- [ ] Hard Failures: None

## 踩坑故事（Debug Mission）

- [ ] 最小化窗口污染卡片存在。
- [ ] Edge/Chrome URL 错位卡片存在。
- [ ] OneNote/Edge 残留关闭卡片存在。
- [ ] 双屏坐标偏差卡片存在。
- [ ] Edge 延迟恢复旧标签卡片存在。
- [ ] 每张卡片说明问题、解决与对应指标。

## 参赛材料

- [ ] `docs/post-materials-template.md` 存在。
- [ ] 其中包含不少于 3 个截图占位。
- [ ] 其中包含不少于 3 个 TRAE Session ID 占位。
- [ ] 明确提醒不要虚构截图或 Session ID。
- [ ] `docs/session-notes-template.md` 存在。
- [ ] `package-note.md` 说明如何打包 zip。
