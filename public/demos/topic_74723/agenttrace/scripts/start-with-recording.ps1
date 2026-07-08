# AgentTrace 启动脚本 - Windows PowerShell
# 使用方法: .\start-with-recording.ps1 [codex|claude|trae]

param(
    [string]$Tool = "codex"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = "agenttrace-$timestamp.log"
$terminalLog = "terminal-recording-$timestamp.log"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AgentTrace - AI工作记录启动器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "工具: $Tool"
Write-Host "日志文件: $logFile"
Write-Host ""
Write-Host "💡 提示：启动后，先发送 AgentTrace 自动记录提示词给AI" -ForegroundColor Yellow
Write-Host ""

# 自动记录提示词
$prompt = @"
【AgentTrace 自动记录模式 - 请严格遵守】

你现在需要在完成任务的同时，自动把工作过程记录到当前目录下的 $logFile 文件中。

第一步：先执行以下PowerShell命令初始化日志：
"[AgentTrace 会话记录]`n开始时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n" | Out-File -FilePath $logFile -Encoding utf8

记录规则（使用 Add-Content 追加，不要用 Out-File 覆盖）：
1. 每个阶段开始: Add-Content $logFile "`n[阶段 X: 名称]`n计划: 你这一步要做什么"
2. 命令执行后: Add-Content $logFile "✓ [Command] 执行的命令 → 成功" (失败时记录错误信息)
3. 文件修改后: Add-Content $logFile "📄 [File] Created/Updated: 文件路径`n说明: 改了什么"
4. 遇到错误: Add-Content $logFile "⚠️ [Issue]`n错误: 关键错误信息`n原因: 分析`n解决: 修复方法"
5. 任务结束: Add-Content $logFile "`n[任务总结]`n状态: 成功/部分成功/失败`n完成内容:`n- 完成项1`n遇到的问题:`n- 问题1`n修改的文件:`n- 文件1"

重要：
- ❌ 不要把生成的代码写入日志！代码已经在文件里了
- ❌ 不要记录npm install下载输出、进度条、spinner动画
- ✅ 重点记录：思路计划、执行的命令、文件变更、错误和解决方法
- ✅ 任务结束后提醒用户：工作记录已保存到 $logFile，可以上传到AgentTrace复盘
"@

# 复制到剪贴板
try {
    Set-Clipboard -Value $prompt
    Write-Host "✅ 提示词已复制到剪贴板！启动 $Tool 后直接 Ctrl+V 粘贴" -ForegroundColor Green
} catch {
    Write-Host "⚠️  无法自动复制，请手动复制以下提示词：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $prompt
    Write-Host ""
}

Write-Host ""
Write-Host "正在启动 $Tool ..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 启动转录并运行工具
Start-Transcript -Path $terminalLog -UseMinimalHeader
& $Tool
Stop-Transcript

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 会话结束！" -ForegroundColor Green
Write-Host ""
Write-Host "生成的文件："
Write-Host "  1. AI自动记录的结构化日志: $logFile (优先用这个！)" -ForegroundColor Green
Write-Host "  2. PowerShell终端录制: $terminalLog"
Write-Host ""
Write-Host "下一步：把 $logFile 拖拽到 AgentTrace 上传即可复盘！" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
