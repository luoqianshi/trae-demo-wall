package plugin

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/dop251/goja"
	"github.com/fsnotify/fsnotify"

	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
)

// PluginStatus 插件运行时状态
type PluginStatus string

const (
	PluginStatusLoaded   PluginStatus = "loaded"   // 已加载并运行中
	PluginStatusUnloaded PluginStatus = "unloaded" // 已卸载
	PluginStatusError    PluginStatus = "error"    // 加载或运行出错
	PluginStatusDisabled PluginStatus = "disabled" // 被配置禁用
)

// PluginInstance 单个插件的运行时实例，持有 Goja 运行时、清单与状态
type PluginInstance struct {
	Runtime  *GojaRuntime
	Manifest *PluginManifest
	Dir      string
	Status   PluginStatus
	Error    string
	LoadTime time.Time
}

// PluginManager 插件管理器，负责插件生命周期管理（发现/加载/卸载/重载/热加载）
// 通过 fsnotify 监听插件目录变化实现热重载，线程安全
type PluginManager struct {
	plugins            map[string]*PluginInstance
	mu                 sync.RWMutex
	pluginsDir         string
	disabledList       map[string]bool
	allPluginManifests map[string]*PluginManifest // 所有已发现插件（含禁用）
	watcher            *fsnotify.Watcher
	watchStop          chan struct{}
	cachedCmdProc      CommandRegistrar
	cachedSendFn       func(platform.Message) error
	ipcPlugins         map[string]*IPCPluginWrapper // IPC 模式插件映射
}

// DefaultPluginManager 默认插件管理器单例，由 InitPluginManager 设置
var DefaultPluginManager *PluginManager

// InitPluginManager 创建并初始化插件管理器，设置全局 DefaultPluginManager
// pluginsDir 为插件根目录，为空时默认使用 ./plugins
func InitPluginManager(pluginsDir string) *PluginManager {
	if pluginsDir == "" {
		pluginsDir = "./plugins"
	}

	absDir, err := filepath.Abs(pluginsDir)
	if err != nil {
		absDir = pluginsDir
	}

	pm := &PluginManager{
		plugins:            make(map[string]*PluginInstance),
		pluginsDir:         absDir,
		disabledList:       make(map[string]bool),
		allPluginManifests: make(map[string]*PluginManifest),
		ipcPlugins:         make(map[string]*IPCPluginWrapper),
	}

	if err := os.MkdirAll(absDir, 0755); err != nil {
		logger.Sugar.Warnw("Failed to create plugins directory", "error", err)
	}

	DefaultPluginManager = pm
	return pm
}

func (pm *PluginManager) Discover() ([]*PluginManifest, error) {
	entries, err := os.ReadDir(pm.pluginsDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read plugins directory: %w", err)
	}

	var manifests []*PluginManifest
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		pluginDir := filepath.Join(pm.pluginsDir, entry.Name())
		manifestPath := filepath.Join(pluginDir, "plugin.json")

		if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
			continue
		}

		manifest, err := LoadManifest(pluginDir)
		if err != nil {
			logger.Sugar.Warnw("[Plugin] failed to load manifest", "path", entry.Name(), "error", err)
			continue
		}

		manifests = append(manifests, manifest)
	}

	sort.Slice(manifests, func(i, j int) bool {
		return manifests[i].ID < manifests[j].ID
	})

	return manifests, nil
}

func (pm *PluginManager) Load(pluginID string) error {
	pm.mu.Lock()

	if existing, ok := pm.plugins[pluginID]; ok && existing.Status == PluginStatusLoaded {
		pm.mu.Unlock()
		return fmt.Errorf("plugin %s is already loaded", pluginID)
	}

	pluginDir := filepath.Join(pm.pluginsDir, pluginID)
	manifest, err := LoadManifest(pluginDir)
	if err != nil {
		pm.mu.Unlock()
		return fmt.Errorf("failed to load manifest for %s: %w", pluginID, err)
	}

	api := NewAPIRegistry(nil, manifest.ID, pluginDir, manifest)
	runtime := NewGojaRuntime(manifest, pluginDir, api)

	api.SetCommandProcessor(nil)

	pm.plugins[pluginID] = &PluginInstance{
		Runtime:  runtime,
		Manifest: manifest,
		Dir:      pluginDir,
		Status:   PluginStatusUnloaded,
	}
	pm.mu.Unlock()

	if err := api.Inject(); err != nil {
		pm.mu.Lock()
		pm.plugins[pluginID].Status = PluginStatusError
		pm.plugins[pluginID].Error = fmt.Sprintf("API injection failed: %v", err)
		pm.mu.Unlock()
		return fmt.Errorf("API injection failed: %w", err)
	}

	if pm.cachedCmdProc != nil {
		api.SetCommandProcessor(pm.cachedCmdProc)
	}
	if pm.cachedSendFn != nil {
		api.SetSendMessageFn(pm.cachedSendFn)
	}
	api.SetCrossPluginAPICallFn(func(qualifiedName string, params map[string]interface{}) (interface{}, error) {
		return pm.CallPluginAPI(qualifiedName, params)
	})

	if err := runtime.Load(); err != nil {
		pm.mu.Lock()
		pm.plugins[pluginID].Status = PluginStatusError
		pm.plugins[pluginID].Error = err.Error()
		pm.mu.Unlock()
		return fmt.Errorf("failed to load plugin %s: %w", pluginID, err)
	}

	pm.mu.Lock()
	pm.plugins[pluginID].Status = PluginStatusLoaded
	pm.plugins[pluginID].LoadTime = time.Now()
	pm.mu.Unlock()

	return nil
}

