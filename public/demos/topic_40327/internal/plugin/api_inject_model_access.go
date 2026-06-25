package plugin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/dop251/goja"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
)

// ─── ModelAccessInjector ───

type ModelAccessInjector struct {
	ctx *InjectorContext
}

func NewModelAccessInjector(ctx *InjectorContext) *ModelAccessInjector {
	return &ModelAccessInjector{ctx: ctx}
}

func (mai *ModelAccessInjector) APIName() string { return "model" }

func (mai *ModelAccessInjector) Inject() error {
	if !mai.ctx.manifest.HasPermission("model.access") {
		return nil
	}

	modelAPI := map[string]interface{}{
		"chat":                mai.createChat(),
		"chatWithConfig":      mai.createChatWithConfig(),
		"getConfig":           mai.createGetConfig(),
		"getAllConfigs":       mai.createGetAllConfigs(),
		"listTasks":           mai.createListTasks(),
		"chatWithTask":        mai.createChatWithTask(),
		"getAvailableConfigs": mai.createGetAvailableConfigs(),
		"chatWithTools":       mai.createChatWithTools(),
		"embed":               mai.createEmbed(),
		"getAvailableModels":  mai.createGetAvailableModels(),
	}

	mai.ctx.mergeIntoYara("model", modelAPI)
	return nil
}

func (mai *ModelAccessInjector) createChat() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chat(options) requires options object"))
		}

		rawOpts := call.Arguments[0].Export()
		opts, ok := rawOpts.(map[string]interface{})
		if !ok {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chat(options): options must be an object"))
		}

		messagesRaw, hasMessages := opts["messages"]
		if !hasMessages {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chat(options): options.messages is required"))
		}
		messagesList, ok := messagesRaw.([]interface{})
		if !ok {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chat(options): options.messages must be an array"))
		}

		taskType := "replyer"
		if tt, exists := opts["taskType"]; exists {
			if ttStr, ok := tt.(string); ok {
				taskType = ttStr
			}
		}

		chatMessages := chatMessagesFromList(messagesList)
		if len(chatMessages) == 0 {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": "no valid messages provided",
			})
		}

		provider := llm.NewRandomModelProvider(taskType)
		response, err := provider.Chat(chatMessages)
		if err != nil {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("LLM chat failed: %v", err),
			})
		}

		return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"content": response,
		})
	}
}

func (mai *ModelAccessInjector) createChatWithConfig() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithConfig(options) requires options object"))
		}

		rawOpts := call.Arguments[0].Export()
		opts, ok := rawOpts.(map[string]interface{})
		if !ok {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithConfig(options): options must be an object"))
		}

		messagesRaw, hasMessages := opts["messages"]
		if !hasMessages {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithConfig(options): options.messages is required"))
		}
		messagesList, ok := messagesRaw.([]interface{})
		if !ok {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithConfig(options): options.messages must be an array"))
		}

		baseURL := ""
		apiKey := ""
		modelName := ""
		temperature := float32(0.7)
		timeout := 120
		maxTokens := 0

		if url, exists := opts["baseUrl"]; exists {
			baseURL = fmt.Sprintf("%v", url)
		}
		if key, exists := opts["apiKey"]; exists {
			apiKey = fmt.Sprintf("%v", key)
		}
		if model, exists := opts["model"]; exists {
			modelName = fmt.Sprintf("%v", model)
		}
		if temp, exists := opts["temperature"]; exists {
			switch v := temp.(type) {
			case float64:
				temperature = float32(v)
			case int64:
				temperature = float32(v)
			}
		}
		if mt, exists := opts["maxTokens"]; exists {
			switch v := mt.(type) {
			case float64:
				maxTokens = int(v)
			case int64:
				maxTokens = int(v)
			}
		}
		_ = maxTokens // ProviderConfig 不支持 MaxTokens，预留字段
		if to, exists := opts["timeout"]; exists {
			switch v := to.(type) {
			case float64:
				timeout = int(v)
			case int64:
				timeout = int(v)
			}
		}

		if baseURL == "" || apiKey == "" || modelName == "" {
			taskType := "replyer"
			if tt, exists := opts["taskType"]; exists {
				if ttStr, ok := tt.(string); ok {
					taskType = ttStr
				}
			}
			provider := llm.NewRandomModelProvider(taskType)
			response, err := provider.Chat(chatMessagesFromList(messagesList))
			if err != nil {
				return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
					"error": fmt.Sprintf("LLM chat failed: %v", err),
				})
			}
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"content": response,
			})
		}

		providerCfg := llm.ProviderConfig{
			BaseURL:     baseURL,
			APIKey:      apiKey,
			Model:       modelName,
			Temperature: temperature,
			Timeout:     timeout,
			MaxRetries:  2,
		}

		provider := llm.NewOpenAIProvider(providerCfg)
		response, err := provider.Chat(chatMessagesFromList(messagesList))
		if err != nil {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("plugin custom LLM chat failed: %v", err),
			})
		}

		logger.Sugar.Infow("[Plugin] custom model chat succeeded", "id", mai.ctx.pluginID, "model", modelName, "response_len", len(response))

		return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"content": response,
		})
	}
}

