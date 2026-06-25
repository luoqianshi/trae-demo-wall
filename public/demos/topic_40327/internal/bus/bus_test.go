package bus

import (
	"sync"
	"testing"
	"time"
)

type testSubscriber struct {
	mu        sync.Mutex
	events    []Event
	eventChan chan Event
}

func (s *testSubscriber) HandleEvent(event Event) {
	s.mu.Lock()
	s.events = append(s.events, event)
	s.mu.Unlock()
	if s.eventChan != nil {
		s.eventChan <- event
	}
}

func (s *testSubscriber) eventsCopy() []Event {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]Event{}, s.events...)
}

func TestBusNew(t *testing.T) {
	bus := &Bus{
		subscribers: make(map[string][]Subscriber),
	}
	if bus == nil {
		t.Fatal("Bus should not be nil")
	}
	if bus.subscribers == nil {
		t.Fatal("subscribers map should be initialized")
	}
}

func TestBusSubscribeAndPublish(t *testing.T) {
	bus := &Bus{
		subscribers: make(map[string][]Subscriber),
	}
	sub := &testSubscriber{eventChan: make(chan Event, 1)}
	bus.Subscribe("test.topic", sub)

	if subscribers, ok := bus.subscribers["test.topic"]; !ok || len(subscribers) != 1 {
		t.Fatal("subscriber should be registered")
	}

	bus.Publish("test.topic", "hello")

	select {
	case event := <-sub.eventChan:
		if event.Topic != "test.topic" {
			t.Errorf("Topic = %s, want test.topic", event.Topic)
		}
		if event.Payload != "hello" {
			t.Errorf("Payload = %v, want hello", event.Payload)
		}
	case <-time.After(time.Second):
		t.Fatal("timeout waiting for event")
	}
}

func TestBusPublishNoTopic(t *testing.T) {
	bus := &Bus{
		subscribers: make(map[string][]Subscriber),
	}
	bus.Publish("nonexistent", "data")
}

func TestBusUnsubscribe(t *testing.T) {
	bus := &Bus{
		subscribers: make(map[string][]Subscriber),
	}
	sub := &testSubscriber{}
	bus.Subscribe("test.topic", sub)

	if len(bus.subscribers["test.topic"]) != 1 {
		t.Fatal("subscriber should be registered")
	}

	bus.Unsubscribe("test.topic", sub)

	if len(bus.subscribers["test.topic"]) != 0 {
		t.Fatal("subscriber should be unregistered")
	}
}

func TestBusUnsubscribeNonExistent(t *testing.T) {
	bus := &Bus{
		subscribers: make(map[string][]Subscriber),
	}
	sub := &testSubscriber{}
	bus.Unsubscribe("nonexistent", sub)
}

func TestBusMultipleSubscribers(t *testing.T) {
	bus := &Bus{
		subscribers: make(map[string][]Subscriber),
	}
	s1 := &testSubscriber{eventChan: make(chan Event, 1)}
	s2 := &testSubscriber{eventChan: make(chan Event, 1)}

	bus.Subscribe("topic", s1)
	bus.Subscribe("topic", s2)
	bus.Publish("topic", "data")

	for i, sub := range []*testSubscriber{s1, s2} {
		select {
		case <-sub.eventChan:
		case <-time.After(time.Second):
			t.Fatalf("timeout waiting for subscriber %d", i+1)
		}
	}
}

func TestBusClose(t *testing.T) {
	bus := &Bus{
		subscribers: make(map[string][]Subscriber),
	}
	bus.Subscribe("topic", &testSubscriber{})
	bus.Close()
	if bus.subscribers != nil {
		t.Error("subscribers should be nil after Close")
	}
}
