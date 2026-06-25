package webui

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"
)

// handleAdapterConfig 读写适配器配置（qq_adapter）
func (s *Server) handleAdapterConfig(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		config, err := loadAdapterConfig()
		if err != nil {
			jsonError(w, 500, fmt.Sprintf("读取适配器配置失败: %v", err))
			return
		}
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"config":  config,
			"path":    getRelativeConfigPath(),
		})

	case "PUT":
		var update map[string]interface{}
		if err := readJSON(r, &update); err != nil {
			jsonError(w, 400, "JSON 解析失败")
			return
		}
		if err := saveAdapterConfig(update); err != nil {
			jsonError(w, 500, fmt.Sprintf("保存适配器配置失败: %v", err))
			return
		}

		// 热重载：bridge_adapter 通过 fsnotify 监听配置文件变更自动重载
		// YaraFlow 端只需保存配置文件，无需重启
		reloadAdapterConfiguration()

		jsonResponse(w, map[string]interface{}{
			"success": true,
			"message": "适配器配置已保存并热重载生效",
		})

	default:
		jsonError(w, 405, "Method not allowed")
	}
}

// loadAdapterConfig 从 lunar_config.json 读取 qq_adapter 配置
func loadAdapterConfig() (map[string]interface{}, error) {
	configPath := findConfigPath()
	if configPath == "" {
		return nil, fmt.Errorf("配置文件未找到")
	}

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

	adapterMap, ok := adapter.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("qq_adapter 配置格式错误，期望 JSON 对象")
	}
	return adapterMap, nil
}

// saveAdapterConfig 保存 qq_adapter 配置到 lunar_config.json
func saveAdapterConfig(update map[string]interface{}) error {
	configPath := findConfigPath()
	if configPath == "" {
		return fmt.Errorf("配置文件未找到")
	}

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

// findConfigPath 查找 lunar_config.json 路径
// 优先使用项目根目录（从 config.yaml 路径推导），回退相对路径
func findConfigPath() string {
	// 1. 从 YaraFlow 的 config.yaml 路径推导项目根目录
	if cfgPath := config.GetConfigPath(); cfgPath != "" {
		// config.yaml 在 configs/ 目录下，其父目录的父目录是项目根
		projectRoot := filepath.Dir(filepath.Dir(cfgPath))
		candidate := filepath.Join(projectRoot, "local_data", "lunar_config.json")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}

	// 2. 回退：使用工作目录相对路径
	paths := []string{
		filepath.Join("local_data", "lunar_config.json"),
		filepath.Join("..", "local_data", "lunar_config.json"),
	}

	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			absPath, _ := filepath.Abs(p)
			return absPath
		}
	}

	// 3. 从工作目录搜索
	if workDir, err := os.Getwd(); err == nil {
		for _, p := range paths {
			absPath := filepath.Join(workDir, p)
			if _, err := os.Stat(absPath); err == nil {
				return absPath
			}
		}
	}

	logger.Warn("[适配器配置] 未找到 lunar_config.json 文件")
	return ""
}

// getRelativeConfigPath 返回配置文件的相对路径（用于前端展示）
func getRelativeConfigPath() string {
	absPath := findConfigPath()
	if absPath == "" {
		return ""
	}

	// 尝试获取相对于工作目录的路径
	workDir, err := os.Getwd()
	if err != nil {
		return absPath
	}

	relPath, err := filepath.Rel(workDir, absPath)
	if err != nil {
		return absPath
	}

	// 统一使用正斜杠
	return strings.ReplaceAll(relPath, "\\", "/")
}

// reloadAdapterConfiguration 适配器配置热重载
// bridge_adapter 是独立进程，通过 fsnotify 监听 lunar_config.json 变更自动热重载
// YaraFlow 端只需保存配置文件，无需主动断开 WS
func reloadAdapterConfiguration() {
	logger.Info("[适配器配置] 配置文件已保存，bridge_adapter 将通过 fsnotify 自动检测并热重载")
}