// LoadAll 扫描插件目录，按依赖拓扑顺序加载所有未禁用的插件
func (pm *PluginManager) LoadAll() error {
	entries, err := os.ReadDir(pm.pluginsDir)
	if err != nil {
		return fmt.Errorf("failed to read plugins directory: %w", err)
	}

	var manifests []*PluginManifest
	dirNamesByID := make(map[string]string)

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		pluginDir := filepath.Join(pm.pluginsDir, entry.Name())
		manifestPath := filepath.Join(pluginDir, "plugin.json")

		if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
			continue
		}

		manifest, err := LoadManifest(pluginDir)
		if err != nil {
			logger.Sugar.Warnw("[Plugin] failed to load manifest", "path", entry.Name(), "error", err)
			continue
		}

		// 记录所有已发现插件（含禁用的）
		pm.allPluginManifests[manifest.ID] = manifest

		// 从配置文件读取 enabled 字段，更新 disabledList
		pm.syncDisabledFromConfig(manifest, pluginDir)

		if pm.disabledList[manifest.ID] {
			logger.Sugar.Infow("[Plugin] skipping disabled plugin", "id", manifest.ID)
			continue
		}

		manifests = append(manifests, manifest)
		dirNamesByID[manifest.ID] = entry.Name()
	}

	logger.Sugar.Infow("[Plugin] discovered plugins", "count", len(manifests))

	sorted := pm.resolveLoadOrder(manifests)
	for _, manifest := range sorted {
		dirName := dirNamesByID[manifest.ID]
		pluginDir := filepath.Join(pm.pluginsDir, dirName)
		if err := pm.LoadFromDir(dirName, pluginDir, manifest); err != nil {
			logger.Sugar.Warnw("[Plugin] failed to load", "id", manifest.ID, "error", err)
		}
	}

	return nil
}

func (pm *PluginManager) resolveLoadOrder(manifests []*PluginManifest) []*PluginManifest {
	manifestMap := make(map[string]*PluginManifest)
	for _, m := range manifests {
		manifestMap[m.ID] = m
	}

	inDegree := make(map[string]int)
	graph := make(map[string][]string)

	for _, m := range manifests {
		inDegree[m.ID] = 0
	}
	for _, m := range manifests {
		for _, dep := range m.Dependencies {
			depID := dep.ID
			if _, depExists := manifestMap[depID]; depExists {
				graph[depID] = append(graph[depID], m.ID)
				inDegree[m.ID]++
			}
		}
	}

	var queue []string
	for id, degree := range inDegree {
		if degree == 0 {
			queue = append(queue, id)
		}
	}
	sort.Strings(queue)

	var order []*PluginManifest
	for len(queue) > 0 {
		id := queue[0]
		queue = queue[1:]

		if m, ok := manifestMap[id]; ok {
			order = append(order, m)
		}

		dependents := make([]string, len(graph[id]))
		copy(dependents, graph[id])
		sort.Strings(dependents)

		for _, dependent := range dependents {
			inDegree[dependent]--
			if inDegree[dependent] == 0 {
				queue = append(queue, dependent)
			}
		}
	}

	inOrder := make(map[string]bool)
	for _, m := range order {
		inOrder[m.ID] = true
	}
	for _, m := range manifests {
		if !inOrder[m.ID] {
			logger.Sugar.Warnw("[Plugin] has unresolved dependencies, loading last", "id", m.ID)
			order = append(order, m)
		}
	}

	return order
}

