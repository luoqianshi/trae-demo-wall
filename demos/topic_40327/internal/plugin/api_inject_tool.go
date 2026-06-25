package plugin

import (
	"fmt"
	"time"

	"github.com/dop251/goja"

	"YaraFlow/internal/config"
	"YaraFlow/internal/hook"
	"YaraFlow/internal/logger"
)

// ─── ToolInjector ───

type ToolInjector struct {
	ctx *InjectorContext
}

func NewToolInjector(ctx *InjectorContext) *ToolInjector {
	return &ToolInjector{ctx: ctx}
}

func (ti *ToolInjector) APIName() string { return "tool" }

func (ti *ToolInjector) Inject() error {
	if !ti.ctx.manifest.HasPermission("tool.register") {
		return nil
	}

	toolAPI := map[string]interface{}{
		"register":           ti.createRegister(),
		"registerAutonomous": ti.createRegisterAutonomous(),
		"getDefinitions":     ti.createGetDefinitions(),
	}

	ti.ctx.mergeIntoYara("tool", toolAPI)
	return nil
}

func (ti *ToolInjector) createRegister() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 3 {
			panic(ti.ctx.sandbox.Runtime().NewTypeError("tool.register(name, definition, handler) requires 3 arguments"))
		}
		toolName := call.Arguments[0].String()
		rawDef := call.Arguments[1].Export()
		handler, ok := goja.AssertFunction(call.Arguments[2])
		if !ok {
			panic(ti.ctx.sandbox.Runtime().NewTypeError("tool.register: third argument must be a function"))
		}

		defMap, ok := rawDef.(map[string]interface{})
		if !ok {
			panic(ti.ctx.sandbox.Runtime().NewTypeError("tool.register: definition must be an object"))
		}

		description := ""
		briefDescription := ""
		detailedDescription := ""
		coreTool := false
		visibility := ""
		toolType := ""
		timeoutSeconds := 0

		if desc, exists := defMap["description"]; exists {
			description = fmt.Sprintf("%v", desc)
		}
		if brief, exists := defMap["briefDescription"]; exists {
			briefDescription = fmt.Sprintf("%v", brief)
		}
		if detailed, exists := defMap["detailedDescription"]; exists {
			detailedDescription = fmt.Sprintf("%v", detailed)
		}
		if ct, exists := defMap["coreTool"]; exists {
			if b, ok := ct.(bool); ok {
				coreTool = b
			}
		}
		// 提取可见性：visible / hidden / deferred
		if v, exists := defMap["visibility"]; exists {
			visibility = fmt.Sprintf("%v", v)
		}
		// 提取工具类型：agent / autonomous / core
		if t, exists := defMap["toolType"]; exists {
			toolType = fmt.Sprintf("%v", t)
		}
		// coreTool 为 true 时将 toolType 设为 core（向后兼容）
		if coreTool && toolType == "" {
			toolType = ToolTypeCore
		}
		// 提取超时时间
		if ts, exists := defMap["timeoutSeconds"]; exists {
			if tsNum, ok := ts.(float64); ok {
				timeoutSeconds = int(tsNum)
			} else if tsInt, ok := ts.(int64); ok {
				timeoutSeconds = int(tsInt)
			}
		}

		var parameters []ToolParamDef
		if paramsRaw, exists := defMap["parameters"]; exists {
			if paramsList, ok := paramsRaw.([]interface{}); ok {
				for _, p := range paramsList {
					if pMap, ok := p.(map[string]interface{}); ok {
						required := false
						if req, exists := pMap["required"]; exists {
							if b, ok := req.(bool); ok {
								required = b
							}
						}

						paramDef := ToolParamDef{
							Name:        fmt.Sprintf("%v", pMap["name"]),
							Type:        fmt.Sprintf("%v", pMap["type"]),
							Description: fmt.Sprintf("%v", pMap["description"]),
							Required:    required,
						}

						if def, exists := pMap["default"]; exists {
							paramDef.Default = def
						}
						if enumVals, exists := pMap["enumValues"]; exists {
							if ev, ok := enumVals.([]interface{}); ok {
								paramDef.EnumValues = ev
							}
						}

						parameters = append(parameters, paramDef)
					}
				}
			}
		}

		definition := ToolDef{
			Name:                toolName,
			Description:         description,
			BriefDescription:    briefDescription,
			DetailedDescription: detailedDescription,
			Parameters:          parameters,
			CoreTool:            coreTool,
			Visibility:          visibility,
			ToolType:            toolType,
			TimeoutSeconds:      timeoutSeconds,
		}

		id := ti.ctx.pluginID + "." + toolName
		ti.ctx.callbacks[id] = handler

		ti.ctx.mu.Lock()
		ti.ctx.toolDefinitions = append(ti.ctx.toolDefinitions, toolDefEntry{
			Name:       toolName,
			Definition: definition,
		})
		ti.ctx.mu.Unlock()

		logger.Sugar.Infow("[Plugin] registered tool", "id", ti.ctx.pluginID, "tool", toolName, "core", coreTool, "visibility", visibility, "toolType", toolType)
		return goja.Undefined()
	}
}

