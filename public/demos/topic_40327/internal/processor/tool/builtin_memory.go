package tool

import (
	"fmt"
	"strings"

	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/memory"
)

func (r *BuiltinToolRegistry) registerQueryMemory() {
	r.tools["query_memory"] = builtinToolEntry{
		Def: config.ToolDefData{
			Name:        "query_memory",
			Description: "【首选】检索AI总结过的长期记忆，返回的是提炼后的知识点和对话摘要，不是原始聊天记录。用于「X是谁」「之前讨论过什么」「我对某事的看法」这类需要记住的事实。scope=group(默认)仅搜本群，scope=global搜所有群。",
			Parameters: []config.ToolParamData{
				{Name: "query", Type: "string", Description: "要检索的关键词或问题", Required: true},
				{Name: "scope", Type: "string", Description: "检索范围：group(本群记忆，默认)/global(全局记忆，需开启全局记忆开关)", Required: false},
				{Name: "limit", Type: "integer", Description: "返回条数，默认5条，最大20条", Required: false},
				{Name: "mode", Type: "string", Description: "检索模式：hybrid(混合语义+关键词)/semantic(纯语义)/keyword(纯关键词)，默认hybrid", Required: false},
			},
			Visibility: "deferred",
			ToolType:   "action",
		},
		Handler: r.handleQueryMemory,
	}
}

func (r *BuiltinToolRegistry) handleQueryMemory(args map[string]interface{}, ctx *BuiltinToolContext) (string, error) {
	query, _ := args["query"].(string)
	if query == "" {
		return "", fmt.Errorf("query_memory 需要提供 query 参数")
	}

	limit := parseLimitArg(args, 5, 20)

	mode := "hybrid"
	if raw, ok := args["mode"].(string); ok && raw != "" {
		mode = raw
	}
	allowedModes := map[string]bool{"hybrid": true, "semantic": true, "keyword": true}
	if !allowedModes[mode] {
		mode = "hybrid"
	}

	scope := "group"
	if raw, ok := args["scope"].(string); ok && raw != "" {
		scope = raw
	}
	if scope != "group" && scope != "global" {
		scope = "group"
	}

	if scope == "global" && !config.AppConfig.Memory.GlobalMemory.Enabled {
		return "", fmt.Errorf("全局记忆开关未开启，当前仅支持 scope=group 的本群记忆检索")
	}

	groupID := ""
	if ctx != nil {
		groupID = ctx.GroupID
	}

	req := memory.MemoryQueryRequest{
		CurrentMessage: query,
		GroupID:        groupID,
		Limit:          limit,
		SearchMode:     mode,
	}

	var result *memory.MemoryQueryResult
	var err error

	if scope == "global" {
		logger.Sugar.Infow("[内置工具] query_memory",
			"query", query, "scope", "global", "mode", mode, "limit", limit)
		result, err = r.memoryManager.QueryGlobal(req)
	} else {
		logger.Sugar.Infow("[内置工具] query_memory",
			"query", query, "scope", "group", "groupID", groupID, "mode", mode, "limit", limit)
		result, err = r.memoryManager.Query(req)
	}

	if err != nil {
		return "", fmt.Errorf("记忆检索失败: %w", err)
	}

	if result == nil || len(result.Hits) == 0 {
		return "未找到匹配的记忆。", nil
	}

	return formatMemoryToolResult(result.Hits), nil
}

func formatMemoryToolResult(hits []memory.MemoryHit) string {
	if len(hits) == 0 {
		return "未找到匹配的记忆。"
	}
	return fmt.Sprintf("找到 %d 条相关记忆：\n%s", len(hits), memory.FormatMemorySummary(hits))
}

func (r *BuiltinToolRegistry) registerQueryGraph() {
	r.tools["query_graph"] = builtinToolEntry{
		Def: config.ToolDefData{
			Name:        "query_graph",
			Description: "查询知识图谱中的实体信息。用于查找关于某个实体（人、地点、事物等）的已知关系和信息。",
			Parameters: []config.ToolParamData{
				{Name: "entity", Type: "string", Description: "要查询的实体名称", Required: true},
			},
			Visibility: "deferred",
			ToolType:   "action",
		},
		Handler: r.handleQueryGraph,
	}
}

func (r *BuiltinToolRegistry) handleQueryGraph(args map[string]interface{}, ctx *BuiltinToolContext) (string, error) {
	entity, _ := args["entity"].(string)
	if entity == "" {
		return "", fmt.Errorf("query_graph 需要提供 entity 参数")
	}

	if r.graphStore == nil {
		return "", fmt.Errorf("图谱存储未初始化")
	}

	logger.Sugar.Infow("[内置工具] query_graph", "entity", entity)

	card := r.graphStore.FormatEntityCard(entity)
	if card == "" {
		entities, _ := r.graphStore.SearchEntities(entity, 5)
		if len(entities) > 0 {
			var builder strings.Builder
			builder.WriteString(fmt.Sprintf("未找到精确匹配的实体 \"%s\"，但找到以下相似实体：\n", entity))
			for i, e := range entities {
				builder.WriteString(fmt.Sprintf("%d. %s (%s)\n", i+1, e.Name, e.Type))
			}
			return builder.String(), nil
		}
		return fmt.Sprintf("未找到实体 \"%s\" 的相关信息。", entity), nil
	}

	return card, nil
}

func (r *BuiltinToolRegistry) registerQueryProfile() {
	r.tools["query_profile"] = builtinToolEntry{
		Def: config.ToolDefData{
			Name:        "query_profile",
			Description: "查询用户的人物画像。用于了解对话对象的身份、偏好、关系等信息。",
			Parameters: []config.ToolParamData{
				{Name: "name", Type: "string", Description: "用户名称或ID", Required: true},
			},
			Visibility: "deferred",
			ToolType:   "action",
		},
		Handler: r.handleQueryProfile,
	}
}

func (r *BuiltinToolRegistry) handleQueryProfile(args map[string]interface{}, ctx *BuiltinToolContext) (string, error) {
	name, _ := args["name"].(string)
	if name == "" {
		return "", fmt.Errorf("query_profile 需要提供 name 参数")
	}

	if r.profileStore == nil {
		return "", fmt.Errorf("画像存储未初始化")
	}

	logger.Sugar.Infow("[内置工具] query_profile", "name", name)

	profile, err := r.profileStore.FindProfileByName(name)
	if err != nil {
		return "", fmt.Errorf("查询画像失败: %w", err)
	}

	if profile == nil {
		return fmt.Sprintf("未找到用户 \"%s\" 的人物画像。", name), nil
	}

	return r.profileStore.FormatProfileText(profile), nil
}