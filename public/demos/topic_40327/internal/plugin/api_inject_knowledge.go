package plugin

import (
	"fmt"

	"github.com/dop251/goja"

	"YaraFlow/internal/knowledge"
	"YaraFlow/internal/logger"
)

// ─── KnowledgeInjector ───
// 为插件提供知识库/备忘录搜索能力

type KnowledgeInjector struct {
	ctx *InjectorContext
}

func NewKnowledgeInjector(ctx *InjectorContext) *KnowledgeInjector {
	return &KnowledgeInjector{ctx: ctx}
}

func (ki *KnowledgeInjector) APIName() string { return "knowledge" }

func (ki *KnowledgeInjector) Inject() error {
	if !ki.ctx.manifest.HasPermission("knowledge.search") {
		return nil
	}

	knowledgeAPI := map[string]interface{}{
		"search": ki.createSearch(),
	}

	ki.ctx.mergeIntoYara("knowledge", knowledgeAPI)
	return nil
}

// search 搜索知识库/备忘录
// JS: yara.knowledge.search({ query: "xxx", limit: 5 })
func (ki *KnowledgeInjector) createSearch() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		vm := ki.ctx.sandbox.Runtime()
		if vm == nil {
			return goja.Null()
		}

		query := ""
		limit := 5

		if len(call.Arguments) >= 1 {
			if opts, ok := call.Arguments[0].Export().(map[string]interface{}); ok {
				if q, exists := opts["query"]; exists {
					query = fmt.Sprintf("%v", q)
				}
				if l, exists := opts["limit"]; exists {
					switch v := l.(type) {
					case float64:
						limit = int(v)
					case int64:
						limit = int(v)
					}
				}
			}
		}

		if query == "" {
			return vm.ToValue(map[string]interface{}{
				"entries": []interface{}{},
				"total":   0,
			})
		}

		if knowledge.DefaultManager == nil {
			logger.Sugar.Warnw("[Plugin] knowledge manager not initialized", "id", ki.ctx.pluginID)
			return vm.ToValue(map[string]interface{}{
				"entries": []interface{}{},
				"total":   0,
			})
		}

		// 优先使用语义搜索，回退到关键词搜索
		entries, err := knowledge.DefaultManager.SearchSemantic(query, limit)
		if err != nil {
			logger.Sugar.Warnw("[Plugin] knowledge search failed", "id", ki.ctx.pluginID, "error", err)
			return vm.ToValue(map[string]interface{}{
				"entries": []interface{}{},
				"total":   0,
			})
		}

		result := make([]interface{}, 0, len(entries))
		for _, entry := range entries {
			if entry == nil {
				continue
			}
			result = append(result, map[string]interface{}{
				"id":        entry.ID,
				"content":   entry.Content,
				"tags":      entry.Tags,
				"source":    entry.Source,
				"createdAt": entry.CreatedAt,
				"updatedAt": entry.UpdatedAt,
			})
		}

		return vm.ToValue(map[string]interface{}{
			"entries": result,
			"total":   len(result),
		})
	}
}
