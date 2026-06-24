package plugin

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// ─── Manifest 主结构 ───

type PluginManifest struct {
	ManifestVersion int               `json:"manifestVersion,omitempty"`
	ID              string            `json:"id"`
	Name            string            `json:"name"`
	Version         string            `json:"version"`
	Author          AuthorInfo        `json:"author"`
	License         string            `json:"license,omitempty"`
	Description     string            `json:"description"`
	Main            string            `json:"main"`
	PluginType      string            `json:"type,omitempty"`
	HostApplication VersionConstraint `json:"hostApplication,omitempty"`
	SDK             VersionConstraint `json:"sdk,omitempty"`
	Dependencies    []Dependency      `json:"dependencies,omitempty"`
	Hooks           []string          `json:"hooks,omitempty"`
	Commands        []CommandDef      `json:"commands,omitempty"`
	Actions         []ActionDef       `json:"actions,omitempty"`
	Tools           []ToolDef         `json:"tools,omitempty"`
	EventHandlers   []EventHandlerDef `json:"eventHandlers,omitempty"`
	LLMProviders    []LLMProviderDef  `json:"llmProviders,omitempty"`
	APIs            []APIDef          `json:"apis,omitempty"`
	Capabilities    []string          `json:"capabilities,omitempty"`
	Permissions     []string          `json:"permissions,omitempty"`
	Config          *PluginConfigDef  `json:"config,omitempty"`
	I18n            *I18nConfig       `json:"i18n,omitempty"`
}

func (m *PluginManifest) UnmarshalJSON(data []byte) error {
	type Alias PluginManifest
	aux := &struct {
		Author interface{} `json:"author"`
		*Alias
	}{
		Alias: (*Alias)(m),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	switch v := aux.Author.(type) {
	case string:
		m.Author = AuthorInfo{Name: v}
	case map[string]interface{}:
		if name, ok := v["name"].(string); ok {
			m.Author.Name = name
		}
		if url, ok := v["url"].(string); ok {
			m.Author.URL = url
		}
	}
	return nil
}

// ─── 嵌套数据类型 ───

type AuthorInfo struct {
	Name string `json:"name"`
	URL  string `json:"url,omitempty"`
}

func (a AuthorInfo) String() string {
	return a.Name
}

type VersionConstraint struct {
	MinVersion string `json:"minVersion,omitempty"`
	MaxVersion string `json:"maxVersion,omitempty"`
}

type I18nConfig struct {
	DefaultLocale    string   `json:"defaultLocale,omitempty"`
	LocalesPath      string   `json:"localesPath,omitempty"`
	SupportedLocales []string `json:"supportedLocales,omitempty"`
}

type Dependency struct {
	Type        string `json:"type"`
	ID          string `json:"id,omitempty"`
	Name        string `json:"name,omitempty"`
	VersionSpec string `json:"versionSpec,omitempty"`
}

// ─── 组件定义 ───

type CommandDef struct {
	Name        string   `json:"name"`
	Pattern     string   `json:"pattern"`
	Description string   `json:"description"`
	Aliases     []string `json:"aliases,omitempty"`
}

type ActionDef struct {
	Name                  string            `json:"name"`
	Description           string            `json:"description"`
	BriefDescription      string            `json:"briefDescription,omitempty"`
	DetailedDescription   string            `json:"detailedDescription,omitempty"`
	ActionParameters      map[string]string `json:"action_parameters,omitempty"`
	ActionRequirements    []string          `json:"action_requirements,omitempty"`
	ActivationType        string            `json:"activation_type,omitempty"`
	ActivationKeywords    []string          `json:"activation_keywords,omitempty"`
	ActivationProbability float64           `json:"activation_probability,omitempty"`
	AssociatedTypes       []string          `json:"associated_types,omitempty"`
	ParallelAction        bool              `json:"parallel_action,omitempty"`
	Parameters            []ActionParamDef  `json:"parameters,omitempty"`
}

type ActionParamDef struct {
	Name        string      `json:"name"`
	Type        string      `json:"type"`
	Description string      `json:"description"`
	Required    bool        `json:"required"`
	Default     interface{} `json:"default,omitempty"`
	EnumValues  []string    `json:"enumValues,omitempty"`
}

type ToolDef struct {
	Name                string         `json:"name"`
	Description         string         `json:"description,omitempty"`
	BriefDescription    string         `json:"briefDescription,omitempty"`
	DetailedDescription string         `json:"detailedDescription,omitempty"`
	Parameters          []ToolParamDef `json:"parameters,omitempty"`
	CoreTool            bool           `json:"coreTool,omitempty"`
	Visibility          string         `json:"visibility,omitempty"`
	ToolType            string         `json:"toolType,omitempty"`
	TimeoutSeconds      int            `json:"timeoutSeconds,omitempty"`
}

type ToolParamDef struct {
	Name                 string                 `json:"name"`
	Type                 string                 `json:"type"`
	Description          string                 `json:"description"`
	Required             bool                   `json:"required"`
	Default              interface{}            `json:"default,omitempty"`
	EnumValues           []interface{}          `json:"enumValues,omitempty"`
	ItemsSchema          map[string]interface{} `json:"itemsSchema,omitempty"`
	Properties           map[string]interface{} `json:"properties,omitempty"`
	RequiredProperties   []string               `json:"requiredProperties,omitempty"`
	AdditionalProperties interface{}            `json:"additionalProperties,omitempty"`
}

type EventHandlerDef struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	EventType        string `json:"eventType"`
	InterceptMessage bool   `json:"interceptMessage,omitempty"`
	Weight           int    `json:"weight,omitempty"`
}

