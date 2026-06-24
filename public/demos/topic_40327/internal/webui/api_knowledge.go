package webui

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"YaraFlow/internal/knowledge"
	"YaraFlow/internal/plugin"

	"github.com/pelletier/go-toml/v2"
	"gopkg.in/yaml.v3"
)

// handleKnowledge 处理 /api/knowledge
func (s *Server) handleKnowledge(w http.ResponseWriter, r *http.Request) {
	if knowledge.DefaultManager == nil {
		jsonError(w, 500, "知识库管理器未初始化")
		return
	}

	switch r.Method {
	case "GET":
		s.listKnowledge(w, r)
	case "POST":
		s.addKnowledge(w, r)
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

// handleKnowledgeAction 处理 /api/knowledge/{id} 和 /api/knowledge/search 等
func (s *Server) handleKnowledgeAction(w http.ResponseWriter, r *http.Request) {
	if knowledge.DefaultManager == nil {
		jsonError(w, 500, "知识库管理器未初始化")
		return
	}

	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/knowledge/"), "/")
	if len(parts) == 0 {
		s.handleKnowledge(w, r)
		return
	}

	first := parts[0]
	switch first {
	case "search":
		s.searchKnowledge(w, r)
	case "import":
		s.importFileKnowledge(w, r)
	default:
		// 解析为 ID
		id, err := strconv.ParseInt(first, 10, 64)
		if err != nil {
			jsonError(w, 400, "无效的知识条目 ID")
			return
		}
		switch r.Method {
		case "GET":
			s.getKnowledge(w, r, id)
		case "PUT":
			s.updateKnowledge(w, r, id)
		case "DELETE":
			s.deleteKnowledge(w, r, id)
		default:
			jsonError(w, 405, "Method not allowed")
		}
	}
}

func (s *Server) listKnowledge(w http.ResponseWriter, r *http.Request) {
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 {
		limit = 50
	}

	entries, total, err := knowledge.DefaultManager.ListEntries(offset, limit)
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("查询知识库失败: %v", err))
		return
	}

	list := make([]map[string]any, 0, len(entries))
	for _, entry := range entries {
		list = append(list, entryToMap(entry))
	}

	jsonResponse(w, map[string]any{
		"success": true,
		"entries": list,
		"total":   total,
		"offset":  offset,
		"limit":   limit,
	})
}

func (s *Server) addKnowledge(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Content string   `json:"content"`
		Tags    []string `json:"tags"`
	}
	if err := readJSON(r, &req); err != nil {
		jsonError(w, 400, fmt.Sprintf("JSON 解析失败: %v", err))
		return
	}
	if req.Content == "" {
		jsonError(w, 400, "内容不能为空")
		return
	}

	entry, err := knowledge.DefaultManager.AddEntry(req.Content, req.Tags)
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("添加知识条目失败: %v", err))
		return
	}

	jsonResponse(w, map[string]any{
		"success": true,
		"entry":   entryToMap(entry),
		"message": "知识条目已添加",
	})
}

func (s *Server) getKnowledge(w http.ResponseWriter, _ *http.Request, id int64) {
	entry, err := knowledge.DefaultManager.GetEntry(id)
	if err != nil {
		jsonError(w, 404, fmt.Sprintf("条目 #%d 不存在", id))
		return
	}
	jsonResponse(w, map[string]any{
		"success": true,
		"entry":   entryToMap(entry),
	})
}

func (s *Server) updateKnowledge(w http.ResponseWriter, r *http.Request, id int64) {
	var req struct {
		Content string   `json:"content"`
		Tags    []string `json:"tags"`
	}
	if err := readJSON(r, &req); err != nil {
		jsonError(w, 400, fmt.Sprintf("JSON 解析失败: %v", err))
		return
	}

	entry, err := knowledge.DefaultManager.UpdateEntry(id, req.Content, req.Tags)
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("更新知识条目失败: %v", err))
		return
	}

	jsonResponse(w, map[string]any{
		"success": true,
		"entry":   entryToMap(entry),
		"message": "知识条目已更新",
	})
}

func (s *Server) deleteKnowledge(w http.ResponseWriter, _ *http.Request, id int64) {
	if err := knowledge.DefaultManager.DeleteEntry(id); err != nil {
		jsonError(w, 500, fmt.Sprintf("删除知识条目失败: %v", err))
		return
	}
	jsonResponse(w, map[string]any{
		"success": true,
		"message": fmt.Sprintf("知识条目 #%d 已删除", id),
	})
}

