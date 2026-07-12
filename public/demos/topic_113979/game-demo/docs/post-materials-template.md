# Post Materials Template / 参赛发帖材料模板

> 本文件是参赛发帖（视频 + 图文）的填充模板。
> **重要提醒：最终发帖前必须由用户填入真实截图、真实链接、真实 TRAE Session ID。**
> **严禁虚构任何截图、链接或 Session ID。** 未取得真实材料时，对应占位保持 `[待填入真实材料]`。

## 一、项目一句话介绍

Workspace Switcher 是一个 Windows 本地桌面自动化工具：保存多虚拟桌面工作状态，进入游戏/专注模式（关闭受管工作窗口并收缩到单桌面），随后恢复桌面、窗口、浏览器 URL 与布局。

## 二、为什么用模拟 Demo

真实工具会操作评委机器上的 Windows 桌面、虚拟桌面与窗口，无法在评审环境安全运行。因此用纯 HTML/CSS/JS 模拟 Demo 让评委体验完整流程，真实执行能力由录屏、实验报告、截图与 TRAE Session ID 证明。

## 三、开发过程截图（不少于 3 个）

> 请填入真实开发过程截图。下方为占位，不可直接使用。

1. 截图 1：[待填入真实截图] —— 说明：例如 PowerShell 工具在真实 Windows 上保存工作区快照的运行画面。
2. 截图 2：[待填入真实截图] —— 说明：例如进入游戏/专注模式后桌面收缩为 1 个的对比画面。
3. 截图 3：[待填入真实截图] —— 说明：例如恢复后 4 桌面 / 双屏 / 28 窗口归位的对比画面。
4. （可选）截图 4：[待填入真实截图] —— 说明：例如实验报告关键指标或浏览器 8/8 `--new-window` 恢复验证。

## 四、演示视频链接

> 请填入真实视频链接。下方为占位，不可直接使用。

- 演示视频：[待填入真实视频链接]

## 五、真实 TRAE Session ID（不少于 3 个）

> 请填入真实 TRAE Session ID。下方为占位，不可直接使用。
> Session ID 对应 `contest/game-demo/TRAE_SESSION_PROMPTS.md` 中的 5 个 Session。

- Session 1（创建离线 Demo 骨架）：[待填入真实 TRAE Session ID]
- Session 2（实现任务状态机）：[待填入真实 TRAE Session ID]
- Session 3（构建视觉模拟器）：[待填入真实 TRAE Session ID]
- Session 4（报告指标与 Debug Mission）：[待填入真实 TRAE Session ID]
- Session 5（打磨、可访问性与打包）：[待填入真实 TRAE Session ID]

## 六、关键指标（来自实验报告）

| 指标 | 数值 |
| --- | --- |
| Desktops before | 4 |
| Screens | 2 |
| Baseline visible windows | 28 |
| Game mode exit code | 0 |
| Desktops after game mode | 1 |
| Residual configured and managed close targets | 0 |
| Minimized snapshot entries excluded | 2 |
| Restore exit code | 0 |
| Desktops after restore | 4 |
| Browser args using --new-window | 8/8 |
| PowerToys duplicate app entries | 0 |
| Hard Failures | None |

## 七、5 个 Debug Mission（踩坑故事）

1. 最小化窗口污染 —— 排除最小化快照条目（2 条）。
2. Edge/Chrome URL 错位 —— 使用 `--new-window` 隔离恢复入口（8/8）。
3. OneNote/Edge 残留关闭 —— 关闭配置与托管目标并校验残留（0）。
4. 双屏坐标偏差 —— 恢复时纳入屏幕与布局校验（Screens 2 / Restore exit code 0）。
5. Edge 延迟恢复旧标签 —— 使用新窗口参数并做浏览器恢复校验（8/8）。

## 八、再次提醒

- 不要虚构截图。
- 不要虚构视频链接。
- 不要虚构 TRAE Session ID。
- 所有 `[待填入真实材料]` 占位在发帖前必须替换为真实材料，否则保留占位标记。