func (mai *ModelAccessInjector) createGetConfig() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		taskType := ""
		if len(call.Arguments) >= 1 {
			taskType = call.Arguments[0].String()
		}

		modelConfig, apiProvider, err := llm.GetModelConfig(taskType)
		if err != nil {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("failed to get model config: %v", err),
			})
		}

		modelMap := make(map[string]interface{})
		if modelConfig != nil {
			modelMap["model_identifier"] = modelConfig.ModelIdentifier
			modelMap["name"] = modelConfig.Name
			modelMap["api_provider"] = modelConfig.APIProvider
		}
		if apiProvider != nil {
			modelMap["provider_name"] = apiProvider.Name
			modelMap["base_url"] = apiProvider.BaseURL
			modelMap["api_key"] = apiProvider.APIKey
			modelMap["provider_model"] = modelConfig.ModelIdentifier
			modelMap["client_type"] = apiProvider.ClientType
		}

		return mai.ctx.sandbox.Runtime().ToValue(modelMap)
	}
}

func (mai *ModelAccessInjector) createGetAllConfigs() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		allConfigs := make(map[string]interface{})
		taskTypes := []string{"replyer", "planner", "tool_use", "vlm", "voice"}
		for _, taskType := range taskTypes {
			modelConfig, apiProvider, err := llm.GetModelConfig(taskType)
			if err != nil {
				continue
			}
			cfg := make(map[string]interface{})
			if modelConfig != nil {
				cfg["model_identifier"] = modelConfig.ModelIdentifier
				cfg["name"] = modelConfig.Name
				cfg["api_provider"] = modelConfig.APIProvider
			}
			if apiProvider != nil {
				cfg["provider_name"] = apiProvider.Name
				cfg["base_url"] = apiProvider.BaseURL
				cfg["api_key"] = apiProvider.APIKey
				cfg["client_type"] = apiProvider.ClientType
			}
			allConfigs[taskType] = cfg
		}
		return mai.ctx.sandbox.Runtime().ToValue(allConfigs)
	}
}

func (mai *ModelAccessInjector) createListTasks() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		tasks := []string{"replyer", "planner", "tool_use", "vlm", "voice"}
		return mai.ctx.sandbox.Runtime().ToValue(tasks)
	}
}

func (mai *ModelAccessInjector) createChatWithTask() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithTask(taskType, messages) requires 2 arguments"))
		}
		taskType := call.Arguments[0].String()
		messagesRaw := call.Arguments[1].Export()
		messagesList, ok := messagesRaw.([]interface{})
		if !ok {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithTask: messages must be an array"))
		}

		provider := llm.NewRandomModelProvider(taskType)
		response, err := provider.Chat(chatMessagesFromList(messagesList))
		if err != nil {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("model.chatWithTask failed: %v", err),
			})
		}

		return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"content":  response,
			"taskType": taskType,
		})
	}
}

func (mai *ModelAccessInjector) createGetAvailableConfigs() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		allConfigs := make(map[string]interface{})
		taskTypes := []string{"replyer", "planner", "tool_use", "vlm", "voice"}
		for _, taskType := range taskTypes {
			modelConfig, apiProvider, err := llm.GetModelConfig(taskType)
			if err != nil {
				continue
			}
			cfg := make(map[string]interface{})
			if modelConfig != nil {
				cfg["model_name"] = modelConfig.Name
				cfg["model_identifier"] = modelConfig.ModelIdentifier
				cfg["api_provider"] = modelConfig.APIProvider
			}
			if apiProvider != nil {
				cfg["provider_name"] = apiProvider.Name
				cfg["provider_base_url"] = apiProvider.BaseURL
				cfg["client_type"] = apiProvider.ClientType
			}
			allConfigs[taskType] = cfg
		}
		return mai.ctx.sandbox.Runtime().ToValue(allConfigs)
	}
}

