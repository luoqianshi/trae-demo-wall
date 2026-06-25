package dedupe

import (
	"sync"
	"time"
)

// DefaultDeduplicator 全局默认去重器实例
var DefaultDeduplicator *Deduplicator

// Deduplicator 消息去重器，基于滑动窗口 + 消息ID追踪
// 防止同一条消息被重复处理（如WebSocket重连、多平台转发等场景）
type Deduplicator struct {
	mu      sync.Mutex
	seen    map[string]time.Time
	window  time.Duration
	maxSize int
}

// New 创建消息去重器
// window: 消息ID保留窗口时长，超过此时间的记录会被清理
// maxSize: 最大记录数量，超过时清理一半
func New(window time.Duration, maxSize int) *Deduplicator {
	if window <= 0 {
		window = 5 * time.Minute
	}
	if maxSize <= 0 {
		maxSize = 10000
	}
	return &Deduplicator{
		seen:    make(map[string]time.Time, maxSize),
		window:  window,
		maxSize: maxSize,
	}
}

// IsDuplicate 检查消息ID是否重复
// 如果不是重复消息，记录该ID并返回 false
// 如果是重复消息，返回 true
func (d *Deduplicator) IsDuplicate(msgID string) bool {
	if msgID == "" {
		return false
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	// 定期清理过期条目
	d.cleanup()

	if _, exists := d.seen[msgID]; exists {
		return true
	}

	d.seen[msgID] = time.Now()
	return false
}

// Seen 检查消息ID是否已被记录（不记录，仅查询）
func (d *Deduplicator) Seen(msgID string) bool {
	if msgID == "" {
		return false
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	_, exists := d.seen[msgID]
	return exists
}

// Mark 手动标记消息ID为已处理
func (d *Deduplicator) Mark(msgID string) {
	if msgID == "" {
		return
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	d.seen[msgID] = time.Now()
}

// Reset 清空所有记录
func (d *Deduplicator) Reset() {
	d.mu.Lock()
	defer d.mu.Unlock()

	d.seen = make(map[string]time.Time, d.maxSize)
}

// Size 返回当前记录数量
func (d *Deduplicator) Size() int {
	d.mu.Lock()
	defer d.mu.Unlock()

	return len(d.seen)
}

// cleanup 清理过期的消息ID记录（调用前需持有锁）
func (d *Deduplicator) cleanup() {
	now := time.Now()
	cutoff := now.Add(-d.window)

	for id, t := range d.seen {
		if t.Before(cutoff) {
			delete(d.seen, id)
		}
	}

	// 如果超过最大容量，清理一半旧记录
	if len(d.seen) >= d.maxSize {
		cleared := 0
		target := d.maxSize / 2
		// 收集所有key后删除，避免遍历时修改map可能出现的问题
		keys := make([]string, 0, len(d.seen))
		for id := range d.seen {
			keys = append(keys, id)
		}
		for _, id := range keys {
			if cleared >= target {
				break
			}
			delete(d.seen, id)
			cleared++
		}
	}
}
