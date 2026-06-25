# 限量名额并发抢占器

## 背景

`solution.rs` 实现一个进程内 `SeatRegistry`（限量名额登记器）：在活动开始时设定一个固定的名额上限 `capacity`，随后大量并发线程同时来抢占名额。

## 功能需求

- `SeatRegistry::new(capacity)`：创建一个总名额为 `capacity` 的登记器，已发放数从 0 开始。
- `try_acquire()`：尝试抢占一个名额。若仍有剩余名额则发放一个并返回 `true`；若名额已耗尽则返回 `false`，且不改变已发放数。
- `granted()`：返回当前累计已发放的名额数。
- `capacity()`：返回名额上限。
- 模块函数 `run_concurrent(reg, threads, per_thread)`：起 `threads` 个线程，每个线程连续调用 `try_acquire()` 共 `per_thread` 次，返回所有线程成功抢占的总次数。

**核心不变量**（任意并发场景）：

1. **不超卖**：`granted()` 的值任何时刻都不得超过 `capacity`。
2. **恰好发满**：当抢占请求总数（`threads * per_thread`）不小于 `capacity` 时，最终 `granted()` 必须恰好等于 `capacity`。
3. **计数一致**：`run_concurrent` 返回的成功总次数必须等于最终的 `granted()`，不多发也不漏记。

## 错误现象

- 单线程、低并发场景完全正常：发满容量后继续抢占都返回 `false`。
- 多线程高并发抢占同一份有限名额时，出现**发放数超过容量（超卖）**：`granted()` 大于 `capacity`，成功次数也随之偏高。

## 你的任务

定位并修复，使三条不变量在任意并发调用模式下都严格成立。

## 约束

- **只能修改 `solution.rs`**，仅可使用标准库。
- 保持 `SeatRegistry::new/try_acquire/granted/capacity` 与 `run_concurrent` 的对外签名语义不变。
