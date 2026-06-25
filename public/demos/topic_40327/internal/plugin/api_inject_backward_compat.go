package plugin

import (
	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/storage"
)

// ─── BackwardCompatInjector ───

type BackwardCompatInjector struct {
	ctx *InjectorContext
}

func NewBackwardCompatInjector(ctx *InjectorContext) *BackwardCompatInjector {
	return &BackwardCompatInjector{ctx: ctx}
}

func (bci *BackwardCompatInjector) APIName() string { return "backwardCompat" }

func (bci *BackwardCompatInjector) Inject() error {
	messageAPI := map[string]interface{}{
		"send": bci.createSend(),
	}

	bci.ctx.mergeIntoYara("message", messageAPI)
	return nil
}

func (bci *BackwardCompatInjector) createSend() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(bci.ctx.sandbox.Runtime().NewTypeError("message.send(groupID, content) requires 2 arguments"))
		}
		groupID := call.Arguments[0].String()
		content := call.Arguments[1].String()

		msg := platform.Message{
			ID:        platform.GenerateMessageID(),
			SenderID:  "lunar",
			GroupID:   groupID,
			Content:   content,
			Timestamp: platform.NowMilliseconds(),
		}

		if bci.ctx.sendMessageFn != nil {
			if err := bci.ctx.sendMessageFn(msg); err != nil {
				logger.Sugar.Warnw("[Plugin] message.send failed", "id", bci.ctx.pluginID, "error", err)
				return bci.ctx.sandbox.Runtime().ToValue(false)
			}
			storage.SaveMessage(storage.MessageRecord{
				MessageID:  msg.ID,
				Platform:   "lunar",
				SenderID:   msg.SenderID,
				SenderName: bci.ctx.pluginID,
				GroupID:    groupID,
				Content:    content,
				Direction:  "out",
				Timestamp:  msg.Timestamp,
			})
		}

		return bci.ctx.sandbox.Runtime().ToValue(true)
	}
}
