package download

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

// ProgressEvent 下载进度事件，通过 SSE 推送给前端
type ProgressEvent struct {
	DownloadID string `json:"download_id"`
	URL        string `json:"url"`
	FileName   string `json:"file_name"`
	GroupID    string `json:"group_id"`
	Total      int64  `json:"total"`      // 文件总大小（字节），-1 表示未知
	Downloaded int64  `json:"downloaded"` // 已下载字节数
	Percent    int    `json:"percent"`    // 百分比 0-100
	Speed      int64  `json:"speed"`      // 下载速度（字节/秒）
	Status     string `json:"status"`     // downloading, completed, failed
	Error      string `json:"error,omitempty"`
	CreatedAt  int64  `json:"created_at"`
}

// Tracker 单个下载任务的进度追踪器，线程安全
type Tracker struct {
	ID         string
	URL        string
	FileName   string
	GroupID    string
	Total      int64       // 文件总大小
	downloaded atomic.Int64 // 已下载字节数
	status     string
	errMsg     string
	startTime  time.Time
	mu         sync.Mutex
	stopCh     chan struct{} // 停止定时推送的信号
}

// NewTracker 创建进度追踪器
func NewTracker(id, url, fileName, groupID string, total int64) *Tracker {
	t := &Tracker{
		ID:        id,
		URL:       url,
		FileName:  fileName,
		GroupID:   groupID,
		Total:     total,
		status:    "downloading",
		startTime: time.Now(),
		stopCh:    make(chan struct{}),
	}
	// 注册到全局追踪表
	registerTracker(t)
	// 启动定时进度推送
	go t.progressLoop()
	// 推送初始状态
	t.pushEvent()
	return t
}

// progressLoop 定时推送下载进度（每 500ms）
func (t *Tracker) progressLoop() {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-t.stopCh:
			return
		case <-ticker.C:
			t.pushEvent()
		}
	}
}

// Add 累加已下载字节数（多线程安全）
func (t *Tracker) Add(n int64) {
	t.downloaded.Add(n)
}

// MarkCompleted 标记下载完成
func (t *Tracker) MarkCompleted() {
	t.mu.Lock()
	t.status = "completed"
	t.mu.Unlock()
	close(t.stopCh)
	t.pushEvent()
}

// MarkFailed 标记下载失败
func (t *Tracker) MarkFailed(err string) {
	t.mu.Lock()
	t.status = "failed"
	t.errMsg = err
	t.mu.Unlock()
	close(t.stopCh)
	t.pushEvent()
}

// Remove 从全局追踪表移除
func (t *Tracker) Remove() {
	unregisterTracker(t.ID)
}

// ToEvent 生成进度事件
func (t *Tracker) ToEvent() ProgressEvent {
	downloaded := t.downloaded.Load()
	elapsed := time.Since(t.startTime).Seconds()
	speed := int64(0)
	if elapsed > 0 {
		speed = int64(float64(downloaded) / elapsed)
	}

	percent := 0
	if t.Total > 0 {
		percent = int(downloaded * 100 / t.Total)
		if percent > 100 {
			percent = 100
		}
	}

	t.mu.Lock()
	status := t.status
	errMsg := t.errMsg
	t.mu.Unlock()

	return ProgressEvent{
		DownloadID: t.ID,
		URL:        t.URL,
		FileName:   t.FileName,
		GroupID:    t.GroupID,
		Total:      t.Total,
		Downloaded: downloaded,
		Percent:    percent,
		Speed:      speed,
		Status:     status,
		Error:      errMsg,
		CreatedAt:  time.Now().UnixMilli(),
	}
}

// pushEvent 推送当前进度到所有 SSE 订阅者
func (t *Tracker) pushEvent() {
	PushProgressEvent(t.ToEvent())
}

// === 全局追踪表 & 订阅者 ===

var (
	trackers     = make(map[string]*Tracker)
	trackersMu   sync.Mutex
	subscribers  []chan ProgressEvent
	subscribersMu sync.Mutex
	progressBuffer []ProgressEvent
	progressBufferMu sync.Mutex
	maxProgressBuffer = 100
)

func registerTracker(t *Tracker) {
	trackersMu.Lock()
	trackers[t.ID] = t
	trackersMu.Unlock()
}

func unregisterTracker(id string) {
	trackersMu.Lock()
	delete(trackers, id)
	trackersMu.Unlock()
}

// GetActiveDownloads 获取所有活跃下载的进度事件
func GetActiveDownloads() []ProgressEvent {
	trackersMu.Lock()
	defer trackersMu.Unlock()
	events := make([]ProgressEvent, 0, len(trackers))
	for _, t := range trackers {
		events = append(events, t.ToEvent())
	}
	return events
}

// PushProgressEvent 推送下载进度事件到所有 SSE 客户端
func PushProgressEvent(event ProgressEvent) {
	progressBufferMu.Lock()
	progressBuffer = append(progressBuffer, event)
	if len(progressBuffer) > maxProgressBuffer {
		progressBuffer = progressBuffer[len(progressBuffer)-maxProgressBuffer:]
	}
	progressBufferMu.Unlock()

	subscribersMu.Lock()
	defer subscribersMu.Unlock()
	for _, ch := range subscribers {
		select {
		case ch <- event:
		default:
		}
	}
}

// SubscribeProgress 订阅下载进度事件流
func SubscribeProgress() chan ProgressEvent {
	ch := make(chan ProgressEvent, 100)
	subscribersMu.Lock()
	subscribers = append(subscribers, ch)
	subscribersMu.Unlock()
	return ch
}

// UnsubscribeProgress 取消订阅
func UnsubscribeProgress(ch chan ProgressEvent) {
	subscribersMu.Lock()
	defer subscribersMu.Unlock()
	for i, sub := range subscribers {
		if sub == ch {
			subscribers = append(subscribers[:i], subscribers[i+1:]...)
			close(ch)
			return
		}
	}
}

// HandleProgressSSE 处理下载进度 SSE 连接
func HandleProgressSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", 500)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// 解除 WriteTimeout 限制
	fmt.Fprintf(w, ": ok\n\n")
	flusher.Flush()
	rc := http.NewResponseController(w)
	rc.SetWriteDeadline(time.Time{})

	// 先发送当前活跃下载的初始状态
	for _, event := range GetActiveDownloads() {
		data, _ := json.Marshal(event)
		fmt.Fprintf(w, "data: %s\n\n", data)
		flusher.Flush()
	}

	ch := SubscribeProgress()
	defer UnsubscribeProgress(ch)

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