// chatMessagesFromList 将 JS 消息列表转换为 Go 消息列表
func chatMessagesFromList(messagesList []interface{}) []llm.ChatMessage {
	var chatMessages []llm.ChatMessage
	for _, msgRaw := range messagesList {
		msgMap, ok := msgRaw.(map[string]interface{})
		if !ok {
			continue
		}
		role, _ := msgMap["role"].(string)
		content, _ := msgMap["content"].(string)
		chatMessages = append(chatMessages, llm.ChatMessage{
			Role:    role,
			Content: content,
		})
	}
	return chatMessages
}

// createChatWithTools 调用 LLM 并支持 Function Calling
// JS: model.chatWithTools({ messages: [...], tools: [...], taskType: "replyer" })
func (mai *ModelAccessInjector) createChatWithTools() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithTools(options) requires options object"))
		}

		rawOpts := call.Arguments[0].Export()
		opts, ok := rawOpts.(map[string]interface{})
		if !ok {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithTools(options): options must be an object"))
		}

		// 解析 messages
		messagesRaw, hasMessages := opts["messages"]
		if !hasMessages {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithTools(options): options.messages is required"))
		}
		messagesList, ok := messagesRaw.([]interface{})
		if !ok {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithTools(options): options.messages must be an array"))
		}

		// 解析 tools
		toolsRaw, hasTools := opts["tools"]
		if !hasTools {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithTools(options): options.tools is required"))
		}
		toolsList, ok := toolsRaw.([]interface{})
		if !ok {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.chatWithTools(options): options.tools must be an array"))
		}

		taskType := "replyer"
		if tt, exists := opts["taskType"]; exists {
			if ttStr, ok := tt.(string); ok {
				taskType = ttStr
			}
		}

		chatMessages := chatMessagesFromList(messagesList)
		if len(chatMessages) == 0 {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": "no valid messages provided",
			})
		}

		// 转换 tools 为 Go 结构
		tools := jsToolsToLLM(toolsList)
		if len(tools) == 0 {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": "no valid tools provided",
			})
		}

		provider := llm.NewRandomModelProvider(taskType)
		response, err := provider.ChatWithTools(chatMessages, tools)
		if err != nil {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("chatWithTools failed: %v", err),
			})
		}

		// 转换 toolCalls 为 JS 格式
		jsToolCalls := make([]interface{}, 0, len(response.ToolCalls))
		for _, tc := range response.ToolCalls {
			jsToolCalls = append(jsToolCalls, map[string]interface{}{
				"id":   tc.ID,
				"type": tc.Type,
				"function": map[string]interface{}{
					"name":      tc.Function.Name,
					"arguments": tc.Function.Arguments,
				},
			})
		}

		return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"content":   response.Content,
			"toolCalls": jsToolCalls,
		})
	}
}

// createEmbed 获取文本嵌入向量
// JS: model.embed({ text: "hello", taskType: "replyer" })
// 或 model.embed({ texts: ["hello", "world"], taskType: "replyer" })
func (mai *ModelAccessInjector) createEmbed() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.embed(options) requires options object"))
		}

		rawOpts := call.Arguments[0].Export()
		opts, ok := rawOpts.(map[string]interface{})
		if !ok {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.embed(options): options must be an object"))
		}

		// 支持单个 text 或批量 texts
		var texts []string
		if t, exists := opts["text"]; exists {
			texts = []string{fmt.Sprintf("%v", t)}
		}
		if ts, exists := opts["texts"]; exists {
			if tsList, ok := ts.([]interface{}); ok {
				texts = make([]string, 0, len(tsList))
				for _, t := range tsList {
					texts = append(texts, fmt.Sprintf("%v", t))
				}
			}
		}
		if len(texts) == 0 {
			panic(mai.ctx.sandbox.Runtime().NewTypeError("model.embed(options): options.text or options.texts is required"))
		}

		taskType := "replyer"
		if tt, exists := opts["taskType"]; exists {
			if ttStr, ok := tt.(string); ok {
				taskType = ttStr
			}
		}

		// 获取 LLM 配置来获取 baseURL 和 apiKey
		modelConfig, apiProvider, err := llm.GetModelConfig(taskType)
		if err != nil || apiProvider == nil {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("failed to get model config: %v", err),
			})
		}

		// 使用 OpenAI 兼容的 embeddings API
		embedModel := "text-embedding-3-small"
		if modelConfig != nil && modelConfig.ModelIdentifier != "" {
			embedModel = modelConfig.ModelIdentifier
		}

		embeddings, err := callEmbeddingAPI(apiProvider.BaseURL, apiProvider.APIKey, embedModel, texts)
		if err != nil {
			return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("embedding failed: %v", err),
			})
		}

		// 转换为 JS 数组
		jsEmbeddings := make([]interface{}, len(embeddings))
		for i, emb := range embeddings {
			jsEmb := make([]interface{}, len(emb))
			for j, v := range emb {
				jsEmb[j] = v
			}
			jsEmbeddings[i] = jsEmb
		}

		return mai.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"embeddings": jsEmbeddings,
			"model":      embedModel,
		})
	}
}

