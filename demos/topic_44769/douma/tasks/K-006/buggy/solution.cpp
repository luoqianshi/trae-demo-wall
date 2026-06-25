// 银行转账系统：n 个账户，每个账户初始余额相同，系统总额 = n*initial 恒定。
// 对外保证：transfer 把金额从一个账户搬到另一个账户，资金守恒——
// 任意时刻所有账户余额之和都应等于初始总额；total() 允许在并发 transfer 进行中被调用。
#include <mutex>
#include <thread>
#include <vector>

class Bank {
public:
    // 构造 n 个账户，每个账户初始余额为 initial。
    Bank(int n, long initial) : balances_(n, initial), locks_(n) {}

    // 从 from 账户扣 amt，给 to 账户加 amt。from==to 时为空操作。
    // 每个账户各自持有一把锁，保证单账户的读改写是原子的。
    void transfer(int from, int to, long amt) {
        if (from == to) return;
        {
            std::lock_guard<std::mutex> g(locks_[from]);
            balances_[from] -= amt;
        }
        {
            std::lock_guard<std::mutex> g(locks_[to]);
            balances_[to] += amt;
        }
    }

    // 读取单个账户余额（加该账户锁）。
    long balance(int i) const {
        std::lock_guard<std::mutex> g(locks_[i]);
        return balances_[i];
    }

    // 求所有账户余额之和：逐账户加锁读取后累加。
    long total() const {
        long s = 0;
        for (size_t i = 0; i < balances_.size(); ++i) {
            std::lock_guard<std::mutex> g(locks_[i]);
            s += balances_[i];
        }
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
    std::vector<long> balances_;
    mutable std::vector<std::mutex> locks_;
};
