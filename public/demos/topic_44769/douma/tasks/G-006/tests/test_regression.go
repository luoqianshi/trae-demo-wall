package main

import (
	"fmt"
	"os"
)

// 回归测试：干净基线 —— 全部查询都命中时，Find/DisplayName 行为正确。
func main() {
	d := NewDirectory()
	d.Add(10, "carol")
	d.Add(20, "dave")
	d.Add(10, "carol2") // 覆盖

	u, err := d.Find(10)
	if err != nil || u == nil || u.Name != "carol2" {
		fmt.Printf("Find 覆盖后结果错误: u=%v err=%v\n", u, err)
		os.Exit(1)
	}

	for id, want := range map[int]string{10: "carol2", 20: "dave"} {
		name, err := d.DisplayName(id)
		if err != nil || name != want {
			fmt.Printf("DisplayName(%d)=%q err=%v，期望 %q\n", id, name, err, want)
			os.Exit(1)
		}
	}
	os.Exit(0)
}
