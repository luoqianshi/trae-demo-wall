package main

import "sync"

// 计数聚合器：用 map 按分类键累加。
type Aggregator struct {
	// 缺陷：内部 map 没有任何并发保护。Go 的内置 map 不是并发安全的，
	// 多个 goroutine 同时写会触发运行期 fatal「concurrent map writes」崩溃，
	// 即便侥幸不崩，读改写非原子也会丢更新。
	counts map[string]int // 分类键 -> 累计计数
}

// 创建一个空的聚合器。
func NewAggregator() *Aggregator {
	return &Aggregator{counts: make(map[string]int)}
}

// 把某分类计数加 1：无锁直接读改写共享 map——并发写竞态点。
func (a *Aggregator) Add(key string) {
	a.counts[key]++
}

// 返回某分类当前计数。
func (a *Aggregator) Get(key string) int {
	return a.counts[key]
}

// 返回所有分类计数之和。
func (a *Aggregator) Total() int {
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
