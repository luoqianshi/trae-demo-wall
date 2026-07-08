#!/bin/bash
# AgentTrace 启动脚本 - Mac/Linux
# 使用方法: ./start-with-recording.sh [codex|claude|trae]

TOOL=${1:-codex}
LOG_FILE="agenttrace-$(date +%Y%m%d-%H%M%S).log"

echo "========================================"
echo "  AgentTrace - AI工作记录启动器"
echo "========================================"
echo ""
echo "工具: $TOOL"
echo "日志文件: $LOG_FILE"
echo ""
echo "💡 提示：启动后，先发送 AgentTrace 自动记录提示词给AI"
echo "   提示词已复制到剪贴板（如果安装了pbcopy）"
echo ""

# 尝试复制提示词到剪贴板
PROMPT='【AgentTrace 自动记录模式 - 请严格遵守】

你现在需要在完成任务的同时，自动把工作过程记录到当前目录下的 '$LOG_FILE' 文件中。

第一步：先执行 echo "[AgentTrace 会话记录]\n开始时间: $(date)\n" > '$LOG_FILE' 初始化日志。

记录规则：
1. 每个阶段开始: echo "[阶段 X: 名称]\n计划: ..." >> '$LOG_FILE'
2. 命令执行后: echo "✓ [Command] 命令 → 成功" >> '$LOG_FILE' (失败时记录错误)
3. 文件修改后: echo "📄 [File] Created/Updated: 文件路径\n说明: ..." >> '$LOG_FILE'
4. 遇到错误: echo "⚠️ [Issue]\n错误: ...\n原因: ...\n解决: ..." >> '$LOG_FILE'
5. 任务结束: echo "[任务总结]\n状态: 成功/部分成功/失败\n完成内容: ..." >> '$LOG_FILE'

重要：
- ❌ 不要把代码写入日志，代码已经在文件里了
- ❌ 不要记录npm install下载输出、进度条、spinner
- ✅ 记录思路、命令、文件变更、错误和解决方法
- ✅ 用echo >>追加，不要覆盖
- ✅ 结束时提醒用户上传 '$LOG_FILE' 到AgentTrace复盘'

if command -v pbcopy &> /dev/null; then
  echo "$PROMPT" | pbcopy
  echo "✅ 提示词已复制到剪贴板！启动 $TOOL 后直接 Cmd+V 粘贴"
elif command -v xclip &> /dev/null; then
  echo "$PROMPT" | xclip -selection clipboard
  echo "✅ 提示词已复制到剪贴板！启动 $TOOL 后直接 Ctrl+V 粘贴"
else
  echo "⚠️  未检测到pbcopy/xclip，请手动复制以下提示词："
  echo ""
  echo "$PROMPT"
  echo ""
fi

echo ""
echo "正在启动 $TOOL ..."
echo "========================================"
echo ""

# 启动AI工具，同时录制终端输出
script -q -f terminal-recording-$(date +%Y%m%d-%H%M%S).log -c "$TOOL"

echo ""
echo "========================================"
echo "✅ 会话结束！"
echo ""
echo "生成的文件："
echo "  1. AI自动记录的结构化日志: $LOG_FILE (优先用这个！)"
echo "  2. 终端完整录制: terminal-recording-*.log"
echo ""
echo "下一步：把 $LOG_FILE 拖拽到 AgentTrace 上传即可复盘！"
echo "========================================"
