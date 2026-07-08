# AgentTrace - 日志获取完全指南

从 Codex / Claude Code 获取工作日志有4种方案，从最简单到最自动化：

---

## ⭐ 方案一：自动记录Skill（最推荐，零复制）

这是最好的方案！**让AI自己边工作边写日志文件**，工作结束直接上传那个文件就行。

### 使用步骤：

1. 打开 AgentTrace，在"AI工作记录"区域点击 **"🚀 复制Skill提示词"** 按钮（推荐的"自动写文件模式"）
2. 切到 Codex / Claude Code，**先粘贴发送这个提示词**
3. 然后正常描述你的任务，AI会：
   - 首先执行命令创建 `agenttrace.log` 文件
   - 每开始一个阶段，自动追加 `[阶段 X: 名称]` 和计划
   - 执行命令后，自动记录 `✓ [Command] xxx → 成功`（失败时记录错误）
   - 修改文件后，自动记录 `📄 [File] Created/Updated: 文件路径`
   - 遇到错误时，自动记录 `⚠️ [Issue]` + 原因 + 解决方法
   - 任务结束时，自动写入 `[任务总结]`
4. 工作完成后，直接把项目目录下生成的 **`agenttrace.log`** 文件拖拽到 AgentTrace 上传即可！

### 为什么这是最好的？

- ✅ **零手动复制**：你不需要复制任何内容
- ✅ **日志非常干净**：AI自动过滤掉npm install输出、spinner、代码块等冗余内容
- ✅ **包含AI思路**：不仅记录做了什么，还记录计划、原因分析、解决方法
- ✅ **结构化格式**：直接生成符合AgentTrace解析格式的日志，复盘效果最好

---

## 方案二：终端输出模式（简单）

如果你不想让AI写文件，用简单版提示词：

1. 点击"📋 复制提示词"（简单模式）
2. 发给AI，它会按结构化格式输出到终端
3. 工作结束后，复制AI的输出（很短，没有冗余）粘贴到AgentTrace即可

---

## 方案三：智能提取过滤（兜底）

如果你已经有了完整的终端输出（比如忘记提前发提示词）：

1. 直接把全部内容粘贴到输入框，或者拖拽上传终端录制文件
2. 如果内容超过150行，系统会自动显示提示条
3. 点击 **"⚡ 智能提取关键行"**，系统自动过滤：
   - ✗ npm warn/notice、依赖统计
   - ✗ spinner动画字符（⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏）
   - ✗ 下载进度条
   - ✗ 构建产物大小、版本号信息
   - ✓ 保留：错误、命令、文件路径、阶段标记、动作描述
   - ✓ 省略处标注 `// ... 省略 X 行冗余内容 ...`
4. 提取后显示统计：X行→Y行（压缩至Z%），可以一键恢复原文

---

## 方案四：启动脚本（极客，一键启动+自动录制）

项目 `scripts/` 目录提供了一键启动脚本：

### Mac / Linux
```bash
chmod +x scripts/start-with-recording.sh
./scripts/start-with-recording.sh codex    # 启动codex
./scripts/start-with-recording.sh claude   # 启动claude
```

脚本会：
- 自动复制Skill提示词到剪贴板
- 用 `script` 命令录制完整终端输出（备份）
- 启动AI工具
- 结束后提示你上传日志文件

### Windows PowerShell
```powershell
.\scripts\start-with-recording.ps1 codex
.\scripts\start-with-recording.ps1 claude
```

脚本会：
- 自动复制Skill提示词到剪贴板
- 用 `Start-Transcript` 录制完整终端输出（备份）
- 启动AI工具
- 结束后提示你上传日志文件

---

## 手动终端录制（不推荐）

如果你什么都不想准备，至少用终端录制：

### Mac / Linux
```bash
script -f session.log   # 开始录制
codex                   # 启动AI工具
# 工作完成后按 Ctrl+D 或输入 exit 结束录制
```

### Windows PowerShell
```powershell
Start-Transcript -Path session.log
codex
Stop-Transcript
```

然后上传 `session.log`，再用智能提取过滤冗余内容。

---

## 总结：最佳实践

| 场景 | 推荐方案 |
|------|----------|
| 开始新任务 | ⭐ 方案一：复制Skill提示词发给AI，让它自动写 `agenttrace.log` |
| 回顾已完成的任务 | 方案三：直接粘贴/上传 + 智能提取 |
| 想偷懒 | 方案四：用启动脚本一键启动 |
| 应急快速复盘 | 方案二：简单提示词 + 复制输出 |

**核心思想**：日志里最重要的不是代码（代码在文件里），而是 **AI的思路、执行的命令、遇到的错误、修改了哪些文件**。让AI自己记录这些信息，比事后从海量输出里过滤高效得多！
