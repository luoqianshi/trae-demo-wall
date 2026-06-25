import threading

import metrics_store


class CappedAggregator:
    """带每-key 上限的并发指标聚合器。

    record(key)：若该 key 当前计数未达上限则 +1 并返回 True；已达上限返回 False。
    底层使用分片计数存储（metrics_store.ShardedCounter）来分散高并发下的锁竞争。
    """

    def __init__(self, cap, shards=16):
        self._cap = cap
        self._counter = metrics_store.ShardedCounter(shards=shards)
        # 自备一组与分片数对齐的独立锁：用于把 "检查上限 + 计数" 这对操作合成原子区。
        # 不能复用 ShardedCounter 的内部锁（其 get/add 会再次获取同一把非重入锁，导致死锁）。
        self._shards = shards
        self._locks = [threading.Lock() for _ in range(shards)]

    def _guard(self, key):
        return self._locks[hash(key) % self._shards]

    def record(self, key):
        # 检查上限与计数必须在同一临界区内，否则多个线程会同时通过检查并越界累加
        with self._guard(key):
            if self._counter.get(key) < self._cap:
                self._counter.add(key, 1)
                return True
            return False

    def count(self, key):
        return self._counter.get(key)

    def total(self):
        return self._counter.total()

    def snapshot(self):
        return self._counter.snapshot()
