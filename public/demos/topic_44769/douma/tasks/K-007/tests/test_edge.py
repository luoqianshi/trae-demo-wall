"""边界测试：cap=0、海量不同 key 的并发、不得死锁。"""
import sys
import threading

sys.setswitchinterval(5e-7)

from solution import CappedAggregator


def test_cap_zero_rejects_all():
    agg = CappedAggregator(cap=0)
    assert agg.record("a") is False
    assert agg.count("a") == 0
    assert agg.total() == 0


def test_cap_zero_under_concurrency():
    agg = CappedAggregator(cap=0)
    accepted = [0] * 32

    def worker(idx):
        c = 0
        for _ in range(1000):
            if agg.record("z"):
                c += 1
        accepted[idx] = c

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(32)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sum(accepted) == 0
    assert agg.total() == 0


def test_many_distinct_keys_concurrent():
    # 大量不同 key，跨分片并发；不得死锁，且每个 key 精确等于 cap
    cap = 4
    n_keys = 200
    agg = CappedAggregator(cap=cap)
    keys = [f"key-{i}" for i in range(n_keys)]

    def worker():
        for _ in range(20):
            for k in keys:
                agg.record(k)

    threads = [threading.Thread(target=worker) for _ in range(16)]
    for t in threads:
        t.start()
    for t in threads:
        # 设超时以捕获潜在死锁；正常应瞬间完成
        t.join(timeout=15)
        assert not t.is_alive(), "出现死锁或卡死"

    snap = agg.snapshot()
    assert len(snap) == n_keys
    for k in keys:
        assert snap[k] == cap, f"{k} 计数 {snap[k]} != {cap}"
    assert agg.total() == cap * n_keys
