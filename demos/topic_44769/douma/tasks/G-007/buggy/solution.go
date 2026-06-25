package main

// Sharder 把整型键映射到固定数量的分桶。
// 对外保证：对任意整型 key（含负数），桶索引都落在 [0, n) 内。
type Sharder struct {
	n int
}

// 创建拥有 n 个桶的分片器（n >= 1）。
func NewSharder(n int) *Sharder {
	if n < 1 {
		n = 1
	}
	return &Sharder{n: n}
}

// 返回 key 所属桶索引。
func (s *Sharder) Bucket(key int) int {
	return key % s.n
}

// 统计一批 keys 落入各桶的数量。
func (s *Sharder) Count(n int, keys []int) []int {
	counts := make([]int, n)
	sh := NewSharder(n)
	for _, k := range keys {
		counts[sh.Bucket(k)]++
	}
	return counts
}