// LoadFromDir 从指定目录加载插件，需传入目录名、绝对路径与已解析的清单
func (pm *PluginManager) LoadFromDir(dirName string, pluginDir string, manifest *PluginManifest) error {
	pm.mu.Lock()

	if existing, ok := pm.plugins[manifest.ID]; ok && existing.Status == PluginStatusLoaded {
		pm.mu.Unlock()
		return fmt.Errorf("plugin %s is already loaded", manifest.ID)
	}

	api := NewAPIRegistry(nil, manifest.ID, pluginDir, manifest)
	runtime := NewGojaRuntime(manifest, pluginDir, api)

	api.SetCommandProcessor(nil)

	pm.plugins[manifest.ID] = &PluginInstance{
		Runtime:  runtime,
		Manifest: manifest,
		Dir:      pluginDir,
		Status:   PluginStatusUnloaded,
	}
	pm.mu.Unlock()

	if err := api.Inject(); err != nil {
		pm.mu.Lock()
		pm.plugins[manifest.ID].Status = PluginStatusError
		pm.plugins[manifest.ID].Error = fmt.Sprintf("API injection failed: %v", err)
		pm.mu.Unlock()
		return fmt.Errorf("API injection failed: %w", err)
	}

	if pm.cachedCmdProc != nil {
		api.SetCommandProcessor(pm.cachedCmdProc)
	}
	if pm.cachedSendFn != nil {
		api.SetSendMessageFn(pm.cachedSendFn)
	}
	api.SetCrossPluginAPICallFn(func(qualifiedName string, params map[string]interface{}) (interface{}, error) {
		return pm.CallPluginAPI(qualifiedName, params)
	})

	if err := runtime.Load(); err != nil {
		pm.mu.Lock()
		pm.plugins[manifest.ID].Status = PluginStatusError
		pm.plugins[manifest.ID].Error = err.Error()
		pm.mu.Unlock()
		return fmt.Errorf("failed to load plugin %s: %w", manifest.ID, err)
	}

	pm.mu.Lock()
	pm.plugins[manifest.ID].Status = PluginStatusLoaded
	pm.plugins[manifest.ID].LoadTime = time.Now()
	pm.mu.Unlock()

	logger.Sugar.Infow("[Plugin] loaded successfully", "id", manifest.ID, "dir", dirName)
	return nil
}

// GetPlugin 获取指定 ID 的插件实例（线程安全）
func (pm *PluginManager) GetPlugin(pluginID string) *PluginInstance {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	return pm.plugins[pluginID]
}

// Unload 卸载指定插件：调用 onUnload、清理注册、释放运行时
func (pm *PluginManager) Unload(pluginID string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	instance, ok := pm.plugins[pluginID]
	if !ok {
		return fmt.Errorf("plugin %s not found", pluginID)
	}

	// 如果是 IPC 模式，通过 wrapper 关闭
	if wrapper, ipcOk := pm.ipcPlugins[pluginID]; ipcOk {
		wrapper.Close()
		delete(pm.ipcPlugins, pluginID)
	}

	if instance.Status == PluginStatusUnloaded {
		return fmt.Errorf("plugin %s is not loaded", pluginID)
	}

	if instance.Runtime != nil {
		if err := instance.Runtime.Unload(); err != nil {
			logger.Sugar.Warnw("[Plugin] unload error", "id", pluginID, "error", err)
		}
	}

	instance.Status = PluginStatusUnloaded
	instance.Runtime = nil

	delete(pm.plugins, pluginID)

	logger.Sugar.Infow("[Plugin] unloaded", "id", pluginID)
	return nil
}

// UnloadAll 卸载所有已加载的插件
func (pm *PluginManager) UnloadAll() {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	for id, instance := range pm.plugins {
		if instance.Status == PluginStatusLoaded && instance.Runtime != nil {
			if err := instance.Runtime.Unload(); err != nil {
				logger.Sugar.Warnw("[Plugin] unload error", "id", id, "error", err)
			}
		}
	}

	pm.plugins = make(map[string]*PluginInstance)
	logger.Info("[Plugin] all plugins unloaded")
}

func (pm *PluginManager) Reload(pluginID string) error {
	if err := pm.Unload(pluginID); err != nil {
		logger.Sugar.Warnw("[Plugin] failed to unload", "id", pluginID, "error", err)
	}

	if err := pm.Load(pluginID); err != nil {
		return fmt.Errorf("failed to reload plugin %s: %w", pluginID, err)
	}

	logger.Sugar.Infow("[Plugin] reloaded", "id", pluginID)
	return nil
}

func (pm *PluginManager) ReloadAll() {
	pm.UnloadAll()
	if err := pm.LoadAll(); err != nil {
		logger.Sugar.Warnw("[Plugin] failed to reload all plugins", "error", err)
	}
}

