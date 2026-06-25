// functional：高并发后总量精确，且最终快照自洽 count==Σbuckets==sum。
#include "solution.cpp"

int main() {
    for (int round = 0; round < 30; ++round) {
        LiveStats s;
        s.run_concurrent(64, 4000);           // 每次 add(1)
        long expect = 64L * 4000L;
        LiveStats::Snap snap = s.snapshot();
        if (snap.count != expect) return 1;   // 计数无丢失
        long bsum = 0;
        for (int b = 0; b < LiveStats::NB; ++b) bsum += snap.buckets[b];
        if (bsum != expect) return 1;         // 桶之和等于计数
        if (snap.sum != expect) return 1;     // 样本值均为 1，总和==计数
    }
    return 0;
}
