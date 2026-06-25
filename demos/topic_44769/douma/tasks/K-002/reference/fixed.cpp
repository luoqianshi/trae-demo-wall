// 实时统计聚合器（修复版）。
// 修复要点：count/sum/buckets 的更新与读取必须作为一个整体临界区串行化。
// 仅把字段各自做成 atomic 不够——snapshot() 逐字段读取期间若有并发 add()，
// 读到的 count 与 Σbuckets 会撕裂。用一把互斥锁把 add() 的三字段更新与
// snapshot() 的整体读取分别包成原子区，即可保证读期一致：count == Σbuckets。
#include <mutex>
#include <thread>
#include <vector>

class LiveStats {
public:
    static const int NB = 8;

    struct Snap {
        long count;
        long sum;
        long buckets[NB];
    };

    void add(long value) {
        int b = static_cast<int>(((value % NB) + NB) % NB);
        std::lock_guard<std::mutex> g(m_);
        count_ += 1;
        buckets_[b] += 1;
        sum_ += value;
    }

    long count() const {
        std::lock_guard<std::mutex> g(m_);
        return count_;
    }
    long sum() const {
        std::lock_guard<std::mutex> g(m_);
        return sum_;
    }
    long bucket(int b) const {
        std::lock_guard<std::mutex> g(m_);
        return buckets_[b];
    }

    // 整体临界区内一次性读出全部字段，保证快照自洽。
    Snap snapshot() const {
        std::lock_guard<std::mutex> g(m_);
        Snap s;
        s.count = count_;
        for (int b = 0; b < NB; ++b) s.buckets[b] = buckets_[b];
        s.sum = sum_;
        return s;
    }

    void run_concurrent(int n, int per_thread) {
        std::vector<std::thread> ts;
        for (int i = 0; i < n; ++i)
            ts.emplace_back([this, per_thread] {
                for (int k = 0; k < per_thread; ++k) add(1);
            });
        for (auto& t : ts) t.join();
    }

private:
    mutable std::mutex m_;
    long count_ = 0;
    long sum_ = 0;
    long buckets_[NB] = {0};
};
