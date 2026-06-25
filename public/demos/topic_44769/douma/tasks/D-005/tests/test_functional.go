package main

import (
	"errors"
	"fmt"
	"os"
)

// 功能测试：正常任务与错误任务都正确归还槽位，且错误如实返回。
func main() {
	p := NewPool(4)

	// 正常返回的任务
	if err := p.RunTask(func() error { return nil }); err != nil {
		fmt.Printf("正常任务不应出错: %v\n", err)
		os.Exit(1)
	}
	if p.Active() != 0 {
		fmt.Printf("正常任务后 active 应为 0，实际 %d\n", p.Active())
		os.Exit(1)
	}

	// 返回业务错误的任务：错误应原样返回，且槽位归还
	bizErr := errors.New("biz")
	if err := p.RunTask(func() error { return bizErr }); err != bizErr {
		fmt.Printf("业务错误应原样返回，实际 %v\n", err)
		os.Exit(1)
	}
	if p.Active() != 0 {
		fmt.Printf("错误任务后 active 应为 0，实际 %d\n", p.Active())
		os.Exit(1)
	}
	os.Exit(0)
}
