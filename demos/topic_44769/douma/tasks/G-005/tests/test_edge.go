package main

import (
	"fmt"
	"os"
	"sort"
)

// 边界测试：多份快照之间相互独立，且对快照排序/改写不得回灌缓冲。
func main() {
	b := NewEventBuffer()
	for _, v := range []int{5, 3, 1, 4, 2} {
		b.Add(v)
	}

	// 取两份快照：对一份加工不得影响另一份，也不得影响缓冲
	snapA := b.Snapshot()
	snapB := b.Snapshot()

	// 对 snapA 就地排序（典型本地加工）
	sort.Ints(snapA)

	// snapB 必须仍是原始顺序
	wantB := []int{5, 3, 1, 4, 2}
	for i, v := range wantB {
		if snapB[i] != v {
			fmt.Printf("快照间串味：snapB 位置 %d 得到 %d，期望 %d\n", i, snapB[i], v)
			os.Exit(1)
		}
	}

	// 对 Recent 结果就地改写与 append，缓冲不得变化
	recent := b.Recent(3) // 期望最近三条 1,4,2
	recent[0] = -100
	recent = append(recent, -200, -300, -400)
	_ = recent

	// 缓冲内部必须始终保持原始数据与长度
	final := b.Snapshot()
	wantFinal := []int{5, 3, 1, 4, 2}
	if b.Len() != len(wantFinal) {
		fmt.Printf("缓冲长度被污染：%d\n", b.Len())
		os.Exit(1)
	}
	for i, v := range wantFinal {
		if final[i] != v {
			fmt.Printf("缓冲被污染：位置 %d 得到 %d，期望 %d\n", i, final[i], v)
			os.Exit(1)
		}
	}
	os.Exit(0)
}