func (s *Server) searchKnowledge(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		jsonError(w, 400, "搜索关键词不能为空")
		return
	}

	mode := r.URL.Query().Get("mode") // "keyword" 或 "semantic"
	entries, err := knowledge.DefaultManager.SearchByKeyword(q, 20)
	if mode == "semantic" {
		entries, err = knowledge.DefaultManager.SearchSemantic(q, 20)
	}
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("搜索失败: %v", err))
		return
	}

	list := make([]map[string]any, 0, len(entries))
	for _, entry := range entries {
		list = append(list, entryToMap(entry))
	}

	jsonResponse(w, map[string]any{
		"success": true,
		"query":   q,
		"results": list,
		"count":   len(list),
	})
}

func (s *Server) importFileKnowledge(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	// 限制 10MB
	r.ParseMultipartForm(10 << 20)
	file, header, err := r.FormFile("file")
	if err != nil {
		jsonError(w, 400, fmt.Sprintf("读取上传文件失败: %v", err))
		return
	}
	defer file.Close()

	// 读取文件内容
	buf := make([]byte, header.Size)
	if _, err := file.Read(buf); err != nil {
		jsonError(w, 500, fmt.Sprintf("读取文件内容失败: %v", err))
		return
	}

	content := string(buf)
	if content == "" {
		jsonError(w, 400, "文件内容为空")
		return
	}

	// 按行分割导入
	lines := strings.Split(content, "\n")
	imported := 0
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		_, err := knowledge.DefaultManager.AddEntry(line, []string{"imported"})
		if err != nil {
			continue
		}
		imported++
	}

	jsonResponse(w, map[string]any{
		"success":  true,
		"filename": header.Filename,
		"imported": imported,
		"message":  fmt.Sprintf("从 %s 导入 %d 条知识", header.Filename, imported),
	})
}

func entryToMap(e *knowledge.Entry) map[string]any {
	if e == nil {
		return nil
	}
	result := map[string]any{
		"id":         e.ID,
		"content":    e.Content,
		"tags":       e.Tags,
		"source":     e.Source,
		"created_at": e.CreatedAt,
		"updated_at": e.UpdatedAt,
	}
	if e.Tags == nil {
		result["tags"] = []string{}
	}
	return result
}

// ── 插件配置辅助 ──

func getPluginConfigContent(pluginID string) map[string]any {
	pluginDir := resolvePluginDir(pluginID)
	if pluginDir == "" {
		return nil
	}
	// 尝试读取插件目录下的配置文件，按优先级：config.yaml > config.yml > config.toml > config.json
	configCandidates := []string{"config.yaml", "config.yml", "config.toml", "config.json"}
	for _, name := range configCandidates {
		configPath := filepath.Join(pluginDir, name)
		data, err := os.ReadFile(configPath)
		if err == nil {
			result := map[string]any{
				"raw":       string(data),
				"path":      configPath,
				"plugin_id": pluginID,
				"format":    strings.TrimPrefix(filepath.Ext(name), "."),
			}

			// 统一解析配置为 JSON 对象，供可视化编辑器使用
			parsed := parseConfig(data, result["format"].(string))
			if parsed != nil {
				result["parsed"] = parsed
			}

			return result
		}
	}
	return map[string]any{"note": "无配置文件"}
}

// parseConfig 统一解析 YAML/TOML/JSON 配置为 map[string]any
func parseConfig(data []byte, format string) map[string]any {
	var result map[string]any
	switch format {
	case "yaml", "yml":
		if err := yaml.Unmarshal(data, &result); err == nil {
			return result
		}
	case "toml":
		if err := toml.Unmarshal(data, &result); err == nil {
			return result
		}
	case "json":
		if err := json.Unmarshal(data, &result); err == nil {
			return result
		}
	}
	return nil
}

func savePluginConfig(pluginID string, config map[string]any) error {
	pluginDir := resolvePluginDir(pluginID)
	if pluginDir == "" {
		return fmt.Errorf("插件 %s 未找到", pluginID)
	}

	// 优先保存在已有配置文件，其次新建 config.yaml
	configCandidates := []string{"config.yaml", "config.yml", "config.toml", "config.json"}
	configPath := filepath.Join(pluginDir, "config.yaml") // 默认
	for _, name := range configCandidates {
		p := filepath.Join(pluginDir, name)
		if _, err := os.ReadFile(p); err == nil {
			configPath = p
			break
		}
	}

	// 备份
	if existing, err := os.ReadFile(configPath); err == nil {
		backupPath := configPath + ".backup"
		os.WriteFile(backupPath, existing, 0644)
	}

	// 优先使用可视化编辑器传来的 parsed 对象，序列化为原始格式
	if parsedRaw, ok := config["parsed"]; ok {
		format := strings.TrimPrefix(filepath.Ext(configPath), ".")
		serialized, err := serializeConfig(parsedRaw, format)
		if err == nil {
			return os.WriteFile(configPath, serialized, 0644)
		}
		// 序列化失败，回退到 raw 字符串
	}

	rawContent, ok := config["raw"].(string)
	if !ok {
		return fmt.Errorf("配置内容格式错误")
	}

	return os.WriteFile(configPath, []byte(rawContent), 0644)
}

