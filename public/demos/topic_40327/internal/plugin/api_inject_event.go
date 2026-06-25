package plugin

import (
	"github.com/dop251/goja"

	"YaraFlow/internal/bus"
	"YaraFlow/internal/logger"
)

// ─── EventInjector ───

type EventInjector struct {
	ctx *InjectorContext
}

func NewEventInjector(ctx *InjectorContext) *EventInjector {
	return &EventInjector{ctx: ctx}
}

func (ei *EventInjector) APIName() string { return "event" }

func (ei *EventInjector) Inject() error {
	if !ei.ctx.checkAnyPermission([]string{"event.subscribe", "event.publish"}) {
		return nil
	}

	eventAPI := make(map[string]interface{})

	if ei.ctx.manifest.HasPermission("event.subscribe") {
		eventAPI["subscribe"] = ei.createSubscribe()
	}

	if ei.ctx.manifest.HasPermission("event.publish") {
		eventAPI["publish"] = ei.createPublish()
	}

	ei.ctx.mergeIntoYara("event", eventAPI)
	return nil
}

func (ei *EventInjector) createSubscribe() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(ei.ctx.sandbox.Runtime().NewTypeError("event.subscribe(topic, callback) requires 2 arguments"))
		}
		topic := call.Arguments[0].String()
		callback, ok := goja.AssertFunction(call.Arguments[1])
		if !ok {
			panic(ei.ctx.sandbox.Runtime().NewTypeError("event.subscribe: second argument must be a function"))
		}

		adapter := &jsEventAdapter{
			ctx:      ei.ctx,
			callback: callback,
			topic:    topic,
		}

		ei.ctx.mu.Lock()
		ei.ctx.eventSubs = append(ei.ctx.eventSubs, eventSubEntry{
			Topic:    topic,
			Callback: callback,
			Adapter:  adapter,
		})
		ei.ctx.mu.Unlock()

		bus.DefaultBus.Subscribe(topic, adapter)
		logger.Sugar.Infow("[Plugin] subscribed to event", "id", ei.ctx.pluginID, "topic", topic)
		return goja.Undefined()
	}
}

func (ei *EventInjector) createPublish() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(ei.ctx.sandbox.Runtime().NewTypeError("event.publish(topic, payload?) requires at least 1 argument"))
		}
		topic := call.Arguments[0].String()
		var payload interface{}
		if len(call.Arguments) >= 2 {
			payload = call.Arguments[1].Export()
		}

		bus.DefaultBus.Publish(topic, payload)
		logger.Sugar.Infow("[Plugin] published event", "id", ei.ctx.pluginID, "topic", topic)
		return goja.Undefined()
	}
}
