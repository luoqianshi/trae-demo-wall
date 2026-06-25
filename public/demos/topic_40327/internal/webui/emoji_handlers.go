package webui

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"

	"YaraFlow/internal/emoji"
	"YaraFlow/internal/logger"
)

// handleEmojiList 返回所有表情包列表
func (s *Server) handleEmojiList(w http.ResponseWriter, r *http.Request) {
	if emoji.DefaultEmojiManager == nil {
		jsonResponse(w, map[string]interface{}{
			"success": false,
			"message": "表情包管理器未初始化",
		})
		return
	}

	emojis := emoji.DefaultEmojiManager.GetAllEmojis()
	type EmojiItem struct {
		Hash         string   `json:"hash"`
		FileName     string   `json:"file_name"`
		Description  string   `json:"description"`
		Emotions     []string `json:"emotions"`
		QueryCount   int      `json:"query_count"`
		IsRegistered bool     `json:"is_registered"`
	}

	items := make([]EmojiItem, 0, len(emojis))
	for _, e := range emojis {
		items = append(items, EmojiItem{
			Hash:         e.Hash,
			FileName:     e.FileName,
			Description:  e.Description,
			Emotions:     e.Emotions,
			QueryCount:   e.QueryCount,
			IsRegistered: e.IsRegistered,
		})
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"count":   len(items),
		"emojis":  items,
	})
}

// handleEmojiDelete 删除指定表情包
func (s *Server) handleEmojiDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		jsonError(w, http.StatusMethodNotAllowed, "仅支持 POST 请求")
		return
	}

	var body struct {
		Hash string `json:"hash"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Hash == "" {
		jsonError(w, http.StatusBadRequest, "请提供有效的 hash 参数")
		return
	}

	if emoji.DefaultEmojiManager == nil {
		jsonError(w, http.StatusInternalServerError, "表情包管理器未初始化")
		return
	}

	if err := emoji.DefaultEmojiManager.DeleteEmoji(body.Hash); err != nil {
		hashPreview := body.Hash
		if len(hashPreview) > 8 {
			hashPreview = hashPreview[:8]
		}
		logger.Sugar.Errorw("[表情包API] 删除失败", "error", err, "hash", hashPreview)
		jsonError(w, http.StatusInternalServerError, "删除失败: "+err.Error())
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": "已删除表情包并清理存储文件",
	})
}

// handleEmojiCleanup 运行表情包清理
func (s *Server) handleEmojiCleanup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		jsonError(w, http.StatusMethodNotAllowed, "仅支持 POST 请求")
		return
	}

	if emoji.DefaultEmojiManager == nil {
		jsonError(w, http.StatusInternalServerError, "表情包管理器未初始化")
		return
	}

	beforeCount := emoji.DefaultEmojiManager.GetEmojiCount()
	emoji.DefaultEmojiManager.CleanupAll()
	afterCount := emoji.DefaultEmojiManager.GetEmojiCount()

	jsonResponse(w, map[string]interface{}{
		"success":      true,
		"message":      "清理完成",
		"before_count": beforeCount,
		"after_count":  afterCount,
		"removed":      beforeCount - afterCount,
	})
}

// handleEmojiFile 提供表情包图片文件，前端通过 hash 查询后渲染显示
func (s *Server) handleEmojiFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, http.StatusMethodNotAllowed, "仅支持 GET 请求")
		return
	}

	hash := r.URL.Query().Get("hash")
	if hash == "" {
		jsonError(w, http.StatusBadRequest, "缺少 hash 参数")
		return
	}

	if emoji.DefaultEmojiManager == nil {
		jsonError(w, http.StatusInternalServerError, "表情包管理器未初始化")
		return
	}

	info := emoji.DefaultEmojiManager.GetEmojiByHash(hash)
	if info == nil {
		jsonError(w, http.StatusNotFound, "表情包不存在")
		return
	}

	if info.FullPath == "" {
		jsonError(w, http.StatusNotFound, "表情包文件路径为空")
		return
	}

	data, err := os.ReadFile(info.FullPath)
	if err != nil {
		jsonError(w, http.StatusNotFound, "表情包文件读取失败")
		return
	}

	ext := filepath.Ext(info.FullPath)
	contentType := "image/png"
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".gif":
		contentType = "image/gif"
	case ".webp":
		contentType = "image/webp"
	case ".bmp":
		contentType = "image/bmp"
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Write(data)
}
