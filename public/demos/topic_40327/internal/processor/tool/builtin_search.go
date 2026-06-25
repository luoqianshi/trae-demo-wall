package tool

import (
	"fmt"
	"strings"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/download"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/memory"
	"YaraFlow/internal/platform"
	websearch "YaraFlow/internal/search"
	"YaraFlow/internal/storage"
)

// llmProviderAdapter 将项目 LLM Provider 适配为 websearch 模块的 Provider 接口
type llmProviderAdapter struct {
	provider llm.LLMProvider
}

func (a *llmProviderAdapter) Chat(messages []websearch.ChatMessage) (string, error) {
	llmMsgs := make([]llm.ChatMessage, len(messages))
	for i, m := range messages {
		llmMsgs[i] = llm.ChatMessage{Role: m.Role, Content: m.Content}
	}
	return a.provider.Chat(llmMsgs)
}

func (r *BuiltinToolRegistry) registerWebSearch() {
	params := []config.ToolParamData{
		{Name: "query", Type: "string", Description: "搜索关键词或问题", Required: true},
	}

	// 仅当深度搜索启用时，才暴露 depth 参数
	wc := config.AppConfig.WebSearch
	if wc.Research.Enabled {
		params = append(params, config.ToolParamData{
			Name:        "depth",
			Type:        "string",
			Description: "搜索模式：simple(简易搜索)、webpage(常规搜索)、depth(深度搜索)，默认常规搜索",
			Required:    false,
		})
		params = append(params, config.ToolParamData{
			Name: "limit", Type: "integer", Description: "返回结果数量，默认5条，最大10条", Required: false,
		})
	} else {
		params = append(params, config.ToolParamData{
			Name: "limit", Type: "integer", Description: "返回结果数量，默认5条，最大10条", Required: false,
		})
	}

	desc := "联网搜索最新信息。支持简易搜索(快速返回摘要)和常规搜索(抓取网页全文并用LLM分析总结)。"
	if wc.Research.Enabled {
		desc = "联网搜索最新信息。支持三种模式：simple(简易搜索，快速返回摘要)、webpage(常规搜索，抓取网页全文并用LLM分析总结)、depth(深度搜索，多智能体辩论式深度研究)。用于查询实时数据、新闻、百科知识等需要最新信息的场景。"
	}

	r.tools["web_search"] = builtinToolEntry{
		Def: config.ToolDefData{
			Name:        "web_search",
			Description: desc,
			Parameters:  params,
			Visibility:  "deferred",
			ToolType:    "action",
		},
		Handler: r.handleWebSearch,
	}
}

// initWebSearchSystem 初始化 websearch 子系统
func (r *BuiltinToolRegistry) initWebSearchSystem() {
	wc := config.AppConfig.WebSearch

	cfg := websearch.Config{
		Simple: websearch.SimpleConfig{
			MaxResults: wc.Shallow.MaxResults,
		},
		Webpage: websearch.WebpageConfig{
			MaxResults:       wc.Deep.MaxResults,
			FetchContent:     wc.Deep.FetchContent,
			FetchTimeout:     wc.Deep.FetchTimeout,
			MaxContentLength: 2000,
		},
		Depth: websearch.DepthConfig{
			Enabled:       wc.Research.Enabled,
			MaxRounds:     wc.Research.MaxRounds,
			MaxResults:    wc.Research.MaxResults,
			MaxSubQueries: wc.Research.MaxSubQueries,
		},
		HTTP: websearch.HTTPConfig{
			Timeout:   10 * time.Second,
			UserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		},
	}

	if r.searchLLMProvider != nil {
		adapter := &llmProviderAdapter{provider: r.searchLLMProvider}
		r.webSearchSystem = websearch.NewWithLLM(cfg, adapter)
	} else {
		r.webSearchSystem = websearch.NewWithConfig(cfg)
	}

	// 设置记忆提供者（供大会辩论使用）
	if wc.Research.Enabled && r.memoryManager != nil {
		r.webSearchSystem.SetMemoryProvider(&memorySearchAdapter{mm: r.memoryManager})
	}

	// 初始化下载管理器（始终初始化，由规划器通过 download_file 工具按需调用）
	// 优先使用 Download 配置段，兼容旧 WebSearch 配置
	dc := config.AppConfig.Download
	downloadDir := dc.DownloadDir
	if downloadDir == "" {
		downloadDir = wc.DownloadDir // 兼容旧配置
	}
	if downloadDir == "" {
		downloadDir = "./data/downloads"
	}
	r.downloadManager = download.NewManager(downloadDir)

	// 设置迅雷下载配置
	useThunder := dc.UseThunder
	minFileSize := dc.ThunderMinFileSize
	if minFileSize <= 0 {
		minFileSize = 10 // 默认 10MB
	}
	r.downloadManager.SetThunderConfig(useThunder, minFileSize)

	// 注入文件发送回调（通用接口：通过平台驱动发送文件到群组）
	r.downloadManager.SetSendFileFunc(func(filePath, fileName, groupID string) error {
		driver := platform.DefaultPlatformDriver
		if driver == nil {
			return fmt.Errorf("平台驱动未初始化")
		}
		return driver.SendFileMessage(filePath, fileName, groupID)
	})

	// 设置下载回调（供 fetch_url 识别下载链接用，不自动下载）
	r.webSearchSystem.SetDownloadFunc(func(url string, groupID string) (string, error) {
		return "下载文件", nil
	})

	logger.Sugar.Infow("[下载] 下载管理器已初始化",
		"dir", downloadDir,
	)
}

