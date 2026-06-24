package plugin

import (
	"fmt"
	"sync"

	"github.com/dop251/goja"

	"YaraFlow/internal/bus"
	"YaraFlow/internal/hook"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
)

// ─── APIInjector 接口 ───

// APIInjector 定义了 API 注入器的统一接口
type APIInjector interface {
	// Inject 将 API 注入到沙箱中，返回错误则该 API 注入失败
	Inject() error
	// APIName 返回该 API 的名称（对应 yara 全局对象下的 key）
	APIName() string
}

// ─── InjectorContext 共享状态 ───

// InjectorContext 持有所有注入器共享的状态和数据
type InjectorContext struct {
	sandbox   *Sandbox
	pluginID  string
	pluginDir string
	manifest  *PluginManifest

	callbacks           map[string]goja.Callable
	eventSubs           []eventSubEntry
	hookEntries         []hookEntry
	cmdDefinitions      []cmdDefEntry
	toolDefinitions     []toolDefEntry
	actionDefinitions   []actionDefEntry
	eventHandlerEntries []eventHandlerEntry
	llmProviderEntries  []llmProviderEntry
	apiEntries          []apiEntry
	mu                  sync.RWMutex

	sendMessageFn func(platform.Message) error
	cmdProcessor  CommandRegistrar

	crossPluginAPICallFn func(qualifiedName string, params map[string]interface{}) (interface{}, error)
}

// NewInjectorContext 创建共享的注入器上下文
func NewInjectorContext(sandbox *Sandbox, pluginID string, pluginDir string, manifest *PluginManifest) *InjectorContext {
	return &InjectorContext{
		sandbox:             sandbox,
		pluginID:            pluginID,
		pluginDir:           pluginDir,
		manifest:            manifest,
		callbacks:           make(map[string]goja.Callable),
		eventSubs:           make([]eventSubEntry, 0),
		hookEntries:         make([]hookEntry, 0),
		cmdDefinitions:      make([]cmdDefEntry, 0),
		toolDefinitions:     make([]toolDefEntry, 0),
		actionDefinitions:   make([]actionDefEntry, 0),
		eventHandlerEntries: make([]eventHandlerEntry, 0),
		llmProviderEntries:  make([]llmProviderEntry, 0),
		apiEntries:          make([]apiEntry, 0),
	}
}

// ─── 共享方法 ───

// mergeIntoYara 将 API 对象合并到 yara 全局对象中
func (ctx *InjectorContext) mergeIntoYara(key string, apiObj map[string]interface{}) {
	existing := ctx.sandbox.Get("yara")
	if existing != nil && !goja.IsUndefined(existing) {
		if existingObj, ok := existing.Export().(map[string]interface{}); ok {
			existingObj[key] = apiObj
			ctx.sandbox.Set("yara", existingObj)
		}
	} else {
		ctx.sandbox.Set("yara", map[string]interface{}{key: apiObj})
	}
}

// checkPermissions 检查插件是否至少拥有所列权限之一
func (ctx *InjectorContext) checkAnyPermission(permissions []string) bool {
	for _, perm := range permissions {
		if ctx.manifest.HasPermission(perm) {
			return true
		}
	}
	return false
}

// sandboxSafe 检查沙箱是否可用，返回错误信息
func (ctx *InjectorContext) sandboxSafe() (*goja.Runtime, error) {
	if ctx.sandbox == nil {
		return nil, fmt.Errorf("sandbox is nil")
	}
	vm := ctx.sandbox.Runtime()
	if vm == nil {
		return nil, fmt.Errorf("runtime is nil")
	}
	return vm, nil
}

// ─── Setter 方法（从外部注入依赖） ───

func (ctx *InjectorContext) SetSandbox(s *Sandbox) {
	ctx.sandbox = s
}

func (ctx *InjectorContext) SetSendMessageFn(fn func(platform.Message) error) {
	ctx.sendMessageFn = fn
}

func (ctx *InjectorContext) SetCrossPluginAPICallFn(fn func(string, map[string]interface{}) (interface{}, error)) {
	ctx.crossPluginAPICallFn = fn
}

