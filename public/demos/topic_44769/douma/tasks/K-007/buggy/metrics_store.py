"""分片计数存储（只读支撑模块，请勿修改）。

按 key 的哈希把计数分布到固定数量的分片中，每个分片配备独立的锁，
以降低高并发下的锁竞争。
"""
import threading


class ShardedCounter:
    """分片计数器。

    - add(key, delta) / get(key)：针对**单个 key** 的操作是线程安全的，
      内部会持有该 key 所在分片的锁。
    - total()：对所有分片求和，得到全局计数。
    - snapshot()：返回当前所有 key 的计数副本。
    """

    def __init__(self, shards: int = 16):
        self._n = shards
        self._shards = [dict() for _ in range(shards)]
        self._locks = [threading.Lock() for _ in range(shards)]

    def _index(self, key) -> int:
        return hash(key) % self._n

    def shard_lock(self, key) -> threading.Lock:
        """返回 key 所在分片的锁。"""
        return self._locks[self._index(key)]

    def add(self, key, delta: int = 1) -> int:
        i = self._index(key)
        with self._locks[i]:
            self._shards[i][key] = self._shards[i].get(key, 0) + delta
            return self._shards[i][key]

    def get(self, key) -> int:
        i = self._index(key)
        with self._locks[i]:
            return self._shards[i].get(key, 0)

    def total(self) -> int:
        s = 0
        for i in range(self._n):
            with self._locks[i]:
                s += sum(self._shards[i].values())
        return s

    def snapshot(self) -> dict:
        out = {}
        for i in range(self._n):
            with self._locks[i]:
                out.update(self._shards[i])
        return out
