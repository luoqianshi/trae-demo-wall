package main

import (
	"fmt"
	"os"
)

// 功能测试：混合多键的正确次序——优先级降序、时间升序、ID 升序。
func main() {
	tasks := []Task{
		{ID: 1, Priority: 5, Time: 100},
		{ID: 2, Priority: 9, Time: 50},
		{ID: 3, Priority: 5, Time: 80},
		{ID: 4, Priority: 9, Time: 50}, // 与 ID2 同优先级同时间 -> 按 ID 升序在其后
		{ID: 5, Priority: 1, Time: 10},
	}
	got := SortTasks(tasks)

	// 期望次序：P9(t50,id2) P9(t50,id4) P5(t80,id3) P5(t100,id1) P1(t10,id5)
	wantIDs := []int{2, 4, 3, 1, 5}
	if len(got) != len(wantIDs) {
		os.Exit(1)
	}
	for i, id := range wantIDs {
		if got[i].ID != id {
			fmt.Printf("位置 %d 期望 ID %d，实际 ID %d\n", i, id, got[i].ID)
			os.Exit(1)
		}
	}
	os.Exit(0)
}
