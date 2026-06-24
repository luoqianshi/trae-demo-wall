package tool

import (
	"context"
	"fmt"
	"strings"

	"YaraFlow/internal/config"
	"YaraFlow/internal/download"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/memory"

	websearch "YaraFlow/internal/search"
)

type BuiltinToolHandler func(args map[string]interface{}, ctx *BuiltinToolContext) (string, error)

type BuiltinToolContext struct {
	SessionID        string
	Platform         string
	GroupID          string
	UserID           string
	SenderName       string
	IsGroupChat      bool
	Reasoning        string
	PauseExecution   bool
	ReplacedQuery    string   // web_search 替换链接后的消息，用于覆盖原始消息
	LinkDescriptions []string // web_search 链接内容描述，格式 "[链接N] 的内容：..."
}

type builtinToolEntry struct {
	Def     config.ToolDefData
	Handler BuiltinToolHandler
}

type BuiltinToolRegistry struct {
	memoryManager     *memory.MemoryManager
	graphStore        *memory.GraphStore
	profileStore      *memory.PersonProfileStore
	searchLLMProvider llm.LLMProvider
	webSearchSystem   *websearch.System
	downloadManager   *download.Manager
	tools             map[string]builtinToolEntry
}

func NewBuiltinToolRegistry(mm *memory.MemoryManager) *BuiltinToolRegistry {
	r := &BuiltinToolRegistry{
		memoryManager: mm,
		tools:         make(map[string]builtinToolEntry),
	}
	r.registerToolSearch()
	if config.AppConfig.Memory.Enabled {
		r.registerQueryMemory()
	}
	if config.AppConfig.WebSearch.Enabled {
		r.registerWebSearch()
		r.registerFetchURL()
		// 优先使用 Download 配置段，兼容旧 WebSearch 配置
		allowDownload := config.AppConfig.Download.AllowFileDownload
		if !allowDownload {
			allowDownload = config.AppConfig.WebSearch.AllowFileDownload
		}
		if allowDownload {
			r.registerDownloadFile()
		}
	}
	if config.AppConfig.Memory.GraphMemory.Enabled {
		r.registerQueryGraph()
		r.registerQueryProfile()
	}
	return r
}

func (r *BuiltinToolRegistry) SetGraphStore(gs *memory.GraphStore) {
	r.graphStore = gs
}

func (r *BuiltinToolRegistry) SetProfileStore(ps *memory.PersonProfileStore) {
	r.profileStore = ps
}

func (r *BuiltinToolRegistry) SetSearchLLMProvider(p llm.LLMProvider) {
	r.searchLLMProvider = p
	r.registerSearchMessages()
	if config.AppConfig.WebSearch.Enabled {
		r.initWebSearchSystem()
	}
}

// SetVisionProvider 注入已有的识图模型池到 websearch 子系统
func (r *BuiltinToolRegistry) SetVisionProvider(vp llm.VisionProvider) {
	if r.webSearchSystem != nil {
		r.webSearchSystem.SetVisionProvider(vp)
	}
}

// StartDownloadCleanup 启动下载文件定期清理循环
func (r *BuiltinToolRegistry) StartDownloadCleanup(ctx context.Context) {
	if r.downloadManager != nil {
		r.downloadManager.StartCleanupLoop(ctx)
		logger.Sugar.Info("[下载] 清理循环已启动")
	}
}

// SetDownloadErrorCallback 设置异步下载失败回调
func (r *BuiltinToolRegistry) SetDownloadErrorCallback(cb download.DownloadErrorCallback) {
	if r.downloadManager != nil {
		r.downloadManager.SetDownloadErrorCallback(cb)
	}
}

// SetDownloadSuccessCallback 设置异步下载成功回调
func (r *BuiltinToolRegistry) SetDownloadSuccessCallback(cb download.DownloadSuccessCallback) {
	if r.downloadManager != nil {
		r.downloadManager.SetDownloadSuccessCallback(cb)
	}
}

func (r *BuiltinToolRegistry) GetToolDefinitions() []config.ToolDefData {
	var defs []config.ToolDefData
	for _, entry := range r.tools {
		defs = append(defs, entry.Def)
	}
	return defs
}

func (r *BuiltinToolRegistry) GetVisibleToolDefinitions() []config.ToolDefData {
	var defs []config.ToolDefData
	for _, entry := range r.tools {
		v := entry.Def.Visibility
		if v == "" || v == "visible" {
			defs = append(defs, entry.Def)
		}
	}
	return defs
}

func (r *BuiltinToolRegistry) GetDeferredToolNames() []string {
	var names []string
	for _, entry := range r.tools {
		if entry.Def.Visibility == "deferred" {
			names = append(names, entry.Def.Name)
		}
	}
	return names
}

func (r *BuiltinToolRegistry) Execute(name string, args map[string]interface{}, ctx *BuiltinToolContext) (string, error) {
	entry, ok := r.tools[name]
	if !ok {
		return "", fmt.Errorf("内置工具 %s 不存在", name)
	}
	return entry.Handler(args, ctx)
}

func (r *BuiltinToolRegistry) HasTool(name string) bool {
	_, ok := r.tools[name]
	return ok
}

func parseLimitArg(args map[string]interface{}, defaultVal, maxVal int) int {
	limit := defaultVal
	if raw, ok := args["limit"]; ok {
		switch v := raw.(type) {
		case float64:
			limit = int(v)
		case int:
			limit = v
		}
	}
	if limit <= 0 {
		limit = defaultVal
	}
	if limit > maxVal {
		limit = maxVal
	}
	return limit
}

func (r *BuiltinToolRegistry) registerToolSearch() {
	r.tools["tool_search"] = builtinToolEntry{
		Def: config.ToolDefData{
			Name:        "tool_search",
			Description: "搜索可用工具列表。当你需要某个功能但当前工具列表中找不到时，先调用此工具搜索。tool_search 只负责发现工具并返回其完整定义，不直接执行业务。",
			Parameters: []config.ToolParamData{
				{Name: "query", Type: "string", Description: "要搜索的工具名、前缀或关键词", Required: true},
				{Name: "limit", Type: "integer", Description: "最多返回多少个匹配工具，默认5", Required: false},
			},
			Visibility: "visible",
			ToolType:   "action",
		},
		Handler: r.handleToolSearch,
	}
}

func (r *BuiltinToolRegistry) handleToolSearch(args map[string]interface{}, ctx *BuiltinToolContext) (string, error) {
	query, _ := args["query"].(string)
	if query == "" {
		return "", fmt.Errorf("tool_search 需要提供 query 参数")
	}

	limit := parseLimitArg(args, 5, 20)

	logger.Sugar.Infow("[内置工具] tool_search", "query", query, "limit", limit)

	var matched []config.ToolDefData
	queryLower := strings.ToLower(query)

	for _, entry := range r.tools {
		if entry.Def.Visibility != "deferred" {
			continue
		}
		if strings.Contains(strings.ToLower(entry.Def.Name), queryLower) ||
			strings.Contains(strings.ToLower(entry.Def.Description), queryLower) {
			matched = append(matched, entry.Def)
			if len(matched) >= limit {
				break
			}
		}
	}

	if len(matched) == 0 {
		return fmt.Sprintf("未找到与 \"%s\" 匹配的工具。可尝试更通用的关键词搜索，如 \"search\"、\"memory\"、\"web\" 等。", query), nil
	}

	return config.FormatToolsForPrompt(matched), nil
}
