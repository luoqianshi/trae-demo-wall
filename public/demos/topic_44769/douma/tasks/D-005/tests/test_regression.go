package main

import (
	"fmt"
	"os"
)

// 回归测试：干净基线 —— 全是正常任务时占用/归还成对、容量限制生效。
func main() {
	p := NewPool(2)

	// 连续跑多个正常任务，每次结束 active 都应回到 0
	for i := 0; i < 10; i++ {
		if err := p.RunTask(func() error { return nil }); err != nil {
			fmt.Printf("第 %d 个正常任务出错: %v\n", i, err)
			os.Exit(1)
		}
		if p.Active() != 0 {
			fmt.Printf("第 %d 个任务后 active=%d，应为 0\n", i, p.Active())
			os.Exit(1)
		}
	}

	// 容量限制：在任务内部嵌套占用，验证满时被拒
	err := p.RunTask(func() error {
		// 此时已占用 1 个槽位，再占用 1 个达到上限 2
		return p.RunTask(func() error {
			// 已满，第三次应被拒绝
			if e := p.RunTask(func() error { return nil }); e == nil {
				return fmt.Errorf("池已满却未拒绝")
			}
			return nil
		})
	})
	if err != nil {
		fmt.Printf("容量测试失败: %v\n", err)
		os.Exit(1)
	}
	if p.Active() != 0 {
		fmt.Printf("容量测试后 active=%d，应为 0\n", p.Active())
		os.Exit(1)
	}
	os.Exit(0)
}