// memorySearchAdapter 适配器：将项目记忆系统适配为 websearch 模块的 MemoryProvider
type memorySearchAdapter struct {
	mm *memory.MemoryManager
}

func (a *memorySearchAdapter) Query(query string) (string, error) {
	req := memory.MemoryQueryRequest{
		CurrentMessage: query,
		Limit:          5,
		SearchMode:     "hybrid",
	}
	result, err := a.mm.Query(req)
	if err != nil {
		return "", err
	}
	if result == nil || len(result.Hits) == 0 {
		return "记忆库中未找到相关信息。", nil
	}
	return memory.FormatMemorySummary(result.Hits), nil
}

func (r *BuiltinToolRegistry) handleWebSearch(args map[string]interface{}, ctx *BuiltinToolContext) (string, error) {
	query, _ := args["query"].(string)
	if query == "" {
		return "", fmt.Errorf("web_search 需要提供 query 参数")
	}

	depth, _ := args["depth"].(string)
	if depth == "" {
		depth = config.AppConfig.WebSearch.DefaultDepth
	}
	if depth == "" {
		depth = "webpage"
	}

	// 智能兜底：用户消息中明确要求深度搜索时，自动切换为 depth 模式
	if depth != "depth" && depth != "research" && config.AppConfig.WebSearch.Research.Enabled {
		if detectDepthIntent(query) {
			depth = "depth"
			// 剥离深度意图词，避免污染搜索关键词
			query = stripSearchIntentWords(query)
			logger.Sugar.Infow("[内置工具] 自动检测到深度搜索意图，切换为 depth 模式",
				"query", query)
		}
	}

	cleanQuery := r.rewriteSearchQuery(query)
	logger.Sugar.Infow("[内置工具] web_search",
		"original_query", query,
		"rewritten_query", cleanQuery,
		"depth", depth)

	var mode websearch.SearchMode
	switch depth {
	// 新命名（推荐）
	case "simple", "shallow":
		mode = websearch.ModeSimple
	case "webpage", "deep":
		mode = websearch.ModeWebpage
	case "depth", "research":
		mode = websearch.ModeDepth
	default:
		mode = websearch.ModeWebpage
	}

	return r.webSearchSystem.Search(cleanQuery, mode)
}

// registerFetchURL 注册 fetch_url 工具，由规划器主动调用以获取链接内容
func (r *BuiltinToolRegistry) registerFetchURL() {
	r.tools["fetch_url"] = builtinToolEntry{
		Def: config.ToolDefData{
			Name:        "fetch_url",
			Description: "获取链接指向的内容并生成摘要。可用于查看网页、图片或下载链接。不是必须调用，由你自行判断是否需要。注意：下载链接只会标记为「下载文件」，不会自动下载（如需下载请使用 download_file）。",
			Parameters: []config.ToolParamData{
				{Name: "url", Type: "string", Description: "要获取内容的链接URL（从聊天消息中提取）", Required: true},
			},
			Visibility: "visible",
			ToolType:   "action",
		},
		Handler: r.handleFetchURL,
	}
}

