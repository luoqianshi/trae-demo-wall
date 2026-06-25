package plugin

import (
	"fmt"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/storage"
)

// ─── DatabaseInjector ───
// 为插件提供数据库查询能力，包括消息历史、用户信息等

type DatabaseInjector struct {
	ctx *InjectorContext
}

func NewDatabaseInjector(ctx *InjectorContext) *DatabaseInjector {
	return &DatabaseInjector{ctx: ctx}
}

func (di *DatabaseInjector) APIName() string { return "database" }

func (di *DatabaseInjector) Inject() error {
	// database 需要 database.read 权限
	if !di.ctx.manifest.HasPermission("database.read") {
		return nil
	}

	dbAPI := map[string]interface{}{
		"queryMessages":   di.createQueryMessages(),
		"searchMessages":  di.createSearchMessages(),
		"getUserMessages": di.createGetUserMessages(),
		"getUserInfo":     di.createGetUserInfo(),
	}

	di.ctx.mergeIntoYara("database", dbAPI)
	return nil
}

// queryMessages 查询最近的聊天消息
// JS: yara.database.queryMessages({ platform, groupID, limit })
func (di *DatabaseInjector) createQueryMessages() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := di.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Undefined()
		}

		platform := ""
		groupID := ""
		limit := 50

		if len(call.Arguments) >= 1 {
			if opts, ok := call.Arguments[0].Export().(map[string]interface{}); ok {
				if v, exists := opts["platform"]; exists {
					platform = fmt.Sprintf("%v", v)
				}
				if v, exists := opts["groupID"]; exists {
					groupID = fmt.Sprintf("%v", v)
				}
				if v, exists := opts["limit"]; exists {
					if n, ok := v.(float64); ok {
						limit = int(n)
					} else if n, ok := v.(int64); ok {
						limit = int(n)
					}
				}
			}
		}

		messages, err := storage.GetRecentMessages(platform, groupID, limit)
		if err != nil {
			logger.Sugar.Warnw("[Plugin] database.queryMessages failed", "id", di.ctx.pluginID, "error", err)
			return vm.ToValue([]interface{}{})
		}

		result := make([]interface{}, 0, len(messages))
		for _, msg := range messages {
			result = append(result, map[string]interface{}{
				"messageId":    msg.MessageID,
				"platform":     msg.Platform,
				"senderId":     msg.SenderID,
				"senderName":   msg.SenderName,
				"groupId":      msg.GroupID,
				"groupName":    msg.GroupName,
				"content":      msg.Content,
				"direction":    msg.Direction,
				"isAtMe":       msg.IsAtMe,
				"hasImage":     msg.HasImage,
				"replyToMsgId": msg.ReplyToMsgID,
				"timestamp":    msg.Timestamp,
			})
		}

		return vm.ToValue(result)
	}
}

// searchMessages 全文搜索聊天消息
// JS: yara.database.searchMessages({ platform, groupID, query, limit, offset })
func (di *DatabaseInjector) createSearchMessages() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := di.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Undefined()
		}

		platform := ""
		groupID := ""
		query := ""
		limit := 50
		offset := 0

		if len(call.Arguments) >= 1 {
			if opts, ok := call.Arguments[0].Export().(map[string]interface{}); ok {
				if v, exists := opts["platform"]; exists {
					platform = fmt.Sprintf("%v", v)
				}
				if v, exists := opts["groupID"]; exists {
					groupID = fmt.Sprintf("%v", v)
				}
				if v, exists := opts["query"]; exists {
					query = fmt.Sprintf("%v", v)
				}
				if v, exists := opts["limit"]; exists {
					if n, ok := v.(float64); ok {
						limit = int(n)
					} else if n, ok := v.(int64); ok {
						limit = int(n)
					}
				}
				if v, exists := opts["offset"]; exists {
					if n, ok := v.(float64); ok {
						offset = int(n)
					} else if n, ok := v.(int64); ok {
						offset = int(n)
					}
				}
			}
		}

		if query == "" {
			return vm.ToValue(map[string]interface{}{
				"messages": []interface{}{},
				"total":    0,
			})
		}

		messages, total, err := storage.SearchMessages(platform, groupID, query, limit, offset)
		if err != nil {
			logger.Sugar.Warnw("[Plugin] database.searchMessages failed", "id", di.ctx.pluginID, "error", err)
			return vm.ToValue(map[string]interface{}{"messages": []interface{}{}, "total": 0})
		}

		result := make([]interface{}, 0, len(messages))
		for _, msg := range messages {
			result = append(result, map[string]interface{}{
				"messageId":    msg.MessageID,
				"platform":     msg.Platform,
				"senderId":     msg.SenderID,
				"senderName":   msg.SenderName,
				"groupId":      msg.GroupID,
				"groupName":    msg.GroupName,
				"content":      msg.Content,
				"snippet":      msg.Snippet,
				"direction":    msg.Direction,
				"isAtMe":       msg.IsAtMe,
				"hasImage":     msg.HasImage,
				"replyToMsgId": msg.ReplyToMsgID,
				"timestamp":    msg.Timestamp,
			})
		}

		return vm.ToValue(map[string]interface{}{
			"messages": result,
			"total":    total,
		})
	}
}

