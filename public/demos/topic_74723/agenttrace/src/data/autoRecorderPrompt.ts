// AgentTrace 自动记录 Skill - 发给 Codex / Claude Code，让它边工作边写日志文件
// 这是一个"技能提示词"，复制发给AI即可让它自动记录工作过程
export const autoRecorderPrompt = `【AgentTrace 自动记录模式 - 请严格遵守】

你现在需要在完成任务的同时，自动把工作过程记录到当前目录下的 agenttrace.log 文件中。

## 第一步：初始化日志文件
任务开始时，先执行命令创建日志文件：

Mac / Linux 使用:
echo "[AgentTrace 会话记录]
开始时间: $(date '+%Y-%m-%d %H:%M')
" > agenttrace.log

Windows PowerShell 使用:
"[AgentTrace 会话记录]
开始时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm')
" | Out-File -FilePath agenttrace.log -Encoding utf8

## 记录规则
在工作过程中，每个关键节点都要把信息追加写入 agenttrace.log 文件。
注意：用 >> 追加（Mac/Linux）或 Add-Content（Windows），不要用 > 覆盖！

### 1. 开始新阶段时记录：
echo "
[阶段 X: 阶段名称]
计划: 你这一步要做什么
" >> agenttrace.log

### 2. 执行命令后记录结果（npm install 只写成功/失败，不要粘贴依赖列表）：
成功时: echo "✓ [Command] 执行的命令 → 成功" >> agenttrace.log
失败时: echo "✗ [Command] 执行的命令 → 失败
错误: 保留1-2行关键错误信息
" >> agenttrace.log

### 3. 创建/修改文件后记录：
echo "📄 [File] Created/Updated/Fixed: 文件路径
说明: 简单描述改了什么
" >> agenttrace.log

### 4. 遇到错误并修复后记录：
echo "⚠️ [Issue] 遇到问题
错误: 关键错误信息
原因: 你的分析
解决: 修复方法
" >> agenttrace.log

### 5. 任务结束时记录总结：
echo "
[任务总结]
状态: 成功 / 部分成功 / 失败
完成内容:
- 具体完成项1
- 具体完成项2
遇到的问题:
- 问题1
修改的文件:
- 文件1
- 文件2
" >> agenttrace.log

## 重要要求（必须遵守）
1. ❌ 绝对不要把生成的代码写入日志！代码已经在文件里了，日志只记录过程
2. ❌ 不要记录 npm/pnpm install 的下载输出，只写"✓ 依赖安装成功"
3. ❌ 不要记录构建产物大小、进度条、spinner动画等无关内容
4. ✅ 重点记录：你的思路计划、执行的命令、文件变更、遇到的错误和解决方法
5. ✅ 用中文记录，简洁明了
6. ✅ 每个关键动作后立即记录，不要等任务结束才补
7. ✅ 任务结束后，提醒用户：工作记录已保存到 agenttrace.log，可以直接上传到 AgentTrace 复盘

现在，先初始化日志文件，然后开始处理用户的任务，同时记得按照上面的规则记录！`;

// 简单版提示词（只输出到终端，不写文件，适合快速使用）
export const simpleRecorderPrompt = `【记录员模式】
在完成任务的同时，请按以下格式输出工作过程（不要输出完整代码块，代码已经写进文件了）：

[任务目标]
你的理解：本次要做什么

[阶段 X: 名称]
计划：这一步做什么
执行后：✓/✗ 结果，有错误就记录错误和解决方法
文件：Created/Updated xxx.tsx

[任务总结]
状态：成功/部分成功/失败
完成：列出完成项
问题：列出遇到的问题
文件：列出修改的文件

重点：不要输出代码内容，只记录过程、命令、文件、错误！`;
