# Workspace Switcher 游戏化交互 Demo

TRAE AI 创意大赛参赛 HTML Demo。本 Demo 让评委以"控制室任务"的形式体验 Workspace Switcher 的完整流程：

`混乱工作区 -> 保存快照 -> 进入游戏/专注模式 -> 恢复工作区 -> 查看验证报告`

## 如何打开

直接双击 `index.html` 即可在浏览器中打开。无需联网，无需安装任何依赖。

推荐使用 Chrome / Edge / Firefox 等现代浏览器。

## 为什么这是模拟 Demo

本页面是**安全的前端模拟**，不会操作真实窗口、虚拟桌面、PowerToys、浏览器或 PowerShell。

- 所有"桌面 / 屏幕 / 窗口 / 浏览器 URL"都是页面内的模拟对象。
- 所有事件日志行均带 `[SIMULATED]` 标记。
- 所有指标来自真实实验报告，不是当前网页实时检测的结果。

之所以采用模拟形式，是因为真实工具会操作评委机器上的 Windows 桌面、虚拟桌面与窗口，无法在评审环境中安全运行。

## 真实能力如何证明

Workspace Switcher 的真实执行能力由以下材料证明（不在本 HTML Demo 内）：

- 录屏视频
- 实验报告：`experiments/20260620-124805/report.md`
- 截图
- 真实 TRAE Session ID

请勿在参赛材料中虚构链接、截图或 Session ID。

## 关键指标（来自实验报告）

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

## 文件结构

```text
contest/game-demo/
  index.html
  README.md
  package-note.md
  assets/
    css/style.css
    js/app.js
    js/demo-data.js
    js/scenes.js
    img/.gitkeep
  docs/
    acceptance-checklist.md
    post-materials-template.md
    session-notes-template.md
```

## 实现进度

- Session 1：离线静态骨架（当前）。
- Session 2：任务状态机。
- Session 3：桌面 / 屏幕 / 窗口 / 浏览器视觉模拟器。
- Session 4：报告指标与 Debug Mission 卡片。
- Session 5：打磨、可访问性与打包说明。

## 安全边界

- 仅在 `contest/game-demo` 下新增或修改文件。
- 不修改原运行目录 `E:\learning\新建文件夹\workspace-control`。
- 不执行 PowerShell，不关闭真实窗口，不切换真实虚拟桌面，不修改 PowerToys 配置，不读取真实浏览器 URL。
- 不使用 CDN、npm 或任何外部资源。
