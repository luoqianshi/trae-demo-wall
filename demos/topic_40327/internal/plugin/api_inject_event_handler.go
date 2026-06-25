package plugin

import (
	"fmt"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

// ─── EventHandlerInjector ───

type EventHandlerInjector struct {
	ctx *InjectorContext
}

func NewEventHandlerInjector(ctx *InjectorContext) *EventHandlerInjector {
	return &EventHandlerInjector{ctx: ctx}
}

func (ehi *EventHandlerInjector) APIName() string { return "eventHandler" }

func (ehi *EventHandlerInjector) Inject() error {
	if !ehi.ctx.manifest.HasPermission("event_handler.register") {
		return nil
	}

	eventHandlerAPI := map[string]interface{}{
		"register": ehi.createRegister(),
	}

	ehi.ctx.mergeIntoYara("eventHandler", eventHandlerAPI)
	return nil
}

func (ehi *EventHandlerInjector) createRegister() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 3 {
			panic(ehi.ctx.sandbox.Runtime().NewTypeError("eventHandler.register(name, eventType, handler, options?) requires at least 3 arguments"))
		}
		name := call.Arguments[0].String()
		eventType := call.Arguments[1].String()
		handler, ok := goja.AssertFunction(call.Arguments[2])
		if !ok {
			panic(ehi.ctx.sandbox.Runtime().NewTypeError("eventHandler.register: third argument must be a function"))
		}

		if !validEventTypes[eventType] {
			panic(ehi.ctx.sandbox.Runtime().NewTypeError("eventHandler.register: invalid event type '" + eventType + "'"))
		}

		interceptMessage := false
		weight := 0
		description := ""

		if len(call.Arguments) >= 4 {
			if opts, ok := call.Arguments[3].Export().(map[string]interface{}); ok {
				if im, exists := opts["interceptMessage"]; exists {
					if b, ok := im.(bool); ok {
						interceptMessage = b
					}
				}
				if w, exists := opts["weight"]; exists {
					if wNum, ok := w.(int64); ok {
						weight = int(wNum)
					} else if wNum, ok := w.(float64); ok {
						weight = int(wNum)
					}
				}
				if d, exists := opts["description"]; exists {
					description = fmt.Sprintf("%v", d)
				}
			}
		}

		entry := eventHandlerEntry{
			Name:             name,
			Description:      description,
			EventType:        eventType,
			InterceptMessage: interceptMessage,
			Weight:           weight,
			Handler:          handler,
		}

		ehi.ctx.mu.Lock()
		ehi.ctx.eventHandlerEntries = append(ehi.ctx.eventHandlerEntries, entry)
		ehi.ctx.mu.Unlock()

		logger.Sugar.Infow("[Plugin] registered event handler", "id", ehi.ctx.pluginID, "name", name, "event", eventType, "intercept", interceptMessage, "weight", weight)
		return goja.Undefined()
	}
}
