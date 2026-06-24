package plugin

import (
	"fmt"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

// ─── LLMProviderInjector ───

type LLMProviderInjector struct {
	ctx *InjectorContext
}

func NewLLMProviderInjector(ctx *InjectorContext) *LLMProviderInjector {
	return &LLMProviderInjector{ctx: ctx}
}

func (lpi *LLMProviderInjector) APIName() string { return "llmProvider" }

func (lpi *LLMProviderInjector) Inject() error {
	if !lpi.ctx.manifest.HasPermission("llm_provider.register") {
		return nil
	}

	llmProviderAPI := map[string]interface{}{
		"register": lpi.createRegister(),
	}

	lpi.ctx.mergeIntoYara("llmProvider", llmProviderAPI)
	return nil
}

func (lpi *LLMProviderInjector) createRegister() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(lpi.ctx.sandbox.Runtime().NewTypeError("llmProvider.register(clientType, handler, options?) requires at least 2 arguments"))
		}
		clientType := call.Arguments[0].String()
		handler, ok := goja.AssertFunction(call.Arguments[1])
		if !ok {
			panic(lpi.ctx.sandbox.Runtime().NewTypeError("llmProvider.register: second argument must be a function"))
		}

		if clientType == "" {
			panic(lpi.ctx.sandbox.Runtime().NewTypeError("llmProvider.register: clientType cannot be empty"))
		}

		name := clientType
		description := ""
		version := "1.0.0"

		if len(call.Arguments) >= 3 {
			if opts, ok := call.Arguments[2].Export().(map[string]interface{}); ok {
				if n, exists := opts["name"]; exists {
					name = fmt.Sprintf("%v", n)
				}
				if d, exists := opts["description"]; exists {
					description = fmt.Sprintf("%v", d)
				}
				if v, exists := opts["version"]; exists {
					version = fmt.Sprintf("%v", v)
				}
			}
		}

		entry := llmProviderEntry{
			ClientType:  clientType,
			Name:        name,
			Description: description,
			Version:     version,
			Handler:     handler,
		}

		lpi.ctx.mu.Lock()
		lpi.ctx.llmProviderEntries = append(lpi.ctx.llmProviderEntries, entry)
		lpi.ctx.mu.Unlock()

		logger.Sugar.Infow("[Plugin] registered llm provider", "id", lpi.ctx.pluginID, "name", name, "client_type", clientType)
		return goja.Undefined()
	}
}
