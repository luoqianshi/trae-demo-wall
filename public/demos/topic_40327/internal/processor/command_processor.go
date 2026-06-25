package processor

import (
	"regexp"
	"strings"

	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"
)

type CommandMatch struct {
	CommandName string
	PluginID    string
	MatchedText string
	Groups      map[string]string
	Platform    string // 触发命令的平台（如 qq, telegram）
	GroupID     string // 触发命令的群组ID
}

type CommandProcessor struct {
	config           *config.Config
	commands         []CommandDefinition
	onExecuteCommand func(cmdMatch *CommandMatch) (string, error)
	onBuiltinCommand func(cmdMatch *CommandMatch) (string, error)
}

type CommandDefinition struct {
	Name     string
	Pattern  string
	PluginID string
	Regex    *regexp.Regexp
}

func NewCommandProcessor(cfg *config.Config) *CommandProcessor {
	cp := &CommandProcessor{
		config:   cfg,
		commands: make([]CommandDefinition, 0),
	}
	cp.loadCommands()
	return cp
}

func (cp *CommandProcessor) loadCommands() {
	defaultCommands := []CommandDefinition{
		{
			Name:     "help",
			Pattern:  `^/(help|帮助|\?)$`,
			PluginID: "builtin",
		},
		{
			Name:     "echo",
			Pattern:  `^/echo\s+(.+)$`,
			PluginID: "builtin",
		},
		{
			Name:     "status",
			Pattern:  `^/(status|状态)$`,
			PluginID: "builtin",
		},
		{
			Name:     "clear",
			Pattern:  `^/(clear|清理)$`,
			PluginID: "builtin",
		},
		{
			Name:     "memo_add",
			Pattern:  `^/(记|memo_add)\s+(.+)$`,
			PluginID: "builtin",
		},
		{
			Name:     "memo_edit",
			Pattern:  `^/(改|memo_edit)\s+(\d+)\s+(.+)$`,
			PluginID: "builtin",
		},
		{
			Name:     "memo_del",
			Pattern:  `^/(忘|memo_del)\s+(\d+)$`,
			PluginID: "builtin",
		},
		{
			Name:     "memo_list",
			Pattern:  `^/(备忘录|memo_list|memo)(\s+\d+)?$`,
			PluginID: "builtin",
		},
		{
			Name:     "memo_search",
			Pattern:  `^/(找|memo_search)\s+(.+)$`,
			PluginID: "builtin",
		},
	}

	for _, cmd := range defaultCommands {
		if re, err := regexp.Compile(cmd.Pattern); err == nil {
			cp.commands = append(cp.commands, CommandDefinition{
				Name:     cmd.Name,
				Pattern:  cmd.Pattern,
				PluginID: cmd.PluginID,
				Regex:    re,
			})
		}
	}
}

func (cp *CommandProcessor) FindCommand(text string) (*CommandMatch, bool) {
	text = strings.TrimSpace(text)
	// 去除开头可能存在的不可见Unicode字符（BOM、零宽空格等）
	text = strings.TrimLeftFunc(text, func(r rune) bool {
		switch r {
		case '\uFEFF', // BOM
			'\u200B',                                                                                                                                                       // 零宽空格
			'\u200C',                                                                                                                                                       // 零宽非连接符
			'\u200D',                                                                                                                                                       // 零宽连接符
			'\u200E',                                                                                                                                                       // 左至右标记
			'\u200F',                                                                                                                                                       // 右至左标记
			'\u2060',                                                                                                                                                       // 词连接符
			'\uFE00', '\uFE01', '\uFE02', '\uFE03', '\uFE04', '\uFE05', '\uFE06', '\uFE07', '\uFE08', '\uFE09', '\uFE0A', '\uFE0B', '\uFE0C', '\uFE0D', '\uFE0E', '\uFE0F', // 变体选择符
			'\u2061', '\u2062', '\u2063', '\u2064': // 不可见运算符
			return true
		default:
			return false
		}
	})

	for _, cmd := range cp.commands {
		if cmd.Regex.MatchString(text) {
			match := cmd.Regex.FindStringSubmatch(text)
			groups := make(map[string]string)

			for i, name := range cmd.Regex.SubexpNames() {
				if i > 0 && i < len(match) && name != "" {
					groups[name] = match[i]
				}
			}

			if len(groups) == 0 && len(match) > 1 {
				for i := 1; i < len(match); i++ {
					groups[string(rune('0'+i))] = match[i]
				}
			}

			return &CommandMatch{
				CommandName: cmd.Name,
				PluginID:    cmd.PluginID,
				MatchedText: text,
				Groups:      groups,
			}, true
		}
	}

	return nil, false
}

func (cp *CommandProcessor) ExecuteCommand(cmdMatch *CommandMatch) (string, error) {
	logger.Info("Executing command: " + cmdMatch.CommandName)

	switch cmdMatch.CommandName {
	case "help":
		return cp.executeHelpCommand(cmdMatch)
	case "echo":
		return cp.executeEchoCommand(cmdMatch)
	case "status":
		return cp.executeStatusCommand(cmdMatch)
	case "clear":
		return cp.executeClearCommand(cmdMatch)
	default:
		// 备忘录命令和其他内置命令通过回调处理
		if cmdMatch.PluginID == "builtin" && cp.onBuiltinCommand != nil {
			return cp.onBuiltinCommand(cmdMatch)
		}
		if cmdMatch.PluginID != "builtin" && cp.onExecuteCommand != nil {
			return cp.onExecuteCommand(cmdMatch)
		}
		return "", nil
	}
}

func (cp *CommandProcessor) executeHelpCommand(_ *CommandMatch) (string, error) {
	helpText := `可用命令列表：
/help 或 /? - 显示帮助信息
/echo <文本> - 重复你说的话
/status - 显示当前状态
/clear - 清理上下文
【备忘录】
/记 <内容> - 记一条备忘录
/改 <id> <内容> - 修改备忘录
/忘 <id> - 删除备忘录
/备忘录 [页码] - 查看备忘录
/找 <关键词> - 搜索备忘录
`
	return helpText, nil
}

func (cp *CommandProcessor) executeEchoCommand(cmdMatch *CommandMatch) (string, error) {
	return cmdMatch.Groups["1"], nil
}

func (cp *CommandProcessor) executeStatusCommand(_ *CommandMatch) (string, error) {
	return "YaraFlow Lunar Server 运行正常", nil
}

func (cp *CommandProcessor) executeClearCommand(_ *CommandMatch) (string, error) {
	return "上下文已清理", nil
}

func (cp *CommandProcessor) RegisterCommand(name, pattern, pluginID string) error {
	re, err := regexp.Compile(pattern)
	if err != nil {
		return err
	}

	cp.commands = append(cp.commands, CommandDefinition{
		Name:     name,
		Pattern:  pattern,
		PluginID: pluginID,
		Regex:    re,
	})

	return nil
}

func (cp *CommandProcessor) UnregisterCommand(name string) {
	for i, cmd := range cp.commands {
		if cmd.Name == name {
			cp.commands = append(cp.commands[:i], cp.commands[i+1:]...)
			return
		}
	}
}

func (cp *CommandProcessor) GetCommands() []CommandDefinition {
	return cp.commands
}

func (cp *CommandProcessor) SetOnExecuteCommand(fn func(cmdMatch *CommandMatch) (string, error)) {
	cp.onExecuteCommand = fn
}

func (cp *CommandProcessor) SetOnBuiltinCommand(fn func(cmdMatch *CommandMatch) (string, error)) {
	cp.onBuiltinCommand = fn
}
