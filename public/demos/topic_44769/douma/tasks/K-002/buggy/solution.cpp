// 实时统计聚合器：每个样本同时更新 总计数 count、总和 sum、以及所属分桶 bucket。
// 对外保证：任意时刻读到的快照都自洽——count == Σbuckets，且 sum 与已计入样本一致。
// snapshot() 允许在其它线程并发 add() 进行中被调用，必须返回一份"读期一致"的视图。
#include <mutex>
#include <thread>
#include <vector>

class LiveStats {
public:
    static const int NB = 8;  // 分桶数

    struct Snap {
        long count;
        long sum;
        long buckets[NB];
    };

    LiveStats() {
        for (int b = 0; b < NB; ++b) buckets_[b] = 0;
    }

    // 计入一个样本：落入第 (value%NB) 个桶，并累加计数与总和。
    void add(long value) {
        int b = static_cast<int>(((value % NB) + NB) % NB);
        std::lock_guard<std::mutex> lock(mu_);
        // 三处状态必须一起更新，snapshot 才不会读到跨字段的中间态。
        ++count_;
        ++buckets_[b];
        sum_ += value;
    }

    long count() const {
        std::lock_guard<std::mutex> lock(mu_);
        return count_;
    }
    long sum() const {
        std::lock_guard<std::mutex> lock(mu_);
        return sum_;
    }
    long bucket(int b) const {
        std::lock_guard<std::mutex> lock(mu_);
        return buckets_[b];
    }

    // 拍一份快照：逐字段读取，未持锁。
    // 缺陷：count 与各 bucket 是先后分别读出的且不在临界区内，读取期间若有 add() 插入，
    // 读到的 count 与 Σbuckets 会对不上（读期撕裂）。
    Snap snapshot() const {
        Snap s;
        s.count = count_;
        for (int b = 0; b < NB; ++b)
            s.buckets[b] = buckets_[b];
        s.sum = sum_;
        return s;
    }

    // 让 n 个线程各调用 add(1) 共 per_thread 次（样本值固定为 1，便于校验）。
    void run_concurrent(int n, int per_thread) {
        std::vector<std::thread> ts;
        for (int i = 0; i < n; ++i)
            ts.emplace_back([this, per_thread] {
                for (int k = 0; k < per_thread; ++k) add(1);
            });
        for (auto& t : ts) t.join();
    }

private:
    mutable std::mutex mu_;
    long count_{0};
    long sum_{0};
    long buckets_[NB];
};