// serializeConfig 将 map[string]any 序列化为指定格式
func serializeConfig(data any, format string) ([]byte, error) {
	switch format {
	case "yaml", "yml":
		return yaml.Marshal(data)
	case "toml":
		return toml.Marshal(data)
	case "json":
		return json.MarshalIndent(data, "", "  ")
	default:
		return yaml.Marshal(data)
	}
}

// resolvePluginDir 解析插件目录（支持已加载和禁用插件）
func resolvePluginDir(pluginID string) string {
	if plugin.DefaultPluginManager == nil {
		return ""
	}
	inst := plugin.DefaultPluginManager.GetPlugin(pluginID)
	if inst != nil {
		return inst.Dir
	}
	// 禁用插件：从 allPluginManifests 获取，或扫描 plugins 目录
	if m := plugin.DefaultPluginManager.GetPluginManifest(pluginID); m != nil {
		// 扫描 plugins 目录匹配 ID
		pluginsDir := plugin.DefaultPluginManager.GetPluginsDir()
		entries, _ := os.ReadDir(pluginsDir)
		for _, e := range entries {
			if !e.IsDir() {
				continue
			}
			manifestPath := filepath.Join(pluginsDir, e.Name(), "plugin.json")
			if data, err := os.ReadFile(manifestPath); err == nil {
				var temp struct {
					ID string `json:"id"`
				}
				json.Unmarshal(data, &temp)
				if temp.ID == pluginID {
					return filepath.Join(pluginsDir, e.Name())
				}
			}
		}
	}
	return ""
}

func buildPluginSchema(pluginID string) map[string]any {
	inst := plugin.DefaultPluginManager.GetPlugin(pluginID)

	// 优先使用已加载插件的 manifest，否则从 allPluginManifests 获取（禁用插件）
	var manifest *plugin.PluginManifest
	if inst != nil {
		manifest = inst.Manifest
	}
	if manifest == nil {
		manifest = plugin.DefaultPluginManager.GetPluginManifest(pluginID)
	}

	// 无 manifest：返回基础的 _plugin_settings 开关
	if manifest == nil {
		return map[string]any{
			"plugin_id": pluginID,
			"sections": map[string]any{
				"_plugin_settings": map[string]any{
					"name":        "_plugin_settings",
					"label":       "插件设置",
					"description": "插件的基础开关设置",
					"fields": []map[string]any{
						{
							"name":        "enabled",
							"type":        "boolean",
							"description": "是否启用此插件",
							"default":     true,
							"required":    false,
						},
					},
				},
			},
			"_note": "插件清单未找到，仅显示基础设置",
		}
	}

	sections := map[string]any{}

	// 检查 manifest 是否已有 plugin section，没有则添加虚拟的
	hasPluginSection := false
	if manifest.Config != nil {
		for _, s := range manifest.Config.Sections {
			if s.Name == "plugin" {
				hasPluginSection = true
				break
			}
		}
	}
	if !hasPluginSection {
		sections["_plugin_settings"] = map[string]any{
			"name":        "_plugin_settings",
			"label":       "插件设置",
			"description": "插件的基础开关设置",
			"fields": []map[string]any{
				{
					"name":        "enabled",
					"type":        "boolean",
					"description": "是否启用此插件",
					"default":     true,
					"required":    false,
				},
			},
		}
	}

	if manifest.Config != nil {
		for _, sec := range manifest.Config.Sections {
			fields := []map[string]any{}
			for _, f := range sec.Fields {
				fields = append(fields, map[string]any{
					"name":        f.Name,
					"type":        f.Type,
					"description": f.Description,
					"default":     f.Default,
					"required":    f.Required,
					"placeholder": f.Placeholder,
				})
			}
			sections[sec.Name] = map[string]any{
				"name":        sec.Name,
				"label":       sec.Label,
				"icon":        sec.Icon,
				"description": sec.Description,
				"fields":      fields,
			}
		}
	}

	result := map[string]any{
		"plugin_id": pluginID,
		"plugin_info": map[string]any{
			"name":        manifest.Name,
			"version":     manifest.Version,
			"description": manifest.Description,
			"author":      manifest.Author.Name,
		},
		"sections": sections,
	}
	if inst == nil {
		result["_note"] = "插件未加载，仅显示基础设置"
	}
	return result
}
