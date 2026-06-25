package webui

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// BackgroundEntry 单个背景信息
type BackgroundEntry struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	URL       string `json:"url"`
	CreatedAt int64  `json:"created_at"`
}

// BackgroundConfig 背景配置文件
type BackgroundConfig struct {
	Selected string            `json:"selected"`
	List     []BackgroundEntry `json:"list"`
}

var bgDataDir string
var bgConfigPath string
var bgUploadDir string

func init() {
	// 与 main.go 中 ./data/ 路径保持一致
	bgDataDir = filepath.Join("data", "backgrounds")
	bgConfigPath = filepath.Join(bgDataDir, "config.json")
	bgUploadDir = filepath.Join(bgDataDir, "uploads")
}

func getBackgroundConfig() BackgroundConfig {
	os.MkdirAll(bgUploadDir, 0755)
	data, err := os.ReadFile(bgConfigPath)
	if err != nil {
		return BackgroundConfig{List: []BackgroundEntry{}}
	}
	var cfg BackgroundConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return BackgroundConfig{List: []BackgroundEntry{}}
	}
	if cfg.List == nil {
		cfg.List = []BackgroundEntry{}
	}
	return cfg
}

func saveBackgroundConfig(cfg BackgroundConfig) error {
	os.MkdirAll(bgDataDir, 0755)
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(bgConfigPath, data, 0644)
}

func (s *Server) handleBackgrounds(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.handleBackgroundList(w, r)
	case http.MethodPost:
		s.handleBackgroundUpload(w, r)
	case http.MethodDelete:
		s.handleBackgroundDelete(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleBackgroundList(w http.ResponseWriter, _ *http.Request) {
	cfg := getBackgroundConfig()
	// 清理不存在的文件
	valid := make([]BackgroundEntry, 0)
	for _, bg := range cfg.List {
		path := filepath.Join(bgUploadDir, bg.ID)
		if _, err := os.Stat(path); err == nil {
			valid = append(valid, bg)
		}
	}
	cfg.List = valid
	if cfg.Selected != "" {
		found := false
		for _, bg := range valid {
			if bg.ID == cfg.Selected {
				found = true
				break
			}
		}
		if !found {
			cfg.Selected = ""
		}
	}
	saveBackgroundConfig(cfg)

	sort.Slice(cfg.List, func(i, j int) bool {
		return cfg.List[i].CreatedAt > cfg.List[j].CreatedAt
	})

	jsonResponse(w, map[string]any{
		"success":     true,
		"backgrounds": cfg.List,
		"selected":    cfg.Selected,
	})
}

func (s *Server) handleBackgroundUpload(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(16 << 20) // 16 MB max
	file, header, err := r.FormFile("file")
	if err != nil {
		jsonResponse(w, map[string]any{"success": false, "error": "缺少文件"})
		return
	}
	defer file.Close()

	// 只允许图片格式
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" && ext != ".bmp" {
		jsonResponse(w, map[string]any{"success": false, "error": "仅支持 JPG/PNG/GIF/WebP/BMP 格式"})
		return
	}

	name := r.FormValue("name")
	if name == "" {
		name = header.Filename
	}

	id := time.Now().Format("20060102150405") + "_" + header.Filename
	safeID := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '.' || r == '-' {
			return r
		}
		return '_'
	}, id)

	destPath := filepath.Join(bgUploadDir, safeID)
	dst, err := os.Create(destPath)
	if err != nil {
		jsonResponse(w, map[string]any{"success": false, "error": "保存失败"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		jsonResponse(w, map[string]any{"success": false, "error": "写入失败"})
		return
	}

	cfg := getBackgroundConfig()
	entry := BackgroundEntry{
		ID:        safeID,
		Name:      name,
		URL:       "/api/backgrounds/file/" + safeID,
		CreatedAt: time.Now().UnixMilli(),
	}
	cfg.List = append(cfg.List, entry)
	saveBackgroundConfig(cfg)

	jsonResponse(w, map[string]any{
		"success":    true,
		"background": entry,
	})
}

func (s *Server) handleBackgroundDelete(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/backgrounds/")
	if id == "" || id == "select" {
		jsonResponse(w, map[string]any{"success": false, "error": "缺少背景ID"})
		return
	}

	cfg := getBackgroundConfig()
	found := false
	newList := make([]BackgroundEntry, 0)
	for _, bg := range cfg.List {
		if bg.ID == id {
			found = true
			os.Remove(filepath.Join(bgUploadDir, bg.ID))
		} else {
			newList = append(newList, bg)
		}
	}
	if !found {
		jsonResponse(w, map[string]any{"success": false, "error": "背景不存在"})
		return
	}
	cfg.List = newList
	if cfg.Selected == id {
		cfg.Selected = ""
	}
	saveBackgroundConfig(cfg)

	jsonResponse(w, map[string]any{"success": true})
}

func (s *Server) handleBackgroundSelect(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonResponse(w, map[string]any{"success": false, "error": "无效请求"})
		return
	}

	cfg := getBackgroundConfig()
	// ID 为空表示不使用背景
	if body.ID != "" {
		found := false
		for _, bg := range cfg.List {
			if bg.ID == body.ID {
				found = true
				break
			}
		}
		if !found {
			jsonResponse(w, map[string]any{"success": false, "error": "背景不存在"})
			return
		}
	}
	cfg.Selected = body.ID
	saveBackgroundConfig(cfg)

	jsonResponse(w, map[string]any{"success": true, "selected": body.ID})
}

func (s *Server) handleBackgroundFile(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/backgrounds/file/")
	if id == "" {
		http.Error(w, "缺少文件ID", http.StatusBadRequest)
		return
	}

	// 安全检查：防止路径穿越
	safeID := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '.' || r == '-' {
			return r
		}
		return '_'
	}, id)

	filePath := filepath.Join(bgUploadDir, safeID)
	http.ServeFile(w, r, filePath)
}
