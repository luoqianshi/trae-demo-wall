// edge：读期资金守恒。多个写线程持续 transfer，同时一个读线程在转账进行中
// 反复调用 total()，每一次都必须等于初始总额——否则说明观察到了「钱已扣、未到账」
// 的中间态（资金守恒被破坏），置 bad 并失败。多轮放大竞态。
// buggy（每账户独立锁、转账拆成两个独立临界区）以及「仅把余额原子化」的半对解，
// total() 都会读到不守恒的中间态；只有把转账两步与求和整体串行化才能始终成立。
#include <atomic>
#include <thread>
#include <vector>
#include "solution.cpp"

int main() {
    const int N = 8;            // 账户数
    const long INIT = 100000;   // 每账户初始余额
    const long EXPECT = (long)N * INIT;

    for (int round = 0; round < 20; ++round) {
        Bank bank(N, INIT);
        std::atomic<bool> stop{false};
        std::atomic<bool> bad{false};
        std::atomic<int> ready{0};   // 自旋 barrier：等所有线程就绪再齐发

        const int NW = 6;            // 写线程数
        const int total_threads = NW + 1;

        // 写线程：在账户对之间持续交叉转账。
        std::vector<std::thread> writers;
        for (int w = 0; w < NW; ++w)
            writers.emplace_back([&, w] {
                ready.fetch_add(1);
                while (ready.load() < total_threads) {}  // barrier 对齐
                int from = w % N;
                int step = 1 + (w % (N - 1));
                for (int k = 0; k < 60000; ++k) {
                    int to = (from + step) % N;
                    bank.transfer(from, to, 1);
                    from = to;
                }
            });

        // 读线程：在写入进行中不断读 total()，校验资金守恒。
        std::thread reader([&] {
            ready.fetch_add(1);
            while (ready.load() < total_threads) {}  // barrier 对齐
            while (!stop.load()) {
                if (bank.total() != EXPECT) { bad.store(true); return; }
            }
        });

        for (auto& t : writers) t.join();
        stop.store(true);
        reader.join();
        if (bad.load()) return 1;

        // 收尾：系统静止后总额也必须精确守恒。
        if (bank.total() != EXPECT) return 1;
    }
    return 0;
}