// SetTransport 设置命令处理器与消息发送函数，并同步到所有已加载插件的 API 注册表
func (pm *PluginManager) SetTransport(cmdProcessor interface{}, sendFn func(platform.Message) error) {
	pm.mu.Lock()
	if cp, ok := cmdProcessor.(CommandRegistrar); ok {
		pm.cachedCmdProc = cp
	}
	if sendFn != nil {
		pm.cachedSendFn = sendFn
	}

	plugins := make([]*PluginInstance, 0, len(pm.plugins))
	for _, instance := range pm.plugins {
		plugins = append(plugins, instance)
	}
	pm.mu.Unlock()

	for _, instance := range plugins {
		if instance.Runtime != nil {
			api := instance.Runtime.API()
			if api != nil {
				if pm.cachedCmdProc != nil {
					api.SetCommandProcessor(pm.cachedCmdProc)
				}
				if pm.cachedSendFn != nil {
					api.SetSendMessageFn(pm.cachedSendFn)
				}
				api.SetCrossPluginAPICallFn(func(qualifiedName string, params map[string]interface{}) (interface{}, error) {
					return pm.CallPluginAPI(qualifiedName, params)
				})
			}
		}
	}
}

// GetLLMProviders 收集所有已加载插件注册的 LLM Provider，按 client_type 索引返回
func (pm *PluginManager) GetLLMProviders() map[string]llmProviderEntry {
	result := make(map[string]llmProviderEntry)
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	for _, instance := range pm.plugins {
		if instance.Status != PluginStatusLoaded || instance.Runtime == nil {
			continue
		}
		api := instance.Runtime.API()
		if api != nil {
			for _, provider := range api.GetLLMProviderEntries() {
				result[provider.ClientType] = provider
			}
		}
	}

	return result
}

func (pm *PluginManager) CallPluginAPI(qualifiedName string, params map[string]interface{}) (interface{}, error) {
	parts := strings.SplitN(qualifiedName, ".", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid api qualified name: %s (expected pluginId.apiName)", qualifiedName)
	}

	pluginID := parts[0]
	apiName := parts[1]

	pm.mu.RLock()
	instance, ok := pm.plugins[pluginID]
	pm.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("plugin %s not found", pluginID)
	}
	if instance.Status != PluginStatusLoaded {
		return nil, fmt.Errorf("plugin %s is not loaded", pluginID)
	}
	if instance.Runtime == nil {
		return nil, fmt.Errorf("plugin %s runtime is nil", pluginID)
	}

	reg := instance.Runtime.API()
	if reg == nil {
		return nil, fmt.Errorf("plugin %s api registry is nil", pluginID)
	}

	handler, ok := reg.GetAPIHandler(apiName)
	if !ok {
		return nil, fmt.Errorf("api %s not found in plugin %s", apiName, pluginID)
	}

	vm := instance.Runtime.Sandbox().Runtime()
	if vm == nil {
		return nil, fmt.Errorf("plugin %s runtime vm is nil", pluginID)
	}

	resultChan := make(chan struct {
		val interface{}
		err error
	}, 1)

	go func() {
		defer func() { recover() }()
		jsParams := vm.ToValue(params)
		result, callErr := handler(goja.Undefined(), jsParams)
		var sendVal interface{}
		var sendErr error
		if callErr != nil {
			sendVal = nil
			sendErr = fmt.Errorf("plugin %s api %s error: %w", pluginID, apiName, callErr)
		} else {
			sendVal = result.Export()
			sendErr = nil
		}
		select {
		case resultChan <- struct {
			val interface{}
			err error
		}{sendVal, sendErr}:
		default:
		}
	}()

	select {
	case result := <-resultChan:
		return result.val, result.err
	case <-time.After(30 * time.Second):
		return nil, fmt.Errorf("cross-plugin api call '%s' timed out after 30s", qualifiedName)
	}
}

func (pm *PluginManager) LoadConfig(cfg *config.Config) {
	if cfg.Goja.ScriptPath != "" {
		absDir, err := filepath.Abs(cfg.Goja.ScriptPath)
		if err == nil {
			pm.pluginsDir = absDir
		}
	}
}

func (pm *PluginManager) Shutdown() {
	pm.mu.Lock()
	if pm.watchStop != nil {
		close(pm.watchStop)
		pm.watchStop = nil
	}
	if pm.watcher != nil {
		pm.watcher.Close()
		pm.watcher = nil
	}
	pm.mu.Unlock()

	// 先关闭 IPC 插件
	pm.ShutdownIPC()
	pm.UnloadAll()
}

func (pm *PluginManager) LoadedCount() int {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	count := 0
	for _, instance := range pm.plugins {
		if instance.Status == PluginStatusLoaded {
			count++
		}
	}
	return count
}

// PluginCount 返回当前管理器中的插件实例总数（含已卸载/出错的）
func (pm *PluginManager) PluginCount() int {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	return len(pm.plugins)
}