func (r *BuiltinToolRegistry) handleFetchURL(args map[string]interface{}, ctx *BuiltinToolContext) (string, error) {
	url, _ := args["url"].(string)
	if url == "" {
		return "", fmt.Errorf("fetch_url 需要提供 url 参数")
	}

	if r.webSearchSystem == nil {
		return "", fmt.Errorf("websearch 子系统未初始化")
	}

	// 设置下载目标群组（供 download_file 使用）
	r.webSearchSystem.SetDownloadGroupID(ctx.GroupID)

	// 处理链接（不含自动下载）
	replacedQuery, linkDescs := r.webSearchSystem.ProcessLinks(url)
	ctx.ReplacedQuery = replacedQuery
	ctx.LinkDescriptions = linkDescs

	if len(linkDescs) == 0 {
		return "未能获取链接内容", nil
	}

	logger.Sugar.Infow("[内置工具] fetch_url 完成",
		"url", url,
		"desc_count", len(linkDescs))

	return strings.Join(linkDescs, "\n"), nil
}

// registerDownloadFile 注册 download_file 工具，由规划器在用户明确要求下载时调用
func (r *BuiltinToolRegistry) registerDownloadFile() {
	r.tools["download_file"] = builtinToolEntry{
		Def: config.ToolDefData{
			Name:        "download_file",
			Description: "下载文件并发送到群聊。可用于帮用户下载文件。不是必须调用，由你自行判断是否需要。下载是后台进行的，提交后即可回复用户，无需等待下载完成。",
			Parameters: []config.ToolParamData{
				{Name: "url", Type: "string", Description: "要下载的文件URL", Required: true},
			},
			Visibility: "visible",
			ToolType:   "action",
		},
		Handler: r.handleDownloadFile,
	}
}

func (r *BuiltinToolRegistry) handleDownloadFile(args map[string]interface{}, ctx *BuiltinToolContext) (string, error) {
	url, _ := args["url"].(string)
	if url == "" {
		return "", fmt.Errorf("download_file 需要提供 url 参数")
	}

	if r.downloadManager == nil {
		return "", fmt.Errorf("下载管理器未初始化，请检查配置")
	}

	logger.Sugar.Infow("[内置工具] download_file 异步开始",
		"url", url,
		"group_id", ctx.GroupID)

	// 异步下载：立即返回，后台 goroutine 执行下载和发送
	r.downloadManager.DownloadAndSendAsync(url, ctx.GroupID)

	return "已经开始下载了，下完直接发群里", nil
}

func (r *BuiltinToolRegistry) rewriteSearchQuery(rawQuery string) string {
	if r.searchLLMProvider == nil {
		return rawQuery
	}

	// 快速路径：已有空格分隔的复合查询，说明已经被优化过或本身质量高，直接返回
	if strings.Contains(rawQuery, " ") && len([]rune(rawQuery)) >= 6 {
		return rawQuery
	}

	// 纯中文短查询无空格，用 LLM 做关键词提取
	if !strings.Contains(rawQuery, " ") && len([]rune(rawQuery)) <= 8 {
		return rawQuery
	}

	prompt := fmt.Sprintf(`你是一个搜索查询优化器。从用户的对话消息中提取核心搜索关键词。

规则：
- 去掉称呼（如"瞳瞳""哥"）、语气词（"呢""吧""哈""呀"）、疑问词（"帮我查""有没有""怎么样"）
- 去掉搜索意图词（"查""搜索""深度""详细""看看""找找""搜搜"），这些不是搜索对象
- 提取核心名词和关键信息词，用空格分隔
- 保留专有名词的完整性（游戏名、人名、地名、作品名等必须保持原样）
- 对游戏、动漫、小说等领域的专有名词，不需要拆词，保持完整
  例如："原神的尘世七执政" → "原神 尘世七执政"
  例如："崩坏星穹铁道最新剧情" → "崩坏星穹铁道 最新剧情"
- 只输出关键词，不要任何解释

用户消息: %s

关键词:`, rawQuery)

	messages := []llm.ChatMessage{
		{Role: "user", Content: prompt},
	}

	response, err := r.searchLLMProvider.Chat(messages)
	if err != nil {
		logger.Sugar.Warnw("[搜索重写] LLM 调用失败，使用原始查询",
			"error", err, "query", rawQuery)
		return rawQuery
	}

	cleanQuery := strings.TrimSpace(response)
	if cleanQuery == "" || cleanQuery == rawQuery {
		return rawQuery
	}

	// 后处理：剥离 LLM 可能遗漏的搜索意图词（如 "深度查询"）
	cleanQuery = stripSearchIntentWords(cleanQuery)
	if cleanQuery == "" {
		return rawQuery
	}

	return cleanQuery
}

