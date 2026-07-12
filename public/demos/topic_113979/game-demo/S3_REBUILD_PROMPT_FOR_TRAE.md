# S3 Rebuild Prompt For TRAE

请先读取以下文件：

1. `workspace-control-contest-copy\CONTEXT.md`
2. `workspace-control-contest-copy\contest\game-demo\S3_REDESIGN_BRIEF.md`
3. `workspace-control-contest-copy\contest\game-demo\GAME_DEMO_SPEC.md`

当前 S3 方向需要推翻重构：不要继续做验证仪表盘，不要以日志和指标为主。请把 Demo 改成软桌面模拟体验。

## 必须完成的主流程

1. 首屏是一个大显示器，自动轮播 4 个模拟桌面。
2. 每个桌面放 3-5 个圆润代表窗口，体现不同工作区。
3. 用户点击 `打开工作区管理`。
4. 用户点击 `进入游戏 / 重任务模式` 或 `释放资源`。
5. 自动播放：记录每个桌面，然后一个个收起，最后变成干净桌面。
6. 用户点击 `恢复工作区`。
7. 自动播放：桌面和窗口一个个恢复回来，浏览器 URL 恢复可用 `8/8` 做最终提示。
8. 最后只显示简短证据条和可展开说明。

## 视觉方向

- 使用软桌面模拟，不要做硬质后台仪表盘。
- 显示器、任务栏、桌面名、窗口标题栏、App 图标、URL 标签都要能被看出来。
- 风格要更圆润、更友好、略带卡通感，让评委知道这只是安全模拟。
- 主画面不复刻 28 个窗口，只用代表窗口表达“多工作区、多窗口正在运行”。

## 禁止事项

- 不要把事件日志做成主面板。
- 不要从验证报告开始。
- 不要把 `Hard Failures: None` 当成首屏重点。
- 不要做暂停、下一步、逐桌面确认按钮。
- 不要在主流程里塞 CPU/GPU/内存数字。
- 不要执行任何真实 PowerShell、虚拟桌面、PowerToys、窗口、浏览器 API。
- 不要伪造 Session ID、截图、视频链接或 GitHub 链接。

所有实现继续限制在：

`workspace-control-contest-copy\contest\game-demo`
