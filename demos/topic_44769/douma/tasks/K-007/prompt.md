# 并发指标聚合器

## 背景

`solution.py` 实现了一个 `CappedAggregator`，用于在高并发服务中对每个 `key`（如用户 ID、接口名）做**带上限的计数**。它底层复用了团队提供的高性能分片计数存储 `metrics_store.ShardedCounter`（只读，不要修改）——该存储按 key 哈希分片，每个分片独立加锁，专门为高并发场景设计。

## 功能需求

`CappedAggregator(cap, shards=16)`：

- `record(key)`：如果该 `key` 当前的计数**严格小于 `cap`**，则将其计数 +1 并返回 `True`；如果已经达到 `cap`，则不再增加并返回 `False`。
- `count(key)`：返回该 key 当前计数。
- `total()`：返回所有 key 的计数之和。
- `snapshot()`：返回所有 key 当前计数的字典副本。

**核心不变量**：无论被多少线程并发调用，对任意 key，`count(key)` 必须始终满足 `count(key) <= cap`；并且 `record` 返回 `True` 的总次数必须严格等于最终所有计数之和。

## 错误现象

单线程下功能完全正常。但在生产高并发压测中，偶发观察到某些 key 的计数**超过了 `cap`**，`total()` 也比预期偏大。底层 `ShardedCounter` 的每个分片都已经加了锁，按理说不应该出错。请定位并修复，使其在任意并发下都严格满足上限约束。

注意：`metrics_store.py` 是经过验证的公共组件，不可改动；只允许修改 `solution.py`。
