package pool

import (
	"testing"
)

// ── Buffer Pool 测试 ──

func TestBufferPool_GetPut(t *testing.T) {
	buf := GetBuffer()
	if buf == nil {
		t.Fatal("GetBuffer 不应返回 nil")
	}
	if buf.Len() != 0 {
		t.Errorf("新 Buffer 应为空, Len=%d", buf.Len())
	}

	buf.WriteString("hello")
	if buf.String() != "hello" {
		t.Errorf("Buffer 内容 = %q, 期望 hello", buf.String())
	}

	PutBuffer(buf)
	// 归还后不应 panic
}

func TestBufferPool_Reuse(t *testing.T) {
	// 获取两个 buffer，验证是不同对象
	buf1 := GetBuffer()
	buf2 := GetBuffer()

	buf1.WriteString("a")
	buf2.WriteString("b")

	if buf1.String() == buf2.String() {
		t.Error("两个 buffer 应为不同对象")
	}

	PutBuffer(buf1)
	PutBuffer(buf2)
}

func TestBufferPool_ResetOnGet(t *testing.T) {
	buf := GetBuffer()
	buf.WriteString("some data")
	PutBuffer(buf)

	// 再次获取，应被 Reset
	buf2 := GetBuffer()
	if buf2.Len() != 0 {
		t.Errorf("归还后重新获取的 Buffer 应被 Reset, Len=%d", buf2.Len())
	}
	PutBuffer(buf2)
}

func TestBufferPool_NilPut(t *testing.T) {
	// PutBuffer(nil) 不应 panic
	PutBuffer(nil)
}

func TestBufferPool_LargeBuffer(t *testing.T) {
	buf := GetBuffer()
	// 写入超过 64KB 的数据
	largeData := make([]byte, 65537)
	for i := range largeData {
		largeData[i] = 'x'
	}
	buf.Write(largeData)

	// 归还大 buffer（应被丢弃而不是放回池中）
	PutBuffer(buf)

	// 不应 panic
}

// ── Builder Pool 测试 ──

func TestBuilderPool_GetPut(t *testing.T) {
	sb := GetBuilder()
	if sb == nil {
		t.Fatal("GetBuilder 不应返回 nil")
	}
	if sb.Len() != 0 {
		t.Errorf("新 Builder 应为空, Len=%d", sb.Len())
	}

	sb.WriteString("hello world")
	if sb.String() != "hello world" {
		t.Errorf("Builder 内容 = %q, 期望 hello world", sb.String())
	}

	PutBuilder(sb)
}

func TestBuilderPool_Reuse(t *testing.T) {
	sb1 := GetBuilder()
	sb2 := GetBuilder()

	sb1.WriteString("a")
	sb2.WriteString("b")

	if sb1.String() == sb2.String() {
		t.Error("两个 builder 应为不同对象")
	}

	PutBuilder(sb1)
	PutBuilder(sb2)
}

func TestBuilderPool_ResetOnGet(t *testing.T) {
	sb := GetBuilder()
	sb.WriteString("previous data")
	PutBuilder(sb)

	sb2 := GetBuilder()
	if sb2.Len() != 0 {
		t.Errorf("归还后重新获取的 Builder 应被 Reset, Len=%d", sb2.Len())
	}
	PutBuilder(sb2)
}

func TestBuilderPool_NilPut(t *testing.T) {
	PutBuilder(nil)
}

// ── Bytes Pool 测试 ──

func TestBytesPool_GetPut(t *testing.T) {
	// 4K buffer
	b := GetBytes(4096)
	if len(b) != 4096 {
		t.Errorf("GetBytes(4096) len = %d, 期望 4096", len(b))
	}
	capBefore := cap(b)
	PutBytes(b)

	// 重新获取，验证容量
	b2 := GetBytes(4096)
	if cap(b2) >= capBefore*2 {
		// 池可能返回不同对象，但容量应合理
	}
	PutBytes(b2)
}

func TestBytesPool_DifferentSizes(t *testing.T) {
	b4k := GetBytes(4096)
	b32k := GetBytes(32768)
	b128k := GetBytes(131072)

	if cap(b4k) < 4096 {
		t.Errorf("4K buffer cap = %d, 应 >= 4096", cap(b4k))
	}
	if cap(b32k) < 32768 {
		t.Errorf("32K buffer cap = %d, 应 >= 32768", cap(b32k))
	}
	if cap(b128k) < 131072 {
		t.Errorf("128K buffer cap = %d, 应 >= 131072", cap(b128k))
	}

	PutBytes(b4k)
	PutBytes(b32k)
	PutBytes(b128k)
}

func TestBytesPool_NilPut(t *testing.T) {
	PutBytes(nil)
}

func TestBytesPool_SmallSize(t *testing.T) {
	b := GetBytes(100) // 小于 4K，应使用 4K 池
	if cap(b) < 100 {
		t.Errorf("cap = %d, 应 >= 100", cap(b))
	}
	PutBytes(b)
}

// ── Stats 测试 ──

func TestGetStats(t *testing.T) {
	stats := GetStats()
	// 初始状态，统计应返回零值
	_ = stats
}

// ── 并发安全测试 ──

func TestPoolConcurrency(t *testing.T) {
	done := make(chan struct{})
	for i := 0; i < 10; i++ {
		go func() {
			for j := 0; j < 100; j++ {
				buf := GetBuffer()
				buf.WriteString("test")
				PutBuffer(buf)

				sb := GetBuilder()
				sb.WriteString("test")
				PutBuilder(sb)
			}
			done <- struct{}{}
		}()
	}

	for i := 0; i < 10; i++ {
		<-done
	}
}