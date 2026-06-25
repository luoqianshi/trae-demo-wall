package main

import (
	"fmt"
	"os"
	"sync"
	"sync/atomic"
)

// 边界测试：极高并发多轮放大竞态 —— 大量 goroutine 疯狂写同一份 map 的「同时」并发读。
//   - buggy（map 无锁）：并发写 + 并发读几乎必现 fatal
//     「concurrent map writes / concurrent map read and map write」崩溃。
//   - 半修复（只锁 Add、Get/Total 不锁）：并发读 + 并发写触发
//     fatal「concurrent map read and map write」，被本测试挡住。
//   - reference（读写全加锁）：读写都安全，总数精确，通过。
//
// 读 goroutine 写期间读到中间值属正常，不断言其返回值；
// 仅在所有写结束后对最终总数与分类守恒做精确断言。
func main() {
	for round := 0; round < 30; round++ {
		agg := NewAggregator()
		workers, perWorker := 64, 2000
		want := workers * perWorker

		var writeWg sync.WaitGroup // 等待所有写 goroutine 结束
		var readWg sync.WaitGroup  // 等待所有读 goroutine 退出
		var stop int32             // 写完成信号：通知读 goroutine 退出

		// 启动并发读 goroutine：与写路径真正并发，暴露读路径未加锁问题。
		for r := 0; r < 8; r++ {
			readWg.Add(1)
			go func() {
				defer readWg.Done()
				for atomic.LoadInt32(&stop) == 0 {
					_ = agg.Total()
					for _, k := range keys {
						_ = agg.Get(k)
					}
				}
			}()
		}

		// 启动极高并发写 goroutine。
		for w := 0; w < workers; w++ {
			writeWg.Add(1)
			go func(seed int) {
				defer writeWg.Done()
				for i := 0; i < perWorker; i++ {
					agg.Add(keys[(seed+i)%len(keys)])
				}
			}(w)
		}

		writeWg.Wait()              // 等所有写结束
		atomic.StoreInt32(&stop, 1) // 通知读 goroutine 退出
		readWg.Wait()               // 等读 goroutine 全部退出

		// 此刻已无并发，读取结果必须精确。
		total := agg.Total()
		if total != want {
			fmt.Printf("第 %d 轮总数错误：得到 %d，期望 %d\n", round, total, want)
			os.Exit(1)
		}
		sum := 0
		for _, k := range keys {
			sum += agg.Get(k)
		}
		if sum != want {
			fmt.Printf("第 %d 轮分类守恒错误：分类和 %d，期望 %d\n", round, sum, want)
			os.Exit(1)
		}
	}
	os.Exit(0)
}
