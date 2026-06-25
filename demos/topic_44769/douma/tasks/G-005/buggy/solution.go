package main

// 事件缓冲：持续追加事件，随时取最近 n 条或全部的快照。
// 对外保证：调用方对快照的修改/append 不得污染缓冲内部状态。
type EventBuffer struct {
	events []int
}

// 创建空缓冲。
func NewEventBuffer() *EventBuffer {
	return &EventBuffer{events: make([]int, 0)}
}

// 追加一个事件。
func (b *EventBuffer) Add(v int) {
	b.events = append(b.events, v)
}

// 当前事件数量。
func (b *EventBuffer) Len() int {
	return len(b.events)
}

// 返回最近 n 条事件（不足 n 条则返回全部）。
func (b *EventBuffer) Recent(n int) []int {
	if n > len(b.events) {
		n = len(b.events)
	}
	start := len(b.events) - n
	return b.events[start:]
}

// 返回全部事件。
func (b *EventBuffer) Snapshot() []int {
	return b.events
}
