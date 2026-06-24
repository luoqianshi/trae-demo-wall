package plugin

import (
	"fmt"
	"time"

	"github.com/dop251/goja"

	"YaraFlow/internal/hook"
	"YaraFlow/internal/logger"
)

// ─── HookInjector ───

type HookInjector struct {
	ctx *InjectorContext
}

func NewHookInjector(ctx *InjectorContext) *HookInjector {
	return &HookInjector{ctx: ctx}
}

func (hi *HookInjector) APIName() string { return "hook" }

func (hi *HookInjector) Inject() error {
	if !hi.ctx.manifest.HasPermission("hook.register") {
		return nil
	}

	hookAPI := map[string]interface{}{
		"register": hi.createRegister(),
	}

	hi.ctx.mergeIntoYara("hook", hookAPI)
	return nil
}

func (hi *HookInjector) createRegister() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(hi.ctx.sandbox.Runtime().NewTypeError("hook.register(type, handler, options?) requires at least 2 arguments"))
		}
		hookTypeStr := call.Arguments[0].String()

		var handler goja.Callable
		var rawOpts map[string]interface{}
		var ok bool

		handler, ok = goja.AssertFunction(call.Arguments[1])
		if ok {
			if len(call.Arguments) >= 3 {
				if opts, optsOk := call.Arguments[2].Export().(map[string]interface{}); optsOk {
					rawOpts = opts
				}
			}
		} else if len(call.Arguments) >= 3 {
			handler, ok = goja.AssertFunction(call.Arguments[2])
			if !ok {
				panic(hi.ctx.sandbox.Runtime().NewTypeError("hook.register: handler must be a function (either as 2nd or 3rd argument)"))
			}
			if opts, optsOk := call.Arguments[1].Export().(map[string]interface{}); optsOk {
				rawOpts = opts
			}
		} else {
			panic(hi.ctx.sandbox.Runtime().NewTypeError("hook.register: second or third argument must be a function"))
		}

		if !validHookTypes[hookTypeStr] {
			panic(hi.ctx.sandbox.Runtime().NewTypeError("hook.register: invalid hook type '" + hookTypeStr + "'"))
		}

		mode := "blocking"
		order := "normal"
		errorPolicy := "skip"
		timeoutMs := 8000 // 默认 8 秒

		if rawOpts != nil {
			if m, exists := rawOpts["mode"]; exists {
				modeStr := fmt.Sprintf("%v", m)
				if validHookModes[modeStr] {
					mode = modeStr
				}
			}
			if o, exists := rawOpts["order"]; exists {
				orderStr := fmt.Sprintf("%v", o)
				if validHookOrders[orderStr] {
					order = orderStr
				}
			}
			if ep, exists := rawOpts["errorPolicy"]; exists {
				epStr := fmt.Sprintf("%v", ep)
				if validErrorPolicies[epStr] {
					errorPolicy = epStr
				}
			}
			if t, exists := rawOpts["timeoutMs"]; exists {
				if tNum, ok := t.(int64); ok {
					timeoutMs = int(tNum)
				} else if tNum, ok := t.(float64); ok {
					timeoutMs = int(tNum)
				}
			}
		}

		spec, hasSpec := hookSpecs[hookTypeStr]
		if hasSpec {
			if mode == "blocking" && !spec.AllowBlocking {
				panic(hi.ctx.sandbox.Runtime().NewTypeError("hook.register: hook '" + hookTypeStr + "' does not allow blocking mode"))
			}
			if errorPolicy == "abort" && !spec.AllowAbort {
				panic(hi.ctx.sandbox.Runtime().NewTypeError("hook.register: hook '" + hookTypeStr + "' does not allow abort error policy"))
			}
		}

		hookType := hook.HookType(hookTypeStr)

		hookHandler := hook.HookHandlerFunc(func(event hook.HookEvent) (result hook.HookResult) {
			defer func() {
				if r := recover(); r != nil {
					logger.Sugar.Warnw("[Plugin] hook handler panic", "id", hi.ctx.pluginID, "hook", hookTypeStr, "panic", r)
					result = hook.HookResult{AllowContinue: true}
				}
			}()

			vm, err := hi.ctx.sandboxSafe()
			if err != nil {
				return hook.HookResult{AllowContinue: true}
			}

			jsEvent := map[string]interface{}{
				"type":    string(event.Type),
				"message": jsifyMessage(vm, event.Message),
				"context": event.Context,
			}

			jsResult, jsErr := handler(goja.Undefined(), vm.ToValue(jsEvent))
			if jsErr != nil {
				logger.Sugar.Warnw("[Plugin] hook handler error", "id", hi.ctx.pluginID, "hook", hookTypeStr, "error", jsErr)
				return hook.HookResult{AllowContinue: true}
			}

			exported := jsResult.Export()
			hookResult := hook.HookResult{AllowContinue: true}

			if resultMap, ok := exported.(map[string]interface{}); ok {
				if action, exists := resultMap["action"]; exists {
					actionStr := fmt.Sprintf("%v", action)
					if actionStr == "abort" {
						hookResult.AllowContinue = false
					}
				}
				if allow, exists := resultMap["allowContinue"]; exists {
					if b, ok := allow.(bool); ok {
						hookResult.AllowContinue = b
					}
				}
			}
			return hookResult
		})

		hi.ctx.mu.Lock()
		hi.ctx.hookEntries = append(hi.ctx.hookEntries, hookEntry{
			HookType: hookType,
			Handler:  hookHandler,
		})
		hi.ctx.mu.Unlock()

		hook.DefaultHookManager.Register(hookType, hookHandler, time.Duration(timeoutMs)*time.Millisecond, mode == "observe")
		logger.Sugar.Infow("[Plugin] registered hook", "id", hi.ctx.pluginID, "hook", hookTypeStr, "mode", mode, "order", order, "error_policy", errorPolicy)
		return goja.Undefined()
	}
}
