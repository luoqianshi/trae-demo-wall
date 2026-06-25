package main

import (
	"fmt"
	"os"
)

// 回归测试：所有优先级互不相同的干净基线（永不进入相等决胜路径）。
func main() {
	tasks := []Task{
		{ID: 10, Priority: 3, Time: 5},
		{ID: 20, Priority: 7, Time: 5},
		{ID: 30, Priority: 1, Time: 5},
		{ID: 40, Priority: 9, Time: 5},
		{ID: 50, Priority: 5, Time: 5},
	}
	got := SortTasks(tasks)

	// 优先级互异 -> 纯优先级降序
	wantPriorities := []int{9, 7, 5, 3, 1}
	for i, p := range wantPriorities {
		if got[i].Priority != p {
			fmt.Printf("位置 %d 期望优先级 %d，实际 %d\n", i, p, got[i].Priority)
			os.Exit(1)
		}
	}
	// 长度与元素保全
	if len(got) != 5 {
		os.Exit(1)
	}
	os.Exit(0)
}
