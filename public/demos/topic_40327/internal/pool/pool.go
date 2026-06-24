// Package pool 提供基于 sync.Pool 的高频对象复用
// 减少 GC 压力，特别适合 JSON 编解码、HTTP 请求等高并发场景
//
// 使用方式:
//
//	buf := pool.GetBuffer()
//	defer pool.PutBuffer(buf)
//	buf.WriteString("hello")
//
//	sb := pool.GetBuilder()
//	defer pool.PutBuilder(sb)
//	sb.WriteString("world")
package pool

import (
	"bytes"
	"expvar"
	"strings"
	"sync"
	"sync/atomic"
)

// ── bytes.Buffer 池 ──
// 用于 JSON 编解码、HTTP 响应构建等频繁创建 []byte 的场景

var bufferPool = sync.Pool{
	New: func() interface{} {
		return new(bytes.Buffer)
	},
}

// GetBuffer 从池中获取一个 bytes.Buffer（已 Reset）
func GetBuffer() *bytes.Buffer {
	atomic.AddInt64(&stats.BufferGets, 1)
	buf := bufferPool.Get().(*bytes.Buffer)
	buf.Reset()
	return buf
}

// PutBuffer 归还 bytes.Buffer 到池中
func PutBuffer(buf *bytes.Buffer) {
	atomic.AddInt64(&stats.BufferPuts, 1)
	if buf == nil {
		return
	}
	// 限制池中对象大小，避免大对象长期占用内存
	if buf.Cap() > 64*1024 { // 64KB
		return
	}
	buf.Reset()
	bufferPool.Put(buf)
}

// ── strings.Builder 池 ──
// 用于字符串拼接场景，如构建 prompt、格式化消息内容

var builderPool = sync.Pool{
	New: func() interface{} {
		return new(strings.Builder)
	},
}

// GetBuilder 从池中获取一个 strings.Builder（已 Reset）
func GetBuilder() *strings.Builder {
	atomic.AddInt64(&stats.BuilderGets, 1)
	sb := builderPool.Get().(*strings.Builder)
	sb.Reset()
	return sb
}

// PutBuilder 归还 strings.Builder 到池中
func PutBuilder(sb *strings.Builder) {
	atomic.AddInt64(&stats.BuilderPuts, 1)
	if sb == nil {
		return
	}
	if sb.Cap() > 64*1024 {
		return
	}
	sb.Reset()
	builderPool.Put(sb)
}

// ── []byte 缓冲池 ──
// 用于 HTTP 响应读取、图片下载等需要固定大小缓冲区的场景

var (
	bytePool4K   = &sync.Pool{New: func() interface{} { b := make([]byte, 4096); return &b }}
	bytePool32K  = &sync.Pool{New: func() interface{} { b := make([]byte, 32768); return &b }}
	bytePool128K = &sync.Pool{New: func() interface{} { b := make([]byte, 131072); return &b }}
)

// GetBytes 获取指定大小的 []byte 缓冲区
func GetBytes(size int) []byte {
	var bp *sync.Pool
	switch {
	case size <= 4096:
		bp = bytePool4K
	case size <= 32768:
		bp = bytePool32K
	default:
		bp = bytePool128K
	}
	b := bp.Get().(*[]byte)
	return (*b)[:size]
}

// PutBytes 归还 []byte 缓冲区
func PutBytes(b []byte) {
	if b == nil {
		return
	}
	cap := cap(b)
	var bp *sync.Pool
	switch {
	case cap <= 4096:
		bp = bytePool4K
	case cap <= 32768:
		bp = bytePool32K
	default:
		bp = bytePool128K
	}
	bp.Put(&b)
}

// ── 统计信息（调试用） ──

// PoolStats 池统计信息
type PoolStats struct {
	BufferGets  int64 // Buffer 获取次数
	BufferPuts  int64 // Buffer 归还次数
	BuilderGets int64 // Builder 获取次数
	BuilderPuts int64 // Builder 归还次数
}

var stats PoolStats

// poolStats 导出到 expvar 的池统计变量
var (
	poolBufferGets  = new(expvar.Int)
	poolBufferPuts  = new(expvar.Int)
	poolBuilderGets = new(expvar.Int)
	poolBuilderPuts = new(expvar.Int)
)

func init() {
	expvar.Publish("pool_buffer_gets", poolBufferGets)
	expvar.Publish("pool_buffer_puts", poolBufferPuts)
	expvar.Publish("pool_builder_gets", poolBuilderGets)
	expvar.Publish("pool_builder_puts", poolBuilderPuts)
}

// GetStats 获取池统计信息（线程安全，使用原子操作）
func GetStats() PoolStats {
	return PoolStats{
		BufferGets:  atomic.LoadInt64(&stats.BufferGets),
		BufferPuts:  atomic.LoadInt64(&stats.BufferPuts),
		BuilderGets: atomic.LoadInt64(&stats.BuilderGets),
		BuilderPuts: atomic.LoadInt64(&stats.BuilderPuts),
	}
}

// UpdateExpvar 将原子计数器同步到 expvar（供定期调用）
func UpdateExpvar() {
	poolBufferGets.Set(atomic.LoadInt64(&stats.BufferGets))
	poolBufferPuts.Set(atomic.LoadInt64(&stats.BufferPuts))
	poolBuilderGets.Set(atomic.LoadInt64(&stats.BuilderGets))
	poolBuilderPuts.Set(atomic.LoadInt64(&stats.BuilderPuts))
}