// createRegisterAutonomous 注册自主运行工具
// 自主运行工具的特点：
//   - visibility 固定为 "hidden"，对 Agent 不可见
//   - toolType 固定为 "autonomous"
//   - 通过 Hook 自动触发（如检测到 B站链接 → 视频理解 → 注入聊天流）
//
// JS 调用方式:
//
//	yara.tool.registerAutonomous({
//	    name: "bilibili_video_understander",
//	    description: "检测B站视频链接并自动理解视频内容",
//	    hookType: "chat.receive.before_process",  // 拦截消息的 Hook 点
//	    pattern: "bilibili\\.com/video/(BV\\w+)",  // 触发正则（可选）
//	    handler: function(message) {
//	        // 检测到 B站链接，进行视频理解
//	        // 返回 { intercepted: true, injectedContent: "视频摘要..." }
//	    }
//	})
func (ti *ToolInjector) createRegisterAutonomous() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(ti.ctx.sandbox.Runtime().NewTypeError("tool.registerAutonomous(definition) requires 1 argument"))
		}

		rawDef := call.Arguments[0].Export()
		defMap, ok := rawDef.(map[string]interface{})
		if !ok {
			panic(ti.ctx.sandbox.Runtime().NewTypeError("tool.registerAutonomous: definition must be an object"))
		}

		// 提取工具名称
		toolName := ""
		if n, exists := defMap["name"]; exists {
			toolName = fmt.Sprintf("%v", n)
		}
		if toolName == "" {
			panic(ti.ctx.sandbox.Runtime().NewTypeError("tool.registerAutonomous: name is required"))
		}

		// 提取 handler
		handler, handlerOk := goja.AssertFunction(call.Arguments[0].ToObject(ti.ctx.sandbox.Runtime()).Get("handler"))
		if !handlerOk {
			panic(ti.ctx.sandbox.Runtime().NewTypeError("tool.registerAutonomous: handler function is required"))
		}

		// 提取 Hook 类型
		hookTypeStr := "chat.receive.before_process" // 默认在消息处理前拦截
		if ht, exists := defMap["hookType"]; exists {
			hookTypeStr = fmt.Sprintf("%v", ht)
		}
		ht := hook.HookType(hookTypeStr)

		// 提取触发正则（可选）
		pattern := ""
		if p, exists := defMap["pattern"]; exists {
			pattern = fmt.Sprintf("%v", p)
		}

		// 提取描述
		description := ""
		if d, exists := defMap["description"]; exists {
			description = fmt.Sprintf("%v", d)
		}

		// 提取超时时间
		timeoutSeconds := 8
		if ts, exists := defMap["timeoutSeconds"]; exists {
			if tsNum, ok := ts.(float64); ok {
				timeoutSeconds = int(tsNum)
			} else if tsInt, ok := ts.(int64); ok {
				timeoutSeconds = int(tsInt)
			}
		}

		// 1. 注册为 autonomous 工具（hidden + autonomous）
		toolDef := ToolDef{
			Name:           toolName,
			Description:    description,
			Visibility:     ToolVisibilityHidden,
			ToolType:       ToolTypeAutonomous,
			TimeoutSeconds: timeoutSeconds,
		}

		toolID := ti.ctx.pluginID + "." + toolName
		ti.ctx.callbacks[toolID] = handler

		ti.ctx.mu.Lock()
		ti.ctx.toolDefinitions = append(ti.ctx.toolDefinitions, toolDefEntry{
			Name:       toolName,
			Definition: toolDef,
		})
		ti.ctx.mu.Unlock()

		// 2. 注册 Hook，在消息处理前拦截
		hookHandler := hook.HookHandlerFunc(func(event hook.HookEvent) hook.HookResult {
			msg := event.Message
			if msg == nil || msg.Content == "" {
				return hook.HookResult{AllowContinue: true}
			}

			// 调用 JS handler（pattern 通过 jsMsg["pattern"] 传入，JS 侧自行判断）
			vm := ti.ctx.sandbox.Runtime()
			if vm == nil {
				return hook.HookResult{AllowContinue: true}
			}

			jsMsg := jsifyMessage(vm, msg)
			jsMsg["pattern"] = pattern

			result, err := handler(goja.Undefined(), vm.ToValue(jsMsg))
			if err != nil {
				logger.Sugar.Warnw("[Plugin] autonomous tool error", "id", ti.ctx.pluginID, "tool", toolName, "error", err)
				return hook.HookResult{AllowContinue: true}
			}

			// 解析 handler 返回结果
			if result != nil && !goja.IsUndefined(result) {
				resultObj := result.ToObject(vm)
				if intercepted := resultObj.Get("intercepted"); intercepted != nil && !goja.IsUndefined(intercepted) {
					if intercepted.ToBoolean() {
						// 消息被拦截，检查是否有注入内容
						injectedContent := ""
						if ic := resultObj.Get("injectedContent"); ic != nil && !goja.IsUndefined(ic) {
							injectedContent = ic.String()
						}

						if injectedContent != "" {
							// 将注入内容追加到消息中
							modifiedMsg := *msg // 浅拷贝
							if event.Context == nil {
								event.Context = make(map[string]interface{})
							}
							event.Context["autonomous_tool"] = toolName
							event.Context["injected_content"] = injectedContent

							// 可以选择追加到消息内容或放在 context 中
							// 这里追加到消息内容后面，让 Agent 能看到
							if modifiedMsg.Content != "" {
								modifiedMsg.Content = modifiedMsg.Content + "\n\n[系统注入] " + injectedContent
							}

							logger.Sugar.Infow("[Plugin] autonomous tool intercepted and injected",
								"id", ti.ctx.pluginID, "tool", toolName,
								"senderId", msg.SenderID)
							return hook.HookResult{
								AllowContinue: true,
								ModifiedData:  &modifiedMsg,
							}
						}

						// 拦截但不注入（阻止消息继续处理）
						logger.Sugar.Infow("[Plugin] autonomous tool intercepted message",
							"id", ti.ctx.pluginID, "tool", toolName)
						return hook.HookResult{AllowContinue: false}
					}
				}

				// 非拦截模式：检查是否有 modifiedMessage
				if modifiedMsgRaw := resultObj.Get("modifiedMessage"); modifiedMsgRaw != nil && !goja.IsUndefined(modifiedMsgRaw) {
					if modMsg, ok := modifiedMsgRaw.Export().(map[string]interface{}); ok {
						modifiedMsg := *msg
						if content, ok := modMsg["content"].(string); ok {
							modifiedMsg.Content = content
						}
						return hook.HookResult{
							AllowContinue: true,
							ModifiedData:  &modifiedMsg,
						}
					}
				}
			}

			return hook.HookResult{AllowContinue: true}
		})

		hook.DefaultHookManager.Register(ht, hookHandler, time.Duration(timeoutSeconds)*time.Second, true)

		// 3. 记录 hook 条目，确保插件卸载时正确清理
		ti.ctx.mu.Lock()
		ti.ctx.hookEntries = append(ti.ctx.hookEntries, hookEntry{
			HookType: ht,
			Handler:  hookHandler,
		})
		ti.ctx.mu.Unlock()

		logger.Sugar.Infow("[Plugin] registered autonomous tool",
			"id", ti.ctx.pluginID, "tool", toolName,
			"hookType", hookTypeStr, "pattern", pattern)
		return goja.Undefined()
	}
}

