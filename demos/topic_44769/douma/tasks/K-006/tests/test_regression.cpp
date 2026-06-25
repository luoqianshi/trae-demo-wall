// regression：单线程确定转账序列，逐账户余额与总额精确校验。
// buggy 在单线程下两步顺序执行无中间态可被观察，应当通过（安全基线）。
#include "solution.cpp"

int main() {
    const int N = 4;
    const long INIT = 1000;
    Bank bank(N, INIT);

    // 一串确定转账：手工推演每个账户的期望余额。
    bank.transfer(0, 1, 100);  // [900,1100,1000,1000]
    bank.transfer(1, 2, 300);  // [900, 800,1300,1000]
    bank.transfer(2, 3, 500);  // [900, 800, 800,1500]
    bank.transfer(3, 0, 200);  // [1100,800, 800,1300]
    bank.transfer(2, 2, 999);  // from==to 空操作，无变化

    if (bank.balance(0) != 1100) return 1;
    if (bank.balance(1) != 800) return 1;
    if (bank.balance(2) != 800) return 1;
    if (bank.balance(3) != 1300) return 1;
    if (bank.total() != (long)N * INIT) return 1;  // 总额恒为 4000
    return 0;
}
