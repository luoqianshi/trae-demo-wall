// 银行转账系统（修复版）。
// 修复要点：transfer 的「扣款 + 入账」两步必须作为一个整体临界区完成，
// total() 也必须在同一互斥下取得一致快照——否则 total() 会读到「钱已扣、未到账」
// 的中间态而破坏资金守恒。仅把余额字段各自原子化不够（两次原子操作之间仍有中间态）。
// 这里用一把全局互斥锁把 transfer 与 total 串行化，保证任意并发组合下资金恒守恒。
// 若要保留每账户锁的并发度，可改为转账时按账户 id 升序同时持有两把锁以避免死锁，
// 并让 total() 按序锁住全部账户取一致快照——此处选用最简洁的全局锁方案。
#include <mutex>
#include <thread>
#include <vector>

class Bank {
public:
    // 构造 n 个账户，每个账户初始余额为 initial。
    Bank(int n, long initial) : balances_(n, initial) {}

    // 从 from 账户扣 amt，给 to 账户加 amt。from==to 时为空操作。
    // 扣款与入账在同一临界区内完成，外部观察不到中间态。
    void transfer(int from, int to, long amt) {
        if (from == to) return;
        std::lock_guard<std::mutex> g(m_);
        balances_[from] -= amt;
        balances_[to] += amt;
    }

    // 读取单个账户余额。
    long balance(int i) const {
        std::lock_guard<std::mutex> g(m_);
        return balances_[i];
    }

    // 在同一临界区内一次性累加全部账户余额，保证求和是一致快照。
    long total() const {
        std::lock_guard<std::mutex> g(m_);
        long s = 0;
        for (size_t i = 0; i < balances_.size(); ++i) s += balances_[i];
        return s;
    }

    // 让 n_threads 个线程各做 per_thread 次转账：在 n_accounts 个账户间轮转挑选
    // from/to（每次金额为 amt），便于测试制造高并发转账负载。
    void run_transfers(int n_threads, int per_thread, int n_accounts, long amt) {
        std::vector<std::thread> ts;
        for (int t = 0; t < n_threads; ++t)
            ts.emplace_back([this, t, per_thread, n_accounts, amt] {
                // 每个线程用不同的步长轮转账户对，制造交叉转账。
                int from = t % n_accounts;
                int step = 1 + (t % (n_accounts - 1));
                for (int k = 0; k < per_thread; ++k) {
                    int to = (from + step) % n_accounts;
                    transfer(from, to, amt);
                    from = to;
                }
            });
        for (auto& t : ts) t.join();
    }

private:
    mutable std::mutex m_;
    std::vector<long> balances_;
};
