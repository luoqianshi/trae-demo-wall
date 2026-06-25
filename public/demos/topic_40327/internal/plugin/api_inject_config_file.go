package plugin

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

// ─── ConfigFileInjector ───

type ConfigFileInjector struct {
	ctx       *InjectorContext
	rawConfig map[string]interface{}
}

func NewConfigFileInjector(ctx *InjectorContext) *ConfigFileInjector {
	return &ConfigFileInjector{ctx: ctx}
}

func (cfi *ConfigFileInjector) APIName() string { return "configFile" }

func (cfi *ConfigFileInjector) Inject() error {
	rawConfig, err := cfi.loadRawConfigFile()
	if err != nil {
		logger.Sugar.Infow("[Plugin] no config file loaded, using defaults", "id", cfi.ctx.pluginID, "error", err)
	}
	cfi.rawConfig = rawConfig

	configFileAPI := map[string]interface{}{
		"getFile": cfi.createGetFile(),
	}

	configAPI := cfi.ctx.sandbox.Get("yara")
	if configAPI != nil && !goja.IsUndefined(configAPI) {
		if existingObj, ok := configAPI.Export().(map[string]interface{}); ok {
			if existingConfig, ok := existingObj["config"].(map[string]interface{}); ok {
				existingConfig["getFile"] = configFileAPI["getFile"]
			}
		}
	}

	return nil
}

func (cfi *ConfigFileInjector) createGetFile() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if cfi.rawConfig != nil {
			return cfi.ctx.sandbox.Runtime().ToValue(cfi.rawConfig)
		}
		return goja.Undefined()
	}
}

func (cfi *ConfigFileInjector) loadRawConfigFile() (map[string]interface{}, error) {
	if cfi.ctx.manifest.Config == nil || cfi.ctx.manifest.Config.ConfigFile == "" {
		return nil, fmt.Errorf("no config file specified in manifest")
	}

	configPath := filepath.Join(cfi.ctx.pluginDir, cfi.ctx.manifest.Config.ConfigFile)
	cleaned := filepath.Clean(configPath)
	pluginDirClean := filepath.Clean(cfi.ctx.pluginDir)
	// 用 filepath.Rel 检查路径是否在插件目录内（防止路径遍历攻击）
	rel, err := filepath.Rel(pluginDirClean, cleaned)
	if err != nil || strings.HasPrefix(rel, "..") {
		return nil, fmt.Errorf("config file path traversal detected: %s", cfi.ctx.manifest.Config.ConfigFile)
	}
	data, err := os.ReadFile(cleaned)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	configType := strings.ToLower(cfi.ctx.manifest.Config.Type)
	var result map[string]interface{}

	switch configType {
	case "json":
		if err := json.Unmarshal(data, &result); err != nil {
			return nil, fmt.Errorf("failed to parse JSON config: %w", err)
		}
	case "toml":
		if err := parseTOML(data, &result); err != nil {
			return nil, fmt.Errorf("failed to parse TOML config: %w", err)
		}
	case "yaml":
		if err := parseYAML(data, &result); err != nil {
			return nil, fmt.Errorf("failed to parse YAML config: %w", err)
		}
	default:
		return nil, fmt.Errorf("unsupported config type: %s", configType)
	}

	result = mergeDefaults(result, cfi.ctx.manifest.Config.Default)
	return result, nil
}

// ─── 配置解析辅助函数 ───

func mergeDefaults(loaded map[string]interface{}, defaults map[string]interface{}) map[string]interface{} {
	if defaults == nil {
		return loaded
	}
	if loaded == nil {
		loaded = make(map[string]interface{})
	}
	for key, defaultVal := range defaults {
		if _, exists := loaded[key]; !exists {
			loaded[key] = defaultVal
		}
	}
	return loaded
}

func parseTOML(data []byte, result *map[string]interface{}) error {
	lines := strings.Split(string(data), "\n")
	*result = make(map[string]interface{})
	currentSection := *result
	var currentHeader string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if strings.HasPrefix(line, "[") && strings.HasSuffix(line, "]") {
			header := line[1 : len(line)-1]
			currentHeader = header
			section := make(map[string]interface{})
			if !strings.Contains(header, ".") {
				(*result)[header] = section
				currentSection = section
			} else {
				parts := strings.Split(header, ".")
				parent := *result
				for i := 0; i < len(parts)-1; i++ {
					if _, ok := parent[parts[i]]; !ok {
						parent[parts[i]] = make(map[string]interface{})
					}
					parent = parent[parts[i]].(map[string]interface{})
				}
				parent[parts[len(parts)-1]] = section
				currentSection = section
			}
			_ = currentHeader
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		value = strings.Trim(value, "\"'")
		currentSection[key] = parseTOMLValue(value)
	}

	return nil
}

func parseTOMLValue(value string) interface{} {
	if value == "true" {
		return true
	}
	if value == "false" {
		return false
	}
	if strings.Contains(value, ".") {
		if v, err := strconv.ParseFloat(value, 64); err == nil {
			return v
		}
	}
	if i, err := strconv.ParseInt(value, 10, 64); err == nil {
		return i
	}
	if strings.HasPrefix(value, "[") && strings.HasSuffix(value, "]") {
		inner := strings.Trim(value, "[]")
		items := strings.Split(inner, ",")
		var arr []interface{}
		for _, item := range items {
			arr = append(arr, parseTOMLValue(strings.TrimSpace(item)))
		}
		return arr
	}
	return value
}

func parseYAML(data []byte, result *map[string]interface{}) error {
	lines := strings.Split(string(data), "\n")
	*result = make(map[string]interface{})
	currentPath := []string{}
	currentIndent := 0

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		indent := len(line) - len(strings.TrimLeft(line, " "))
		parts := strings.SplitN(trimmed, ":", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		if indent <= currentIndent {
			popCount := (currentIndent - indent) / 4
			if indent == 0 {
				popCount = len(currentPath)
			}
			if popCount > len(currentPath) {
				popCount = len(currentPath)
			}
			currentPath = currentPath[:len(currentPath)-popCount]
		}
		currentIndent = indent

		// 处理 key 中包含冒号的情况（如 "qq:757594183:"）
		// SplitN 在第一个冒号处切开，value 末尾的冒号说明它属于 key
		if strings.HasSuffix(value, ":") {
			key = key + ":" + strings.TrimSuffix(value, ":")
			currentPath = append(currentPath, key)
			continue
		}

		if value == "" || value == "|" || value == ">" {
			currentPath = append(currentPath, key)
			continue
		}

		currentPath = append(currentPath, key)
		setDeepValue(*result, currentPath, parseTOMLValue(value))
		currentPath = currentPath[:len(currentPath)-1]
	}

	return nil
}

func setDeepValue(m map[string]interface{}, path []string, value interface{}) {
	current := m
	for i := 0; i < len(path)-1; i++ {
		if _, ok := current[path[i]]; !ok {
			current[path[i]] = make(map[string]interface{})
		}
		next, ok := current[path[i]].(map[string]interface{})
		if !ok {
			next = make(map[string]interface{})
			current[path[i]] = next
		}
		current = next
	}
	current[path[len(path)-1]] = value
}
