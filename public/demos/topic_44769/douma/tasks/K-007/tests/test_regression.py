"""回归测试：单线程语义必须保持不变（修复不能破坏基本行为）。"""
import threading

import metrics_store
from solution import CappedAggregator


def test_basic_record_and_cap():
    agg = CappedAggregator(cap=3)
    assert agg.record("a") is True
    assert agg.record("a") is True
    assert agg.record("a") is True
    # 达到上限后拒绝
    assert agg.record("a") is False
    assert agg.count("a") == 3


def test_independent_keys():
    agg = CappedAggregator(cap=2)
    assert agg.record("x") is True
    assert agg.record("y") is True
    assert agg.record("x") is True
    assert agg.record("x") is False
    assert agg.record("y") is True
    assert agg.record("y") is False
    assert agg.count("x") == 2
    assert agg.count("y") == 2
    assert agg.total() == 4


def test_snapshot_and_total():
    agg = CappedAggregator(cap=5)
    for _ in range(3):
        agg.record("p")
    for _ in range(5):
        agg.record("q")
    snap = agg.snapshot()
    assert snap == {"p": 3, "q": 5}
    assert agg.total() == 8


def test_return_value_semantics():
    agg = CappedAggregator(cap=1)
    assert agg.record("only") is True
    assert agg.record("only") is False
    assert agg.count("only") == 1


def test_distinct_keys_record_concurrently_no_global_lock():
    """反作弊：不同分片上的 key 必须能真正并行进入计数临界区。

    用"一把全局大锁"虽然能修对上限不变量，却会把所有 key 串行化。
    这里让 N 个分别落在不同分片的 key 同时调用 record，并在被测后端 ShardedCounter.add
    内部用 barrier 要求它们必须同时到场——若实现用单一全局锁包住 record，
    barrier 永远凑不齐 N 个，触发超时变 BrokenBarrierError，判失败。

    ShardedCounter 是题目强制使用的只读后端，故在类方法层面插桩，不依赖实现的内部命名。
    """
    n = 8
    # 找出 n 个落在互不相同分片的 key（分片数默认 16）
    shard_of = {}
    keys = []
    i = 0
    while len(keys) < n:
        k = f"probe-{i}"
        idx = hash(k) % 16
        if idx not in shard_of:
            shard_of[idx] = k
            keys.append(k)
        i += 1

    agg = CappedAggregator(cap=10, shards=16)
    barrier = threading.Barrier(n, timeout=5)
    original_add = metrics_store.ShardedCounter.add
    entered_lock = threading.Lock()
    entered = {"n": 0}

    def instrumented_add(self, key, delta=1):
        # 进入计数原语即视为"已在临界区"，要求所有 key 线程同时到齐
        with entered_lock:
            entered["n"] += 1
        barrier.wait()  # 全局锁实现无法让 n 个线程同时到此，超时 -> BrokenBarrier
        return original_add(self, key, delta)

    errors = []

    def worker(k):
        try:
            agg.record(k)
        except threading.BrokenBarrierError:
            errors.append(k)

    metrics_store.ShardedCounter.add = instrumented_add
    try:
        threads = [threading.Thread(target=worker, args=(k,)) for k in keys]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=10)
    finally:
        metrics_store.ShardedCounter.add = original_add

    assert not errors, (
        f"以下 key 无法与其它分片的 key 并行进入临界区（疑似用单一全局锁串行化）：{errors}"
    )
    assert entered["n"] == n