// IsLoaded 判断指定插件是否处于已加载状态
func (pm *PluginManager) IsLoaded(pluginID string) bool {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	instance, ok := pm.plugins[pluginID]
	return ok && instance.Status == PluginStatusLoaded
}

// GetPluginStatus 返回指定插件的当前状态（含禁用判断）
func (pm *PluginManager) GetPluginStatus(pluginID string) PluginStatus {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	if pm.disabledList[pluginID] {
		return PluginStatusDisabled
	}

	instance, ok := pm.plugins[pluginID]
	if !ok {
		return PluginStatusUnloaded
	}
	return instance.Status
}

// DisablePlugin 将指定插件加入禁用列表，下次 LoadAll 时跳过
func (pm *PluginManager) DisablePlugin(pluginID string) {
	pm.mu.Lock()
	pm.disabledList[pluginID] = true
	pm.mu.Unlock()
}

// EnablePlugin 将指定插件从禁用列表移除
func (pm *PluginManager) EnablePlugin(pluginID string) {
	pm.mu.Lock()
	delete(pm.disabledList, pluginID)
	pm.mu.Unlock()
}

// GetDisabledList 返回禁用插件 ID 集合的副本
func (pm *PluginManager) GetDisabledList() map[string]bool {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	result := make(map[string]bool)
	for k, v := range pm.disabledList {
		result[k] = v
	}
	return result
}

// GetPluginIDs 返回当前管理器中所有插件实例的 ID（已排序）
func (pm *PluginManager) GetPluginIDs() []string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	ids := make([]string, 0, len(pm.plugins))
	for id := range pm.plugins {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// GetAllToolDefinitions 收集所有已加载插件注册的工具定义
func (pm *PluginManager) GetAllToolDefinitions() []config.ToolDefData {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	var allTools []config.ToolDefData
	for _, instance := range pm.plugins {
		if instance.Status != PluginStatusLoaded || instance.Runtime == nil {
			continue
		}

		api := instance.Runtime.API()
		if api == nil {
			continue
		}

		toolDefs := api.GetToolDefinitions()
		for _, entry := range toolDefs {
			def := entry.Definition
			var params []config.ToolParamData
			for _, p := range def.Parameters {
				params = append(params, config.ToolParamData{
					Name:        p.Name,
					Type:        p.Type,
					Description: p.Description,
					Required:    p.Required,
				})
			}
			allTools = append(allTools, config.ToolDefData{
				Name:        def.Name,
				Description: def.Description,
				Parameters:  params,
				Visibility:  def.Visibility,
				ToolType:    def.ToolType,
				TimeoutSec:  def.TimeoutSeconds,
			})
		}
	}
	return allTools
}

// GetVisibleToolDefinitions 返回对 LLM 可见的工具定义（core 类型 + visible 且非 autonomous 类型）
func (pm *PluginManager) GetVisibleToolDefinitions() []config.ToolDefData {
	allTools := pm.GetAllToolDefinitions()
	var visible []config.ToolDefData

	for _, tool := range allTools {
		v := tool.Visibility
		if v == "" {
			v = ToolVisibilityVisible // 默认可见
		}
		tt := tool.ToolType
		if tt == "" {
			tt = ToolTypeAgent // 默认为 agent 可调用
		}

		// core 类型始终可见（无论 visibility 设置）
		if tt == ToolTypeCore {
			visible = append(visible, tool)
			continue
		}

		// 只对 Agent 可见：visible 且不是 autonomous 类型
		if v == ToolVisibilityVisible && tt != ToolTypeAutonomous {
			visible = append(visible, tool)
		}
	}
	return visible
}

// GetAgentToolDefinitions 获取所有 Agent 可调用的工具（用于 LLM Function Calling）
func (pm *PluginManager) GetAgentToolDefinitions() []config.ToolDefData {
	return pm.GetVisibleToolDefinitions()
}

// GetAutonomousToolDefinitions 获取所有自主运行的工具（不可被 Agent 调用）
func (pm *PluginManager) GetAutonomousToolDefinitions() []config.ToolDefData {
	allTools := pm.GetAllToolDefinitions()
	var autonomous []config.ToolDefData

	for _, tool := range allTools {
		tt := tool.ToolType
		if tt == ToolTypeAutonomous {
			autonomous = append(autonomous, tool)
		}
	}
	return autonomous
}

// GetToolDefinitionsByType 按工具类型获取工具定义
func (pm *PluginManager) GetToolDefinitionsByType(toolType string) []config.ToolDefData {
	allTools := pm.GetAllToolDefinitions()
	var filtered []config.ToolDefData

	for _, tool := range allTools {
		tt := tool.ToolType
		if tt == "" {
			tt = ToolTypeAgent
		}
		if tt == toolType {
			filtered = append(filtered, tool)
		}
	}
	return filtered
}

// GetToolDefinitionsByVisibility 按可见性获取工具定义
func (pm *PluginManager) GetToolDefinitionsByVisibility(visibility string) []config.ToolDefData {
	allTools := pm.GetAllToolDefinitions()
	var filtered []config.ToolDefData

	for _, tool := range allTools {
		v := tool.Visibility
		if v == "" {
			v = ToolVisibilityVisible
		}
		if v == visibility {
			filtered = append(filtered, tool)
		}
	}
	return filtered
}

func (pm *PluginManager) SearchTools(query string) []config.ToolDefData {
	allTools := pm.GetAllToolDefinitions()
	queryLower := strings.ToLower(query)
	var results []config.ToolDefData
	for _, tool := range allTools {
		nameLower := strings.ToLower(tool.Name)
		descLower := strings.ToLower(tool.Description)
		if strings.Contains(nameLower, queryLower) || strings.Contains(descLower, queryLower) {
			results = append(results, tool)
		}
	}
	return results
}

func (pm *PluginManager) FindPluginByToolName(toolName string) (string, error) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	for _, instance := range pm.plugins {
		if instance.Status != PluginStatusLoaded || instance.Runtime == nil {
			continue
		}

		api := instance.Runtime.API()
		if api == nil {
			continue
		}

		toolDefs := api.GetToolDefinitions()
		for _, entry := range toolDefs {
			if entry.Definition.Name == toolName {
				return instance.Manifest.ID, nil
			}
		}
	}
	return "", fmt.Errorf("tool %s not found in any loaded plugin", toolName)
}