type LLMProviderDef struct {
	ClientType  string `json:"clientType"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Version     string `json:"version,omitempty"`
}

type APIDef struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Version     string `json:"version,omitempty"`
	Public      bool   `json:"public,omitempty"`
}

type PluginConfigDef struct {
	Type       string                 `json:"type"`
	ConfigFile string                 `json:"configFile,omitempty"`
	Default    map[string]interface{} `json:"default,omitempty"`
	Sections   []ConfigSection        `json:"sections,omitempty"`
}

type ConfigSection struct {
	Name        string           `json:"name"`
	Label       string           `json:"label,omitempty"`
	Icon        string           `json:"icon,omitempty"`
	Description string           `json:"description,omitempty"`
	Fields      []ConfigFieldDef `json:"fields,omitempty"`
}

type ConfigFieldDef struct {
	Name        string      `json:"name"`
	Type        string      `json:"type"`
	Description string      `json:"description,omitempty"`
	Default     interface{} `json:"default,omitempty"`
	Required    bool        `json:"required,omitempty"`
	Placeholder string      `json:"placeholder,omitempty"`
}

// ─── Hook 点注册表（支持插件注册的 Hook 类型） ───

var validHookTypes = map[string]bool{
	// 聊天消息链
	"chat.receive.before_process": true,
	"chat.receive.after_process":  true,

	// 命令执行链
	"chat.command.before_execute": true,
	"chat.command.after_execute":  true,

	// 表情包链
	"emoji.chat.before_select":               true,
	"emoji.chat.after_select":                true,
	"emoji.register.after_build_description": true,
	"emoji.register.after_build_emotion":     true,

	// 发送服务链
	"send_service.after_build_message": true,
	"send_service.before_send":         true,
	"send_service.after_send":          true,

	// 规划器链
	"chat.planner.before_request": true,
	"chat.planner.after_response": true,

	// 回复器链
	"chat.replyer.before_request":       true,
	"chat.replyer.before_model_request": true,
	"chat.replyer.after_response":       true,

	// 黑话链
	"jargon.query.before_search":       true,
	"jargon.query.after_search":        true,
	"jargon.extract.before_persist":    true,
	"jargon.inference.before_finalize": true,

	// 表达方式链
	"expression.select.before_select":   true,
	"expression.select.after_selection": true,
	"expression.learn.after_extract":    true,
	"expression.learn.before_upsert":    true,
}

// HookSpec 描述每个 Hook 点的能力约束
type HookSpec struct {
	Name                string
	Description         string
	AllowBlocking       bool
	AllowObserve        bool
	AllowAbort          bool
	AllowKwargsMutation bool
}

var hookSpecs = map[string]HookSpec{
	"chat.receive.before_process":            {"chat.receive.before_process", "入站消息处理前", true, true, true, true},
	"chat.receive.after_process":             {"chat.receive.after_process", "入站消息处理后", true, true, true, true},
	"chat.command.before_execute":            {"chat.command.before_execute", "命令执行前", true, true, true, true},
	"chat.command.after_execute":             {"chat.command.after_execute", "命令执行后", true, true, false, true},
	"send_service.after_build_message":       {"send_service.after_build_message", "消息构建后", true, true, true, true},
	"send_service.before_send":               {"send_service.before_send", "消息发送前", true, true, true, true},
	"send_service.after_send":                {"send_service.after_send", "消息发送后", true, true, false, false},
	"chat.planner.before_request":            {"chat.planner.before_request", "规划器请求前", true, true, false, true},
	"chat.planner.after_response":            {"chat.planner.after_response", "规划器响应后", true, true, false, true},
	"chat.replyer.before_request":            {"chat.replyer.before_request", "回复器请求前", true, true, false, true},
	"chat.replyer.before_model_request":      {"chat.replyer.before_model_request", "回复器模型请求前", true, true, false, true},
	"chat.replyer.after_response":            {"chat.replyer.after_response", "回复器响应后", true, true, false, true},
	"emoji.chat.before_select":               {"emoji.chat.before_select", "表情选择前", true, true, true, true},
	"emoji.chat.after_select":                {"emoji.chat.after_select", "表情选择后", true, true, true, true},
	"emoji.register.after_build_description": {"emoji.register.after_build_description", "表情描述生成后", true, true, true, true},
	"emoji.register.after_build_emotion":     {"emoji.register.after_build_emotion", "表情情绪标签生成后", true, true, true, true},
	"jargon.query.before_search":             {"jargon.query.before_search", "黑话查询前", true, true, true, true},
	"jargon.query.after_search":              {"jargon.query.after_search", "黑话查询后", true, true, true, true},
	"jargon.extract.before_persist":          {"jargon.extract.before_persist", "黑话写库前", true, true, true, true},
	"jargon.inference.before_finalize":       {"jargon.inference.before_finalize", "黑话推断结果写回前", true, true, true, true},
	"expression.select.before_select":        {"expression.select.before_select", "表达方式选择前", true, true, true, true},
	"expression.select.after_selection":      {"expression.select.after_selection", "表达方式选择后", true, true, true, true},
	"expression.learn.after_extract":         {"expression.learn.after_extract", "表达方式学习解析后", true, true, true, true},
	"expression.learn.before_upsert":         {"expression.learn.before_upsert", "表达方式写库前", true, true, true, true},
}

// ─── EventType 枚举 ───

var validEventTypes = map[string]bool{
	"ON_START":               true,
	"ON_STOP":                true,
	"ON_MESSAGE_PRE_PROCESS": true,
	"ON_MESSAGE":             true,
	"ON_PLAN":                true,
	"POST_LLM":               true,
	"AFTER_LLM":              true,
	"POST_SEND_PRE_PROCESS":  true,
	"POST_SEND":              true,
	"AFTER_SEND":             true,
}

// ─── HookMode / HookOrder / ErrorPolicy 枚举 ───

var validHookModes = map[string]bool{
	"blocking": true,
	"observe":  true,
}

var validHookOrders = map[string]bool{
	"early":  true,
	"normal": true,
	"late":   true,
}

var validErrorPolicies = map[string]bool{
	"abort": true,
	"skip":  true,
	"log":   true,
}

// ─── Tool 可见性枚举 ───

const (
	ToolVisibilityVisible  = "visible"  // 对 LLM 完全可见，Agent 可主动调用
	ToolVisibilityHidden   = "hidden"   // 对 LLM 隐藏，仅程序内部/自主运行
	ToolVisibilityDeferred = "deferred" // 延迟可见，默认不暴露给 LLM（按需加载）
)

var validToolVisibilities = map[string]bool{
	ToolVisibilityVisible:  true,
	ToolVisibilityHidden:   true,
	ToolVisibilityDeferred: true,
}

// ─── Tool 类型枚举 ───

const (
	ToolTypeAgent      = "agent"      // Agent 可调用工具（默认）
	ToolTypeAutonomous = "autonomous" // 自主运行工具（Hook 触发，不可被 Agent 调用）
	ToolTypeCore       = "core"       // 核心工具（始终可见）
)

var validToolTypes = map[string]bool{
	ToolTypeAgent:      true,
	ToolTypeAutonomous: true,
	ToolTypeCore:       true,
}

// ─── ToolParamType 枚举 ───

var validToolParamTypes = map[string]bool{
	"string":  true,
	"integer": true,
	"number":  true,
	"float":   true,
	"boolean": true,
	"array":   true,
	"object":  true,
}

// ─── 权限系统（Capability-style） ───

var allowedPermissions = map[string]bool{
	// 事件
	"event.subscribe": true,
	"event.publish":   true,

	// 钩子
	"hook.register": true,

	// 指令
	"command.register": true,

	// 工具
	"tool.register": true,

	// 动作（规划器直接可选动作）
	"action.register": true,

	// 事件处理器
	"event_handler.register": true,

	// LLM Provider
	"llm_provider.register": true,

	// API
	"api.register": true,
	"api.call":     true,

	// 消息发送
	"send.text":    true,
	"send.image":   true,
	"send.emoji":   true,
	"send.forward": true,
	"send.hybrid":  true,

	// 表情包
	"emoji.access":             true,
	"emoji.get_random":         true,
	"emoji.get_by_description": true,

	// 数据库
	"database.read":  true,
	"database.write": true,

	// 配置
	"plugin.config.read":  true,
	"plugin.config.write": true,

	// 文件
	"plugin.file.read":  true,
	"plugin.file.write": true,

	// 网络
	"network.http": true,

	// HTTP 请求（GET/POST/下载）
	"http.request": true,

	// 模型访问（插件调用LLM）
	"model.access": true,

	// 异步任务执行
	"async_task.execute": true,

	// 聊天流
	"chat.get_streams":  true,
	"chat.open_session": true,

	// 用户信息
	"person.get_info": true,

	// 频率控制
	"frequency.read":  true,
	"frequency.write": true,

	// 组件管理
	"component.manage": true,

	// 历史消息
	"message.history": true,

	// LLM 调用
	"llm.generate":            true,
	"llm.generate_with_tools": true,
	"llm.embed":               true,

	// 备忘录
	"knowledge.search": true,

	// 渲染
	"render.html2png": true,

	// 插件数据目录访问（用于视频下载、缓存文件等）
	"data.directory.read":  true,
	"data.directory.write": true,

	// 模型列表查询
	"llm.get_available_models": true,
}

// ─── Capability 到 Permission 的映射 ───

func CapabilityToPermission(cap string) string {
	// 直接将 capability 作为 permission 使用
	return cap
}

// ─── 清单加载与校验 ───

func LoadManifest(pluginDir string) (*PluginManifest, error) {
	manifestPath := filepath.Join(pluginDir, "plugin.json")
	data, err := os.ReadFile(manifestPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read manifest: %w", err)
	}

	var manifest PluginManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("failed to parse manifest: %w", err)
	}

	if err := validateManifest(&manifest, pluginDir); err != nil {
		return nil, err
	}

	return &manifest, nil
}

func validateManifest(manifest *PluginManifest, pluginDir string) error {
	// ── manifestVersion 默认处理 ──
	if manifest.ManifestVersion == 0 {
		manifest.ManifestVersion = 1
	}
	if manifest.ManifestVersion < 1 || manifest.ManifestVersion > 2 {
		return fmt.Errorf("manifestVersion must be 1 or 2, got %d", manifest.ManifestVersion)
	}

	// ── 必填字段 ──
	if manifest.ID == "" {
		return fmt.Errorf("plugin id is required")
	}
	if !regexp.MustCompile(`^[a-zA-Z0-9]+(?:[.\-][a-zA-Z0-9]+)+$`).MatchString(manifest.ID) {
		return fmt.Errorf("plugin id must follow reverse-domain style (e.g. com.example.my-plugin)")
	}
	if manifest.Name == "" {
		return fmt.Errorf("plugin name is required")
	}
	if manifest.Version == "" {
		return fmt.Errorf("plugin version is required")
	}
	if !regexp.MustCompile(`^\d+\.\d+\.\d+$`).MatchString(manifest.Version) {
		return fmt.Errorf("plugin version must be semver (e.g. 1.0.0)")
	}
	if manifest.Main == "" {
		return fmt.Errorf("plugin main script is required")
	}

	mainPath := filepath.Join(pluginDir, manifest.Main)
	if _, err := os.Stat(mainPath); os.IsNotExist(err) {
		return fmt.Errorf("main script not found: %s", manifest.Main)
	}

	// ── 版本约束 ──
	if manifest.HostApplication.MinVersion != "" {
		if !regexp.MustCompile(`^\d+\.\d+\.\d+$`).MatchString(manifest.HostApplication.MinVersion) {
			return fmt.Errorf("hostApplication.minVersion must be semver")
		}
	}
	if manifest.HostApplication.MaxVersion != "" {
		if !regexp.MustCompile(`^\d+\.\d+\.\d+$`).MatchString(manifest.HostApplication.MaxVersion) {
			return fmt.Errorf("hostApplication.maxVersion must be semver")
		}
	}
	if manifest.SDK.MinVersion != "" {
		if !regexp.MustCompile(`^\d+\.\d+\.\d+$`).MatchString(manifest.SDK.MinVersion) {
			return fmt.Errorf("sdk.minVersion must be semver")
		}
	}
	if manifest.SDK.MaxVersion != "" {
		if !regexp.MustCompile(`^\d+\.\d+\.\d+$`).MatchString(manifest.SDK.MaxVersion) {
			return fmt.Errorf("sdk.maxVersion must be semver")
		}
	}

	// ── URL 格式校验 ──
	checkURL := func(field, url string) error {
		if url != "" && !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
			return fmt.Errorf("%s must start with http:// or https://", field)
		}
		return nil
	}
	if err := checkURL("author.url", manifest.Author.URL); err != nil {
		return err
	}

	// ── Hook 校验 ──
	for _, hook := range manifest.Hooks {
		if !validHookTypes[hook] {
			return fmt.Errorf("invalid hook type: %s", hook)
		}
	}

	// ── Command 校验 ──
	for _, cmd := range manifest.Commands {
		if cmd.Name == "" {
			return fmt.Errorf("command name is required")
		}
		if cmd.Pattern == "" {
			return fmt.Errorf("command pattern is required for '%s'", cmd.Name)
		}
		if _, err := regexp.Compile(cmd.Pattern); err != nil {
			return fmt.Errorf("invalid regex pattern for command '%s': %w", cmd.Name, err)
		}
	}

	// ── Action 校验 ──
	for _, action := range manifest.Actions {
		if action.Name == "" {
			return fmt.Errorf("action name is required")
		}
		if action.Description == "" {
			return fmt.Errorf("action '%s': description is required", action.Name)
		}
		at := strings.ToLower(action.ActivationType)
		if at != "" && at != "always" && at != "random" && at != "keyword" && at != "never" {
			return fmt.Errorf("action '%s': invalid activation_type '%s'", action.Name, action.ActivationType)
		}
		for _, param := range action.Parameters {
			if param.Name == "" {
				return fmt.Errorf("action '%s': parameter name is required", action.Name)
			}
			if param.Type != "" && !validToolParamTypes[strings.ToLower(param.Type)] {
				return fmt.Errorf("action '%s': invalid parameter type '%s' for param '%s'", action.Name, param.Type, param.Name)
			}
		}
	}

	// ── Tool 校验 ──
	for _, tool := range manifest.Tools {
		if tool.Name == "" {
			return fmt.Errorf("tool name is required")
		}
		// 校验 visibility
		if tool.Visibility != "" && !validToolVisibilities[tool.Visibility] {
			return fmt.Errorf("tool '%s': invalid visibility '%s', must be one of: visible, hidden, deferred", tool.Name, tool.Visibility)
		}
		// 校验 toolType
		if tool.ToolType != "" && !validToolTypes[tool.ToolType] {
			return fmt.Errorf("tool '%s': invalid toolType '%s', must be one of: agent, autonomous, core", tool.Name, tool.ToolType)
		}
		// 自主运行工具必须为 hidden
		if tool.ToolType == ToolTypeAutonomous && tool.Visibility != "" && tool.Visibility != ToolVisibilityHidden {
			return fmt.Errorf("tool '%s': autonomous tools must have visibility='hidden', got '%s'", tool.Name, tool.Visibility)
		}
		for _, param := range tool.Parameters {
			if param.Name == "" {
				return fmt.Errorf("tool '%s': parameter name is required", tool.Name)
			}
			if param.Type != "" && !validToolParamTypes[strings.ToLower(param.Type)] {
				return fmt.Errorf("tool '%s': invalid parameter type '%s' for param '%s'", tool.Name, param.Type, param.Name)
			}
		}
	}

	// ── EventHandler 校验 ──
	for _, eh := range manifest.EventHandlers {
		if eh.Name == "" {
			return fmt.Errorf("event handler name is required")
		}
		if eh.EventType != "" && !validEventTypes[eh.EventType] {
			return fmt.Errorf("invalid event type: %s", eh.EventType)
		}
	}

	// ── LLMProvider 校验 ──
	for _, prov := range manifest.LLMProviders {
		if prov.ClientType == "" {
			return fmt.Errorf("llm provider clientType is required")
		}
	}

	// ── Permission 校验 ──
	for _, perm := range manifest.Permissions {
		if !allowedPermissions[perm] {
			return fmt.Errorf("unknown permission: %s", perm)
		}
	}

	// ── Capability 校验 ──
	for _, cap := range manifest.Capabilities {
		perm := CapabilityToPermission(cap)
		if !allowedPermissions[perm] {
			return fmt.Errorf("unknown capability: %s", cap)
		}
	}

	// ── I18n 校验 ──
	if manifest.I18n != nil {
		if manifest.I18n.DefaultLocale != "" {
			for _, locale := range manifest.I18n.SupportedLocales {
				if locale == "" {
					return fmt.Errorf("i18n supportedLocales cannot contain empty values")
				}
			}
		}
	}

	// ── Dependencies 校验 ──
	for _, dep := range manifest.Dependencies {
		if dep.Type != "plugin" && dep.Type != "python_package" {
			return fmt.Errorf("dependency type must be 'plugin' or 'python_package', got '%s'", dep.Type)
		}
		if dep.Type == "plugin" && dep.ID == "" {
			return fmt.Errorf("plugin dependency id is required")
		}
		if dep.Type == "python_package" && dep.Name == "" {
			return fmt.Errorf("python package dependency name is required")
		}
		if dep.ID == manifest.ID {
			return fmt.Errorf("plugin cannot depend on itself")
		}
	}

	// ── Dependencies 自依赖和重复校验 ──
	depIDs := make(map[string]bool)
	for _, dep := range manifest.Dependencies {
		if dep.Type == "plugin" {
			if depIDs[dep.ID] {
				return fmt.Errorf("duplicate plugin dependency: %s", dep.ID)
			}
			depIDs[dep.ID] = true
		}
	}

	// ── Config 校验 ──
	if manifest.Config != nil {
		configType := strings.ToLower(manifest.Config.Type)
		if configType != "json" && configType != "yaml" && configType != "toml" {
			return fmt.Errorf("unsupported config type: %s", manifest.Config.Type)
		}
		if manifest.Config.ConfigFile != "" {
			configPath := filepath.Join(pluginDir, manifest.Config.ConfigFile)
			if _, err := os.Stat(configPath); os.IsNotExist(err) {
				// configFile 不存在不是致命错误，因为可以用默认值
			}
		}
	}

	// ── LLMProvider 双重校验 (manifest + 代码中都需要声明) ──
	clientTypes := make(map[string]bool)
	for _, prov := range manifest.LLMProviders {
		if clientTypes[prov.ClientType] {
			return fmt.Errorf("duplicate llm provider clientType: %s", prov.ClientType)
		}
		clientTypes[prov.ClientType] = true
	}

	// ── API 名称唯一性校验 ──
	apiNames := make(map[string]bool)
	for _, api := range manifest.APIs {
		if apiNames[api.Name] {
			return fmt.Errorf("duplicate api name: %s", api.Name)
		}
		apiNames[api.Name] = true
	}

	// ── EventHandler 名称唯一性校验 ──
	ehNames := make(map[string]bool)
	for _, eh := range manifest.EventHandlers {
		if ehNames[eh.Name] {
			return fmt.Errorf("duplicate event handler name: %s", eh.Name)
		}
		ehNames[eh.Name] = true
	}

	return nil
}

// ── 便捷方法 ──

func (m *PluginManifest) HasPermission(perm string) bool {
	for _, p := range m.Permissions {
		if p == perm {
			return true
		}
	}
	return false
}

func (m *PluginManifest) HasCapability(cap string) bool {
	perm := CapabilityToPermission(cap)
	if m.HasPermission(perm) {
		return true
	}
	for _, c := range m.Capabilities {
		if c == cap {
			return true
		}
	}
	return false
}

type CommandRegistrar interface {
	RegisterCommand(name, pattern, pluginID string) error
	UnregisterCommand(name string)
}
