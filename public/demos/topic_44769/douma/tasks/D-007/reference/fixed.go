package main

import "sort"

// Task 是调度任务：按 优先级降序 -> 时间升序 -> ID 升序 排序。
type Task struct {
	ID       int
	Priority int
	Time     int
}

// SortTasks 返回按规则排好序的新切片，比较器构成严格全序。
func SortTasks(tasks []Task) []Task {
	out := make([]Task, len(tasks))
	copy(out, tasks)
	sort.Slice(out, func(i, j int) bool {
		a, b := out[i], out[j]
		// 逐级严格比较，最终以 ID 决胜，保证全序唯一。
		if a.Priority != b.Priority {
			return a.Priority > b.Priority // 优先级降序
		}
		if a.Time != b.Time {
			return a.Time < b.Time // 时间升序
		}
		return a.ID < b.ID // ID 升序：最终决胜键
	})
	return out
}
