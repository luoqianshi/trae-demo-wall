package webui

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/plugin"
)

// handlePlugins 处理 /api/plugins
func (s *Server) handlePlugins(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		s.listPlugins(w, r)
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

// handlePluginAction 处理 /api/plugins/{id}/...
func (s *Server) handlePluginAction(w http.ResponseWriter, r *http.Request) {
	// 解析路径: /api/plugins/{id}/{action}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/plugins/"), "/")
	if len(parts) < 1 {
		jsonError(w, 400, "缺少插件 ID")
		return
	}

	pluginID := parts[0]
	action := ""
	if len(parts) >= 2 {
		action = parts[1]
	}

	switch action {
	case "reload":
		s.reloadPlugin(w, r, pluginID)
	case "toggle":
		s.togglePlugin(w, r, pluginID)
	case "config":
		s.handlePluginConfig(w, r, pluginID)
	case "schema":
		s.handlePluginSchema(w, r, pluginID)
	case "icon":
		s.handlePluginIcon(w, r, pluginID)
	default:
		// 无 action 时的默认处理
		s.pluginDetail(w, r, pluginID)
	}
}

func (s *Server) listPlugins(w http.ResponseWriter, _ *http.Request) {
	if plugin.DefaultPluginManager == nil {
		jsonResponse(w, map[string]any{
			"plugins": []map[string]any{},
			"count":   0,
		})
		return
	}

	ids := plugin.DefaultPluginManager.GetAllPluginIDs()
	list := make([]map[string]any, 0, len(ids))

	for _, id := range ids {
		status := plugin.DefaultPluginManager.GetPluginStatus(id)
		inst := plugin.DefaultPluginManager.GetPlugin(id)
		info := map[string]any{
			"id":     id,
			"status": status,
		}

		// 优先使用已加载实例的 Manifest，其次使用 allPluginManifests
		manifest := (*plugin.PluginManifest)(nil)
		pluginDir := ""
		if inst != nil {
			manifest = inst.Manifest
			pluginDir = inst.Dir
		} else {
			manifest = plugin.DefaultPluginManager.GetPluginManifest(id)
		}

		if manifest != nil {
			info["name"] = manifest.Name
			info["version"] = manifest.Version
			info["description"] = manifest.Description
			info["type"] = manifest.PluginType
			info["author"] = manifest.Author.Name

			// 如果插件未加载，根据 manifest 推断插件目录
			if pluginDir == "" {
				pluginDir = filepath.Join(plugin.DefaultPluginManager.GetPluginsDir(), id)
			}

			// 从 metadata.json 读取 tags、url、icon（LTP3 包标准元信息）
			meta := readPluginMetadata(pluginDir)
			if meta != nil {
				if tags, ok := meta["tags"].([]any); ok && len(tags) > 0 {
					info["tags"] = tags
				}
				if url, ok := meta["url"].(string); ok && url != "" {
					info["url"] = url
				}
			}

			// 图标：优先插件目录下的图标文件，其次 metadata.json 的 icon 字段，最后 LTPX 默认图标
			iconName := findPluginIcon(pluginDir)
			if iconName != "" {
				info["icon"] = "/api/plugins/" + id + "/icon"
			} else if meta != nil {
				if iconPath, ok := meta["icon"].(string); ok && iconPath != "" {
					info["icon"] = iconPath
				}
			}
			// 最终 fallback：LTPX 默认图标库
			if info["icon"] == nil || info["icon"] == "" {
				info["icon"] = getRandomLTPXIcon()
			}
		}

		// 检查是否有 IPC 包装器
		if ipcWrap := plugin.DefaultPluginManager.GetIPCPlugin(id); ipcWrap != nil {
			info["ipc_mode"] = true
		}

		list = append(list, info)
	}

	jsonResponse(w, map[string]any{
		"plugins": list,
		"count":   len(list),
	})
}

func (s *Server) pluginDetail(w http.ResponseWriter, r *http.Request, pluginID string) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	inst := plugin.DefaultPluginManager.GetPlugin(pluginID)
	if inst == nil || inst.Manifest == nil {
		jsonError(w, 404, fmt.Sprintf("插件 %s 未找到", pluginID))
		return
	}

	jsonResponse(w, map[string]any{
		"id":          inst.Manifest.ID,
		"name":        inst.Manifest.Name,
		"version":     inst.Manifest.Version,
		"description": inst.Manifest.Description,
		"author":      inst.Manifest.Author.Name,
		"type":        inst.Manifest.PluginType,
		"status":      inst.Status,
	})
}

func (s *Server) reloadPlugin(w http.ResponseWriter, r *http.Request, pluginID string) {
	if r.Method != "POST" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	if plugin.DefaultPluginManager == nil {
		jsonError(w, 500, "插件管理器未初始化")
		return
	}

	if err := plugin.DefaultPluginManager.Reload(pluginID); err != nil {
		jsonError(w, 500, fmt.Sprintf("重载失败: %v", err))
		return
	}

	jsonResponse(w, map[string]any{
		"success": true,
		"message": fmt.Sprintf("插件 %s 已重载", pluginID),
	})
}

