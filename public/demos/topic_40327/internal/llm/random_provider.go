package llm

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/logger"
)

type RandomModelProvider struct {
	taskType  string
	mu        sync.Mutex
	providers map[string]LLMProvider
}

func NewRandomModelProvider(taskType string) *RandomModelProvider {
	return &RandomModelProvider{
		taskType:  taskType,
		providers: make(map[string]LLMProvider),
	}
}

func (p *RandomModelProvider) Chat(messages []ChatMessage) (string, error) {
	resp, err := p.ChatEx(messages)
	if err != nil {
		return "", err
	}
	return resp.Content, nil
}

// ChatEx 返回包含 Token 用量和速度指标的完整响应
// 失败时自动尝试模型列表中的下一个模型，直到成功或全部失败
func (p *RandomModelProvider) ChatEx(messages []ChatMessage) (*ChatResponse, error) {
	modelList, taskCfg, err := getTaskModelList(p.taskType)
	if err != nil {
		return nil, err
	}
	if len(modelList) == 0 {
		return nil, fmt.Errorf("task %s 没有配置任何模型", p.taskType)
	}

	shuffled := make([]string, len(modelList))
	copy(shuffled, modelList)
	shuffleStrings(shuffled)

	var lastErr error
	for _, modelName := range shuffled {
		modelCfg, apiProvider := getModelByName(modelName, taskCfg)
		if apiProvider == nil {
			lastErr = fmt.Errorf("模型 %s 的 API 提供商未找到 (task=%s)", modelName, p.taskType)
			logger.Sugar.Warnw("[LLM] 模型配置缺失，跳过", "model", modelName, "task", p.taskType)
			continue
		}

		provider := p.getOrCreateProvider(modelCfg, apiProvider)
		response, err := provider.ChatEx(messages)
		if err != nil {
			logger.Sugar.Warnw("[LLM] 模型调用失败，尝试下一个", "model", modelName, "task", p.taskType, "error", err)
			lastErr = err
			continue
		}

		recordModelUsage(modelName)
		logger.Sugar.Infow("[LLM] 模型调用成功",
			"model", modelName,
			"task", p.taskType,
			"tokens_per_second", fmt.Sprintf("%.1f", response.TokensPerSecond),
			"latency_ms", response.LatencyMs)
		return response, nil
	}

	return nil, fmt.Errorf("task %s 所有 %d 个模型均调用失败: %w", p.taskType, len(shuffled), lastErr)
}

// ChatWithTools 实现 ToolCallingProvider，委托给底层 OpenAIProvider
func (p *RandomModelProvider) ChatWithTools(messages []ChatMessage, tools []ToolDefinition) (*ToolCallResponse, error) {
	modelList, taskCfg, err := getTaskModelList(p.taskType)
	if err != nil {
		return nil, err
	}
	if len(modelList) == 0 {
		return nil, fmt.Errorf("task %s 没有配置任何模型", p.taskType)
	}

	shuffled := make([]string, len(modelList))
	copy(shuffled, modelList)
	shuffleStrings(shuffled)
	modelName := shuffled[0]

	modelCfg, apiProvider := getModelByName(modelName, taskCfg)
	if apiProvider == nil {
		return nil, fmt.Errorf("模型 %s 的 API 提供商未找到 (task=%s)", modelName, p.taskType)
	}

	provider := p.getOrCreateProvider(modelCfg, apiProvider)
	toolProvider, ok := provider.(ToolCallingProvider)
	if !ok {
		return nil, fmt.Errorf("模型 %s 的 Provider 不支持原生 Function Calling", modelName)
	}

	response, err := toolProvider.ChatWithTools(messages, tools)
	if err != nil {
		logger.Sugar.Errorw("[LLM] ChatWithTools 调用失败", "model", modelName, "task", p.taskType, "error", err)
		return nil, fmt.Errorf("ChatWithTools 失败 (task=%s): %w", p.taskType, err)
	}

	recordModelUsage(modelName)
	logger.Sugar.Infow("[LLM] ChatWithTools 调用成功", "model", modelName, "task", p.taskType)
	return response, nil
}

