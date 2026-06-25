package main

import (
	"fmt"
	"os"
)

// 边界测试：放大“忽略 err 后解引用 nil”缺陷 —— 空目录、缺失 id 必须优雅返回错误。
// 若调用方忽略 err 直接用 nil 指针，会触发空指针解引用 panic，进程非零退出即判失败。
func main() {
	// 空目录查任何 id
	empty := NewDirectory()
	name, err := empty.DisplayName(1)
	if err == nil {
		fmt.Printf("空目录应返回错误，得到 name=%q\n", name)
		os.Exit(1)
	}
	if name != "" {
		os.Exit(1)
	}

	// 有数据但查不存在的多个 id：每次都应稳定返回错误
	d := NewDirectory()
	d.Add(1, "x")
	for _, id := range []int{0, 2, -1, 100} {
		name, err := d.DisplayName(id)
		if err == nil {
			fmt.Printf("缺失 id=%d 应返回错误，得到 name=%q\n", id, name)
			os.Exit(1)
		}
		if name != "" {
			fmt.Printf("缺失 id=%d 出错时名字应为空，实际 %q\n", id, name)
			os.Exit(1)
		}
	}

	// Find 对缺失 id 必须返回 nil 指针 + 非 nil 错误
	u, err := d.Find(42)
	if u != nil || err == nil {
		fmt.Printf("Find 缺失 id 应返回 (nil, err)，得到 (%v, %v)\n", u, err)
		os.Exit(1)
	}
	os.Exit(0)
}
