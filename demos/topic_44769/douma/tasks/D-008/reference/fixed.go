package main

import "sync"

// 计数聚合器：用 map 按分类键累加，多个 goroutine 并发写入须串行化保护。
type Aggregator struct {
	mu     sync.Mutex     // 保护 counts 的互斥锁
	counts map[string]int // 分类键 -> 累计计数
}

// 创建一个空的聚合器。
func NewAggregator() *Aggregator {
	return &Aggregator{counts: make(map[string]int)}
}

// 把某分类计数加 1：整段读改写在锁内完成，杜绝并发写 map 崩溃与丢更新。
func (a *Aggregator) Add(key string) {
	a.mu.Lock()
	a.counts[key]++
	a.mu.Unlock()
}

// 返回某分类当前计数。
func (a *Aggregator) Get(key string) int {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.counts[key]
}

// 返回所有分类计数之和。
func (a *Aggregator) Total() int {
	a.mu.Lock()
	defer a.mu.Unlock()
	sum := 0
	for _, v := range a.counts {
		sum += v
	}
	return sum
}

// 轮转使用的固定分类键集合。
var keys = []string{"a", "b", "c", "d"}

// 并发驱动：起 workers 个 goroutine 各 Add perWorker 次，
// 全部结束后返回聚合总数。
func RunConcurrent(agg *Aggregator, workers, perWorker int) int {
	var wg sync.WaitGroup
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func(seed int) {
			defer wg.Done()
			for i := 0; i < perWorker; i++ {
				agg.Add(keys[(seed+i)%len(keys)])
			}
		}(w)
	}
	wg.Wait()
	return agg.Total()
}
