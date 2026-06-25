// functional：取句柄后继续登记更多计数器，旧句柄仍须有效，累加可见。
#include "solution.cpp"

int main() {
    MetricRegistry reg;
    long* h = reg.counter("requests");   // 先取得句柄
    *h += 5;
    // 之后继续登记大量新计数器（buggy 的 vector 会扩容搬迁，旧句柄悬垂）
    for (int i = 0; i < 1000; ++i)
        reg.counter("metric_" + std::to_string(i));
    *h += 3;                             // 通过早先句柄继续累加
    if (reg.value("requests") != 8) return 1;   // 8 = 5 + 3，不得丢更新
    if (reg.size() != 1001) return 1;
    return 0;
}