func (p *RandomModelProvider) getOrCreateProvider(modelCfg *ModelConfig, apiProvider *APIProvider) LLMProvider {
	key := apiProvider.Name + ":" + modelCfg.ModelIdentifier

	p.mu.Lock()
	defer p.mu.Unlock()

	provider, ok := p.providers[key]
	if ok {
		return provider
	}

	temperature := float32(0.7)
	if modelCfg.Temperature != nil {
		temperature = *modelCfg.Temperature
	}

	providerCfg := ProviderConfig{
		BaseURL:       apiProvider.BaseURL,
		APIKey:        apiProvider.APIKey,
		Model:         modelCfg.ModelIdentifier,
		ModelName:     modelCfg.Name,
		ProviderName:  apiProvider.Name,
		TaskType:      p.taskType,
		Temperature:   temperature,
		Timeout:       apiProvider.Timeout,
		MaxRetries:    apiProvider.MaxRetry,
		RetryInterval: apiProvider.RetryInterval,
	}

	switch strings.ToLower(apiProvider.ClientType) {
	case "anthropic":
		provider = NewAnthropicProvider(providerCfg)
	default:
		provider = NewOpenAIProvider(providerCfg)
	}

	p.providers[key] = provider
	return provider
}

// getTaskModelList 获取指定任务的完整模型列表和任务配置
// 返回: 模型名称列表、任务配置、错误
func getTaskModelList(taskType string) ([]string, *TaskConfig, error) {
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
		return nil, nil, fmt.Errorf("task %s 没有配置模型列表", taskType)
	}

	return taskConfig.ModelList, &taskConfig, nil
}

// getModelByName 根据模型名称查找模型配置和 API 提供商
func getModelByName(modelName string, taskCfg *TaskConfig) (*ModelConfig, *APIProvider) {
	modelEntry, exists := GlobalLLMConfig.YaraFlow.Models[modelName]
	if !exists {
		return nil, nil
	}

	modelCfg := parseModelConfig(modelEntry, taskCfg)
	provider := findProviderByName(GlobalLLMConfig.YaraFlow.APIProviders, modelCfg.APIProvider)
	return modelCfg, provider
}

// shuffleStrings 随机打乱字符串切片顺序
func shuffleStrings(s []string) {
	// Fisher-Yates shuffle
	for i := len(s) - 1; i > 0; i-- {
		j := int(fastRandInt(int64(i + 1)))
		s[i], s[j] = s[j], s[i]
	}
}

// fastRandInt 快速伪随机数 (0 <= n < max)
func fastRandInt(max int64) int64 {
	// 使用纳秒时间戳作为随机种子
	return time.Now().UnixNano() % max
}

type RandomVisionProvider struct {
	taskType  string
	mu        sync.Mutex
	providers map[string]VisionProvider
}

func NewRandomVisionProvider(taskType string) *RandomVisionProvider {
	return &RandomVisionProvider{
		taskType:  taskType,
		providers: make(map[string]VisionProvider),
	}
}

func (p *RandomVisionProvider) getProvider() (VisionProvider, error) {
	modelConfig, apiProvider, err := GetModelConfig(p.taskType)
	if err != nil {
		return nil, err
	}

	key := apiProvider.Name + ":" + modelConfig.ModelIdentifier

	p.mu.Lock()
	defer p.mu.Unlock()

	provider, ok := p.providers[key]
	if ok {
		return provider, nil
	}

	provider = NewOpenAIVisionProvider(VisionConfig{
		BaseURL:    apiProvider.BaseURL,
		APIKey:     apiProvider.APIKey,
		Model:      modelConfig.ModelIdentifier,
		Timeout:    apiProvider.Timeout,
		MaxRetries: apiProvider.MaxRetry,
	})
	p.providers[key] = provider
	return provider, nil
}

func (p *RandomVisionProvider) AnalyzeImage(imageURL string, visionRules string) (string, error) {
	provider, err := p.getProvider()
	if err != nil {
		return "", err
	}
	return provider.AnalyzeImage(imageURL, visionRules)
}

func (p *RandomVisionProvider) DescribeImage(imageData []byte, prompt string) (string, error) {
	provider, err := p.getProvider()
	if err != nil {
		return "", err
	}
	return provider.DescribeImage(imageData, prompt)
}
