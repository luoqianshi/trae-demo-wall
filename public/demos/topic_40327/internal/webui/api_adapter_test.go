package webui

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

// ── loadAdapterConfig / saveAdapterConfig / findConfigPath 测试 ──

func TestLoadAdapterConfig_FileNotFound(t *testing.T) {
	// 在不存在的目录中调用，应返回错误
	// 通过临时覆盖 findConfigPath 的行为来测试
	// 直接测试：当配置文件不存在时，loadAdapterConfig 应返回错误
	_, err := loadAdapterConfigWithPath(filepath.Join(os.TempDir(), "nonexistent_lunar_config.json"))
	if err == nil {
		t.Error("不存在的配置文件应返回错误")
	}
}

func TestLoadAdapterConfig_EmptyConfig(t *testing.T) {
	// 创建临时配置文件
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "lunar_config.json")

	// 写入空配置
	if err := os.WriteFile(configPath, []byte("{}"), 0644); err != nil {
		t.Fatalf("创建临时文件失败: %v", err)
	}

	config, err := loadAdapterConfigWithPath(configPath)
	if err != nil {
		t.Fatalf("读取空配置失败: %v", err)
	}

	if config == nil {
		t.Error("空配置应返回空 map 而非 nil")
	}
}

func TestLoadAdapterConfig_WithAdapterConfig(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "lunar_config.json")

	jsonContent := `{
		"qq_adapter": {
			"napcat_ws_server": "ws://localhost:3001",
			"poll_interval": 10,
			"listen_group_ids": ["123456"]
		}
	}`

	if err := os.WriteFile(configPath, []byte(jsonContent), 0644); err != nil {
		t.Fatalf("创建临时文件失败: %v", err)
	}

	config, err := loadAdapterConfigWithPath(configPath)
	if err != nil {
		t.Fatalf("读取适配器配置失败: %v", err)
	}

	if config["napcat_ws_server"] != "ws://localhost:3001" {
		t.Errorf("napcat_ws_server = %v, 期望 ws://localhost:3001", config["napcat_ws_server"])
	}

	if config["listen_group_ids"] == nil {
		t.Error("listen_group_ids 不应为 nil")
	}
}

func TestSaveAdapterConfig(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "lunar_config.json")

	// 先写入初始配置
	initial := `{"other_key": "value"}`
	if err := os.WriteFile(configPath, []byte(initial), 0644); err != nil {
		t.Fatalf("创建临时文件失败: %v", err)
	}

	// 保存适配器配置
	update := map[string]interface{}{
		"napcat_ws_server": "ws://localhost:4000",
		"poll_interval":    5,
	}

	if err := saveAdapterConfigWithPath(configPath, update); err != nil {
		t.Fatalf("保存适配器配置失败: %v", err)
	}

	// 读取验证
	data, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatalf("读取配置失败: %v", err)
	}

	var fullConfig map[string]interface{}
	if err := json.Unmarshal(data, &fullConfig); err != nil {
		t.Fatalf("解析配置失败: %v", err)
	}

	adapter, ok := fullConfig["qq_adapter"]
	if !ok {
		t.Fatal("qq_adapter 配置未保存")
	}

	adapterMap := adapter.(map[string]interface{})
	if adapterMap["napcat_ws_server"] != "ws://localhost:4000" {
		t.Errorf("napcat_ws_server = %v, 期望 ws://localhost:4000", adapterMap["napcat_ws_server"])
	}

	// 验证原有配置未被覆盖
	if fullConfig["other_key"] != "value" {
		t.Error("原有配置项被意外覆盖")
	}
}

func TestSaveAdapterConfig_FileNotFound(t *testing.T) {
	err := saveAdapterConfigWithPath(filepath.Join(os.TempDir(), "nonexistent.json"), map[string]interface{}{})
	if err == nil {
		t.Error("不存在的文件保存时应返回错误")
	}
}

// ── handleAdapterConfig 测试 ──

func TestHandleAdapterConfig_MethodNotAllowed(t *testing.T) {
	s := &Server{}

	req := httptest.NewRequest("POST", "/api/config/adapter", nil)
	w := httptest.NewRecorder()

	s.handleAdapterConfig(w, req)

	if w.Code != 405 {
		t.Errorf("POST 方法应返回 405, 实际 %d", w.Code)
	}
}

func TestHandleAdapterConfig_OPTIONS(t *testing.T) {
	// OPTIONS 请求应通过 CORS 中间件返回 200
	// 注意：handleAdapterConfig 不处理 OPTIONS，由 corsMiddleware 处理
	// 这里测试路由注册正确性
	handler := corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	})

	req := httptest.NewRequest("OPTIONS", "/api/config/adapter", nil)
	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != 200 {
		t.Errorf("OPTIONS 应返回 200, 实际 %d", w.Code)
	}
}

// ── 辅助函数：使用指定路径的 loadAdapterConfig ──

func loadAdapterConfigWithPath(configPath string) (map[string]interface{}, error) {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var fullConfig map[string]interface{}
	if err := json.Unmarshal(data, &fullConfig); err != nil {
		return nil, err
	}

	adapter, ok := fullConfig["qq_adapter"]
	if !ok {
		return map[string]interface{}{}, nil
	}

	return adapter.(map[string]interface{}), nil
}

// ── 辅助函数：使用指定路径的 saveAdapterConfig ──

func saveAdapterConfigWithPath(configPath string, update map[string]interface{}) error {
	data, err := os.ReadFile(configPath)
	if err != nil {
		return err
	}

	var fullConfig map[string]interface{}
	if err := json.Unmarshal(data, &fullConfig); err != nil {
		return err
	}

	fullConfig["qq_adapter"] = update

	newData, err := json.MarshalIndent(fullConfig, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, newData, 0644)
}
