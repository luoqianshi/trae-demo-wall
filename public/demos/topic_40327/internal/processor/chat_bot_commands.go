package processor

import (
	"fmt"
	"strconv"
	"strings"

	"YaraFlow/internal/hook"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
)

func (bot *ChatBot) processCommands(processedMsg *platform.ProcessedMessage, message *platform.Message) (bool, string, bool) {
	cmdContent := extractCommandContent(processedMsg.Content)
	logger.Sugar.Infow("提取命令",
		"original", processedMsg.Content, "extracted", cmdContent)
	cmdMatch, found := bot.commandProcessor.FindCommand(cmdContent)
	if !found {
		return false, "", true
	}

	// 注入当前聊天上下文，让插件可以感知群聊
	cmdMatch.Platform = message.Platform
	cmdMatch.GroupID = message.GroupID

	logger.Sugar.Infow("检测到命令",
		"command", cmdMatch.CommandName, "original", cmdContent)

	if hookResult, err := hook.DefaultHookManager.Trigger(hook.HookChatCommandBeforeExecute, message, map[string]interface{}{
		"command_name":   cmdMatch.CommandName,
		"plugin_id":      cmdMatch.PluginID,
		"matched_groups": cmdMatch.Groups,
	}); err != nil {
		logger.Sugar.Errorw("Hook chat.command.before_execute 触发失败", "error", err)
	} else if !hookResult.AllowContinue {
		logger.Sugar.Infow("命令被 Hook 中止", "command", cmdMatch.CommandName)
		return true, "", false
	}

	cmdResult, err := bot.commandProcessor.ExecuteCommand(cmdMatch)
	if err != nil {
		logger.Sugar.Errorw("命令执行失败", "error", err)
	}

	if _, err := hook.DefaultHookManager.Trigger(hook.HookChatCommandAfterExecute, message, map[string]interface{}{
		"command_name":     cmdMatch.CommandName,
		"plugin_id":        cmdMatch.PluginID,
		"matched_groups":   cmdMatch.Groups,
		"success":          err == nil,
		"response":         cmdResult,
		"continue_process": false,
	}); err != nil {
		logger.Sugar.Errorw("Hook chat.command.after_execute 触发失败", "error", err)
	}

	return true, cmdResult, false
}

func extractCommandContent(fullContent string) string {
	if fullContent == "" {
		return ""
	}
	parts := strings.SplitN(fullContent, " : ", 2)
	if len(parts) >= 2 {
		cmdPart := strings.TrimSpace(parts[len(parts)-1])
		if cmdPart != "" {
			return cmdPart
		}
	}
	return fullContent
}

// executeBuiltinCommand 处理内置命令（备忘录等）
func (bot *ChatBot) executeBuiltinCommand(cmdMatch *CommandMatch) (string, error) {
	switch cmdMatch.CommandName {
	case "memo_add":
		return bot.executeMemoAdd(cmdMatch)
	case "memo_edit":
		return bot.executeMemoEdit(cmdMatch)
	case "memo_del":
		return bot.executeMemoDel(cmdMatch)
	case "memo_list":
		return bot.executeMemoList(cmdMatch)
	case "memo_search":
		return bot.executeMemoSearch(cmdMatch)
	default:
		return "", nil
	}
}

func (bot *ChatBot) executeMemoAdd(cmdMatch *CommandMatch) (string, error) {
	if bot.knowledgeManager == nil {
		return "备忘录未初始化", nil
	}

	content := cmdMatch.Groups["2"]
	if content == "" {
		return "请输入要记的内容", nil
	}

	entry, err := bot.knowledgeManager.AddEntry(content, nil)
	if err != nil {
		return fmt.Sprintf("记失败啦: %v", err), nil
	}

	return fmt.Sprintf("记下啦 #%d: %s", entry.ID, types.Truncate(content, 80)), nil
}

func (bot *ChatBot) executeMemoEdit(cmdMatch *CommandMatch) (string, error) {
	if bot.knowledgeManager == nil {
		return "备忘录未初始化", nil
	}

	idStr := cmdMatch.Groups["2"]
	content := cmdMatch.Groups["3"]
	if idStr == "" || content == "" {
		return "用法: /改 <id> <内容>", nil
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return "ID格式错误，请输入数字", nil
	}

	_, err = bot.knowledgeManager.UpdateEntry(id, content, nil)
	if err != nil {
		return fmt.Sprintf("修改失败: %v", err), nil
	}

	return fmt.Sprintf("改好啦 #%d: %s", id, types.Truncate(content, 80)), nil
}

func (bot *ChatBot) executeMemoDel(cmdMatch *CommandMatch) (string, error) {
	if bot.knowledgeManager == nil {
		return "备忘录未初始化", nil
	}

	idStr := cmdMatch.Groups["2"]
	if idStr == "" {
		return "用法: /忘 <id>", nil
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return "ID格式错误，请输入数字", nil
	}

	if err := bot.knowledgeManager.DeleteEntry(id); err != nil {
		return fmt.Sprintf("删除失败: %v", err), nil
	}

	return fmt.Sprintf("忘掉啦 #%d", id), nil
}

func (bot *ChatBot) executeMemoList(cmdMatch *CommandMatch) (string, error) {
	if bot.knowledgeManager == nil {
		return "备忘录未初始化", nil
	}

	page := 1
	if pageStr := cmdMatch.Groups["2"]; pageStr != "" {
		pageStr = strings.TrimSpace(pageStr)
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	pageSize := 10
	offset := (page - 1) * pageSize
	entries, total, err := bot.knowledgeManager.ListEntries(offset, pageSize)
	if err != nil {
		return fmt.Sprintf("查询失败: %v", err), nil
	}

	if total == 0 {
		return "备忘录是空的哦", nil
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("备忘录 (共%d条, 第%d/%d页):\n", total, page, (total+pageSize-1)/pageSize))
	for _, entry := range entries {
		tagStr := ""
		if len(entry.Tags) > 0 {
			tagStr = " [" + strings.Join(entry.Tags, ", ") + "]"
		}
		sb.WriteString(fmt.Sprintf("#%d: %s%s\n", entry.ID, types.Truncate(entry.Content, 60), tagStr))
	}

	return sb.String(), nil
}

func (bot *ChatBot) executeMemoSearch(cmdMatch *CommandMatch) (string, error) {
	if bot.knowledgeManager == nil {
		return "备忘录未初始化", nil
	}

	keyword := cmdMatch.Groups["2"]
	if keyword == "" {
		return "请输入搜索关键词", nil
	}

	entries, err := bot.knowledgeManager.SearchByKeyword(keyword, 10)
	if err != nil {
		return fmt.Sprintf("搜索失败: %v", err), nil
	}

	if len(entries) == 0 {
		return fmt.Sprintf("没找到和 '%s' 相关的备忘录", keyword), nil
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("找到 '%s' 相关 (%d条):\n", keyword, len(entries)))
	for _, entry := range entries {
		sb.WriteString(fmt.Sprintf("#%d: %s\n", entry.ID, types.Truncate(entry.Content, 80)))
	}

	return sb.String(), nil
}
