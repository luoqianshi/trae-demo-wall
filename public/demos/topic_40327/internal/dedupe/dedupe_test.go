package dedupe

import (
	"testing"
	"time"
)

func TestIsDuplicate_New(t *testing.T) {
	d := New(5*time.Minute, 1000)

	if d.IsDuplicate("msg-1") {
		t.Error("第一次收到 msg-1 不应视为重复")
	}

	if !d.IsDuplicate("msg-1") {
		t.Error("第二次收到 msg-1 应视为重复")
	}
}

func TestIsDuplicate_EmptyID(t *testing.T) {
	d := New(5*time.Minute, 1000)

	if d.IsDuplicate("") {
		t.Error("空消息ID不应视为重复")
	}
}

func TestSeen(t *testing.T) {
	d := New(5*time.Minute, 1000)

	if d.Seen("msg-1") {
		t.Error("Seen 不应修改记录")
	}
	if d.Seen("msg-1") {
		t.Error("两次 Seen 都应返回 false")
	}

	d.Mark("msg-1")
	if !d.Seen("msg-1") {
		t.Error("Mark 后 Seen 应返回 true")
	}
}

func TestReset(t *testing.T) {
	d := New(5*time.Minute, 1000)

	d.Mark("msg-1")
	d.Mark("msg-2")
	if d.Size() != 2 {
		t.Errorf("期望 size=2, 实际 size=%d", d.Size())
	}

	d.Reset()
	if d.Size() != 0 {
		t.Errorf("Reset 后期望 size=0, 实际 size=%d", d.Size())
	}
}

func TestSize(t *testing.T) {
	d := New(5*time.Minute, 1000)

	if d.Size() != 0 {
		t.Error("初始 size 应为 0")
	}

	d.Mark("a")
	d.Mark("b")
	d.Mark("c")
	if d.Size() != 3 {
		t.Errorf("期望 size=3, 实际 size=%d", d.Size())
	}
}

func TestExpiry(t *testing.T) {
	d := New(50*time.Millisecond, 1000)

	d.Mark("msg-1")
	if !d.Seen("msg-1") {
		t.Error("刚标记的消息应可见")
	}

	time.Sleep(100 * time.Millisecond)

	// IsDuplicate 会在检查时自动清理过期条目
	if d.IsDuplicate("msg-1") {
		t.Error("过期条目在 IsDuplicate 后被清理，不应视为重复")
	}
}

func TestMaxSize_Cleanup(t *testing.T) {
	d := New(5*time.Minute, 10)

	// 插入超过 maxSize 条记录
	for i := 0; i < 25; i++ {
		id := "msg-" + string(rune('a'+i%26))
		d.IsDuplicate(id + string(rune('0'+i/26)))
	}

	// 验证 size 不超过 maxSize
	if d.Size() > 10 {
		t.Errorf("size 应不超过 maxSize=10, 实际 size=%d", d.Size())
	}
}

func TestDefaultDeduplicator(t *testing.T) {
	DefaultDeduplicator = New(5*time.Minute, 1000)

	if DefaultDeduplicator.IsDuplicate("default-test") {
		t.Error("第一次收到 default-test 不应视为重复")
	}
	if !DefaultDeduplicator.IsDuplicate("default-test") {
		t.Error("第二次收到 default-test 应视为重复")
	}
}

func TestNew_ZeroValues(t *testing.T) {
	d := New(0, 0)

	if d.window != 5*time.Minute {
		t.Errorf("零值 window 应默认 5 分钟, 实际 %v", d.window)
	}
	if d.maxSize != 10000 {
		t.Errorf("零值 maxSize 应默认 10000, 实际 %d", d.maxSize)
	}
}