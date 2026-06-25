"""功能测试：高并发下严格满足每-key 上限不变量（多轮放大竞态）。"""
import sys
import threading

# 缩短线程切换间隔，放大 check-then-act 竞态窗口（不依赖 sleep 注入扰动）
sys.setswitchinterval(5e-7)

from solution import CappedAggregator


def _hammer(agg, keys, per_thread, accepted_box, idx):
    local = 0
    for i in range(per_thread):
        # 在少量热点 key 上反复争抢，最大化 check-then-act 竞态
        k = keys[i % len(keys)]
        if agg.record(k):
            local += 1
    accepted_box[idx] = local


def _run_once(cap, n_threads, per_thread, n_keys):
    agg = CappedAggregator(cap=cap)
    keys = [f"k{i}" for i in range(n_keys)]
    accepted = [0] * n_threads
    threads = [
        threading.Thread(target=_hammer, args=(agg, keys, per_thread, accepted, t))
        for t in range(n_threads)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return agg, keys, sum(accepted)


def test_per_key_cap_never_exceeded_multi_round():
    # 多轮重复，任一轮越界即失败
    for _round in range(5):
        cap = 50
        n_keys = 8
        agg, keys, total_accepted = _run_once(
            cap=cap, n_threads=48, per_thread=800, n_keys=n_keys
        )
        snap = agg.snapshot()
        # 不变量 1：任意 key 计数不得超过 cap
        for k in keys:
            assert snap.get(k, 0) <= cap, (
                f"round={_round} key={k} count={snap.get(k, 0)} 超过 cap={cap}"
            )
        # 不变量 2：每个热点 key 在如此高的并发下必然被打满到 cap
        for k in keys:
            assert snap.get(k, 0) == cap, (
                f"round={_round} key={k} 应被打满到 {cap}，实际 {snap.get(k, 0)}"
            )
        # 不变量 3：接受次数（record 返回 True 的总数）必须等于计数总和
        assert total_accepted == agg.total(), (
            f"round={_round} accepted={total_accepted} != total={agg.total()}"
        )
        assert agg.total() == cap * n_keys


def test_accept_count_matches_total():
    # 单热点 key：record 成功次数必须精确等于 cap
    for _round in range(5):
        cap = 100
        agg = CappedAggregator(cap=cap)
        accepted = [0] * 50

        def worker(idx):
            c = 0
            for _ in range(1500):
                if agg.record("hot"):
                    c += 1
            accepted[idx] = c

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(48)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        assert agg.count("hot") == cap
        assert sum(accepted) == cap, f"round={_round} accepted={sum(accepted)} != {cap}"