// ExecuteTool 在指定插件中执行工具调用
func (pm *PluginManager) ExecuteTool(pluginID string, toolName string, params map[string]interface{}) (interface{}, error) {
	pm.mu.RLock()
	instance, ok := pm.plugins[pluginID]
	pm.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("plugin %s not found", pluginID)
	}
	if instance.Status != PluginStatusLoaded {
		return nil, fmt.Errorf("plugin %s is not loaded", pluginID)
	}
	if instance.Runtime == nil {
		return nil, fmt.Errorf("plugin %s runtime is nil", pluginID)
	}

	return instance.Runtime.ExecuteTool(toolName, params)
}

// ExecuteAutonomousTool 执行自主运行工具（通过消息上下文触发）
// 与 ExecuteTool 不同，该方法接受消息上下文作为参数
func (pm *PluginManager) ExecuteAutonomousTool(pluginID string, toolName string, message *platform.Message, context map[string]interface{}) (interface{}, error) {
	pm.mu.RLock()
	instance, ok := pm.plugins[pluginID]
	pm.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("plugin %s not found", pluginID)
	}
	if instance.Status != PluginStatusLoaded {
		return nil, fmt.Errorf("plugin %s is not loaded", pluginID)
	}
	if instance.Runtime == nil {
		return nil, fmt.Errorf("plugin %s runtime is nil", pluginID)
	}

	// 构造包含消息和上下文的参数
	sandbox := instance.Runtime.Sandbox()
	if sandbox == nil {
		return nil, fmt.Errorf("plugin %s sandbox is nil", pluginID)
	}
	params := map[string]interface{}{
		"message": jsifyMessage(sandbox.Runtime(), message),
		"context": context,
	}
	return instance.Runtime.ExecuteTool(toolName, params)
}

