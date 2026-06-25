package llm

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"YaraFlow/internal/logger"
)

// ── 配置结构体 ──

type LLMConfig struct {
	Cloud     CloudConfig     `json:"cloud"`
	QQAdapter QQAdapterConfig `json:"qq_adapter"`
	YaraFlow  YaraFlowConfig  `json:"yara_flow"`
}

type CloudConfig struct {
	CloudModelURL       string `json:"cloud_model_url"`
	CloudModelKey       string `json:"cloud_model_key"`
	MultimodalModelName string `json:"multimodal_model_name"`
	EmbeddingModelName  string `json:"embedding_model_name"`
}

type QQAdapterConfig struct {
	NapcatWsServer  string        `json:"napcat_ws_server"`
	NapcatWsToken   string        `json:"napcat_ws_token"`
	LunarCoreURL    string        `json:"lunar_core_url"`
	LunarWsServer   string        `json:"lunar_ws_server"`
	ListenGroupIDs  []interface{} `json:"listen_group_ids"`
	PollInterval    int           `json:"poll_interval"`
	TriggerKeywords []string      `json:"trigger_keywords"`
	DisplayLogs     bool          `json:"display_logs"`
	DefaultReply    string        `json:"default_reply"`
	YutongMode      bool          `json:"yutong_mode"`
}

type YaraFlowConfig struct {
	APIProviders    []APIProvider          `json:"api_providers"`
	Models          map[string]interface{} `json:"models"`
	ModelTaskConfig ModelTaskConfig        `json:"model_task_config"`
}

type APIProvider struct {
	Name          string `json:"name"`
	BaseURL       string `json:"base_url"`
	APIKey        string `json:"api_key"`
	ClientType    string `json:"client_type"`
	MaxRetry      int    `json:"max_retry"`
	Timeout       int    `json:"timeout"`
	RetryInterval int    `json:"retry_interval"`
}

type ModelConfig struct {
	ModelIdentifier string                 `json:"model_identifier"`
	Name            string                 `json:"name"`
	APIProvider     string                 `json:"api_provider"`
	PriceIn         float64                `json:"price_in"`
	PriceOut        float64                `json:"price_out"`
	ForceStreamMode bool                   `json:"force_stream_mode"`
	Temperature     *float32               `json:"temperature"`
	MaxTokens       *int                   `json:"max_tokens"`
	ExtraParams     map[string]interface{} `json:"extra_params"`
}

type ModelTaskConfig struct {
	Replyer   TaskConfig `json:"replyer"`
	Planner   TaskConfig `json:"planner"`
	ToolUse   TaskConfig `json:"tool_use"`
	VLM       TaskConfig `json:"vlm"`
	Voice     TaskConfig `json:"voice"`
	Embedding TaskConfig `json:"embedding"`
}

type TaskConfig struct {
	ModelList         []string `json:"model_list"`
	Temperature       float32  `json:"temperature"`
	MaxTokens         int      `json:"max_tokens"`
	SlowThreshold     float64  `json:"slow_threshold"`
	SelectionStrategy string   `json:"selection_strategy"`
}

type ProviderConfig struct {
	BaseURL       string
	APIKey        string
	Model         string
	ModelName     string // 用于统计的模型名称
	ProviderName  string // 用于统计的提供商名称
	TaskType      string
	Temperature   float32
	Timeout       int
	MaxRetries    int
	RetryInterval int
	VisionModel   string
	VisionBaseURL string
	VisionAPIKey  string
}

var GlobalLLMConfig LLMConfig

// ── 配置加载与合并 ──

