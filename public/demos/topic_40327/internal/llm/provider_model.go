package llm

import (
	"fmt"
	"math/rand"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/logger"
)

// ── 模型选择 ──

func GetProviderConfig() ProviderConfig {
	return ProviderConfig{
		BaseURL:       GlobalLLMConfig.Cloud.CloudModelURL,
		APIKey:        GlobalLLMConfig.Cloud.CloudModelKey,
		Model:         GlobalLLMConfig.Cloud.MultimodalModelName,
		Temperature:   0.7,
		Timeout:       30,
		MaxRetries:    3,
		VisionModel:   GlobalLLMConfig.Cloud.MultimodalModelName,
		VisionBaseURL: GlobalLLMConfig.Cloud.CloudModelURL,
		VisionAPIKey:  GlobalLLMConfig.Cloud.CloudModelKey,
	}
}

func GetModelConfig(taskType string) (*ModelConfig, *APIProvider, error) {
	var taskConfig TaskConfig
	switch taskType {
	case "replyer":
		taskConfig = GlobalLLMConfig.YaraFlow.ModelTaskConfig.Replyer
	case "planner":
		taskConfig = GlobalLLMConfig.YaraFlow.ModelTaskConfig.Planner
	case "tool_use":
		taskConfig = GlobalLLMConfig.YaraFlow.ModelTaskConfig.ToolUse
	case "vlm":
		taskConfig = GlobalLLMConfig.YaraFlow.ModelTaskConfig.VLM
	case "voice":
		taskConfig = GlobalLLMConfig.YaraFlow.ModelTaskConfig.Voice
	case "embedding":
		taskConfig = GlobalLLMConfig.YaraFlow.ModelTaskConfig.Embedding
	default:
		taskConfig = GlobalLLMConfig.YaraFlow.ModelTaskConfig.Replyer
	}

	if len(taskConfig.ModelList) == 0 {
		return nil, nil, fmt.Errorf("no models configured for task type: %s", taskType)
	}

	modelName := selectModel(taskConfig.ModelList, taskConfig.SelectionStrategy)

	modelEntry, exists := GlobalLLMConfig.YaraFlow.Models[modelName]
	if !exists {
		return nil, nil, fmt.Errorf("model not found in models map: %s (task=%s)", modelName, taskType)
	}

	modelConfig := parseModelConfig(modelEntry, &taskConfig)

	provider := findProviderByName(GlobalLLMConfig.YaraFlow.APIProviders, modelConfig.APIProvider)
	if provider == nil {
		return nil, nil, fmt.Errorf("api provider not found: %s (model=%s, task=%s)", modelConfig.APIProvider, modelName, taskType)
	}

	logger.Sugar.Debugw("[模型选择]", "task", taskType, "strategy", taskConfig.SelectionStrategy, "model", modelName, "identifier", modelConfig.ModelIdentifier, "provider", provider.Name)

	recordLastModelSelection(taskType, modelName, modelConfig.ModelIdentifier, provider.Name)

	return modelConfig, provider, nil
}

// ── 模型使用统计 ──

var (
	modelUsageMu     sync.Mutex
	modelUsageCounts = make(map[string]int64)
)

func recordModelUsage(modelName string) {
	modelUsageMu.Lock()
	modelUsageCounts[modelName]++
	modelUsageMu.Unlock()
}

// LastModelSelection 记录最近一次模型选择信息，供前端展示
type LastModelSelection struct {
	TaskType   string `json:"task_type"`
	ModelName  string `json:"model_name"`
	Identifier string `json:"identifier"`
	Provider   string `json:"provider"`
	Time       int64  `json:"time"`
}

var (
	lastSelectionMu sync.Mutex
	lastSelections  = make(map[string]*LastModelSelection)
)

func recordLastModelSelection(taskType, modelName, identifier, provider string) {
	lastSelectionMu.Lock()
	lastSelections[taskType] = &LastModelSelection{
		TaskType:   taskType,
		ModelName:  modelName,
		Identifier: identifier,
		Provider:   provider,
		Time:       time.Now().Unix(),
	}
	lastSelectionMu.Unlock()
}

// GetLastModelSelections 返回所有任务类型的最近一次模型选择
func GetLastModelSelections() map[string]*LastModelSelection {
	lastSelectionMu.Lock()
	defer lastSelectionMu.Unlock()
	result := make(map[string]*LastModelSelection, len(lastSelections))
	for k, v := range lastSelections {
		result[k] = v
	}
	return result
}

// ── 模型选择策略 ──

func selectModel(modelList []string, strategy string) string {
	if len(modelList) == 0 {
		return ""
	}
	if len(modelList) == 1 {
		recordModelUsage(modelList[0])
		return modelList[0]
	}

	switch strings.ToLower(strings.TrimSpace(strategy)) {
	case "random":
		modelName := modelList[rand.Intn(len(modelList))]
		recordModelUsage(modelName)
		return modelName
	case "balance":
		modelName := selectLeastUsedModel(modelList)
		recordModelUsage(modelName)
		return modelName
	default:
		modelName := modelList[0]
		recordModelUsage(modelName)
		return modelName
	}
}

func selectLeastUsedModel(modelList []string) string {
	modelUsageMu.Lock()
	defer modelUsageMu.Unlock()

	var leastModel string
	var leastCount int64 = -1

	for _, model := range modelList {
		count := modelUsageCounts[model]
		if leastCount == -1 || count < leastCount {
			leastCount = count
			leastModel = model
		}
	}

	if leastModel == "" {
		leastModel = modelList[0]
	}

	return leastModel
}

// ── 模型配置解析 ──

func parseModelConfig(entry interface{}, taskConfig *TaskConfig) *ModelConfig {
	entryMap, ok := entry.(map[string]interface{})
	if !ok {
		return &ModelConfig{}
	}

	config := &ModelConfig{}

	if v, ok := entryMap["model_identifier"].(string); ok {
		config.ModelIdentifier = v
	}
	if v, ok := entryMap["name"].(string); ok {
		config.Name = v
	}
	if v, ok := entryMap["api_provider"].(string); ok {
		config.APIProvider = v
	}
	if v, ok := entryMap["price_in"].(float64); ok {
		config.PriceIn = v
	}
	if v, ok := entryMap["price_out"].(float64); ok {
		config.PriceOut = v
	}
	if v, ok := entryMap["force_stream_mode"].(bool); ok {
		config.ForceStreamMode = v
	}
	if v, ok := entryMap["temperature"].(float64); ok {
		t := float32(v)
		config.Temperature = &t
	}
	if v, ok := entryMap["max_tokens"].(float64); ok {
		n := int(v)
		config.MaxTokens = &n
	}
	if v, ok := entryMap["extra_params"].(map[string]interface{}); ok {
		config.ExtraParams = v
	}

	if config.Temperature == nil {
		t := taskConfig.Temperature
		config.Temperature = &t
	}
	if config.MaxTokens == nil && taskConfig.MaxTokens > 0 {
		n := taskConfig.MaxTokens
		config.MaxTokens = &n
	}

	return config
}

func findProviderByName(providers []APIProvider, name string) *APIProvider {
	if name == "" {
		return nil
	}
	for i := range providers {
		if providers[i].Name == name {
			return &providers[i]
		}
	}
	return nil
}
