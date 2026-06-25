# 带版本号的运行时配置

## 背景

`solution.rs` 实现一个进程内 `Config`（运行时配置）。配置由三个必须协同变化的字段组成：

- `version`：配置版本号，每次更新自增 1。
- `value`：随版本派生的主参数，约定恒等于 `version * A`。
- `derived`：随版本派生的辅助参数，约定恒等于 `version * B`。

其中 `A`、`B` 是固定常量。也就是说，无论何时，一份**自洽**的配置都必须同时满足：

```
value   == version * A
derived == version * B
```

## 功能需求

- `Config::new()`：创建初始配置，`version = 0`、`value = 0`、`derived = 0`。
- `bump()`：把配置推进到下一个版本——`version` 自增 1，并同步把 `value`、`derived` 重算为新版本对应的派生值。
- `snapshot()`：返回当前配置的三元组快照 `(version, value, derived)`。
- `version()`：返回当前版本号。
- 模块函数 `run_concurrent(config, writers, bumps_per_writer, readers, reads_per_reader)`：
  - 起 `writers` 个写线程，每个写线程调用 `bump()` 共 `bumps_per_writer` 次；
  - 同时起 `readers` 个读线程，每个读线程调用 `snapshot()` 共 `reads_per_reader` 次，并校验读到的快照是否自洽（`value == version * A && derived == version * B`）；
  - 返回所有读线程观察到的**不自洽快照总数**。

**核心不变量**（任意并发场景）：

1. **快照自洽**：任何一次 `snapshot()` 返回的三元组都必须满足 `value == version * A` 且 `derived == version * B`；即 `run_concurrent` 返回的不自洽计数恒为 0。
2. **版本精确**：所有写线程结束后，`version()` 必须恰好等于 `writers * bumps_per_writer`。
3. **终态自洽**：所有线程结束后的最终快照本身也必须自洽。

## 错误现象

- 单线程、低并发场景完全正常：每个版本的三个字段都对得上。
- 多写多读高并发时，读线程**偶发读到字段对不上的快照**（例如 `value` 已是新版本而 `version` 还停留在旧值，或 `derived` 与 `value` 不属于同一版本），不自洽计数大于 0。

## 你的任务

定位并修复，使三条不变量在任意并发调用模式下都严格成立。

## 约束

- **只能修改 `solution.rs`**，仅可使用标准库。
- 保持 `Config::new/bump/snapshot/version` 与 `run_concurrent` 的对外签名语义不变。
- 常量 `A`、`B` 的取值不得改动。