// getUserMessages 查询指定用户的消息记录
// JS: yara.database.getUserMessages({ platform, userID, limit })
func (di *DatabaseInjector) createGetUserMessages() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := di.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Undefined()
		}

		platform := ""
		userID := ""
		limit := 50

		if len(call.Arguments) >= 1 {
			if opts, ok := call.Arguments[0].Export().(map[string]interface{}); ok {
				if v, exists := opts["platform"]; exists {
					platform = fmt.Sprintf("%v", v)
				}
				if v, exists := opts["userID"]; exists {
					userID = fmt.Sprintf("%v", v)
				}
				if v, exists := opts["limit"]; exists {
					if n, ok := v.(float64); ok {
						limit = int(n)
					} else if n, ok := v.(int64); ok {
						limit = int(n)
					}
				}
			}
		}

		if userID == "" {
			return vm.ToValue([]interface{}{})
		}

		messages, err := storage.GetUserMessages(platform, userID, limit)
		if err != nil {
			logger.Sugar.Warnw("[Plugin] database.getUserMessages failed", "id", di.ctx.pluginID, "error", err)
			return vm.ToValue([]interface{}{})
		}

		result := make([]interface{}, 0, len(messages))
		for _, msg := range messages {
			result = append(result, map[string]interface{}{
				"messageId":    msg.MessageID,
				"platform":     msg.Platform,
				"senderId":     msg.SenderID,
				"senderName":   msg.SenderName,
				"groupId":      msg.GroupID,
				"groupName":    msg.GroupName,
				"content":      msg.Content,
				"direction":    msg.Direction,
				"isAtMe":       msg.IsAtMe,
				"hasImage":     msg.HasImage,
				"replyToMsgId": msg.ReplyToMsgID,
				"timestamp":    msg.Timestamp,
			})
		}

		return vm.ToValue(result)
	}
}

// getUserInfo 查询用户信息
// JS: yara.database.getUserInfo({ platform, userID })
func (di *DatabaseInjector) createGetUserInfo() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := di.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Null()
		}

		platform := ""
		userID := ""

		if len(call.Arguments) >= 1 {
			if opts, ok := call.Arguments[0].Export().(map[string]interface{}); ok {
				if v, exists := opts["platform"]; exists {
					platform = fmt.Sprintf("%v", v)
				}
				if v, exists := opts["userID"]; exists {
					userID = fmt.Sprintf("%v", v)
				}
			}
		}

		if userID == "" {
			return goja.Null()
		}

		info, err := storage.GetUserInfo(platform, userID)
		if err != nil {
			logger.Sugar.Warnw("[Plugin] database.getUserInfo failed", "id", di.ctx.pluginID, "error", err)
			return goja.Null()
		}
		if info == nil {
			return goja.Null()
		}

		return vm.ToValue(map[string]interface{}{
			"platform":     info.Platform,
			"userId":       info.UserID,
			"name":         info.Name,
			"previousName": info.PreviousName,
		})
	}
}
