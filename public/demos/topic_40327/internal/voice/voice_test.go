package voice

import (
	"net/http"
	"testing"
	"time"
)

func TestInitService(t *testing.T) {
	svc := InitService()
	if svc == nil {
		t.Fatal("InitService should not return nil")
	}
	if svc.client == nil {
		t.Fatal("Service.client should not be nil")
	}
	if svc.client.Timeout != 120*time.Second {
		t.Errorf("expected timeout 120s, got %v", svc.client.Timeout)
	}
}

func TestDefaultService(t *testing.T) {
	svc := InitService()
	if DefaultService != svc {
		t.Error("DefaultService should be set by InitService")
	}
}

func TestASRResultStruct(t *testing.T) {
	result := ASRResult{
		Text:     "你好世界",
		Language: "zh",
		Duration: 3.5,
	}
	if result.Text != "你好世界" {
		t.Errorf("Text = %s", result.Text)
	}
	if result.Language != "zh" {
		t.Errorf("Language = %s", result.Language)
	}
	if result.Duration != 3.5 {
		t.Errorf("Duration = %f", result.Duration)
	}
}

func TestASRResultEmpty(t *testing.T) {
	result := ASRResult{}
	if result.Text != "" {
		t.Errorf("expected empty Text, got %q", result.Text)
	}
}

func TestSpeechToTextEmptyAudio(t *testing.T) {
	svc := &Service{
		client: &http.Client{Timeout: 1 * time.Second},
	}
	_, err := svc.SpeechToText(nil, "wav")
	if err == nil {
		t.Error("expected error for nil audio data")
	}
	_, err = svc.SpeechToText([]byte{}, "wav")
	if err == nil {
		t.Error("expected error for empty audio data")
	}
}

func TestServiceFields(t *testing.T) {
	svc := InitService()
	// 验证 Service 是可用的
	if svc.client == nil {
		t.Fatal("Service should have HTTP client")
	}
}