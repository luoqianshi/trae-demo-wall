package plugin

import (
	"github.com/dop251/goja"

	"YaraFlow/internal/emoji"
	"YaraFlow/internal/logger"
)

// ─── EmojiInjector ───
// 为插件提供表情包查询能力

type EmojiInjector struct {
	ctx *InjectorContext
}

func NewEmojiInjector(ctx *InjectorContext) *EmojiInjector {
	return &EmojiInjector{ctx: ctx}
}

func (ei *EmojiInjector) APIName() string { return "emoji" }

func (ei *EmojiInjector) Inject() error {
	// 需要 emoji.access 权限
	if !ei.ctx.manifest.HasPermission("emoji.access") {
		return nil
	}

	emojiAPI := map[string]any{
		"getRandom":    ei.createGetRandom(),
		"getByEmotion": ei.createGetByEmotion(),
		"getAll":       ei.createGetAll(),
		"getCount":     ei.createGetCount(),
		"getEmotions":  ei.createGetEmotions(),
		"getInfo":      ei.createGetInfo(),
	}

	ei.ctx.mergeIntoYara("emoji", emojiAPI)
	return nil
}

// emojiInfoToJS 将 EmojiInfo 转换为 JS 对象
func emojiInfoToJS(_ *goja.Runtime, e *emoji.EmojiInfo) map[string]any {
	if e == nil {
		return nil
	}
	return map[string]any{
		"hash":         e.Hash,
		"fileName":     e.FileName,
		"description":  e.Description,
		"emotions":     e.Emotions,
		"queryCount":   e.QueryCount,
		"isRegistered": e.IsRegistered,
		"isBanned":     e.IsBanned,
	}
}

// getRandom 随机获取一个表情包
// JS: yara.emoji.getRandom()
func (ei *EmojiInjector) createGetRandom() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := ei.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Null()
		}

		if emoji.DefaultEmojiManager == nil {
			logger.Sugar.Warnw("[Plugin] emoji manager not initialized", "id", ei.ctx.pluginID)
			return goja.Null()
		}

		result := emoji.DefaultEmojiManager.GetRandomEmoji()
		jsObj := emojiInfoToJS(vm, result)
		if jsObj == nil {
			return goja.Null()
		}
		return vm.ToValue(jsObj)
	}
}

// getByEmotion 按情绪标签获取表情包
// JS: yara.emoji.getByEmotion(emotion)
func (ei *EmojiInjector) createGetByEmotion() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := ei.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Null()
		}

		if len(call.Arguments) < 1 {
			return goja.Null()
		}

		emotion := call.Arguments[0].String()
		if emotion == "" {
			return goja.Null()
		}

		if emoji.DefaultEmojiManager == nil {
			return goja.Null()
		}

		result := emoji.DefaultEmojiManager.GetEmojiByEmotion(emotion)
		jsObj := emojiInfoToJS(vm, result)
		if jsObj == nil {
			return goja.Null()
		}
		return vm.ToValue(jsObj)
	}
}

// getAll 获取所有已注册表情包
// JS: yara.emoji.getAll()
func (ei *EmojiInjector) createGetAll() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := ei.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Null()
		}

		if emoji.DefaultEmojiManager == nil {
			return vm.ToValue([]any{})
		}

		all := emoji.DefaultEmojiManager.GetAllEmojis()
		result := make([]any, 0, len(all))
		for _, e := range all {
			jsObj := emojiInfoToJS(vm, e)
			if jsObj != nil {
				result = append(result, jsObj)
			}
		}
		return vm.ToValue(result)
	}
}

// getCount 获取表情包总数
// JS: yara.emoji.getCount()
func (ei *EmojiInjector) createGetCount() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := ei.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Undefined()
		}
		if emoji.DefaultEmojiManager == nil {
			return vm.ToValue(0)
		}
		count := emoji.DefaultEmojiManager.GetEmojiCount()
		return vm.ToValue(count)
	}
}

// getEmotions 获取所有情绪标签
// JS: yara.emoji.getEmotions()
func (ei *EmojiInjector) createGetEmotions() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := ei.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Null()
		}
		if emoji.DefaultEmojiManager == nil {
			return vm.ToValue([]any{})
		}

		all := emoji.DefaultEmojiManager.GetAllEmojis()
		emotionSet := make(map[string]bool)
		for _, e := range all {
			for _, emotion := range e.Emotions {
				if emotion != "" {
					emotionSet[emotion] = true
				}
			}
		}

		emotions := make([]any, 0, len(emotionSet))
		for emotion := range emotionSet {
			emotions = append(emotions, emotion)
		}
		return vm.ToValue(emotions)
	}
}

// getInfo 获取表情包系统信息
// JS: yara.emoji.getInfo()
func (ei *EmojiInjector) createGetInfo() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := ei.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Null()
		}
		if emoji.DefaultEmojiManager == nil {
			return vm.ToValue(map[string]any{
				"available": false,
			})
		}

		count := emoji.DefaultEmojiManager.GetEmojiCount()
		return vm.ToValue(map[string]any{
			"available":  true,
			"totalCount": count,
		})
	}
}
