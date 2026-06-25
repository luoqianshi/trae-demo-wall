package main

import (
	"fmt"
	"os"
)

// 回归测试：全非负 key 的干净基线（不触发负数取模 bug），分桶应一切正常。
func main() {
	s := NewSharder(4)

	// 非负 key 的桶号就是 key % 4
	cases := map[int]int{0: 0, 1: 1, 2: 2, 3: 3, 4: 0, 7: 3, 10: 2}
	for k, want := range cases {
		if got := s.Bucket(k); got != want {
			fmt.Printf("Bucket(%d)=%d，期望 %d\n", k, got, want)
			os.Exit(1)
		}
	}

	// Count 统计自洽：总和等于输入数量
	keys := []int{0, 1, 2, 3, 4, 5, 6, 7}
	counts := s.Count(4, keys)
	sum := 0
	for _, c := range counts {
		sum += c
	}
	if sum != len(keys) {
		fmt.Printf("Count 总和 %d，期望 %d\n", sum, len(keys))
		os.Exit(1)
	}
	// 0..7 均匀落 4 桶，每桶 2 个
	for i, c := range counts {
		if c != 2 {
			fmt.Printf("桶 %d 计数 %d，期望 2\n", i, c)
			os.Exit(1)
		}
	}
	os.Exit(0)
}