func LoadConfig() error {
	configPath := filepath.Join("configs", "lunar_config.json")

	if !filepath.IsAbs(configPath) {
		workDir, err := os.Getwd()
		if err == nil {
			configPath = filepath.Join(workDir, "configs", "lunar_config.json")
		}
	}

	templatePath := filepath.Join("configs", "yara_config_template.json")
	if !filepath.IsAbs(templatePath) {
		workDir, err := os.Getwd()
		if err == nil {
			templatePath = filepath.Join(workDir, "configs", "yara_config_template.json")
		}
	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		fmt.Printf("[LLM配置检查] 配置文件不存在: %s\n", configPath)
		fmt.Printf("[LLM配置生成] 正在根据模板生成配置文件...\n")

		if err := copyTemplateConfig(configPath, templatePath); err != nil {
			fmt.Printf("[LLM配置生成] 模板文件不存在，使用默认配置生成...\n")
			if err := createDefaultConfig(configPath); err != nil {
				return err
			}
		} else {
			fmt.Printf("[LLM配置生成] 已从模板复制配置文件: %s\n", configPath)
		}
	} else {
		fmt.Printf("[LLM配置检查] 配置文件存在: %s\n", configPath)

		if err := checkAndUpdateLLMConfig(configPath, templatePath); err != nil {
			fmt.Printf("[LLM配置检查] 配置对比更新失败: %v\n", err)
		} else {
			fmt.Printf("[LLM配置检查] 配置文件已与模板同步\n")
		}
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(data, &GlobalLLMConfig); err != nil {
		return err
	}

	logger.Info("LLM Config loaded successfully")
	return nil
}

func checkAndUpdateLLMConfig(configPath, templatePath string) error {
	templateData, err := os.ReadFile(templatePath)
	if err != nil {
		return fmt.Errorf("failed to read template: %w", err)
	}

	var templateMap map[string]interface{}
	if err := json.Unmarshal(templateData, &templateMap); err != nil {
		return fmt.Errorf("failed to unmarshal template: %w", err)
	}

	configData, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("failed to read config: %w", err)
	}

	var configMap map[string]interface{}
	if err := json.Unmarshal(configData, &configMap); err != nil {
		return fmt.Errorf("failed to unmarshal config: %w", err)
	}

	updated := mergeConfigMaps(configMap, templateMap, "")

	// 清理旧版本模板合并留下的空壳模型（model_1~model_5 等）
	// 这些条目所有字段都是 null/零值，在 UI 中不可见但会污染配置文件
	if yaraFlow, ok := configMap["yara_flow"].(map[string]interface{}); ok {
		if models, ok := yaraFlow["models"].(map[string]interface{}); ok {
			cleaned := false
			for key, entry := range models {
				if isEmptyShell(entry) {
					delete(models, key)
					cleaned = true
					fmt.Printf("[LLM配置清理] 移除空壳模型: %s\n", key)
				}
			}
			if cleaned {
				updated = true
			}
		}
	}

	if updated {
		outputData, err := json.MarshalIndent(configMap, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal updated config: %w", err)
		}

		if err := os.WriteFile(configPath, outputData, 0644); err != nil {
			return fmt.Errorf("failed to write updated config: %w", err)
		}

		fmt.Printf("[LLM配置更新] 配置文件已补充缺失栏目\n")
	}

	return nil
}

// isEmptyShell 判断一个 map 值是否为"空壳"——所有基本类型字段都是 null/零值/空值。
// 模板中的占位模型（model_1~model_5）所有字段都是 null，不应合并到用户配置中。
func isEmptyShell(v interface{}) bool {
	m, ok := v.(map[string]interface{})
	if !ok {
		return false
	}
	if len(m) == 0 {
		return true // 空 map 也是空壳
	}
	// 检查是否所有基本类型字段都是零值
	for _, val := range m {
		switch tv := val.(type) {
		case nil:
			continue // null 是零值
		case bool:
			if tv {
				return false
			}
		case float64:
			if tv != 0 {
				return false
			}
		case string:
			if tv != "" {
				return false
			}
		case map[string]interface{}:
			if len(tv) > 0 {
				return false
			}
		case []interface{}:
			if len(tv) > 0 {
				return false
			}
		default:
			return false // 其他类型认为不是空壳
		}
	}
	return true
}

func mergeConfigMaps(target, source map[string]interface{}, parentKey string) bool {
	updated := false

	for key, sourceValue := range source {
		fullKey := key
		if parentKey != "" {
			fullKey = parentKey + "." + key
		}

		targetValue, exists := target[key]

		if !exists {
			// 跳过空壳条目：模板中 model_1~model_5 等占位模型所有字段都是 null/零值，
			// 合并进去只会污染用户配置，且用户删掉后还会被补回来
			if isEmptyShell(sourceValue) {
				continue
			}
			fmt.Printf("[LLM配置更新] 发现缺失栏目: %s，正在添加\n", fullKey)
			target[key] = sourceValue
			updated = true
		} else {
			sourceMap, sourceIsMap := sourceValue.(map[string]interface{})
			targetMap, targetIsMap := targetValue.(map[string]interface{})

			if sourceIsMap && targetIsMap {
				if mergeConfigMaps(targetMap, sourceMap, fullKey) {
					updated = true
				}
			}

			sourceSlice, sourceIsSlice := sourceValue.([]interface{})
			targetSlice, targetIsSlice := targetValue.([]interface{})

			if sourceIsSlice && targetIsSlice {
				if key == "api_providers" {
					if mergeAPIProviders(targetSlice, sourceSlice) {
						target[key] = targetSlice
						updated = true
					}
				} else if len(sourceSlice) > len(targetSlice) {
					target[key] = sourceValue
					updated = true
				}
			}
		}
	}

	return updated
}