func (ctx *InjectorContext) SetCommandProcessor(cp CommandRegistrar) {
	ctx.cmdProcessor = cp
	if cp != nil {
		ctx.mu.RLock()
		defer ctx.mu.RUnlock()
		for _, cmd := range ctx.cmdDefinitions {
			if err := cp.RegisterCommand(cmd.Name, cmd.Pattern, cmd.PluginID); err != nil {
				logger.Sugar.Warnw("[Plugin] failed to register command", "id", ctx.pluginID, "command", cmd.Name, "error", err)
			}
		}
	}
}

// ─── Getter 方法 ───

func (ctx *InjectorContext) GetCommandHandler(name string) (goja.Callable, bool) {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	handler, ok := ctx.callbacks[name]
	return handler, ok
}

func (ctx *InjectorContext) GetToolHandler(name string) (goja.Callable, bool) {
	id := ctx.pluginID + "." + name
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	handler, ok := ctx.callbacks[id]
	return handler, ok
}

func (ctx *InjectorContext) GetActionHandler(name string) (goja.Callable, bool) {
	id := ctx.pluginID + "." + name
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	handler, ok := ctx.callbacks[id]
	return handler, ok
}

func (ctx *InjectorContext) GetToolDefinitions() []toolDefEntry {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	result := make([]toolDefEntry, len(ctx.toolDefinitions))
	copy(result, ctx.toolDefinitions)
	return result
}

func (ctx *InjectorContext) GetActionDefinitions() []actionDefEntry {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	result := make([]actionDefEntry, len(ctx.actionDefinitions))
	copy(result, ctx.actionDefinitions)
	return result
}

func (ctx *InjectorContext) GetEventHandlerEntries() []eventHandlerEntry {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	result := make([]eventHandlerEntry, len(ctx.eventHandlerEntries))
	copy(result, ctx.eventHandlerEntries)
	return result
}

func (ctx *InjectorContext) GetLLMProviderEntries() []llmProviderEntry {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	result := make([]llmProviderEntry, len(ctx.llmProviderEntries))
	copy(result, ctx.llmProviderEntries)
	return result
}

func (ctx *InjectorContext) GetAPIEntries() []apiEntry {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	result := make([]apiEntry, len(ctx.apiEntries))
	copy(result, ctx.apiEntries)
	return result
}

func (ctx *InjectorContext) GetAPIHandler(name string) (goja.Callable, bool) {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	for _, entry := range ctx.apiEntries {
		if entry.Name == name {
			return entry.Handler, true
		}
	}
	return nil, false
}

func (ctx *InjectorContext) GetLLMProviderHandler(clientType string) (goja.Callable, bool) {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	for _, entry := range ctx.llmProviderEntries {
		if entry.ClientType == clientType {
			return entry.Handler, true
		}
	}
	return nil, false
}

func (ctx *InjectorContext) GetEventHandlerByName(name string) (goja.Callable, bool) {
	ctx.mu.RLock()
	defer ctx.mu.RUnlock()
	for _, entry := range ctx.eventHandlerEntries {
		if entry.Name == name {
			return entry.Handler, true
		}
	}
	return nil, false
}

// ─── Cleanup ───

func (ctx *InjectorContext) Cleanup() {
	ctx.mu.Lock()
	defer ctx.mu.Unlock()

	for _, entry := range ctx.hookEntries {
		hook.DefaultHookManager.Unregister(entry.HookType, entry.Handler)
	}

	for _, sub := range ctx.eventSubs {
		if sub.Adapter != nil {
			bus.DefaultBus.Unsubscribe(sub.Topic, sub.Adapter)
		}
	}

	for _, cmd := range ctx.cmdDefinitions {
		if ctx.cmdProcessor != nil {
			ctx.cmdProcessor.UnregisterCommand(cmd.Name)
		}
	}

	ctx.callbacks = nil
	ctx.eventSubs = nil
	ctx.hookEntries = nil
	ctx.cmdDefinitions = nil
	ctx.toolDefinitions = nil
	ctx.actionDefinitions = nil
	ctx.eventHandlerEntries = nil
	ctx.llmProviderEntries = nil
	ctx.apiEntries = nil
}
