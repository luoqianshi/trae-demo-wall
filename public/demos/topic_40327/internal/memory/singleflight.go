package memory

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"sync"
)

// call 表示一个正在进行的调用
type call struct {
	wg  sync.WaitGroup
	val *MemoryQueryResult
	err error
}

// QueryDeduplicator 请求合并器，防止相同参数的并发查询重复执行
type QueryDeduplicator struct {
	mu    sync.Mutex
	calls map[string]*call
}

// NewQueryDeduplicator 创建请求合并器
func NewQueryDeduplicator() *QueryDeduplicator {
	return &QueryDeduplicator{
		calls: make(map[string]*call),
	}
}

// Do 执行查询，如果相同 key 的查询正在执行中，则等待并共享结果
func (d *QueryDeduplicator) Do(key string, fn func() (*MemoryQueryResult, error)) (*MemoryQueryResult, error) {
	d.mu.Lock()
	if c, ok := d.calls[key]; ok {
		d.mu.Unlock()
		c.wg.Wait()
		return c.val, c.err
	}

	c := &call{}
	c.wg.Add(1)
	d.calls[key] = c
	d.mu.Unlock()

	c.val, c.err = fn()
	c.wg.Done()

	d.mu.Lock()
	delete(d.calls, key)
	d.mu.Unlock()

	return c.val, c.err
}

// QueryKey 生成查询去重键
func QueryKey(currentMessage, sessionID, groupID, mode string) string {
	data := fmt.Sprintf("%s|%s|%s|%s", currentMessage, sessionID, groupID, mode)
	h := sha1.New()
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}
