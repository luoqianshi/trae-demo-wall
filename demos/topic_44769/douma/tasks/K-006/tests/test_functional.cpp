// functional：高并发转账全部 join 后，资金严格守恒，且无账户出现异常。
// 所有转账完成后系统达到静止态，总额必须精确等于初始总额。
#include "solution.cpp"

int main() {
    const int N = 16;          // 账户数
    const long INIT = 100000;  // 每账户初始余额
    const long EXPECT = (long)N * INIT;
    for (int round = 0; round < 20; ++round) {
        Bank bank(N, INIT);
        bank.run_transfers(64, 4000, N, 1);  // 64 线程 × 4000 次转账
        // 全部 join 后系统静止：总额必须守恒
        if (bank.total() != EXPECT) return 1;
        // 余额之和与逐账户累加一致校验
        long s = 0;
        for (int i = 0; i < N; ++i) s += bank.balance(i);
        if (s != EXPECT) return 1;
    }
    return 0;
}
