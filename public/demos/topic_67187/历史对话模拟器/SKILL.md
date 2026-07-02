---
name: "历史对话模拟器"
description: "解析backup-md文件夹中的MD会话文档，自动生成chat-viewer.html对话查看界面。当用户需要回顾历史开发记录、工作区ID变更导致无法直接浏览之前的项目开发过程时调用。"
---

# 历史对话模拟器

## 功能概述

该技能用于当工作区 ID 发生变更导致无法直接浏览之前的项目开发过程时，提供临时替代方案。通过解析 `backup-md` 文件夹中的导出的 MD 格式会话文档，自动生成 `chat-viewer.html` 文件，用户可在浏览器中打开该文件，以结构化的任务列表对话界面回顾项目开发过程中的重要资料和沟通记录。

## 触发条件

当用户提出以下需求时调用此技能：
- 需要回顾历史对话记录
- 工作区变更后无法查看之前的开发过程
- 需要从 MD 文件生成对话查看界面
- 要求生成/更新 chat-viewer.html
- 提到"历史对话模拟器"或"对话查看器"

## 执行流程

### 步骤 1：确认 backup-md 文件夹

检查项目根目录下是否存在 `backup-md` 文件夹，该文件夹应包含：
- `*.md` 文件：导出的会话文档（格式见下方说明）
- `*.png` / `*.jpg` 文件：会话中使用的图片资源（可选）

如果 `backup-md` 文件夹不存在，提示用户创建该文件夹并放入 MD 会话文档。

### 步骤 2：解析 MD 文件

读取 `backup-md` 文件夹中所有 `.md` 文件，按以下格式解析：

```
# 会话标题
> **Workspace:** 工作区路径

---

## User
用户消息内容...

## Assistant
助手回复内容...

## User
用户消息内容...

## Assistant
助手回复内容...
```

解析规则：
- 第一行 `# ` 开头的是会话标题
- `> **Workspace:**` 后面的是工作区路径
- `---` 分隔符之后是对话内容
- `## User` 和 `## Assistant` 交替出现，标识对话角色
- 提取每个消息的完整内容（直到下一个 `## ` 或文件结束）

### 步骤 3：生成 JSON 数据

将解析结果组织为以下 JSON 结构：

```json
{
  "conversations": [
    {
      "id": "conv_1",
      "title": "会话标题",
      "workspace": "工作区路径",
      "timestamp": 1700000000,
      "time_str": "01月01日 12:00",
      "status": "completed",
      "messages": [
        { "role": "user", "content": "用户消息..." },
        { "role": "assistant", "content": "助手回复..." }
      ]
    }
  ]
}
```

- `id`：使用 `conv_` + 序号，保持唯一
- `timestamp`：使用文件修改时间作为时间戳
- `time_str`：格式化为 "MM月DD日 HH:MM"
- `status`：默认为 "completed"（任务完成）
- 如果消息内容以 "任务中断" 开头，设置 `status` 为 "interrupted"

### 步骤 4：生成 chat-viewer.html

使用 `assets/chat-viewer-template.html` 模板文件，通过 `build.py` 脚本将解析后的 JSON 数据嵌入模板，生成 `chat-viewer.html` 文件。

执行方式：
```bash
python .trae/skills/历史对话模拟器/build.py
```

如果项目中存在图片资源（`backup-md/*.png`、`backup-md/*.jpg`），构建脚本会自动将其转换为 base64 并内嵌到 HTML 中。

### 步骤 5：启动 HTTP 服务

生成完成后，启动 HTTP 服务以便用户浏览：

```bash
python -m http.server 8000
```

告知用户访问 `http://localhost:8000/chat-viewer.html` 查看对话界面。

## MD 文件格式说明

### 支持的格式

对话内容支持标准 Markdown 语法：
- 标题（# ## ### ####）
- 粗体（**text**）、斜体（*text*）
- 行内代码（`code`）
- 代码块（```language\ncode\n```）
- 列表（- 或 1.）
- 引用（> text）
- 表格（| col1 | col2 |）
- 链接（[text](url)）
- 分隔线（---）

### 示例 MD 文件

```markdown
# 系统升级3.0开发需求说明

> **Workspace:** e:\HTML\teach-study3x

---

## User
重启HTTP服务，端口号8000，应用前面的更新

## Assistant
好的，让我重启HTTP服务：

HTTP服务已成功重启并运行在：**http://localhost:8000**

## User
检查页面显示效果

## Assistant
让我打开预览页面检查：

页面显示正常，所有功能已正确应用。
```

## 输出文件

- `chat-viewer.html`：生成的对话查看界面，位于项目根目录
- 该文件是自包含的 HTML 文件，所有图片资源以 base64 内嵌，无需额外依赖

## 注意事项

1. 该技能作为临时过渡方案，在官方导入功能正式上线前使用
2. MD 文件格式必须遵循 `## User` / `## Assistant` 的交替结构
3. 生成的 `chat-viewer.html` 文件可直接在浏览器中打开，无需服务器
4. 如果 `backup-md` 文件夹中没有 MD 文件，将生成一个空的对话查看器