package webui

import (
	"YaraFlow/internal/plugin"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// handleIconLTPX 处理 /api/icon/ltpx/ 请求，返回 LTPX 默认图标
// GET /api/icon/ltpx/  → 列出所有可用图标文件名
// GET /api/icon/ltpx/{name} → 返回指定图标文件
func (s *Server) handleIconLTPX(w http.ResponseWriter, r *http.Request) {
	// 图标目录：基于插件目录推导项目根目录 → icon/LTPX
	if plugin.DefaultPluginManager == nil {
		jsonError(w, 500, "插件管理器未初始化")
		return
	}
	iconDir := filepath.Join(filepath.Dir(plugin.DefaultPluginManager.GetPluginsDir()), "icon", "LTPX")

	// 提取文件名
	name := strings.TrimPrefix(r.URL.Path, "/api/icon/ltpx/")
	name = strings.TrimPrefix(name, "/")

	if r.Method == "GET" && name == "" {
		// 列出所有图标
		entries, err := os.ReadDir(iconDir)
		if err != nil {
			jsonList := make([]string, 0)
			jsonResponse(w, map[string]interface{}{
				"icons": jsonList,
				"count": 0,
			})
			return
		}

		list := make([]string, 0)
		for _, e := range entries {
			if !e.IsDir() && strings.HasSuffix(strings.ToLower(e.Name()), ".webp") {
				list = append(list, e.Name())
			}
		}
		jsonResponse(w, map[string]interface{}{
			"icons": list,
			"count": len(list),
		})
		return
	}

	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	// 安全检查：防止路径穿越
	cleanName := filepath.Clean(name)
	if strings.Contains(cleanName, "..") {
		jsonError(w, 400, "非法文件名")
		return
	}

	filePath := filepath.Join(iconDir, cleanName)
	data, err := os.ReadFile(filePath)
	if err != nil {
		jsonError(w, 404, "图标未找到")
		return
	}

	w.Header().Set("Content-Type", "image/webp")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Write(data)
}
