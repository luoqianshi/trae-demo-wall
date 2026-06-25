package main

import (
	"fmt"
	"os"
)

// 边界测试：大量优先级相同、时间相同的任务，必须严格按 ID 升序排列。
// buggy 比较器在相等情形非严格且不以 ID 决胜，会破坏这一确定次序。
func main() {
	// 全部 Priority=5, Time=100，仅 ID 不同，且故意以逆序/打乱给入
	tasks := []Task{
		{ID: 8, Priority: 5, Time: 100},
		{ID: 3, Priority: 5, Time: 100},
		{ID: 6, Priority: 5, Time: 100},
		{ID: 1, Priority: 5, Time: 100},
		{ID: 7, Priority: 5, Time: 100},
		{ID: 2, Priority: 5, Time: 100},
		{ID: 5, Priority: 5, Time: 100},
		{ID: 4, Priority: 5, Time: 100},
	}
	got := SortTasks(tasks)

	// 必须严格 ID 升序 1..8
	for i := 0; i < len(got); i++ {
		if got[i].ID != i+1 {
			fmt.Printf("同优先级同时间未按 ID 升序：位置 %d 得到 ID %d，期望 %d\n", i, got[i].ID, i+1)
			os.Exit(1)
		}
	}

	// 另一组：同优先级、时间分两档，时间升序内再按 ID 升序
	tasks2 := []Task{
		{ID: 30, Priority: 2, Time: 200},
		{ID: 10, Priority: 2, Time: 100},
		{ID: 20, Priority: 2, Time: 200},
		{ID: 40, Priority: 2, Time: 100},
	}
	got2 := SortTasks(tasks2)
	// 期望：t100(id10) t100(id40) t200(id20) t200(id30)
	want2 := []int{10, 40, 20, 30}
	for i, id := range want2 {
		if got2[i].ID != id {
			fmt.Printf("次级排序错误：位置 %d 得到 ID %d，期望 %d\n", i, got2[i].ID, id)
			os.Exit(1)
		}
	}
	os.Exit(0)
}