// GetAllActionDefinitions 收集所有已加载插件注册的动作定义（含清单中声明但未注册的）
func (pm *PluginManager) GetAllActionDefinitions() []config.ActionDefData {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	var allActions []config.ActionDefData
	for _, instance := range pm.plugins {
		if instance.Status != PluginStatusLoaded || instance.Runtime == nil {
			continue
		}

		api := instance.Runtime.API()
		if api == nil {
			continue
		}

		actionDefs := api.GetActionDefinitions()
		for _, entry := range actionDefs {
			def := entry.Definition
			var params []config.ActionParamData
			for _, p := range def.Parameters {
				params = append(params, config.ActionParamData{
					Name:        p.Name,
					Type:        p.Type,
					Description: p.Description,
					Required:    p.Required,
				})
			}
			activationType := def.ActivationType
			if activationType == "" {
				activationType = "always"
			}
			allActions = append(allActions, config.ActionDefData{
				Name:                  def.Name,
				Description:           def.Description,
				BriefDescription:      def.BriefDescription,
				DetailedDescription:   def.DetailedDescription,
				ActionParameters:      def.ActionParameters,
				ActionRequirements:    def.ActionRequirements,
				ActivationType:        activationType,
				ActivationKeywords:    def.ActivationKeywords,
				ActivationProbability: def.ActivationProbability,
				ParallelAction:        def.ParallelAction,
				Parameters:            params,
			})
		}

		for _, actionDef := range instance.Manifest.Actions {
			found := false
			for _, regDef := range actionDefs {
				if regDef.Name == actionDef.Name {
					found = true
					break
				}
			}
			if !found {
				activationType := actionDef.ActivationType
				if activationType == "" {
					activationType = "always"
				}
				var params []config.ActionParamData
				for _, p := range actionDef.Parameters {
					params = append(params, config.ActionParamData{
						Name:        p.Name,
						Type:        p.Type,
						Description: p.Description,
						Required:    p.Required,
					})
				}
				allActions = append(allActions, config.ActionDefData{
					Name:                  actionDef.Name,
					Description:           actionDef.Description,
					BriefDescription:      actionDef.BriefDescription,
					DetailedDescription:   actionDef.DetailedDescription,
					ActionParameters:      actionDef.ActionParameters,
					ActionRequirements:    actionDef.ActionRequirements,
					ActivationType:        activationType,
					ActivationKeywords:    actionDef.ActivationKeywords,
					ActivationProbability: actionDef.ActivationProbability,
					ParallelAction:        actionDef.ParallelAction,
					Parameters:            params,
				})
			}
		}
	}
	return allActions
}

// FindPluginByActionName 根据动作名查找所属插件 ID
func (pm *PluginManager) FindPluginByActionName(actionName string) (string, error) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	for _, instance := range pm.plugins {
		if instance.Status != PluginStatusLoaded || instance.Runtime == nil {
			continue
		}

		api := instance.Runtime.API()
		if api == nil {
			continue
		}

		actionDefs := api.GetActionDefinitions()
		for _, entry := range actionDefs {
			if entry.Definition.Name == actionName {
				return instance.Manifest.ID, nil
			}
		}

		for _, actionDef := range instance.Manifest.Actions {
			if actionDef.Name == actionName {
				return instance.Manifest.ID, nil
			}
		}
	}
	return "", fmt.Errorf("action %s not found in any loaded plugin", actionName)
}

// syncDisabledFromConfig 从配置文件读取 enabled 字段，同步到 disabledList
func (pm *PluginManager) syncDisabledFromConfig(manifest *PluginManifest, pluginDir string) {
	if manifest.Config == nil || manifest.Config.ConfigFile == "" {
		return
	}
	configPath := filepath.Join(pluginDir, manifest.Config.ConfigFile)
	data, err := os.ReadFile(configPath)
	if err != nil {
		return // 配置文件不存在，默认启用
	}
	var configMap map[string]interface{}
	format := manifest.Config.Type
	if format == "" {
		format = "yaml"
	}
	switch format {
	case "yaml", "yml":
		if err := parseYAML(data, &configMap); err != nil {
			return
		}
	case "toml":
		if err := parseTOML(data, &configMap); err != nil {
			return
		}
	case "json":
		if err := json.Unmarshal(data, &configMap); err != nil {
			return
		}
	default:
		return
	}
	if configMap == nil {
		return
	}
	// 支持 plugin.enabled 嵌套和顶层 enabled
	enabled := true
	if pluginSection, ok := configMap["plugin"].(map[string]interface{}); ok {
		if v, ok := pluginSection["enabled"].(bool); ok {
			enabled = v
		}
	} else if v, ok := configMap["enabled"].(bool); ok {
		enabled = v
	}
	if !enabled {
		pm.disabledList[manifest.ID] = true
	}
}

// GetAllPluginIDs 返回所有已发现插件 ID（含禁用）
func (pm *PluginManager) GetAllPluginIDs() []string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	ids := make([]string, 0, len(pm.allPluginManifests))
	for id := range pm.allPluginManifests {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// GetPluginManifest 获取插件清单（含禁用插件）
func (pm *PluginManager) GetPluginManifest(pluginID string) *PluginManifest {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	return pm.allPluginManifests[pluginID]
}

// GetPluginsDir 返回插件目录的绝对路径
func (pm *PluginManager) GetPluginsDir() string {
	return pm.pluginsDir
}

func (pm *PluginManager) ExecuteAction(pluginID string, actionName string, params map[string]interface{}) (interface{}, error) {
	pm.mu.RLock()
	instance, ok := pm.plugins[pluginID]
	pm.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("plugin %s not found", pluginID)
	}
	if instance.Status != PluginStatusLoaded {
		return nil, fmt.Errorf("plugin %s is not loaded", pluginID)
	}
	if instance.Runtime == nil {
		return nil, fmt.Errorf("plugin %s runtime is nil", pluginID)
	}

	return instance.Runtime.ExecuteAction(actionName, params)
}

