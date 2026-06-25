package llm

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"YaraFlow/internal/logger"
)

type VisionProvider interface {
	AnalyzeImage(imageURL string, visionRules string) (string, error)
	DescribeImage(imageData []byte, prompt string) (string, error)
}

type VisionConfig struct {
	BaseURL    string
	APIKey     string
	Model      string
	Timeout    int
	MaxRetries int
}

type OpenAIVisionProvider struct {
	config VisionConfig
	client *http.Client
	cb     *CircuitBreaker // per-provider 熔断器
}

type VisionRequest struct {
	Model    string          `json:"model"`
	Messages []VisionMessage `json:"messages"`
}

type VisionMessage struct {
	Role    string          `json:"role"`
	Content []VisionContent `json:"content"`
}

type VisionContent struct {
	Type     string `json:"type"`
	Text     string `json:"text,omitempty"`
	ImageURL string `json:"image_url,omitempty"`
}

type VisionResponse struct {
	Choices []VisionChoice `json:"choices"`
	Error   *APIError      `json:"error,omitempty"`
}

type VisionChoice struct {
	Message VisionMessageData `json:"message"`
}

type VisionMessageData struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func NewOpenAIVisionProvider(config VisionConfig) *OpenAIVisionProvider {
	cbName := "vision:" + config.Model
	cb := NewNamedCircuitBreaker(cbName, DefaultCircuitBreakerConfig())
	RegisterCircuitBreaker(cbName, cb)
	return &OpenAIVisionProvider{
		config: config,
		client: NewPooledClient(time.Duration(config.Timeout) * time.Second),
		cb:     cb,
	}
}

func (p *OpenAIVisionProvider) DescribeImage(imageData []byte, prompt string) (string, error) {
	// 熔断器检查
	if err := p.cb.Allow(); err != nil {
		logger.Sugar.Warnw("[Vision] 熔断器拒绝请求", "error", err)
		return "", err
	}

	var lastErr error

	for i := 0; i <= p.config.MaxRetries; i++ {
		response, err := p.doDescribe(imageData, prompt)
		if err == nil {
			p.cb.RecordSuccess()
			return response, nil
		}

		lastErr = err
		logger.Sugar.Infow("Vision attempt failed", "attempt", i+1, "error", err)

		if i < p.config.MaxRetries {
			backoff := time.Duration(i+1) * time.Second
			time.Sleep(backoff)
		}
	}

	if IsRetryableError(lastErr) {
		p.cb.RecordFailureRetryable()
	} else {
		p.cb.RecordFailure()
	}
	return "", fmt.Errorf("vision analysis failed after %d attempts: %w", p.config.MaxRetries+1, lastErr)
}

func (p *OpenAIVisionProvider) doDescribe(imageData []byte, prompt string) (string, error) {
	base64Data := base64.StdEncoding.EncodeToString(imageData)
	imageURL := "data:image/png;base64," + base64Data

	reqBody := VisionRequest{
		Model: p.config.Model,
		Messages: []VisionMessage{
			{
				Role: "user",
				Content: []VisionContent{
					{
						Type: "text",
						Text: prompt,
					},
					{
						Type:     "image_url",
						ImageURL: imageURL,
					},
				},
			},
		},
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, p.config.BaseURL+"/chat/completions", bytes.NewBuffer(data))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")

	apiKey := p.config.APIKey
	if apiKey != "" && !hasBearerPrefix(apiKey) {
		apiKey = "Bearer " + apiKey
	}
	req.Header.Set("Authorization", apiKey)

	resp, err := p.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var response VisionResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", fmt.Errorf("failed to parse vision response: %w, response: %s", err, string(body))
	}

	if response.Error != nil {
		return "", fmt.Errorf("vision API error: %s (type: %s, code: %s)", response.Error.Message, response.Error.Type, response.Error.Code)
	}

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no choices in vision response (model=%s, status=%d, body=%s)", p.config.Model, resp.StatusCode, truncateBody(string(body)))
	}

	return response.Choices[0].Message.Content, nil
}

func truncateBody(body string) string {
	runes := []rune(body)
	if len(runes) > 200 {
		return string(runes[:200]) + "..."
	}
	return body
}

func (p *OpenAIVisionProvider) AnalyzeImage(imageURL string, visionRules string) (string, error) {
	// 熔断器检查
	if err := p.cb.Allow(); err != nil {
		logger.Sugar.Warnw("[Vision] 熔断器拒绝请求", "error", err)
		return "", err
	}

	var lastErr error

	for i := 0; i <= p.config.MaxRetries; i++ {
		response, err := p.doAnalyze(imageURL, visionRules)
		if err == nil {
			p.cb.RecordSuccess()
			return response, nil
		}

		lastErr = err
		logger.Sugar.Infow("Vision attempt failed", "attempt", i+1, "error", err)

		if i < p.config.MaxRetries {
			backoff := time.Duration(i+1) * time.Second
			time.Sleep(backoff)
		}
	}

	if IsRetryableError(lastErr) {
		p.cb.RecordFailureRetryable()
	} else {
		p.cb.RecordFailure()
	}
	return "", fmt.Errorf("vision analysis failed after %d attempts: %w", p.config.MaxRetries+1, lastErr)
}

func (p *OpenAIVisionProvider) doAnalyze(imageURL string, visionRules string) (string, error) {
	promptText := "看到这张图的第一反应，用简短口语描述里面有什么、什么氛围，像朋友分享一样自然。"
	if visionRules != "" {
		promptText = visionRules
	}

	reqBody := VisionRequest{
		Model: p.config.Model,
		Messages: []VisionMessage{
			{
				Role: "user",
				Content: []VisionContent{
					{
						Type: "text",
						Text: promptText,
					},
					{
						Type:     "image_url",
						ImageURL: imageURL,
					},
				},
			},
		},
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, p.config.BaseURL+"/chat/completions", bytes.NewBuffer(data))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")

	apiKey := p.config.APIKey
	if apiKey != "" && !hasBearerPrefix(apiKey) {
		apiKey = "Bearer " + apiKey
	}
	req.Header.Set("Authorization", apiKey)

	resp, err := p.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var response VisionResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return "", fmt.Errorf("failed to parse vision response: %w, response: %s", err, string(body))
	}

	if response.Error != nil {
		return "", fmt.Errorf("vision API error: %s (type: %s, code: %s)", response.Error.Message, response.Error.Type, response.Error.Code)
	}

	if len(response.Choices) == 0 {
		return "", fmt.Errorf("no choices in vision response (model=%s, status=%d, body=%s)", p.config.Model, resp.StatusCode, truncateBody(string(body)))
	}

	return response.Choices[0].Message.Content, nil
}