func mergeAPIProviders(target, source []interface{}) bool {
	updated := false

	sourceByName := make(map[string]map[string]interface{})
	for _, item := range source {
		if m, ok := item.(map[string]interface{}); ok {
			if name, ok := m["name"].(string); ok {
				sourceByName[name] = m
			}
		}
	}

	for i, item := range target {
		targetMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		targetName, _ := targetMap["name"].(string)
		if targetName == "" {
			continue
		}

		sourceMap, exists := sourceByName[targetName]
		if !exists {
			continue
		}

		if updateProviderField(targetMap, sourceMap, "timeout") {
			target[i] = targetMap
			updated = true
		}
		if updateProviderField(targetMap, sourceMap, "max_retry") {
			target[i] = targetMap
			updated = true
		}
		if updateProviderField(targetMap, sourceMap, "retry_interval") {
			target[i] = targetMap
			updated = true
		}
	}

	for _, item := range source {
		sourceMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		sourceName, _ := sourceMap["name"].(string)
		if sourceName == "" {
			continue
		}

		found := false
		for _, targetItem := range target {
			if targetMap, ok := targetItem.(map[string]interface{}); ok {
				if targetName, _ := targetMap["name"].(string); targetName == sourceName {
					found = true
					break
				}
			}
		}

		if !found {
			fmt.Printf("[LLM配置更新] 发现缺失 API 提供商: %s，正在添加\n", sourceName)
			target = append(target, sourceMap)
			updated = true
		}
	}

	return updated
}

func updateProviderField(target, source map[string]interface{}, field string) bool {
	sourceVal, sourceExists := source[field]
	targetVal, targetExists := target[field]

	if !sourceExists || !targetExists {
		return false
	}

	sourceNum, sourceIsNum := toFloat64(sourceVal)
	targetNum, targetIsNum := toFloat64(targetVal)

	if sourceIsNum && targetIsNum {
		if sourceNum > targetNum {
			fmt.Printf("[LLM配置更新] 更新 %s 的 %s: %v -> %v\n", target["name"], field, targetVal, sourceVal)
			target[field] = sourceVal
			return true
		}
	}

	return false
}

func toFloat64(v interface{}) (float64, bool) {
	switch val := v.(type) {
	case float64:
		return val, true
	case int:
		return float64(val), true
	case int64:
		return float64(val), true
	case json.Number:
		f, err := val.Float64()
		if err != nil {
			return 0, false
		}
		return f, true
	default:
		return 0, false
	}
}

// ── 默认配置生成 ──