// WatchPlugins 启动插件目录热加载监听，当插件文件变化时自动重载
func (pm *PluginManager) WatchPlugins() error {
	pm.mu.Lock()
	if pm.watcher != nil {
		pm.mu.Unlock()
		return fmt.Errorf("plugin watcher is already running")
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		pm.mu.Unlock()
		return fmt.Errorf("failed to create plugin watcher: %w", err)
	}

	pm.watcher = watcher
	pm.watchStop = make(chan struct{})

	// 递归监听所有已存在的插件目录
	entries, err := os.ReadDir(pm.pluginsDir)
	if err != nil {
		pm.mu.Unlock()
		watcher.Close()
		return fmt.Errorf("failed to read plugins dir: %w", err)
	}
	for _, entry := range entries {
		if entry.IsDir() {
			pluginDir := filepath.Join(pm.pluginsDir, entry.Name())
			watcher.Add(pluginDir)
		}
	}
	// 也监听根目录，以便发现新插件目录
	watcher.Add(pm.pluginsDir)
	pm.mu.Unlock()

	go pm.watchLoop(watcher)

	logger.Info("[Plugin] 热加载监听已启动，插件目录变化将自动重载")
	return nil
}

// watchLoop 文件变化监听循环，带防抖
func (pm *PluginManager) watchLoop(watcher *fsnotify.Watcher) {
	debounceTimers := make(map[string]*time.Timer)
	var debounceMu sync.Mutex

	for {
		select {
		case <-pm.watchStop:
			logger.Info("[Plugin] 热加载监听已停止")
			return
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			pm.handleWatchEvent(event, debounceTimers, &debounceMu, watcher)
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			logger.Sugar.Warnw("[Plugin] 热加载监听错误", "error", err)
		}
	}
}

// handleWatchEvent 处理文件变化事件
func (pm *PluginManager) handleWatchEvent(event fsnotify.Event, debounceTimers map[string]*time.Timer, debounceMu *sync.Mutex, watcher *fsnotify.Watcher) {
	// 忽略临时文件和编辑器备份文件
	baseName := filepath.Base(event.Name)
	if strings.HasSuffix(baseName, "~") || strings.HasPrefix(baseName, ".") {
		return
	}

	// 提取插件 ID（事件路径的父目录名）
	pluginID := pm.extractPluginID(event.Name)

	// 如果是插件目录本身被创建
	if event.Has(fsnotify.Create) {
		info, err := os.Stat(event.Name)
		if err == nil && info.IsDir() {
			manifestPath := filepath.Join(event.Name, "plugin.json")
			if _, err := os.Stat(manifestPath); err == nil {
				watcher.Add(event.Name)
				pm.scheduleDebouncedReload(filepath.Base(event.Name), debounceTimers, debounceMu)
			}
			return
		}
	}

	// 插件目录被删除
	if event.Has(fsnotify.Remove) && pluginID != "" {
		watcher.Remove(event.Name)
		pm.scheduleDebouncedReload(pluginID, debounceTimers, debounceMu)
		return
	}

	// 插件文件变化
	if pluginID != "" && (event.Has(fsnotify.Write) || event.Has(fsnotify.Create) || event.Has(fsnotify.Rename)) {
		pm.scheduleDebouncedReload(pluginID, debounceTimers, debounceMu)
	}
}

// extractPluginID 从文件路径中提取插件目录名
func (pm *PluginManager) extractPluginID(filePath string) string {
	relPath, err := filepath.Rel(pm.pluginsDir, filePath)
	if err != nil {
		return ""
	}
	parts := strings.Split(relPath, string(os.PathSeparator))
	if len(parts) == 0 {
		return ""
	}
	return parts[0]
}

// scheduleDebouncedReload 防抖安排插件重载
func (pm *PluginManager) scheduleDebouncedReload(pluginID string, debounceTimers map[string]*time.Timer, debounceMu *sync.Mutex) {
	if pluginID == "" || pluginID == "." {
		return
	}

	debounceMu.Lock()
	if timer, exists := debounceTimers[pluginID]; exists {
		timer.Stop()
	}
	debounceTimers[pluginID] = time.AfterFunc(500*time.Millisecond, func() {
		debounceMu.Lock()
		delete(debounceTimers, pluginID)
		debounceMu.Unlock()

		logger.Sugar.Infow("[Plugin] 检测到插件变化，热重载", "id", pluginID)
		if err := pm.Reload(pluginID); err != nil {
			logger.Sugar.Warnw("[Plugin] 热重载失败", "id", pluginID, "error", err)
		} else {
			logger.Sugar.Infow("[Plugin] 热重载完成", "id", pluginID)
		}
	})
	debounceMu.Unlock()
}
