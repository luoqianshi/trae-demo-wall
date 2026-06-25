package main

import (
	"fmt"
	"os"
)

// 回归测试：基线内容正确性 —— 只读不改时，Recent/Snapshot 内容与顺序正确。
func main() {
	b := NewEventBuffer()
	if b.Len() != 0 {
		os.Exit(1)
	}
	for _, v := range []int{1, 2, 3, 4, 5, 6} {
		b.Add(v)
	}

	// Snapshot 返回全部、顺序一致
	full := b.Snapshot()
	wantFull := []int{1, 2, 3, 4, 5, 6}
	if len(full) != len(wantFull) {
		os.Exit(1)
	}
	for i, v := range wantFull {
		if full[i] != v {
			fmt.Printf("Snapshot 内容错误：位置 %d 得到 %d，期望 %d\n", i, full[i], v)
			os.Exit(1)
		}
	}

	// Recent(3) 返回最近 3 条
	recent := b.Recent(3)
	wantRecent := []int{4, 5, 6}
	if len(recent) != 3 {
		os.Exit(1)
	}
	for i, v := range wantRecent {
		if recent[i] != v {
			fmt.Printf("Recent 内容错误：位置 %d 得到 %d，期望 %d\n", i, recent[i], v)
			os.Exit(1)
		}
	}

	// Recent 超出长度时返回全部
	all := b.Recent(100)
	if len(all) != 6 {
		os.Exit(1)
	}
	os.Exit(0)
}
