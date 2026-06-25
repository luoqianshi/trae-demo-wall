package webui

import (
	"fmt"
	"io"
	"net/http"
	"strings"

	"YaraFlow/internal/tongshadow"
)

// handleTongShadow 处理 /api/tong-shadow
func (s *Server) handleTongShadow(w http.ResponseWriter, r *http.Request) {
	if tongshadow.DefaultManager == nil {
		jsonError(w, 500, "瞳影管理器未初始化")
		return
	}

	switch r.Method {
	case "GET":
		s.listTongShadow(w, r)
	case "POST":
		s.addTongShadow(w, r)
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

// handleTongShadowAction 处理 /api/tong-shadow/{id}/image 和 /api/tong-shadow/{id}
func (s *Server) handleTongShadowAction(w http.ResponseWriter, r *http.Request) {
	if tongshadow.DefaultManager == nil {
		jsonError(w, 500, "瞳影管理器未初始化")
		return
	}

	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/tong-shadow/"), "/")
	if len(parts) == 0 {
		s.handleTongShadow(w, r)
		return
	}

	first := parts[0]

	// /api/tong-shadow/{id}/image
	if len(parts) >= 2 && parts[1] == "image" {
		s.getTongShadowImage(w, r, first)
		return
	}

	// /api/tong-shadow/{id}
	switch r.Method {
	case "GET":
		s.getTongShadow(w, r, first)
	case "DELETE":
		s.deleteTongShadow(w, r, first)
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

func (s *Server) listTongShadow(w http.ResponseWriter, _ *http.Request) {
	items, err := tongshadow.DefaultManager.ListPortraits()
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("查询自画像列表失败: %v", err))
		return
	}

	if items == nil {
		items = []*tongshadow.PortraitListItem{}
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"items":   items,
		"count":   len(items),
	})
}

func (s *Server) addTongShadow(w http.ResponseWriter, r *http.Request) {
	// 限制 20MB
	r.ParseMultipartForm(20 << 20)

	file, header, err := r.FormFile("file")
	if err != nil {
		jsonError(w, 400, fmt.Sprintf("读取上传文件失败: %v", err))
		return
	}
	defer file.Close()

	// 校验 MIME 类型
	mimeType := header.Header.Get("Content-Type")
	if !strings.HasPrefix(mimeType, "image/") {
		jsonError(w, 400, "仅支持图片文件")
		return
	}

	// 读取文件内容
	imageData, err := io.ReadAll(file)
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("读取文件内容失败: %v", err))
		return
	}

	item, err := tongshadow.DefaultManager.AddPortrait(imageData, mimeType)
	if err != nil {
		jsonError(w, 500, err.Error())
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"item":    item,
		"message": "自画像已添加",
	})
}

func (s *Server) getTongShadow(w http.ResponseWriter, _ *http.Request, id string) {
	items, err := tongshadow.DefaultManager.ListPortraits()
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("查询失败: %v", err))
		return
	}

	for _, item := range items {
		if item.ID == id {
			jsonResponse(w, map[string]interface{}{
				"success": true,
				"item":    item,
			})
			return
		}
	}

	jsonError(w, 404, "自画像不存在")
}

func (s *Server) getTongShadowImage(w http.ResponseWriter, _ *http.Request, id string) {
	imageData, mimeType, err := tongshadow.DefaultManager.GetImageData(id)
	if err != nil {
		jsonError(w, 404, fmt.Sprintf("获取图片失败: %v", err))
		return
	}

	w.Header().Set("Content-Type", mimeType)
	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Write(imageData)
}

func (s *Server) deleteTongShadow(w http.ResponseWriter, _ *http.Request, id string) {
	if err := tongshadow.DefaultManager.DeletePortrait(id); err != nil {
		jsonError(w, 500, fmt.Sprintf("删除自画像失败: %v", err))
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": "自画像已删除",
	})
}
