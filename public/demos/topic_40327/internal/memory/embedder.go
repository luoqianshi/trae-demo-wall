package memory

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
)

type EmbeddingProvider interface {
	Embed(text string) ([]float32, error)
	EmbedBatch(texts []string) ([][]float32, error)
	HealthCheck(ctx context.Context) error
	Dim() int
	Name() string
}

type EmbedderConfig struct {
	Primary ProviderEmbedConfig
}

type ProviderEmbedConfig struct {
	Type    string
	BaseURL string
	Model   string
	APIKey  string
	Dim     int
	Timeout time.Duration
}

type Embedder struct {
	cfg      EmbedderConfig
	provider EmbeddingProvider
}

func NewEmbedder(cfg EmbedderConfig) (*Embedder, error) {
	e := &Embedder{cfg: cfg}

	if cfg.Primary.BaseURL != "" && cfg.Primary.Model != "" {
		p, err := createProvider(cfg.Primary)
		if err != nil {
			return nil, fmt.Errorf("create primary embedding provider: %w", err)
		}
		e.provider = p
	}

	if e.provider == nil {
		return nil, fmt.Errorf("至少需要配置一个 embedding provider (openai)")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.provider.HealthCheck(ctx); err != nil {
		return nil, fmt.Errorf("embedding provider (%s) 不可用: %w", e.provider.Name(), err)
	}

	logger.Sugar.Infow("[记忆系统] 使用 embedding provider", "name", e.provider.Name(), "dim", e.provider.Dim())
	return e, nil
}

func (e *Embedder) Embed(text string) ([]float32, error) {
	if e.provider == nil {
		return nil, fmt.Errorf("无可用 embedding provider")
	}
	return e.provider.Embed(text)
}

func (e *Embedder) EmbedBatch(texts []string) ([][]float32, error) {
	if e.provider == nil {
		return nil, fmt.Errorf("无可用 embedding provider")
	}

	var allResults [][]float32
	batchSize := 32
	for i := 0; i < len(texts); i += batchSize {
		end := i + batchSize
		if end > len(texts) {
			end = len(texts)
		}
		batch := texts[i:end]

		results, err := e.provider.EmbedBatch(batch)
		if err != nil {
			return nil, fmt.Errorf("embed batch [%d:%d] 失败: %w", i, end, err)
		}
		allResults = append(allResults, results...)
	}
	return allResults, nil
}

func (e *Embedder) Dim() int {
	if e.provider != nil {
		return e.provider.Dim()
	}
	return 0
}

func createProvider(cfg ProviderEmbedConfig) (EmbeddingProvider, error) {
	if cfg.Timeout <= 0 {
		cfg.Timeout = 30 * time.Second
	}

	switch cfg.Type {
	case "openai":
		return newOpenAIEmbeddingProvider(cfg), nil
	default:
		return nil, fmt.Errorf("不支持的 embedding provider 类型: %s (支持 openai)", cfg.Type)
	}
}

type openaiEmbeddingProvider struct {
	cfg    ProviderEmbedConfig
	client *http.Client
	cb     *llm.CircuitBreaker // per-provider 熔断器
}

type openaiEmbedRequest struct {
	Model string `json:"model"`
	Input any    `json:"input"`
}

type openaiEmbedResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
	} `json:"data"`
}

func newOpenAIEmbeddingProvider(cfg ProviderEmbedConfig) *openaiEmbeddingProvider {
	cbName := "embedding:" + cfg.Model
	cb := llm.NewNamedCircuitBreaker(cbName, llm.DefaultCircuitBreakerConfig())
	llm.RegisterCircuitBreaker(cbName, cb)
	return &openaiEmbeddingProvider{
		cfg:    cfg,
		client: llm.NewPooledClient(cfg.Timeout),
		cb:     cb,
	}
}

func (p *openaiEmbeddingProvider) Name() string { return "openai" }

func (p *openaiEmbeddingProvider) Dim() int { return p.cfg.Dim }

func (p *openaiEmbeddingProvider) HealthCheck(ctx context.Context) error {
	_, err := p.Embed("ping")
	return err
}

func (p *openaiEmbeddingProvider) Embed(text string) ([]float32, error) {
	results, err := p.EmbedBatch([]string{text})
	if err != nil {
		return nil, err
	}
	if len(results) == 0 {
		return nil, fmt.Errorf("openai embed 返回空结果")
	}
	return results[0], nil
}

func (p *openaiEmbeddingProvider) EmbedBatch(texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	if err := p.cb.Allow(); err != nil {
		return nil, err
	}

	results, err := p.doEmbedBatch(texts)
	if err != nil {
		p.cb.RecordFailure()
		return nil, err
	}
	p.cb.RecordSuccess()
	return results, nil
}

func (p *openaiEmbeddingProvider) doEmbedBatch(texts []string) ([][]float32, error) {
	var input any
	if len(texts) == 1 {
		input = texts[0]
	} else {
		input = texts
	}

	reqBody := openaiEmbedRequest{
		Model: p.cfg.Model,
		Input: input,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	url := p.cfg.BaseURL
	if url[len(url)-1] == '/' {
		url += "embeddings"
	} else {
		url += "/embeddings"
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if p.cfg.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+p.cfg.APIKey)
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("openai embed request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openai embed status %d: %s", resp.StatusCode, string(body))
	}

	var response openaiEmbedResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("openai embed parse: %w, body: %s", err, string(body))
	}

	results := make([][]float32, len(response.Data))
	for i, d := range response.Data {
		results[i] = d.Embedding
	}

	return results, nil
}
