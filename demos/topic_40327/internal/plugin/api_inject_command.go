package plugin

import (
	"fmt"
	"strings"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

// ─── CommandInjector ───

type CommandInjector struct {
	ctx *InjectorContext
}

func NewCommandInjector(ctx *InjectorContext) *CommandInjector {
	return &CommandInjector{ctx: ctx}
}

func (ci *CommandInjector) APIName() string { return "command" }

func (ci *CommandInjector) Inject() error {
	if !ci.ctx.manifest.HasPermission("command.register") {
		return nil
	}

	commandAPI := map[string]interface{}{
		"register": ci.createRegister(),
	}

	ci.ctx.mergeIntoYara("command", commandAPI)
	return nil
}

func (ci *CommandInjector) createRegister() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 3 {
			panic(ci.ctx.sandbox.Runtime().NewTypeError("command.register(name, pattern, handler, options?) requires at least 3 arguments"))
		}
		cmdName := call.Arguments[0].String()
		cmdPattern := stripJSRegexDelimiters(call.Arguments[1].String())
		handler, ok := goja.AssertFunction(call.Arguments[2])
		if !ok {
			panic(ci.ctx.sandbox.Runtime().NewTypeError("command.register: third argument must be a function"))
		}

		aliases := []string{}
		if len(call.Arguments) >= 4 {
			if opts, ok := call.Arguments[3].Export().(map[string]interface{}); ok {
				if a, exists := opts["aliases"]; exists {
					if aList, ok := a.([]interface{}); ok {
						for _, alias := range aList {
							aliases = append(aliases, fmt.Sprintf("%v", alias))
						}
					}
				}
			}
		}

		id := ci.ctx.pluginID + "." + cmdName
		ci.ctx.callbacks[id] = handler

		ci.ctx.mu.Lock()
		ci.ctx.cmdDefinitions = append(ci.ctx.cmdDefinitions, cmdDefEntry{
			Name:     cmdName,
			Pattern:  cmdPattern,
			PluginID: ci.ctx.pluginID,
		})
		ci.ctx.mu.Unlock()

		if ci.ctx.cmdProcessor != nil {
			ci.ctx.cmdProcessor.RegisterCommand(cmdName, cmdPattern, ci.ctx.pluginID)
			for _, alias := range aliases {
				ci.ctx.cmdProcessor.RegisterCommand(cmdName+":"+alias, alias, ci.ctx.pluginID)
			}
		}
		logger.Sugar.Infow("[Plugin] registered command", "id", ci.ctx.pluginID, "command", cmdName, "pattern", cmdPattern, "aliases", aliases)
		return goja.Undefined()
	}
}

// stripJSRegexDelimiters 剥离 JavaScript 正则字面量的分隔符 /pattern/flags
// 插件 JS 代码中常用 /pattern/ 格式，Go 的 regexp 不需要外层 / 分隔符
func stripJSRegexDelimiters(pattern string) string {
	p := strings.TrimSpace(pattern)
	if len(p) >= 2 && p[0] == '/' {
		lastSlash := strings.LastIndex(p[1:], "/")
		if lastSlash >= 0 {
			return p[1 : lastSlash+1]
		}
	}
	return p
}
