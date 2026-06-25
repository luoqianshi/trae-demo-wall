// regression：安全基线——先把所有计数器登记完毕，之后再取句柄使用，结果应正确。
// 与 functional/edge 不同：此处不在"持有旧句柄期间继续登记新计数器"，
// 因此即便 buggy 用 vector，也不会发生取得句柄后再扩容搬迁的情况，应当通过。
#include "solution.cpp"

int main() {
    MetricRegistry reg;
    // 第一步：先把所有需要的计数器全部登记完毕（此时不持有任何句柄）。
    reg.counter("a");
    reg.counter("b");
    reg.counter("c");
    // 第二步：登记结束后再取它们的句柄并使用——不再有后续登记，句柄稳定有效。
    long* a = reg.counter("a");
    long* b = reg.counter("b");
    long* c = reg.counter("c");
    *a += 1;
    *b += 2;
    *c += 3;
    if (reg.value("a") != 1) return 1;
    if (reg.value("b") != 2) return 1;
    if (reg.value("c") != 3) return 1;
    // 同名返回同一句柄
    if (reg.counter("a") != a) return 1;
    if (reg.value("missing") != 0) return 1;  // 不存在返回 0
    if (reg.size() != 3) return 1;
    return 0;
}
