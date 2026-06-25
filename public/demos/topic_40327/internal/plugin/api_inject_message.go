package plugin

import (
	"fmt"
	"strings"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/storage"
)

// ─── MessageInjector ───

type MessageInjector struct {
	ctx *InjectorContext
}

func NewMessageInjector(ctx *InjectorContext) *MessageInjector {
	return &MessageInjector{ctx: ctx}
}

func (mi *MessageInjector) APIName() string { return "send" }

func (mi *MessageInjector) Inject() error {
	sendAPI := map[string]interface{}{
		"text":   mi.createSendText(),
		"image":  mi.createSendImage(),
		"emoji":  mi.createSendEmoji(),
		"hybrid": mi.createSendHybrid(),
	}

	sendObj := mi.ctx.sandbox.Get("yara_send")
	if sendObj != nil && !goja.IsUndefined(sendObj) {
		if obj, ok := sendObj.Export().(map[string]interface{}); ok {
			for k, v := range sendAPI {
				obj[k] = v
			}
			mi.ctx.mergeIntoYara("send", obj)
		}
	} else {
		mi.ctx.mergeIntoYara("send", sendAPI)
	}
	return nil
}

func (mi *MessageInjector) createSendText() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(mi.ctx.sandbox.Runtime().NewTypeError("send.text(groupID, content) requires 2 arguments"))
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

		if mi.ctx.sendMessageFn != nil {
			if err := mi.ctx.sendMessageFn(msg); err != nil {
				logger.Sugar.Warnw("[Plugin] send.text failed", "id", mi.ctx.pluginID, "error", err)
				return mi.ctx.sandbox.Runtime().ToValue(false)
			}
			storage.SaveMessage(storage.MessageRecord{
				MessageID:  msg.ID,
				Platform:   "lunar",
				SenderID:   msg.SenderID,
				SenderName: mi.ctx.pluginID,
				GroupID:    groupID,
				Content:    content,
				Direction:  "out",
				Timestamp:  msg.Timestamp,
			})
		}

		return mi.ctx.sandbox.Runtime().ToValue(true)
	}
}

func (mi *MessageInjector) createSendImage() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(mi.ctx.sandbox.Runtime().NewTypeError("send.image(groupID, imageData) requires 2 arguments"))
		}
		groupID := call.Arguments[0].String()
		imageData := call.Arguments[1].String()

		msg := platform.Message{
			ID:        platform.GenerateMessageID(),
			SenderID:  "lunar",
			GroupID:   groupID,
			Content:   fmt.Sprintf("[图片: %s]", imageData[:minInt(len(imageData), 50)]),
			Timestamp: platform.NowMilliseconds(),
		}

		if mi.ctx.sendMessageFn != nil {
			if err := mi.ctx.sendMessageFn(msg); err != nil {
				logger.Sugar.Warnw("[Plugin] send.image failed", "id", mi.ctx.pluginID, "error", err)
				return mi.ctx.sandbox.Runtime().ToValue(false)
			}
		}

		return mi.ctx.sandbox.Runtime().ToValue(true)
	}
}

// createSendEmoji 发送表情包消息
// JS: send.emoji(groupID, emojiData)
func (mi *MessageInjector) createSendEmoji() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(mi.ctx.sandbox.Runtime().NewTypeError("send.emoji(groupID, emojiData) requires 2 arguments"))
		}
		groupID := call.Arguments[0].String()
		emojiData := call.Arguments[1]

		content := fmt.Sprintf("[表情包: %v]", emojiData.Export())

		msg := platform.Message{
			ID:        platform.GenerateMessageID(),
			SenderID:  "lunar",
			GroupID:   groupID,
			Content:   content,
			Timestamp: platform.NowMilliseconds(),
		}

		if mi.ctx.sendMessageFn != nil {
			if err := mi.ctx.sendMessageFn(msg); err != nil {
				logger.Sugar.Warnw("[Plugin] send.emoji failed", "id", mi.ctx.pluginID, "error", err)
				return mi.ctx.sandbox.Runtime().ToValue(false)
			}
		}

		return mi.ctx.sandbox.Runtime().ToValue(true)
	}
}

// createSendHybrid 发送图文混合消息
// JS: send.hybrid(groupID, [{ type: "text", content: "..." }, { type: "image", content: "base64..." }])
func (mi *MessageInjector) createSendHybrid() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(mi.ctx.sandbox.Runtime().NewTypeError("send.hybrid(groupID, segments) requires 2 arguments"))
		}
		groupID := call.Arguments[0].String()

		segmentsRaw := call.Arguments[1].Export()
		segmentsList, ok := segmentsRaw.([]interface{})
		if !ok {
			panic(mi.ctx.sandbox.Runtime().NewTypeError("send.hybrid: segments must be an array"))
		}

		var contentParts []string
		for _, segRaw := range segmentsList {
			segMap, ok := segRaw.(map[string]interface{})
			if !ok {
				continue
			}
			segType, _ := segMap["type"].(string)
			segContent, _ := segMap["content"].(string)

			switch segType {
			case "text":
				contentParts = append(contentParts, segContent)
			case "image":
				contentParts = append(contentParts, "[图片]")
			case "emoji":
				contentParts = append(contentParts, "[表情包]")
			default:
				contentParts = append(contentParts, fmt.Sprintf("[%s]", segType))
			}
		}

		msg := platform.Message{
			ID:        platform.GenerateMessageID(),
			SenderID:  "lunar",
			GroupID:   groupID,
			Content:   strings.Join(contentParts, ""),
			Timestamp: platform.NowMilliseconds(),
		}

		if mi.ctx.sendMessageFn != nil {
			if err := mi.ctx.sendMessageFn(msg); err != nil {
				logger.Sugar.Warnw("[Plugin] send.hybrid failed", "id", mi.ctx.pluginID, "error", err)
				return mi.ctx.sandbox.Runtime().ToValue(false)
			}
		}

		return mi.ctx.sandbox.Runtime().ToValue(true)
	}
}
