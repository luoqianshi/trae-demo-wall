import metrics_store


class CappedAggregator:
    """带每-key 上限的并发指标聚合器。

    record(key)：若该 key 当前计数未达上限则 +1 并返回 True；已达上限返回 False。
    底层使用分片计数存储（metrics_store.ShardedCounter）来分散高并发下的锁竞争。
    """

    def __init__(self, cap, shards=16):
        self._cap = cap
        self._counter = metrics_store.ShardedCounter(shards=shards)

    def record(self, key):
        # 未达上限则接受并计数，否则拒绝
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
