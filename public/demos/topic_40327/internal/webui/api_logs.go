package webui

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/chat"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/rule"
	"YaraFlow/internal/storage"
)

// ── 日志流管理 ──

var (
	logSubscribers   []chan string
	logSubscribersMu sync.Mutex
	logBuffer        []string
	logBufferMu      sync.Mutex
	maxLogBuffer     = 500
)

// PushLog 向所有订阅者推送日志行
func PushLog(line string) {
	logBufferMu.Lock()
	logBuffer = append(logBuffer, line)
	if len(logBuffer) > maxLogBuffer {
		logBuffer = logBuffer[len(logBuffer)-maxLogBuffer:]
	}
	logBufferMu.Unlock()

	logSubscribersMu.Lock()
	defer logSubscribersMu.Unlock()
	for _, ch := range logSubscribers {
		select {
		case ch <- line:
		default:
			// 订阅者处理不过来，丢弃
		}
	}
}

// GetRecentLogs 获取最近 N 条日志
func GetRecentLogs(n int) []string {
	logBufferMu.Lock()
	defer logBufferMu.Unlock()
	if len(logBuffer) <= n {
		result := make([]string, len(logBuffer))
		copy(result, logBuffer)
		return result
	}
	start := len(logBuffer) - n
	result := make([]string, n)
	copy(result, logBuffer[start:])
	return result
}

// SubscribeLogs 订阅日志流
func SubscribeLogs() chan string {
	ch := make(chan string, 100)
	logSubscribersMu.Lock()
	logSubscribers = append(logSubscribers, ch)
	logSubscribersMu.Unlock()
	return ch
}

// UnsubscribeLogs 取消订阅
func UnsubscribeLogs(ch chan string) {
	logSubscribersMu.Lock()
	defer logSubscribersMu.Unlock()
	for i, sub := range logSubscribers {
		if sub == ch {
			logSubscribers = append(logSubscribers[:i], logSubscribers[i+1:]...)
			close(ch)
			return
		}
	}
}

// handleRules 返回规则列表
func (s *Server) handleRules(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		s.handleRulesList(w, r)
	case "POST":
		s.handleRulesCreate(w, r)
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

func (s *Server) handleRulesList(w http.ResponseWriter, _ *http.Request) {
	rules := rule.DefaultRuleEngine.GetRules()
	list := make([]map[string]any, 0, len(rules))
	for _, r := range rules {
		list = append(list, map[string]any{
			"id":          r.Name,
			"name":        r.Name,
			"description": r.Description,
			"enabled":     r.Enabled,
			"priority":    r.Priority,
			"builtin":     rule.DefaultRuleEngine.IsBuiltin(r.Name),
			"condition":   r.Condition,
			"action":      r.Action,
		})
	}

	jsonResponse(w, map[string]any{
		"success": true,
		"rules":   list,
		"count":   len(list),
	})
}

// handleRulesCreate 创建新规则
func (s *Server) handleRulesCreate(w http.ResponseWriter, r *http.Request) {
	var newRule rule.Rule
	if err := readJSON(r, &newRule); err != nil {
		jsonError(w, 400, fmt.Sprintf("JSON 解析失败: %v", err))
		return
	}

	if newRule.Name == "" {
		jsonError(w, 400, "规则名称不能为空")
		return
	}

	rule.DefaultRuleEngine.AddRule(newRule)

	// 自动保存到文件
	if path := rule.DefaultRuleEngine.GetRulesPath(); path != "" {
		if err := rule.DefaultRuleEngine.SaveRulesToFile(path); err != nil {
			logger.Sugar.Warnw("[WebUI] 保存规则失败", "error", err)
		}
	}

	jsonResponse(w, map[string]any{
		"success": true,
		"message": fmt.Sprintf("规则 %s 创建成功", newRule.Name),
	})
}

// handleRulesTest 测试规则匹配
func (s *Server) handleRulesTest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Content  string `json:"content"`
		SenderID string `json:"sender_id"`
		GroupID  string `json:"group_id"`
		IsAtMe   bool   `json:"is_at_me"`
		HasImage bool   `json:"has_image"`
	}
	if err := readJSON(r, &req); err != nil {
		jsonError(w, 400, fmt.Sprintf("JSON 解析失败: %v", err))
		return
	}

	if req.Content == "" {
		jsonError(w, 400, "消息内容不能为空")
		return
	}

	testMsg := &platform.Message{
		Content:  req.Content,
		SenderID: req.SenderID,
		GroupID:  req.GroupID,
		IsAtMe:   req.IsAtMe,
		HasImage: req.HasImage,
	}

	results := rule.DefaultRuleEngine.TestMatch(testMsg)

	matchedCount := 0
	for _, r := range results {
		if r.Matched {
			matchedCount++
		}
	}

	jsonResponse(w, map[string]any{
		"success":       true,
		"results":       results,
		"total":         len(results),
		"matched_count": matchedCount,
	})
}

