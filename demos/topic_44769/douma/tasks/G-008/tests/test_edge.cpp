// edge：交错持有多个早期句柄并穿插大量登记，放大扩容搬迁导致的悬垂。
#include "solution.cpp"

int main() {
    MetricRegistry reg;
    long* h0 = reg.counter("k0");
    *h0 += 10;
    long* h1 = reg.counter("k1");
    *h1 += 20;
    // 穿插登记，多次触发底层扩容
    for (int i = 0; i < 5000; ++i) {
        reg.counter("filler_" + std::to_string(i));
        if (i % 500 == 0) {
            *h0 += 1;   // 通过早期句柄反复写入
            *h1 += 1;
        }
    }
    // h0 写入：10 + 命中 i%500==0 的次数（i=0,500,...,4500 共 10 次）
    if (reg.value("k0") != 20) return 1;
    if (reg.value("k1") != 30) return 1;
    return 0;
}
