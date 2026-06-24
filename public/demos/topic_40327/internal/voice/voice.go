package voice

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
)

// Service 语音服务，使用已配置的语音模型进行语音转文字（ASR）
type Service struct {
	client *http.Client
	cb     *llm.CircuitBreaker // per-provider 熔断器
}

// DefaultService 全局默认语音服务
var DefaultService *Service

// InitService 初始化语音服务
func InitService() *Service {
	cb := llm.NewNamedCircuitBreaker("voice", llm.DefaultCircuitBreakerConfig())
	llm.RegisterCircuitBreaker("voice", cb)
	svc := &Service{
		client: llm.NewPooledClient(120 * time.Second),
		cb:     cb,
	}
	DefaultService = svc
	return svc
}

// ASRResult ASR识别结果
type ASRResult struct {
	Text     string  `json:"text"`
	Language string  `json:"language,omitempty"`
	Duration float64 `json:"duration,omitempty"`
}

// SpeechToText 将语音转换为文字
// 使用已配置的语音模型（voice task type）调用 ASR API
func (s *Service) SpeechToText(audioData []byte, format string) (*ASRResult, error) {
	if len(audioData) == 0 {
		return nil, fmt.Errorf("音频数据不能为空")
	}

	// 熔断器检查
	if err := s.cb.Allow(); err != nil {
		logger.Sugar.Warnw("[语音] 熔断器拒绝ASR请求", "error", err)
		return nil, err
	}

	result, err := s.doSpeechToText(audioData, format)
	if err != nil {
		s.cb.RecordFailure()
		return nil, err
	}
	s.cb.RecordSuccess()
	return result, nil
}

func (s *Service) doSpeechToText(audioData []byte, format string) (*ASRResult, error) {
	modelCfg, provider, err := llm.GetModelConfig("voice")
	if err != nil {
		return nil, fmt.Errorf("获取语音模型配置失败: %w", err)
	}

	baseURL := provider.BaseURL
	if baseURL == "" {
		return nil, fmt.Errorf("语音模型未配置 base_url")
	}

	if format == "" {
		format = "wav"
	}

	// 构建 multipart/form-data 请求体
	boundary := "----YaraFlowVoiceBoundary"
	body := &bytes.Buffer{}
	body.WriteString("--")
	body.WriteString(boundary)
	body.WriteString("\r\n")
	body.WriteString("Content-Disposition: form-data; name=\"model\"\r\n\r\n")
	body.WriteString(modelCfg.ModelIdentifier)
	body.WriteString("\r\n")
	body.WriteString("--")
	body.WriteString(boundary)
	body.WriteString("\r\n")
	body.WriteString("Content-Disposition: form-data; name=\"file\"; filename=\"audio.")
	body.WriteString(format)
	body.WriteString("\"\r\n")
	body.WriteString("Content-Type: audio/")
	body.WriteString(format)
	body.WriteString("\r\n\r\n")
	body.Write(audioData)
	body.WriteString("\r\n--")
	body.WriteString(boundary)
	body.WriteString("--\r\n")

	req, err := http.NewRequest(http.MethodPost, baseURL+"/audio/transcriptions", body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "multipart/form-data; boundary="+boundary)
	apiKey := provider.APIKey
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	logger.Sugar.Infow("[语音] ASR请求", "model", modelCfg.ModelIdentifier, "audio_size", len(audioData), "format", format)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ASR请求失败: %w", err)
	}
	defer resp.Body.Close()

	respData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取ASR响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ASR API返回错误 (HTTP %d): %s", resp.StatusCode, string(respData))
	}

	var result struct {
		Text     string  `json:"text"`
		Language string  `json:"language"`
		Duration float64 `json:"duration"`
	}
	if err := json.Unmarshal(respData, &result); err != nil {
		return nil, fmt.Errorf("解析ASR结果失败: %w", err)
	}

	logger.Sugar.Infow("[语音] ASR成功", "text_len", len([]rune(result.Text)))

	return &ASRResult{
		Text:     result.Text,
		Language: result.Language,
		Duration: result.Duration,
	}, nil
}
