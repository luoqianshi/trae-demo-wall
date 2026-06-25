# 并发计数聚合器

## 背景

`solution.go` 实现一个进程内 `Aggregator`（计数聚合器）：用一个 `map[string]int` 按分类键累加计数。线上场景里会有大量 goroutine 同时把事件按分类打到这个聚合器上。

## 功能需求

- `NewAggregator()`：创建一个空的聚合器。
- `(a *Aggregator) Add(key string)`：把 `key` 这一分类的计数加 1。
- `(a *Aggregator) Get(key string) int`：返回某分类当前的计数。
- `(a *Aggregator) Total() int`：返回所有分类计数之和。
- 函数 `RunConcurrent(agg *Aggregator, workers, perWorker int) int`：
  - 起 `workers` 个 goroutine，每个 goroutine 调用 `Add` 共 `perWorker` 次（分类键在固定的若干个键之间轮转）；
  - 等待**全部** goroutine 结束后，返回 `agg.Total()`。

**核心不变量**（任意并发场景）：

1. **总数精确**：`RunConcurrent` 返回值必须恰好等于 `workers * perWorker`，每一次 `Add` 都不丢失、不重复。
2. **进程稳定**：任意并发强度下都不得因并发访问 `map` 而导致进程崩溃。
3. **分类守恒**：所有分类 `Get` 之和等于 `Total()`，与总写入次数一致。

## 错误现象

- 单 goroutine、低并发场景完全正常：累加结果精确。
- 多 goroutine 高并发累加时，要么**进程直接崩溃**（运行期报告对 map 的并发访问），要么**总数小于 `workers * perWorker`**（计数丢失）。

## 你的任务

定位并修复，使三条不变量在任意并发调用模式下都严格成立。

## 约束

- **只能修改 `solution.go`**，仅可使用标准库。
- 保持 `NewAggregator / Add / Get / Total / RunConcurrent` 的对外签名语义不变。
- `Aggregator` 内部仍以 `map[string]int` 存储计数。
