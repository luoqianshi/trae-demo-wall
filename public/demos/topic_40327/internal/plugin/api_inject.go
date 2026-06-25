package plugin

import (
	"fmt"

	"github.com/dop251/goja"

	"YaraFlow/internal/bus"
	"YaraFlow/internal/hook"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
)

// ─── 共享类型定义 ───

type toolDefEntry struct {
	Name       string
	Definition ToolDef
}

type actionDefEntry struct {
	Name       string
	Definition ActionDef
}

type eventHandlerEntry struct {
	Name             string
	Description      string
	EventType        string
	InterceptMessage bool
	Weight           int
	Handler          goja.Callable
}

type llmProviderEntry struct {
	ClientType  string
	Name        string
	Description string
	Version     string
	Handler     goja.Callable
}

type apiEntry struct {
	Name        string
	Description string
	Version     string
	Public      bool
	Handler     goja.Callable
}

type eventSubEntry struct {
	Topic    string
	Callback goja.Callable
	Adapter  *jsEventAdapter
}

type hookEntry struct {
	HookType hook.HookType
	Handler  hook.HookHandler
}

type cmdDefEntry struct {
	Name     string
	Pattern  string
	PluginID string
}

// ─── APIRegistry 协调器 ───

// APIRegistry 是 API 注入的协调器，负责管理和调用各个注入器
type APIRegistry struct {
	ctx       *InjectorContext
	injectors []APIInjector
}

// NewAPIRegistry 创建 API 注册表并初始化所有内置注入器
func NewAPIRegistry(sandbox *Sandbox, pluginID string, pluginDir string, manifest *PluginManifest) *APIRegistry {
	ctx := NewInjectorContext(sandbox, pluginID, pluginDir, manifest)

	registry := &APIRegistry{
		ctx:       ctx,
		injectors: make([]APIInjector, 0),
	}

	// 注册所有内置注入器
	registry.registerBuiltinInjectors()

	return registry
}

// registerBuiltinInjectors 注册所有内置 API 注入器
func (api *APIRegistry) registerBuiltinInjectors() {
	api.injectors = append(api.injectors,
		NewEventInjector(api.ctx),
		NewHookInjector(api.ctx),
		NewCommandInjector(api.ctx),
		NewMessageInjector(api.ctx),
		NewLoggerInjector(api.ctx),
		NewStorageInjector(api.ctx),
		NewToolInjector(api.ctx),
		NewActionInjector(api.ctx),
		NewConfigInjector(api.ctx),
		NewFileInjector(api.ctx),
		NewEventHandlerInjector(api.ctx),
		NewLLMProviderInjector(api.ctx),
		NewAPIRegisterInjector(api.ctx),
		NewConfigFileInjector(api.ctx),
		NewModelAccessInjector(api.ctx),
		NewHTTPInjector(api.ctx),
		NewAsyncTaskInjector(api.ctx),
		NewBackwardCompatInjector(api.ctx),
		NewDatabaseInjector(api.ctx),
		NewEmojiInjector(api.ctx),
		NewKnowledgeInjector(api.ctx),
	)
}

// Inject 注入所有已注册的 API
func (api *APIRegistry) Inject() error {
	for _, injector := range api.injectors {
		if err := injector.Inject(); err != nil {
			return fmt.Errorf("failed to inject %s API: %w", injector.APIName(), err)
		}
	}
	return nil
}

// ─── Setter 方法（委托给 InjectorContext） ───

func (api *APIRegistry) SetSandbox(s *Sandbox) {
	api.ctx.SetSandbox(s)
}

func (api *APIRegistry) SetCrossPluginAPICallFn(fn func(string, map[string]any) (any, error)) {
	api.ctx.SetCrossPluginAPICallFn(fn)
}

func (api *APIRegistry) SetCommandProcessor(cp CommandRegistrar) {
	api.ctx.SetCommandProcessor(cp)
}

func (api *APIRegistry) SetSendMessageFn(fn func(platform.Message) error) {
	api.ctx.SetSendMessageFn(fn)
}

// ─── Getter 方法（委托给 InjectorContext） ───

func (api *APIRegistry) GetCommandHandler(name string) (goja.Callable, bool) {
	return api.ctx.GetCommandHandler(name)
}

func (api *APIRegistry) GetToolHandler(name string) (goja.Callable, bool) {
	return api.ctx.GetToolHandler(name)
}

func (api *APIRegistry) GetActionHandler(name string) (goja.Callable, bool) {
	return api.ctx.GetActionHandler(name)
}

func (api *APIRegistry) GetToolDefinitions() []toolDefEntry {
	return api.ctx.GetToolDefinitions()
}

func (api *APIRegistry) GetActionDefinitions() []actionDefEntry {
	return api.ctx.GetActionDefinitions()
}

func (api *APIRegistry) GetEventHandlerEntries() []eventHandlerEntry {
	return api.ctx.GetEventHandlerEntries()
}

func (api *APIRegistry) GetLLMProviderEntries() []llmProviderEntry {
	return api.ctx.GetLLMProviderEntries()
}

func (api *APIRegistry) GetAPIEntries() []apiEntry {
	return api.ctx.GetAPIEntries()
}

func (api *APIRegistry) GetAPIHandler(name string) (goja.Callable, bool) {
	return api.ctx.GetAPIHandler(name)
}

func (api *APIRegistry) GetLLMProviderHandler(clientType string) (goja.Callable, bool) {
	return api.ctx.GetLLMProviderHandler(clientType)
}

func (api *APIRegistry) GetEventHandlerByName(name string) (goja.Callable, bool) {
	return api.ctx.GetEventHandlerByName(name)
}

// Cleanup 清理插件注册的所有资源
func (api *APIRegistry) Cleanup() {
	api.ctx.Cleanup()
}

// ─── jsEventAdapter ───

type jsEventAdapter struct {
	ctx      *InjectorContext
	callback goja.Callable
	topic    string
}

func (a *jsEventAdapter) HandleEvent(event bus.Event) {
	defer func() {
		if r := recover(); r != nil {
			logger.Sugar.Warnw("[Plugin] event handler panic", "id", a.ctx.pluginID, "topic", a.topic, "panic", r)
		}
	}()

	a.ctx.mu.RLock()
	vm, err := a.ctx.sandboxSafe()
	a.ctx.mu.RUnlock()

	if err != nil {
		logger.Sugar.Debugw("[Plugin] skip event", "id", a.ctx.pluginID, "error", err, "topic", a.topic)
		return
	}

	var jsPayload goja.Value
	if event.Payload == nil {
		jsPayload = goja.Null()
	} else {
		jsPayload = vm.ToValue(event.Payload)
	}
	_, cbErr := a.callback(goja.Undefined(), jsPayload)
	if cbErr != nil {
		logger.Sugar.Warnw("[Plugin] event handler error", "id", a.ctx.pluginID, "topic", a.topic, "error", cbErr)
	}
}

// ─── 工具函数 ───

func jsifyMessage(_ *goja.Runtime, msg *platform.Message) map[string]any {
	if msg == nil {
		return nil
	}

	return map[string]any{
		"id":         msg.ID,
		"senderId":   msg.SenderID,
		"senderName": msg.SenderName,
		"groupId":    msg.GroupID,
		"content":    msg.Content,
		"isAtMe":     msg.IsAtMe,
		"hasImage":   msg.HasImage,
		"timestamp":  msg.Timestamp,
		"platform":   msg.Platform,
	}
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}
