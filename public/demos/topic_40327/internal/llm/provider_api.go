package llm

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"YaraFlow/internal/logger"
)

// TestProviderConnection 测试 AI 提供商连接是否通畅
func TestProviderConnection(name, baseURL, apiKey string) (map[string]interface{}, error) {
	start := time.Now()

	client := NewPooledClient(10 * time.Second)

	url := strings.TrimRight(baseURL, "/") + "/models"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(req)
	latency := time.Since(start).Milliseconds()

	result := map[string]interface{}{
		"network_ok":    false,
		"api_key_valid": false,
		"latency_ms":    latency,
		"error":         "",
	}

	if err != nil {
		result["error"] = fmt.Sprintf("网络连接失败(%s): %v", name, err)
		return result, nil
	}
	defer resp.Body.Close()

	result["network_ok"] = true

	switch resp.StatusCode {
	case 200:
		result["api_key_valid"] = true
	case 401, 403:
		result["error"] = fmt.Sprintf("API Key 无效 (HTTP %d)", resp.StatusCode)
	default:
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 500))
		result["error"] = fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	logger.Sugar.Infow("[LLM测试]", "name", name, "network", result["network_ok"], "key", result["api_key_valid"], "latency_ms", latency)

	return result, nil
}

// FetchProviderModels 从 AI 提供商获取可用模型列表
func FetchProviderModels(provider *APIProvider) ([]map[string]interface{}, error) {
	client := NewPooledClient(15 * time.Second)

	url := strings.TrimRight(provider.BaseURL, "/") + "/models"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+provider.APIKey)

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 500))
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	// OpenAI 兼容格式: {"data": [{"id": "xxx", ...}, ...]}
	var result struct {
		Data []struct {
			ID      string `json:"id"`
			OwnedBy string `json:"owned_by"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		var geminiResult struct {
			Models []struct {
				Name        string `json:"name"`
				DisplayName string `json:"displayName"`
			} `json:"models"`
		}
		if err2 := json.Unmarshal(body, &geminiResult); err2 != nil {
			return nil, fmt.Errorf("解析模型列表失败: %w", err)
		}

		models := make([]map[string]interface{}, 0, len(geminiResult.Models))
		for _, m := range geminiResult.Models {
			models = append(models, map[string]interface{}{
				"id":   m.Name,
				"name": m.DisplayName,
			})
		}
		return models, nil
	}

	models := make([]map[string]interface{}, 0, len(result.Data))
	for _, m := range result.Data {
		models = append(models, map[string]interface{}{
			"id":       m.ID,
			"name":     m.ID,
			"owned_by": m.OwnedBy,
		})
	}

	logger.Sugar.Infow("[LLM模型列表]", "provider", provider.Name, "count", len(models))
	return models, nil
}