func (s *Server) togglePlugin(w http.ResponseWriter, r *http.Request, pluginID string) {
	if r.Method != "POST" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	if plugin.DefaultPluginManager == nil {
		jsonError(w, 500, "插件管理器未初始化")
		return
	}

	// 读取当前配置
	configContent := getPluginConfigContent(pluginID)
	if configContent == nil {
		configContent = map[string]any{}
	}
	parsed := map[string]any{}
	if raw, ok := configContent["parsed"].(map[string]any); ok {
		parsed = raw
	}

	// 使用实际插件状态判断当前是否启用（而非配置文件）
	currentStatus := plugin.DefaultPluginManager.GetPluginStatus(pluginID)
	currentEnabled := currentStatus == plugin.PluginStatusLoaded
	newEnabled := !currentEnabled
	// 写入嵌套路径
	if pluginSection, ok := parsed["plugin"].(map[string]any); ok {
		pluginSection["enabled"] = newEnabled
	} else {
		parsed["plugin"] = map[string]any{"enabled": newEnabled}
	}

	// 保存配置
	configContent["parsed"] = parsed
	if err := savePluginConfig(pluginID, configContent); err != nil {
		logger.Sugar.Warnw("[WebUI] 保存插件配置失败", "pluginID", pluginID, "error", err)
	}

	// 加载/卸载插件
	if newEnabled {
		plugin.DefaultPluginManager.EnablePlugin(pluginID)
		if err := plugin.DefaultPluginManager.Load(pluginID); err != nil {
			jsonResponse(w, map[string]any{
				"success": false,
				"enabled": false,
				"message": fmt.Sprintf("启用插件 %s 失败: %v", pluginID, err),
			})
			return
		}
		jsonResponse(w, map[string]any{
			"success": true,
			"enabled": true,
			"message": fmt.Sprintf("插件 %s 已启用", pluginID),
		})
	} else {
		plugin.DefaultPluginManager.DisablePlugin(pluginID)
		if err := plugin.DefaultPluginManager.Unload(pluginID); err != nil {
			logger.Sugar.Warnw("[WebUI] 卸载插件失败", "pluginID", pluginID, "error", err)
		}
		jsonResponse(w, map[string]any{
			"success": true,
			"enabled": false,
			"message": fmt.Sprintf("插件 %s 已禁用", pluginID),
		})
	}
}

func (s *Server) handlePluginConfig(w http.ResponseWriter, r *http.Request, pluginID string) {
	switch r.Method {
	case "GET":
		// 获取插件配置文件内容（如果有的话）
		jsonResponse(w, map[string]any{
			"success":   true,
			"plugin_id": pluginID,
			"config":    getPluginConfigContent(pluginID),
			"message":   "插件配置以 TOML/JSON 形式存储在插件目录中",
		})
	case "PUT":
		var req map[string]any
		if err := readJSON(r, &req); err != nil {
			jsonError(w, 400, fmt.Sprintf("JSON 解析失败: %v", err))
			return
		}
		if err := savePluginConfig(pluginID, req); err != nil {
			jsonError(w, 500, fmt.Sprintf("保存配置失败: %v", err))
			return
		}
		jsonResponse(w, map[string]any{
			"success": true,
			"message": "插件配置已保存，即将自动热更新",
		})
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

func (s *Server) handlePluginSchema(w http.ResponseWriter, r *http.Request, pluginID string) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}
	jsonResponse(w, map[string]any{
		"success": true,
		"schema":  buildPluginSchema(pluginID),
	})
}

// ── 辅助函数 ──

func readJSON(r *http.Request, v any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}

// findPluginIcon 在插件目录中查找图标文件（icon.webp / icon.png / icon.svg）
func findPluginIcon(pluginDir string) string {
	candidates := []string{"icon.webp", "icon.png", "icon.svg", "icon.jpg", "icon.jpeg"}
	for _, name := range candidates {
		if _, err := os.Stat(filepath.Join(pluginDir, name)); err == nil {
			return name
		}
	}
	return ""
}

// handlePluginIcon 提供插件图标文件
func (s *Server) handlePluginIcon(w http.ResponseWriter, r *http.Request, pluginID string) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	pluginDir := resolvePluginDir(pluginID)
	if pluginDir == "" {
		jsonError(w, 404, "插件未找到")
		return
	}

	iconName := findPluginIcon(pluginDir)
	if iconName == "" {
		jsonError(w, 404, "插件无图标")
		return
	}

	iconPath := filepath.Join(pluginDir, iconName)
	data, err := os.ReadFile(iconPath)
	if err != nil {
		jsonError(w, 404, "图标读取失败")
		return
	}

	// 根据扩展名设置 Content-Type
	ext := strings.ToLower(filepath.Ext(iconName))
	contentType := "image/webp"
	switch ext {
	case ".png":
		contentType = "image/png"
	case ".svg":
		contentType = "image/svg+xml"
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Write(data)
}

// readPluginMetadata 读取插件目录下的 metadata.json，返回解析后的 map
func readPluginMetadata(pluginDir string) map[string]any {
	data, err := os.ReadFile(filepath.Join(pluginDir, "metadata.json"))
	if err != nil {
		return nil
	}
	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		return nil
	}
	return result
}

// getRandomLTPXIcon 从 icon/LTPX 目录随机选一个图标，返回前端可用的 URL
func getRandomLTPXIcon() string {
	if plugin.DefaultPluginManager == nil {
		return ""
	}
	iconDir := filepath.Join(filepath.Dir(plugin.DefaultPluginManager.GetPluginsDir()), "icon", "LTPX")
	entries, err := os.ReadDir(iconDir)
	if err != nil {
		return ""
	}
	var icons []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(strings.ToLower(e.Name()), ".webp") {
			icons = append(icons, e.Name())
		}
	}
	if len(icons) == 0 {
		return ""
	}
	return "/api/icon/ltpx/" + icons[rand.Intn(len(icons))]
}
