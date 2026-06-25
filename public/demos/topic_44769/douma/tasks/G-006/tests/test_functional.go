package main

import (
	"fmt"
	"os"
)

// 功能测试：存在的 id 返回正确名字，不存在的 id 必须返回错误而非 panic。
func main() {
	d := NewDirectory()
	d.Add(1, "alice")
	d.Add(2, "bob")

	// 存在的 id：返回真实名字、无错误
	name, err := d.DisplayName(1)
	if err != nil || name != "alice" {
		fmt.Printf("存在 id 解析错误: name=%q err=%v\n", name, err)
		os.Exit(1)
	}

	// 不存在的 id：必须返回非 nil 错误且名字为空，绝不 panic
	name, err = d.DisplayName(999)
	if err == nil {
		fmt.Printf("不存在的 id 应返回错误，却得到 name=%q\n", name)
		os.Exit(1)
	}
	if name != "" {
		fmt.Printf("出错时名字应为空，实际 %q\n", name)
		os.Exit(1)
	}
	os.Exit(0)
}
