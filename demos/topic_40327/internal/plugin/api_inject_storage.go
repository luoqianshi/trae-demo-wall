package plugin

import (
	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/storage"
)

// ─── StorageInjector ───

type StorageInjector struct {
	ctx *InjectorContext
}

func NewStorageInjector(ctx *InjectorContext) *StorageInjector {
	return &StorageInjector{ctx: ctx}
}

func (si *StorageInjector) APIName() string { return "storage" }

func (si *StorageInjector) Inject() error {
	if !si.ctx.checkAnyPermission([]string{"database.read", "database.write"}) {
		return nil
	}

	storageAPI := make(map[string]interface{})

	if si.ctx.manifest.HasPermission("database.read") {
		storageAPI["get"] = si.createGet()
	}

	if si.ctx.manifest.HasPermission("database.write") {
		storageAPI["set"] = si.createSet()
	}

	si.ctx.mergeIntoYara("storage", storageAPI)
	return nil
}

func (si *StorageInjector) createGet() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(si.ctx.sandbox.Runtime().NewTypeError("storage.get(key) requires 1 argument"))
		}
		key := call.Arguments[0].String()
		value, err := storage.GetPluginData(si.ctx.pluginID, key)
		if err != nil || value == "" {
			return goja.Undefined()
		}
		return si.ctx.sandbox.Runtime().ToValue(value)
	}
}

func (si *StorageInjector) createSet() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(si.ctx.sandbox.Runtime().NewTypeError("storage.set(key, value) requires 2 arguments"))
		}
		key := call.Arguments[0].String()
		value := call.Arguments[1].String()
		if err := storage.SetPluginData(si.ctx.pluginID, key, value); err != nil {
			logger.Sugar.Warnw("[Plugin] storage.set failed", "id", si.ctx.pluginID, "error", err)
			return si.ctx.sandbox.Runtime().ToValue(false)
		}
		return si.ctx.sandbox.Runtime().ToValue(true)
	}
}
