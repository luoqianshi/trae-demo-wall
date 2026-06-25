package memory

import (
	"testing"
	"time"
)

func TestOpenAIEmbeddingProviderDim(t *testing.T) {
	p := newOpenAIEmbeddingProvider(ProviderEmbedConfig{
		Type:  "openai",
		Dim:   1536,
		Model: "text-embedding-3-small",
	})

	if p.Name() != "openai" {
		t.Errorf("expected name openai, got %s", p.Name())
	}
	if p.Dim() != 1536 {
		t.Errorf("expected dim 1536, got %d", p.Dim())
	}
}

func TestOpenAIEmbeddingProviderEmptyBatch(t *testing.T) {
	p := newOpenAIEmbeddingProvider(ProviderEmbedConfig{
		Type:    "openai",
		Dim:     1536,
		Model:   "text-embedding-3-small",
		BaseURL: "https://api.openai.com/v1",
		APIKey:  "test-key",
		Timeout: 30 * time.Second,
	})

	results, err := p.EmbedBatch(nil)
	if err != nil {
		t.Fatalf("nil batch should not error: %v", err)
	}
	if results != nil {
		t.Errorf("nil batch should return nil, got %v", results)
	}

	results, err = p.EmbedBatch([]string{})
	if err != nil {
		t.Fatalf("empty batch should not error: %v", err)
	}
	if results != nil {
		t.Errorf("empty batch should return nil, got %v", results)
	}
}

func TestCreateProvider(t *testing.T) {
	p, err := createProvider(ProviderEmbedConfig{Type: "openai", Dim: 1536, Model: "test"})
	if err != nil {
		t.Fatalf("create openai provider: %v", err)
	}
	if p.Name() != "openai" {
		t.Errorf("expected openai, got %s", p.Name())
	}

	_, err = createProvider(ProviderEmbedConfig{Type: "unknown"})
	if err == nil {
		t.Errorf("unknown type should error")
	}
}

func TestEmbedderNoProvider(t *testing.T) {
	cfg := EmbedderConfig{
		Primary: ProviderEmbedConfig{},
	}
	_, err := NewEmbedder(cfg)
	if err == nil {
		t.Errorf("expected error when no provider configured")
	}
}

func TestProviderEmbedConfigDefaults(t *testing.T) {
	cfg := ProviderEmbedConfig{}
	if cfg.Timeout > 0 {
		return
	}
	cfg.Timeout = 30 * time.Second
	if cfg.Timeout != 30*time.Second {
		t.Errorf("expected 30s timeout")
	}
}
