package webui

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"YaraFlow/internal/chat"
	"YaraFlow/internal/download"
)

// MessageStatusEvent 消息处理状态事件
type MessageStatusEvent struct {
	Type         string  `json:"type"`                    // pipeline_start, stage_complete, pipeline_end
	TraceID      string  `json:"trace_id,omitempty"`      // 当前消息的 trace ID
	MsgID        string  `json:"msg_id,omitempty"`        // 消息 ID
	Stage        string  `json:"stage,omitempty"`         // 阶段名称
	DurationMs   int64   `json:"duration_ms,omitempty"`   // 阶段耗时（毫秒）
	TotalMs      float64 `json:"total_ms,omitempty"`      // 总耗时（毫秒）
	StageCount   int     `json:"stage_count,omitempty"`   // 阶段总数
	Content      string  `json:"content,omitempty"`       // 消息内容摘要
	GroupID      string  `json:"group_id,omitempty"`      // 群组
	SenderID     string  `json:"sender_id,omitempty"`     // 发送者
	ShouldReply  bool    `json:"should_reply,omitempty"`  // 是否触发了回复
	ReplyContent string  `json:"reply_content,omitempty"` // 回复内容摘要
	IsRead       bool    `json:"is_read"`                 // 是否已被查看（机器人回复后视为已读）
	CreatedAt    int64   `json:"created_at"`              // 事件时间戳
}

var (
	msgSubscribers   []chan MessageStatusEvent
	msgSubscribersMu sync.Mutex
	msgBuffer        []MessageStatusEvent
	msgBufferMu      sync.Mutex
	maxMsgBuffer     = 200
)

// PushMessageStatus 推送消息处理状态事件到所有 SSE 客户端
func PushMessageStatus(event MessageStatusEvent) {
	event.CreatedAt = time.Now().UnixMilli()

	// 计算已读状态：消息时间戳在会话 LastReplyTime 之前即为已读
	if event.MsgID != "" && event.GroupID != "" || event.SenderID != "" {
		sid := chat.CalculateSessionIDWithInfo(&chat.SessionInfo{
			Platform: "lunar",
			UserID:   event.SenderID,
			GroupID:  event.GroupID,
		})
		if sess, ok := chat.DefaultChatManager.GetSession(sid); ok {
			event.IsRead = event.CreatedAt <= sess.LastReplyTime
		}
	}

	msgBufferMu.Lock()
	msgBuffer = append(msgBuffer, event)
	if len(msgBuffer) > maxMsgBuffer {
		msgBuffer = msgBuffer[len(msgBuffer)-maxMsgBuffer:]
	}
	msgBufferMu.Unlock()

	msgSubscribersMu.Lock()
	defer msgSubscribersMu.Unlock()
	for _, ch := range msgSubscribers {
		select {
		case ch <- event:
		default:
			// 订阅者处理不过来，丢弃
		}
	}
}

// GetRecentMessageEvents 获取最近 N 条消息事件
func GetRecentMessageEvents(n int) []MessageStatusEvent {
	msgBufferMu.Lock()
	defer msgBufferMu.Unlock()
	if len(msgBuffer) <= n {
		result := make([]MessageStatusEvent, len(msgBuffer))
		copy(result, msgBuffer)
		return result
	}
	start := len(msgBuffer) - n
	result := make([]MessageStatusEvent, n)
	copy(result, msgBuffer[start:])
	return result
}

// SubscribeMessageEvents 订阅消息事件流
func SubscribeMessageEvents() chan MessageStatusEvent {
	ch := make(chan MessageStatusEvent, 100)
	msgSubscribersMu.Lock()
	msgSubscribers = append(msgSubscribers, ch)
	msgSubscribersMu.Unlock()
	return ch
}

// UnsubscribeMessageEvents 取消订阅
func UnsubscribeMessageEvents(ch chan MessageStatusEvent) {
	msgSubscribersMu.Lock()
	defer msgSubscribersMu.Unlock()
	for i, sub := range msgSubscribers {
		if sub == ch {
			msgSubscribers = append(msgSubscribers[:i], msgSubscribers[i+1:]...)
			close(ch)
			return
		}
	}
}

func (s *Server) handleMessageStream(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		jsonError(w, 500, "SSE not supported")
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

	// 先发送最近的事件作为初始状态
	recent := GetRecentMessageEvents(20)
	for _, event := range recent {
		data, _ := json.Marshal(event)
		fmt.Fprintf(w, "data: %s\n\n", data)
		flusher.Flush()
	}

	ch := SubscribeMessageEvents()
	defer UnsubscribeMessageEvents(ch)

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case event, ok := <-ch:
			if !ok {
				return
			}
			data, err := json.Marshal(event)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

// handleDownloadProgressStream 处理下载进度 SSE 连接
func (s *Server) handleDownloadProgressStream(w http.ResponseWriter, r *http.Request) {
	download.HandleProgressSSE(w, r)
}

// handleThunderCheck 检测/重新检测迅雷是否可用
func (s *Server) handleThunderCheck(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		// GET: 返回缓存的检测结果
		available := download.IsThunderAvailable()
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"available": available,
		})
		return
	}

	if r.Method == http.MethodPost {
		// POST: 重新检测
		available := download.CheckThunderAvailable()
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"available": available,
		})
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}
