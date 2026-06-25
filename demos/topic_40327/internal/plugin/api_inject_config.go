package plugin

import (
	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/storage"
)

// ─── ConfigInjector ───

type ConfigInjector struct {
	ctx *InjectorContext
}

func NewConfigInjector(ctx *InjectorContext) *ConfigInjector {
	return &ConfigInjector{ctx: ctx}
}

func (ci *ConfigInjector) APIName() string { return "config" }

func (ci *ConfigInjector) Inject() error {
	configAPI := map[string]interface{}{
		"get": ci.createGet(),
		"set": ci.createSet(),
	}

	ci.ctx.mergeIntoYara("config", configAPI)
	return nil
}

func (ci *ConfigInjector) createGet() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		key := ""
		var defaultVal interface{}
		if len(call.Arguments) >= 1 {
			key = call.Arguments[0].String()
		}
		if len(call.Arguments) >= 2 {
			defaultVal = call.Arguments[1].Export()
		}

		value, err := storage.GetPluginData(ci.ctx.pluginID, "config."+key)
		if err != nil || value == "" {
			if defaultVal != nil {
				return ci.ctx.sandbox.Runtime().ToValue(defaultVal)
			}
			return goja.Undefined()
		}
		return ci.ctx.sandbox.Runtime().ToValue(value)
	}
}

func (ci *ConfigInjector) createSet() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(ci.ctx.sandbox.Runtime().NewTypeError("config.set(key, value) requires 2 arguments"))
		}
		key := call.Arguments[0].String()
		value := call.Arguments[1].String()
		if err := storage.SetPluginData(ci.ctx.pluginID, "config."+key, value); err != nil {
			logger.Sugar.Warnw("[Plugin] config.set failed", "id", ci.ctx.pluginID, "error", err)
			return ci.ctx.sandbox.Runtime().ToValue(false)
		}
		return ci.ctx.sandbox.Runtime().ToValue(true)
	}
}
