package webui

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"YaraFlow/internal/monitor"
)

// handleMonitorPreviews 列出所有 Prompt 预览文件
func (s *Server) handleMonitorPreviews(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	previews := monitor.ListPreviews()
	type item struct {
		HTMLPath        string `json:"html_path"`
		TXTPath         string `json:"txt_path"`
		JSONPath        string `json:"json_path,omitempty"`
		Category        string `json:"category"`
		Time            string `json:"time"`
		URI             string `json:"uri"`
		MsgID           string `json:"msg_id,omitempty"` // 关联的原始消息 ID，前端用于精确匹配
		ResponseSummary string `json:"response_summary,omitempty"`
		PreviewHTMLURI  string `json:"preview_html_uri,omitempty"`
		PreviewTXTURI   string `json:"preview_txt_uri,omitempty"`
		PreviewJSONURI  string `json:"preview_json_uri,omitempty"`
	}
	list := make([]item, 0, len(previews))
	for _, p := range previews {
		relPath, err := filepath.Rel(monitorPreviewBasePath(), p.HTMLPath)
		if err != nil {
			relPath = p.HTMLPath
		}
		relPath = strings.ReplaceAll(relPath, "\\", "/")
		relTxtPath := strings.ReplaceAll(filepath.Join(filepath.Dir(relPath), strings.TrimSuffix(filepath.Base(relPath), ".html")+".txt"), "\\", "/")
		relJSONPath := strings.ReplaceAll(filepath.Join(filepath.Dir(relPath), strings.TrimSuffix(filepath.Base(relPath), ".html")+".json"), "\\", "/")

		htmlURI := "/api/monitor/preview?path=" + url.QueryEscape(relPath)
		txtURI := "/api/monitor/preview?path=" + url.QueryEscape(relTxtPath)
		jsonURI := "/api/monitor/preview?path=" + url.QueryEscape(relJSONPath)

		// 从 JSON 预览文件中提取 msg_id，用于前端精确匹配消息
		var msgID string
		if content, err := os.ReadFile(p.JSONPath); err == nil {
			var detail monitor.PromptDetail
			if json.Unmarshal(content, &detail) == nil {
				if v, ok := detail.Metadata["msg_id"]; ok {
					msgID = v
				}
			}
		}

		// 从 TXT 文件读取回复摘要
		var summary string
		if content, err := os.ReadFile(p.TXTPath); err == nil {
			// 提取 RESPONSE 或 ASSISTANT 部分作为摘要
			parts := strings.SplitN(string(content), "--- RESPONSE", 2)
			if len(parts) == 2 {
				summary = strings.TrimSpace(parts[1])
			} else {
				parts = strings.SplitN(string(content), "--- ASSISTANT ---", 2)
				if len(parts) == 2 {
					summary = strings.TrimSpace(parts[1])
				}
			}
			if len(summary) > 300 {
				summary = summary[:300] + "..."
			}
		}

		it := item{
			HTMLPath:        p.HTMLPath,
			TXTPath:         p.TXTPath,
			JSONPath:        p.JSONPath,
			Category:        string(p.Category),
			Time:            p.Time.Format("2006-01-02 15:04:05"),
			URI:             htmlURI,
			MsgID:           msgID,
			ResponseSummary: summary,
			PreviewHTMLURI:  htmlURI,
			PreviewTXTURI:   txtURI,
			PreviewJSONURI:  jsonURI,
		}
		list = append(list, it)
	}

	jsonResponse(w, map[string]interface{}{
		"success":  true,
		"previews": list,
		"count":    len(list),
	})
}

// handleMonitorPreview 提供单个预览文件的内容
func (s *Server) handleMonitorPreview(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	relPath := r.URL.Query().Get("path")
	if relPath == "" {
		jsonError(w, 400, "缺少 path 参数")
		return
	}

	// 安全检查：防止路径穿越
	cleanPath := filepath.Clean(relPath)
	if strings.Contains(cleanPath, "..") {
		jsonError(w, 403, "不允许的路径")
		return
	}

	fullPath := filepath.Join(monitorPreviewBasePath(), cleanPath)
	content, err := os.ReadFile(fullPath)
	if err != nil {
		jsonError(w, 404, fmt.Sprintf("预览文件不存在: %v", err))
		return
	}

	// 根据文件扩展名设置 Content-Type
	contentType := "text/plain; charset=utf-8"
	if strings.HasSuffix(fullPath, ".html") {
		contentType = "text/html; charset=utf-8"
	}
	w.Header().Set("Content-Type", contentType)
	w.Write(content)
}

// monitorPreviewBasePath 返回预览文件的基础目录
func monitorPreviewBasePath() string {
	return filepath.Join("logs", "prompt_previews")
}

// handleMonitorStages 处理阶段状态 SSE 流
func (s *Server) handleMonitorStagesStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		jsonError(w, 500, "不支持 SSE")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// 解除 WriteTimeout 限制，避免 SSE 长连接被周期性断开
	fmt.Fprintf(w, ": ok\n\n")
	flusher.Flush()
	rc := http.NewResponseController(w)
	rc.SetWriteDeadline(time.Time{})

	// 先发送快照
	snapshot := monitor.StageSnapshot()
	for _, ev := range snapshot {
		data, err := json.Marshal(ev)
		if err != nil {
			continue
		}
		fmt.Fprintf(w, "data: %s\n\n", data)
		flusher.Flush()
	}

	ch := monitor.SubscribeStageEvents()
	defer monitor.UnsubscribeStageEvents(ch)

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case ev, ok := <-ch:
			if !ok {
				return
			}
			data, err := json.Marshal(ev)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		case <-ticker.C:
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		}
	}
}

// handleMonitorStages 返回当前阶段状态快照
func (s *Server) handleMonitorStages(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	snapshot := monitor.StageSnapshot()
	jsonResponse(w, map[string]interface{}{
		"success": true,
		"stages":  snapshot,
		"count":   len(snapshot),
	})
}

// handleJargonList 列出所有黑话/新词条目
func (s *Server) handleJargonList(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	if s.jargonManager == nil {
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"entries": []interface{}{},
			"count":   0,
		})
		return
	}

	entries, err := s.jargonManager.List(200)
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("获取黑话列表失败: %v", err))
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"entries": entries,
		"count":   len(entries),
	})
}

// handleJargonStats 获取黑话/新词统计信息
func (s *Server) handleJargonStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	if s.jargonManager == nil {
		jsonResponse(w, map[string]interface{}{
			"success": true,
			"stats":   map[string]interface{}{"total": 0},
		})
		return
	}

	stats := s.jargonManager.GetStats()
	jsonResponse(w, map[string]interface{}{
		"success": true,
		"stats":   stats,
	})
}

// handleJargonDelete 删除指定黑话条目
func (s *Server) handleJargonDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		jsonError(w, 405, "Method not allowed")
		return
	}

	if s.jargonManager == nil {
		jsonError(w, 500, "黑话管理器未初始化")
		return
	}

	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		jsonError(w, 400, "请提供有效的 id 参数")
		return
	}

	if err := s.jargonManager.Delete(id); err != nil {
		jsonError(w, 500, fmt.Sprintf("删除黑话失败: %v", err))
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("黑话条目 #%d 已删除", id),
	})
}