func createDefaultConfig(path string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	defaultConfig := LLMConfig{
		Cloud: CloudConfig{
			CloudModelURL:       "",
			CloudModelKey:       "",
			MultimodalModelName: "",
			EmbeddingModelName:  "",
		},
		QQAdapter: QQAdapterConfig{
			NapcatWsServer:  "",
			NapcatWsToken:   "",
			LunarCoreURL:    "",
			LunarWsServer:   "",
			ListenGroupIDs:  []interface{}{},
			PollInterval:    10,
			TriggerKeywords: []string{},
			DisplayLogs:     true,
			DefaultReply:    "",
			YutongMode:      false,
		},
		YaraFlow: YaraFlowConfig{
			APIProviders: []APIProvider{
				{
					Name:          "DeepSeek",
					BaseURL:       "",
					APIKey:        "",
					ClientType:    "openai",
					MaxRetry:      2,
					Timeout:       120,
					RetryInterval: 10,
				},
				{
					Name:          "BaiLian",
					BaseURL:       "",
					APIKey:        "",
					ClientType:    "openai",
					MaxRetry:      2,
					Timeout:       120,
					RetryInterval: 5,
				},
				{
					Name:          "Google",
					BaseURL:       "",
					APIKey:        "",
					ClientType:    "gemini",
					MaxRetry:      2,
					Timeout:       120,
					RetryInterval: 10,
				},
				{
					Name:          "SiliconFlow",
					BaseURL:       "",
					APIKey:        "",
					ClientType:    "openai",
					MaxRetry:      3,
					Timeout:       120,
					RetryInterval: 5,
				},
				{
					Name:          "Doubao",
					BaseURL:       "",
					APIKey:        "",
					ClientType:    "openai",
					MaxRetry:      2,
					Timeout:       120,
					RetryInterval: 10,
				},
				{
					Name:          "Anthropic",
					BaseURL:       "https://api.anthropic.com/v1",
					APIKey:        "",
					ClientType:    "anthropic",
					MaxRetry:      2,
					Timeout:       120,
					RetryInterval: 10,
				},
			},
			Models: map[string]interface{}{},
			ModelTaskConfig: ModelTaskConfig{
				Replyer: TaskConfig{
					ModelList:         []string{},
					Temperature:       0.7,
					MaxTokens:         2048,
					SlowThreshold:     25.0,
					SelectionStrategy: "random",
				},
				Planner: TaskConfig{
					ModelList:         []string{},
					Temperature:       0.3,
					MaxTokens:         800,
					SlowThreshold:     12.0,
					SelectionStrategy: "random",
				},
				ToolUse: TaskConfig{
					ModelList:         []string{},
					Temperature:       0.2,
					MaxTokens:         1024,
					SlowThreshold:     10.0,
					SelectionStrategy: "random",
				},
				VLM: TaskConfig{
					ModelList:         []string{},
					MaxTokens:         256,
					SlowThreshold:     15.0,
					SelectionStrategy: "random",
				},
				Voice: TaskConfig{
					ModelList:         []string{},
					SlowThreshold:     12.0,
					SelectionStrategy: "random",
				},
				Embedding: TaskConfig{
					ModelList:         []string{},
					SlowThreshold:     10.0,
					SelectionStrategy: "random",
				},
			},
		},
	}

	data, err := json.MarshalIndent(defaultConfig, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}

func copyTemplateConfig(targetPath, templatePath string) error {
	dir := filepath.Dir(targetPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	templateData, err := os.ReadFile(templatePath)
	if err != nil {
		return err
	}

	return os.WriteFile(targetPath, templateData, 0644)
}

// ReloadConfig 重新加载配置文件到内存，不触发模板合并。
// 用于保存配置后重新加载，避免 checkAndUpdateLLMConfig 把用户刚删的条目补回来。
func ReloadConfig() error {
	configPath := findConfigPath()
	data, err := os.ReadFile(configPath)
	if err != nil {
		return fmt.Errorf("读取配置文件失败: %w", err)
	}
	if err := json.Unmarshal(data, &GlobalLLMConfig); err != nil {
		return fmt.Errorf("解析配置文件失败: %w", err)
	}
	logger.Info("LLM Config reloaded (without template merge)")
	return nil
}

// findConfigPath 查找配置文件路径，与 LoadConfig 使用相同逻辑
func findConfigPath() string {
	configPath := filepath.Join("configs", "lunar_config.json")

	if !filepath.IsAbs(configPath) {
		workDir, err := os.Getwd()
		if err == nil {
			configPath = filepath.Join(workDir, "configs", "lunar_config.json")
		}
	}

	return configPath
}

// SaveYaraFlowConfig 保存 YaraFlow 配置（仅更新 yara_flow 部分，保留其他字段）
func SaveYaraFlowConfig(update map[string]interface{}) error {
	configPath := findConfigPath()

	var fullConfig map[string]interface{}
	if data, err := os.ReadFile(configPath); err == nil {
		json.Unmarshal(data, &fullConfig)
	}
	if fullConfig == nil {
		fullConfig = make(map[string]interface{})
	}

	fullConfig["yara_flow"] = update

	newData, err := json.MarshalIndent(fullConfig, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化配置失败: %w", err)
	}

	if err := os.WriteFile(configPath, newData, 0644); err != nil {
		return fmt.Errorf("写入配置文件失败: %w", err)
	}

	logger.Sugar.Infow("[LLM配置] 配置已保存", "path", configPath)
	return nil
}
