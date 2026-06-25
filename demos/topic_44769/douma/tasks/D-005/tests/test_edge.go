package main

import (
	"fmt"
	"os"
)

// 边界测试：放大 panic 路径未归还槽位的缺陷 —— 大量 panic 任务后 active 必须归零，池不被泄漏占满。
func main() {
	p := NewPool(3)

	// 跑很多次 panic 任务：每次都应兜住并返回错误，且归还槽位
	for i := 0; i < 100; i++ {
		err := p.RunTask(func() error {
			panic("boom")
		})
		if err == nil {
			fmt.Printf("第 %d 次 panic 任务应返回错误\n", i)
			os.Exit(1)
		}
		// 关键：每次 panic 后 active 都必须归零，否则会逐步泄漏
		if p.Active() != 0 {
			fmt.Printf("第 %d 次 panic 后 active=%d，发生泄漏（应为 0）\n", i, p.Active())
			os.Exit(1)
		}
	}

	// 泄漏不发生，则池仍可正常接收任务（未被僵尸占用塞满）
	for i := 0; i < 3; i++ {
		if err := p.RunTask(func() error { return nil }); err != nil {
			fmt.Printf("泄漏导致池被占满，正常任务被误拒: %v\n", err)
			os.Exit(1)
		}
	}
	if p.Active() != 0 {
		os.Exit(1)
	}

	// 混合序列：正常/错误/panic 交错，结束后 active 必须为 0
	tasks := []func() error{
		func() error { return nil },
		func() error { panic("x") },
		func() error { return fmt.Errorf("e") },
		func() error { panic("y") },
		func() error { return nil },
	}
	for _, t := range tasks {
		_ = p.RunTask(t)
	}
	if p.Active() != 0 {
		fmt.Printf("混合序列后 active=%d，应为 0\n", p.Active())
		os.Exit(1)
	}
	os.Exit(0)
}