func (r *BuiltinToolRegistry) registerSearchMessages() {
	r.tools["search_messages"] = builtinToolEntry{
		Def: config.ToolDefData{
			Name:        "search_messages",
			Description: "搜索原始聊天记录（返回原消息原文，未经总结）。用于查找「刚才谁说了什么」「某句话的具体内容」等需要原文的场景。如需提炼后的知识/事实，请优先用 query_memory。",
			Parameters: []config.ToolParamData{
				{Name: "query", Type: "string", Description: "自然语言搜索查询，如「上周五关于斐波那契的讨论」、「月华说过什么关于编程的事」", Required: true},
				{Name: "limit", Type: "integer", Description: "返回结果数量，默认10，最大20", Required: false},
			},
			Visibility: "deferred",
			ToolType:   "action",
		},
		Handler: r.handleSearchMessages,
	}
}

func (r *BuiltinToolRegistry) handleSearchMessages(args map[string]interface{}, ctx *BuiltinToolContext) (string, error) {
	query, _ := args["query"].(string)
	if query == "" {
		return "", fmt.Errorf("search_messages 需要提供 query 参数")
	}

	limit := parseLimitArg(args, 10, 20)

	logger.Sugar.Infow("[内置工具] search_messages", "query", query, "limit", limit)

	var extractFn func(string) (string, error)
	if r.searchLLMProvider != nil {
		extractFn = func(nlQuery string) (string, error) {
			return r.extractFTSKeywords(nlQuery)
		}
	}

	return storage.SearchMessagesByNL(ctx.Platform, ctx.GroupID, query, limit, extractFn)
}

func (r *BuiltinToolRegistry) extractFTSKeywords(nlQuery string) (string, error) {
	prompt := fmt.Sprintf(`将以下自然语言查询转换为 FTS5 全文搜索关键词。
只提取核心搜索词，去掉疑问词、语气词、连接词等无关词汇。
输出空格分隔的关键词，不要输出任何其他内容。

自然语言查询: %s

关键词:`, nlQuery)

	messages := []llm.ChatMessage{
		{Role: "user", Content: prompt},
	}

	response, err := r.searchLLMProvider.Chat(messages)
	if err != nil {
		return "", fmt.Errorf("LLM关键词提取失败: %w", err)
	}

	keywords := strings.TrimSpace(response)
	if keywords == "" {
		return nlQuery, nil
	}

	return keywords, nil
}

// stripSearchIntentWords 剥离搜索意图词，避免污染搜索关键词
// 例如 "深度查一下钛宇·星光阁，要深度" → "钛宇·星光阁"
func stripSearchIntentWords(query string) string {
	// 要剔除的意图词模式（按长度降序，避免短词误匹配）
	// 只剥离明确的搜索意图词，不剥离普通词汇
	intentPatterns := []string{
		"深度搜索", "深度查询", "深度研究", "深度查",
		"常规搜索", "常规查", "简易搜索", "简易查",
		"搜索一下", "查一下", "搜一下", "找一下",
		"深度", "研究", "详细", "全面",
		"查查", "搜搜", "找找",
	}

	result := query
	for _, p := range intentPatterns {
		result = strings.ReplaceAll(result, p, "")
	}

	// 清理残留的标点和空格
	result = strings.TrimSpace(result)
	result = strings.Trim(result, "，。！？、,.!? ")
	// 清理连续的空白
	for strings.Contains(result, "  ") {
		result = strings.ReplaceAll(result, "  ", " ")
	}

	// 如果剥离后为空，返回原始查询
	if result == "" {
		return query
	}

	return result
}

// detectDepthIntent 检测用户消息中是否明确要求深度搜索
func detectDepthIntent(query string) bool {
	depthKeywords := []string{
		"深度", "研究", "深入", "详细", "全面",
		"仔细查", "好好查", "认真查", "彻底查",
		"多查", "多找", "多搜",
		"查清楚", "查明白", "查仔细",
		"deep", "research", "thorough",
	}
	lower := strings.ToLower(query)
	for _, kw := range depthKeywords {
		if strings.Contains(lower, kw) {
			return true
		}
	}
	return false
}
