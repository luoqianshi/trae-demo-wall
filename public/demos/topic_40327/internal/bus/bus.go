package bus

import (
	"sync"
)

type Event struct {
	Topic   string
	Payload any
}

type Subscriber interface {
	HandleEvent(event Event)
}

type Bus struct {
	subscribers map[string][]Subscriber
	mu          sync.RWMutex
}

var DefaultBus *Bus

func Init() {
	DefaultBus = &Bus{
		subscribers: make(map[string][]Subscriber),
	}
}

func (b *Bus) Subscribe(topic string, subscriber Subscriber) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if _, ok := b.subscribers[topic]; !ok {
		b.subscribers[topic] = make([]Subscriber, 0)
	}
	b.subscribers[topic] = append(b.subscribers[topic], subscriber)
}

func (b *Bus) Unsubscribe(topic string, subscriber Subscriber) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if subscribers, ok := b.subscribers[topic]; ok {
		for i, sub := range subscribers {
			if sub == subscriber {
				b.subscribers[topic] = append(subscribers[:i], subscribers[i+1:]...)
				return
			}
		}
	}
}

func (b *Bus) Publish(topic string, payload any) {
	event := Event{
		Topic:   topic,
		Payload: payload,
	}

	b.mu.RLock()
	subs, ok := b.subscribers[topic]
	// 拷贝订阅者切片，避免 Unsubscribe 并发修改底层数组导致 panic 或跳过订阅者
	subscribers := make([]Subscriber, len(subs))
	copy(subscribers, subs)
	b.mu.RUnlock()

	if !ok {
		return
	}

	for _, subscriber := range subscribers {
		go func(sub Subscriber) {
			defer func() {
				if r := recover(); r != nil {
					// 订阅者 panic 不应当影响其他订阅者，但需要记录以便排查
				}
			}()
			sub.HandleEvent(event)
		}(subscriber)
	}
}

func (b *Bus) Close() {
	b.mu.Lock()
	defer b.mu.Unlock()

	for topic := range b.subscribers {
		b.subscribers[topic] = nil
	}
	b.subscribers = nil
}
