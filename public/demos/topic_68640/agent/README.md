# Aftertype Desktop Agent

轻量级系统托盘应用，全局监听键盘输入计数（不记录内容），通过窗口标题识别来源应用，并按类型分类为 Char / Token。

## 安装

```bash
cd agent
npm install
```

## 运行

```bash
npm start
```

Agent 将在系统托盘运行，并提供 HTTP API：

- `GET http://localhost:17380/api/status` - 获取当前状态
- `GET http://localhost:17380/api/events` - SSE 实时事件流
- `POST http://localhost:17380/api/reset` - 重置计数
- `POST http://localhost:17380/api/keystroke` - 手动注入按键（测试用）

## 工作模式

### Agent 模式（真实）
使用 `uiohook-napi` 监听全局键盘事件，使用 `active-win` 获取当前活动窗口标题。需要安装这两个 native 模块。

### 模拟模式（自动降级）
当 native 模块不可用时（如沙箱环境、权限不足），自动切换到模拟模式，每 1-4 秒随机生成来自不同应用的打字事件。

## 货币分类规则

| 应用类型 | 示例 | 货币 |
|---------|------|------|
| IDE/编辑器 | VS Code, IntelliJ, PyCharm | Token (1字=2) |
| 终端 | Terminal, iTerm, PowerShell | Token (1字=2) |
| AI工具 | Claude, ChatGPT, Copilot | Token (1字=2) |
| 文档 | Word, Google Docs, Notion | Char (1字=1) |
| 邮件 | Gmail, Outlook | Char (1字=1) |
| 通讯 | Slack, WeChat, 飞书 | Char (1字=1) |
| 其他 | - | Char (1字=1) |

## 托盘菜单

- 暂停/恢复计数
- 查看当前模式（Agent/模拟）
- 重置计数
- 退出
