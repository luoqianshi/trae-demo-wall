package tool

import (
	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/memory"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
)

type PluginToolExecutor interface {
	ExecuteTool(pluginID string, toolName string, params map[string]any) (any, error)
	FindPluginByToolName(toolName string) (string, error)
	SearchTools(query string) []config.ToolDefData
	ExecuteAction(pluginID string, actionName string, params map[string]any) (any, error)
	FindPluginByActionName(actionName string) (string, error)
}

type ToolExecutor struct {
	config                 *config.Config
	visionProvider         llm.VisionProvider
	toolLLMProvider        llm.LLMProvider
	pluginExecutor         PluginToolExecutor
	toolDefinitions        []config.ToolDefData
	builtinTools           *BuiltinToolRegistry
	builtinToolCtx         *BuiltinToolContext
	lastVisionDescriptions []string
	visionDone             bool
}

func NewToolExecutor(cfg *config.Config, vision llm.VisionProvider) *ToolExecutor {
	return &ToolExecutor{
		config:         cfg,
		visionProvider: vision,
	}
}

func (te *ToolExecutor) SetPluginExecutor(executor PluginToolExecutor) {
	te.pluginExecutor = executor
}

func (te *ToolExecutor) SetToolLLMProvider(provider llm.LLMProvider) {
	te.toolLLMProvider = provider
}

func (te *ToolExecutor) SetToolDefinitions(tools []config.ToolDefData) {
	te.toolDefinitions = tools
}

func (te *ToolExecutor) SetBuiltinTools(registry *BuiltinToolRegistry) {
	te.builtinTools = registry
}

// GetBuiltinTools 返回内置工具注册表，供外部设置回调
func (te *ToolExecutor) GetBuiltinTools() *BuiltinToolRegistry {
	return te.builtinTools
}

func (te *ToolExecutor) SetBuiltinToolStores(gs *memory.GraphStore, ps *memory.PersonProfileStore) {
	if te.builtinTools != nil {
		te.builtinTools.SetGraphStore(gs)
		te.builtinTools.SetProfileStore(ps)
	}
}
func (te *ToolExecutor) SetBuiltinToolContext(ctx *BuiltinToolContext) {
	te.builtinToolCtx = ctx
}

// GetBuiltinToolContext 获取当前工具上下文
func (te *ToolExecutor) GetBuiltinToolContext() *BuiltinToolContext {
	return te.builtinToolCtx
}

// SetToolCtxReasoning 更新当前工具上下文的推理文本，供工具执行时参考决策
func (te *ToolExecutor) SetToolCtxReasoning(reasoning string) {
	if te.builtinToolCtx != nil {
		te.builtinToolCtx.Reasoning = reasoning
	}
}

// ExecuteToolsWithName 用指定工具名直接执行（深思模式自动调用）
func (te *ToolExecutor) ExecuteToolsWithName(decision *types.DecisionResult, processedMsg *platform.ProcessedMessage, toolName string, toolArgs map[string]any) ([]types.ToolResult, error) {
	return te.executeToolsInternal(decision, processedMsg, toolName, toolArgs)
}

// executeToolsInternal 统一的工具执行入口，查找优先级：插件工具 → 内置工具
func (te *ToolExecutor) executeToolsInternal(decision *types.DecisionResult, _ *platform.ProcessedMessage, forceToolName string, forceToolArgs map[string]any) ([]types.ToolResult, error) {
	var results []types.ToolResult

	toolName := forceToolName
	toolArgs := forceToolArgs
	if toolName != "" && toolArgs != nil {
		// 已指定工具名和参数，直接执行
		logger.Sugar.Infow("直接执行工具", "tool", toolName)

		// 先尝试插件工具
		if te.pluginExecutor != nil {
			pluginResults, err := te.executePluginToolByName(toolName, toolArgs)
			if err == nil {
				results = append(results, pluginResults...)
			} else {
				// 插件未找到该工具，尝试内置工具
				if te.builtinTools != nil && te.builtinTools.HasTool(toolName) {
					logger.Sugar.Infow("插件未找到工具，回退到内置工具", "tool", toolName)
					builtinResults, bErr := te.executeBuiltinToolByName(decision, toolName, toolArgs)
					if bErr != nil {
						logger.Sugar.Warnw("内置工具执行失败", "error", bErr, "tool", toolName)
						results = append(results, types.ToolResult{
							Success:  false,
							ToolName: toolName,
							Error:    bErr.Error(),
						})
					} else {
						results = append(results, builtinResults...)
					}
				} else {
					logger.Sugar.Warnw("工具执行失败", "error", err, "tool", toolName)
					results = append(results, types.ToolResult{
						Success:  false,
						ToolName: toolName,
						Error:    err.Error(),
					})
				}
			}
		} else if te.builtinTools != nil {
			builtinResults, err := te.executeBuiltinToolByName(decision, toolName, toolArgs)
			if err != nil {
				logger.Sugar.Warnw("内置工具执行失败", "error", err, "tool", toolName)
				results = append(results, types.ToolResult{
					Success:  false,
					ToolName: toolName,
					Error:    err.Error(),
				})
			} else {
				results = append(results, builtinResults...)
			}
		}
	}

	if len(results) > 0 {
		logger.Sugar.Infow("工具执行完成", "count", len(results))
	}
	return results, nil
}