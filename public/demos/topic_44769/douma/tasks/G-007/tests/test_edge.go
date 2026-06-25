package main

import (
	"fmt"
	"os"
)

// 边界测试：负数 key 触发越界/分布错误。Count 中用桶号作下标，负索引会 panic 或错配。
func main() {
	// 全负数 key：若 Bucket 返回负数，counts[负] 会越界 panic 直接判失败
	s := NewSharder(5)
	negKeys := []int{-1, -2, -3, -4, -5, -6, -10, -11}
	counts := s.Count(5, negKeys)

	// 总和必须等于输入数量
	sum := 0
	for _, c := range counts {
		if c < 0 {
			fmt.Printf("桶计数为负：%d\n", c)
			os.Exit(1)
		}
		sum += c
	}
	if sum != len(negKeys) {
		fmt.Printf("负数键统计总和 %d，期望 %d\n", sum, len(negKeys))
		os.Exit(1)
	}

	// 同余校验：n=5 时 -1 应与 4 同桶（(-1+5)%5=4），-5 应与 0 同桶
	if s.Bucket(-1) != s.Bucket(4) {
		fmt.Printf("-1 与 4 应同桶：%d vs %d\n", s.Bucket(-1), s.Bucket(4))
		os.Exit(1)
	}
	if s.Bucket(-5) != 0 {
		fmt.Printf("Bucket(-5) 应为 0，实际 %d\n", s.Bucket(-5))
		os.Exit(1)
	}

	// 大负数与 n=1 边界
	one := NewSharder(1)
	if one.Bucket(-99999) != 0 {
		fmt.Printf("n=1 时任何 key 应落桶 0，实际 %d\n", one.Bucket(-99999))
		os.Exit(1)
	}
	os.Exit(0)
}
