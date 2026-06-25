package webui

import (
	"net/http"
)

// handleLocalChat 本地聊天 API
// POST /api/local-chat
// 绕过 TimingGate/去重/过滤/触发检查，保证必定回复
func (s *Server) handleLocalChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		jsonError(w, 405, "Method not allowed")
		return
	}

	var req struct {
		Content string                `json:"content"`
		History []LocalChatHistoryItem `json:"history"`
	}
	if err := readJSON(r, &req); err != nil {
		jsonError(w, 400, "JSON 解析失败")
		return
	}

	if req.Content == "" {
		jsonError(w, 400, "消息内容不能为空")
		return
	}

	if s.localChatProvider == nil {
		jsonError(w, 503, "本地聊天功能未初始化")
		return
	}

	reply, err := s.localChatProvider.LocalChat(r.Context(), req.Content, req.History)
	if err != nil {
		jsonError(w, 500, err.Error())
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"reply":   reply,
	})
}