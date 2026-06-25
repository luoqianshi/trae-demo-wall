package main

import (
	"fmt"
	"os"
)

// 功能测试：就地修改快照元素不得污染缓冲内部数据。
func main() {
	b := NewEventBuffer()
	for i := 1; i <= 5; i++ {
		b.Add(i * 10) // 10,20,30,40,50
	}

	snap := b.Snapshot()
	// 调用方就地改写整份快照
	for i := range snap {
		snap[i] = -1
	}

	// 缓冲内部必须保持原样
	again := b.Snapshot()
	want := []int{10, 20, 30, 40, 50}
	for i, v := range want {
		if again[i] != v {
			fmt.Printf("快照被污染：位置 %d 得到 %d，期望 %d\n", i, again[i], v)
			os.Exit(1)
		}
	}
	if b.Len() != 5 {
		os.Exit(1)
	}
	os.Exit(0)
}