// handleRulesUpdate 更新/删除/切换规则
func (s *Server) handleRulesUpdate(w http.ResponseWriter, r *http.Request) {
	// 提取规则名称: /api/rules/{name}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/rules/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		jsonError(w, 400, "缺少规则名称")
		return
	}
	ruleName := parts[0]
	action := ""
	if len(parts) > 1 {
		action = parts[1]
	}

	switch {
	case ruleName == "test" && action == "" && r.Method == "POST":
		// POST /api/rules/test — 规则测试端点
		s.handleRulesTest(w, r)
		return

	case action == "test" && r.Method == "POST":
		s.handleRulesTest(w, r)
		return

	case action == "toggle" && r.Method == "POST":
		enabled, err := rule.DefaultRuleEngine.ToggleRule(ruleName)
		if err != nil {
			jsonError(w, 404, err.Error())
			return
		}
		if path := rule.DefaultRuleEngine.GetRulesPath(); path != "" {
			rule.DefaultRuleEngine.SaveRulesToFile(path)
		}
		jsonResponse(w, map[string]any{
			"success": true,
			"enabled": enabled,
			"message": fmt.Sprintf("规则 %s 已%s", ruleName, map[bool]string{true: "启用", false: "禁用"}[enabled]),
		})

	case r.Method == "PUT":
		var updatedRule rule.Rule
		if err := readJSON(r, &updatedRule); err != nil {
			jsonError(w, 400, fmt.Sprintf("JSON 解析失败: %v", err))
			return
		}
		if err := rule.DefaultRuleEngine.UpdateRule(ruleName, updatedRule); err != nil {
			jsonError(w, 404, err.Error())
			return
		}
		if path := rule.DefaultRuleEngine.GetRulesPath(); path != "" {
			rule.DefaultRuleEngine.SaveRulesToFile(path)
		}
		jsonResponse(w, map[string]any{
			"success": true,
			"message": fmt.Sprintf("规则 %s 更新成功", ruleName),
		})

	case r.Method == "DELETE":
		if err := rule.DefaultRuleEngine.DeleteRule(ruleName); err != nil {
			jsonError(w, 404, err.Error())
			return
		}
		if path := rule.DefaultRuleEngine.GetRulesPath(); path != "" {
			rule.DefaultRuleEngine.SaveRulesToFile(path)
		}
		jsonResponse(w, map[string]any{
			"success": true,
			"message": fmt.Sprintf("规则 %s 删除成功", ruleName),
		})

	default:
		jsonError(w, 405, "Method not allowed")
	}
}

// handleChatRecent 最近聊天消息
func (s *Server) handleChatRecent(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := fmt.Sscanf(l, "%d", &limit); err != nil || parsed == 0 {
			limit = 50
		}
	}

	records, err := storage.GetRecentMessages("", "", limit)
	if err != nil {
		jsonError(w, 500, fmt.Sprintf("获取消息失败: %v", err))
		return
	}

	list := make([]map[string]any, 0, len(records))
	for _, r := range records {
		// 计算已读状态：消息时间戳在会话 LastReplyTime 之前即为已读
		isRead := true
		sid := chat.CalculateSessionIDWithInfo(&chat.SessionInfo{
			Platform:  r.Platform,
			UserID:    r.SenderID,
			GroupID:   r.GroupID,
			AccountID: "",
			Scope:     "",
		})
		if sess, ok := chat.DefaultChatManager.GetSession(sid); ok {
			isRead = r.Timestamp <= sess.LastReplyTime
		}

		list = append(list, map[string]any{
			"id":              r.MessageID,
			"platform":        r.Platform,
			"sender_id":       r.SenderID,
			"sender":          r.SenderName,
			"group_id":        r.GroupID,
			"group_name":      r.GroupName,
			"content":         r.Content,
			"direction":       r.Direction,
			"is_at_me":        r.IsAtMe,
			"has_image":       r.HasImage,
			"is_read":         isRead,
			"reply_to_msg_id": r.ReplyToMsgID,
			"timestamp":       r.Timestamp,
		})
	}

	jsonResponse(w, map[string]any{
		"success":  true,
		"messages": list,
		"count":    len(list),
	})
}

// handleLogStream SSE 日志推送
func (s *Server) handleLogStream(w http.ResponseWriter, r *http.Request) {
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

	// 先发一条 SSE 注释触发首次写入，然后解除 WriteTimeout 限制
	// 否则 http.Server.WriteTimeout(30s) 会周期性断开 SSE 长连接，
	// 浏览器 EventSource 自动重连后又推送缓存日志，导致前端反复弹出旧消息
	fmt.Fprintf(w, ": ok\n\n")
	flusher.Flush()
	rc := http.NewResponseController(w)
	rc.SetWriteDeadline(time.Time{})

	// 获取已缓存的日志
	logs := GetRecentLogs(100)
	for _, log := range logs {
		fmt.Fprintf(w, "data: %s\n\n", log)
		flusher.Flush()
	}

	// 持续监听新日志
	logChan := SubscribeLogs()
	defer UnsubscribeLogs(logChan)

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case logLine, ok := <-logChan:
			if !ok {
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", logLine)
			flusher.Flush()
		case <-ticker.C:
			// 心跳
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}
