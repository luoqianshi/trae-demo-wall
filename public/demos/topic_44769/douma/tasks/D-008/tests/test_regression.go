package main

import (
	"fmt"
	"os"
)

// 回归测试：单 goroutine 等价的基础语义正确（buggy 在此应仍能通过——安全基线）。
func main() {
	agg := NewAggregator()
	agg.Add("a")
	agg.Add("a")
	agg.Add("b")
	if agg.Get("a") != 2 {
		fmt.Printf("Get(a) = %d，期望 2\n", agg.Get("a"))
		os.Exit(1)
	}
	if agg.Get("b") != 1 {
		fmt.Printf("Get(b) = %d，期望 1\n", agg.Get("b"))
		os.Exit(1)
	}
	if agg.Total() != 3 {
		fmt.Printf("Total = %d，期望 3\n", agg.Total())
		os.Exit(1)
	}
	// 单 worker 串行累加，结果必精确
	agg2 := NewAggregator()
	if got := RunConcurrent(agg2, 1, 500); got != 500 {
		fmt.Printf("单 worker 总数 = %d，期望 500\n", got)
		os.Exit(1)
	}
	os.Exit(0)
}
