// regression：单线程语义不变——计数、总和、桶之和、分桶分布都精确。
// buggy 在单线程下无撕裂，应当通过（安全基线）。
#include "solution.cpp"

int main() {
    LiveStats s;
    for (int i = 0; i < 800; ++i) s.add(i);   // 样本值 0..799
    LiveStats::Snap snap = s.snapshot();
    if (snap.count != 800L) return 1;
    long expect_sum = 799L * 800L / 2;        // 0+1+...+799
    if (snap.sum != expect_sum) return 1;
    long bsum = 0;
    for (int b = 0; b < LiveStats::NB; ++b) bsum += snap.buckets[b];
    if (bsum != 800L) return 1;
    // 0..799 对 8 取模均匀，每桶恰好 100 次
    for (int b = 0; b < LiveStats::NB; ++b)
        if (snap.buckets[b] != 100L) return 1;
    return 0;
}
