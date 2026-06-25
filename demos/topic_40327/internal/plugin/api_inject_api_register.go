package plugin

import (
	"fmt"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

// ─── APIRegisterInjector ───

type APIRegisterInjector struct {
	ctx *InjectorContext
}

func NewAPIRegisterInjector(ctx *InjectorContext) *APIRegisterInjector {
	return &APIRegisterInjector{ctx: ctx}
}

func (ari *APIRegisterInjector) APIName() string { return "api" }

func (ari *APIRegisterInjector) Inject() error {
	if !ari.ctx.checkAnyPermission([]string{"api.register", "api.call"}) {
		return nil
	}

	apiComponentAPI := make(map[string]interface{})

	if ari.ctx.manifest.HasPermission("api.register") {
		apiComponentAPI["register"] = ari.createRegister()
	}

	if ari.ctx.manifest.HasPermission("api.call") {
		apiComponentAPI["call"] = ari.createCall()
	}

	ari.ctx.mergeIntoYara("api", apiComponentAPI)
	return nil
}

func (ari *APIRegisterInjector) createRegister() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(ari.ctx.sandbox.Runtime().NewTypeError("api.register(name, handler, options?) requires at least 2 arguments"))
		}
		name := call.Arguments[0].String()
		handler, ok := goja.AssertFunction(call.Arguments[1])
		if !ok {
			panic(ari.ctx.sandbox.Runtime().NewTypeError("api.register: second argument must be a function"))
		}

		if name == "" {
			panic(ari.ctx.sandbox.Runtime().NewTypeError("api.register: name cannot be empty"))
		}

		description := ""
		version := "1"
		public := false

		if len(call.Arguments) >= 3 {
			if opts, ok := call.Arguments[2].Export().(map[string]interface{}); ok {
				if d, exists := opts["description"]; exists {
					description = fmt.Sprintf("%v", d)
				}
				if v, exists := opts["version"]; exists {
					version = fmt.Sprintf("%v", v)
				}
				if p, exists := opts["public"]; exists {
					if b, ok := p.(bool); ok {
						public = b
					}
				}
			}
		}

		entry := apiEntry{
			Name:        name,
			Description: description,
			Version:     version,
			Public:      public,
			Handler:     handler,
		}

		ari.ctx.mu.Lock()
		ari.ctx.apiEntries = append(ari.ctx.apiEntries, entry)
		ari.ctx.mu.Unlock()

		logger.Sugar.Infow("[Plugin] registered api", "id", ari.ctx.pluginID, "name", name, "public", public, "version", version)
		return goja.Undefined()
	}
}

func (ari *APIRegisterInjector) createCall() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(ari.ctx.sandbox.Runtime().NewTypeError("api.call(qualifiedName, params?) requires at least 1 argument"))
		}
		qualifiedName := call.Arguments[0].String()
		var params map[string]interface{}
		if len(call.Arguments) >= 2 {
			if p, ok := call.Arguments[1].Export().(map[string]interface{}); ok {
				params = p
			}
		}

		if ari.ctx.crossPluginAPICallFn != nil {
			result, err := ari.ctx.crossPluginAPICallFn(qualifiedName, params)
			if err != nil {
				logger.Sugar.Warnw("[Plugin] cross-plugin api call failed", "id", ari.ctx.pluginID, "api", qualifiedName, "error", err)
				return ari.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
					"error": err.Error(),
				})
			}
			return ari.ctx.sandbox.Runtime().ToValue(result)
		}

		return ari.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"error": "cross-plugin API call is not available",
		})
	}
}
