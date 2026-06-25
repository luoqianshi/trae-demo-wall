package plugin

import (
	"fmt"
	"strings"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

// ─── LoggerInjector ───

type LoggerInjector struct {
	ctx *InjectorContext
}

func NewLoggerInjector(ctx *InjectorContext) *LoggerInjector {
	return &LoggerInjector{ctx: ctx}
}

func (li *LoggerInjector) APIName() string { return "logger" }

func (li *LoggerInjector) Inject() error {
	loggerAPI := map[string]interface{}{
		"info":  li.createLogFunc("INFO", func(msg string) { logger.Info(msg) }),
		"warn":  li.createLogFunc("WARN", func(msg string) { logger.Warn(msg) }),
		"error": li.createLogFunc("ERROR", func(msg string) { logger.Warn(msg) }),
		"debug": li.createLogFunc("DEBUG", func(msg string) { logger.Info(msg) }),
	}

	li.ctx.mergeIntoYara("logger", loggerAPI)
	return nil
}

func (li *LoggerInjector) createLogFunc(level string, logFunc func(msg string)) func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		args := make([]interface{}, len(call.Arguments))
		for i, arg := range call.Arguments {
			args[i] = arg.Export()
		}
		msg := fmt.Sprintf("[Plugin:%s] %s %v", li.ctx.pluginID, strings.ToUpper(level), args)
		logFunc(msg)
		return goja.Undefined()
	}
}