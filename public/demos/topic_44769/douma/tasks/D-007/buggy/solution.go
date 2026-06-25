package main

import "sort"

// Task 是调度任务：按 优先级降序 -> 时间升序 -> ID 升序 排序。
type Task struct {
	ID       int
	Priority int
	Time     int
}

// SortTasks 返回按规则排好序的新切片。
func SortTasks(tasks []Task) []Task {
	out := make([]Task, len(tasks))
	copy(out, tasks)
	sort.Slice(out, func(i, j int) bool {
		a, b := out[i], out[j]
		if a.Priority != b.Priority {
			return a.Priority > b.Priority // 优先级降序
		}
		return a.Time <= b.Time
	})
	return out
}
