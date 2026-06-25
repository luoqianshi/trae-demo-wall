package main

import (
	"fmt"
	"os"
)

// 功能测试：含负数 key 时桶索引必须合法，且与同余正数 key 落入同一桶。
func main() {
	s := NewSharder(8)

	// 索引合法性：正、负、零都必须落在 [0, 8)
	for _, k := range []int{-100, -8, -1, 0, 1, 7, 8, 123} {
		b := s.Bucket(k)
		if b < 0 || b >= 8 {
			fmt.Printf("Bucket(%d)=%d 越界 [0,8)\n", k, b)
			os.Exit(1)
		}
	}

	// 同余一致：n=8 时 -1 与 7 必须同桶，-8/8/0 必须同桶
	if s.Bucket(-1) != s.Bucket(7) {
		fmt.Printf("同余键应同桶：-1->%d, 7->%d\n", s.Bucket(-1), s.Bucket(7))
		os.Exit(1)
	}
	if s.Bucket(-8) != s.Bucket(0) || s.Bucket(8) != s.Bucket(0) {
		fmt.Println("同余键 -8/8/0 应同桶")
		os.Exit(1)
	}
	os.Exit(0)
}