// createGetAvailableModels 获取可用模型名称列表
// JS: model.getAvailableModels()
func (mai *ModelAccessInjector) createGetAvailableModels() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		models := []string{}
		taskTypes := []string{"replyer", "planner", "tool_use", "vlm", "voice"}
		for _, taskType := range taskTypes {
			modelConfig, _, err := llm.GetModelConfig(taskType)
			if err != nil || modelConfig == nil {
				continue
			}
			models = append(models, modelConfig.Name)
		}
		return mai.ctx.sandbox.Runtime().ToValue(models)
	}
}

// jsToolsToLLM 将 JS 格式的工具定义转换为 LLM 的 ToolDefinition
func jsToolsToLLM(toolsList []interface{}) []llm.ToolDefinition {
	var tools []llm.ToolDefinition
	for _, tRaw := range toolsList {
		tMap, ok := tRaw.(map[string]interface{})
		if !ok {
			continue
		}

		funcMap, ok := tMap["function"].(map[string]interface{})
		if !ok {
			// 尝试顶层就是 function 定义
			funcMap = tMap
		}

		name, _ := funcMap["name"].(string)
		desc, _ := funcMap["description"].(string)

		params := llm.ToolParameters{
			Type:       "object",
			Properties: make(map[string]llm.ToolParamProp),
		}

		if paramsRaw, exists := funcMap["parameters"]; exists {
			if paramsMap, ok := paramsRaw.(map[string]interface{}); ok {
				if props, exists := paramsMap["properties"]; exists {
					if propsMap, ok := props.(map[string]interface{}); ok {
						for propName, propRaw := range propsMap {
							if propMap, ok := propRaw.(map[string]interface{}); ok {
								prop := llm.ToolParamProp{}
								if pt, exists := propMap["type"]; exists {
									prop.Type = fmt.Sprintf("%v", pt)
								}
								if pd, exists := propMap["description"]; exists {
									prop.Description = fmt.Sprintf("%v", pd)
								}
								if penum, exists := propMap["enum"]; exists {
									if enumList, ok := penum.([]interface{}); ok {
										for _, e := range enumList {
											prop.Enum = append(prop.Enum, fmt.Sprintf("%v", e))
										}
									}
								}
								params.Properties[propName] = prop
							}
						}
					}
				}
				if req, exists := paramsMap["required"]; exists {
					if reqList, ok := req.([]interface{}); ok {
						for _, r := range reqList {
							params.Required = append(params.Required, fmt.Sprintf("%v", r))
						}
					}
				}
			}
		}

		tools = append(tools, llm.ToolDefinition{
			Type: "function",
			Function: llm.ToolFunctionSchema{
				Name:        name,
				Description: desc,
				Parameters:  params,
			},
		})
	}
	return tools
}

// embeddingRequest OpenAI 兼容的 embedding 请求
type embeddingRequest struct {
	Model string   `json:"model"`
	Input []string `json:"input"`
}

// embeddingResponse OpenAI 兼容的 embedding 响应
type embeddingResponse struct {
	Data []struct {
		Embedding []float64 `json:"embedding"`
	} `json:"data"`
}

// callEmbeddingAPI 调用 OpenAI 兼容的 embeddings API
func callEmbeddingAPI(baseURL, apiKey, model string, texts []string) ([][]float64, error) {
	// 标准化 baseURL
	url := baseURL
	if len(url) > 0 && url[len(url)-1] == '/' {
		url = url[:len(url)-1]
	}
	url += "/v1/embeddings"

	reqBody := embeddingRequest{
		Model: model,
		Input: texts,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewReader(jsonData))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("embedding API returned %d: %s", resp.StatusCode, string(body[:minInt(len(body), 500)]))
	}

	var embResp embeddingResponse
	if err := json.Unmarshal(body, &embResp); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	embeddings := make([][]float64, len(embResp.Data))
	for i, d := range embResp.Data {
		embeddings[i] = d.Embedding
	}

	return embeddings, nil
}