// createGetDefinitions 获取所有已注册的工具定义（供插件查询）
// JS: yara.tool.getDefinitions(filter?)
// filter 可选: { type: "agent"|"autonomous"|"core", visibility: "visible"|"hidden"|"deferred" }
func (ti *ToolInjector) createGetDefinitions() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := ti.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Null()
		}

		var filterType string
		var filterVisibility string

		if len(call.Arguments) >= 1 {
			if opts, ok := call.Arguments[0].Export().(map[string]interface{}); ok {
				if t, exists := opts["type"]; exists {
					filterType = fmt.Sprintf("%v", t)
				}
				if v, exists := opts["visibility"]; exists {
					filterVisibility = fmt.Sprintf("%v", v)
				}
			}
		}

		// 从 PluginManager 获取所有工具定义
		pm := DefaultPluginManager
		if pm == nil {
			return vm.ToValue([]interface{}{})
		}

		var allTools []config.ToolDefData
		if filterType != "" {
			allTools = pm.GetToolDefinitionsByType(filterType)
		} else if filterVisibility != "" {
			allTools = pm.GetToolDefinitionsByVisibility(filterVisibility)
		} else {
			allTools = pm.GetAllToolDefinitions()
		}

		result := make([]interface{}, 0, len(allTools))
		for _, tool := range allTools {
			params := make([]interface{}, 0, len(tool.Parameters))
			for _, p := range tool.Parameters {
				params = append(params, map[string]interface{}{
					"name":        p.Name,
					"type":        p.Type,
					"description": p.Description,
					"required":    p.Required,
				})
			}
			result = append(result, map[string]interface{}{
				"name":        tool.Name,
				"description": tool.Description,
				"parameters":  params,
				"visibility":  tool.Visibility,
				"toolType":    tool.ToolType,
				"timeoutSec":  tool.TimeoutSec,
			})
		}

		return vm.ToValue(result)
	}
}
