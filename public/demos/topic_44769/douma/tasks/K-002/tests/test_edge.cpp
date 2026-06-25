// edge：读期一致性。写线程持续 add()，读线程在写入进行中反复 snapshot，
// 每一份快照都必须自洽：count == Σbuckets（且 sum 不超过 count，样本值为 1）。
// buggy 逐字段读取会读到中间态而撕裂；仅给 add() 或仅给 snapshot() 单边加锁也无法消除撕裂；
// 必须让 add() 的更新与 snapshot() 的读取在同一把锁的临界区内互斥，才能始终成立。
#include <atomic>
#include <thread>
#include "solution.cpp"

int main() {
    for (int round = 0; round < 20; ++round) {
        LiveStats s;
        std::atomic<bool> stop{false};
        std::atomic<bool> bad{false};

        // 多写线程：持续计入样本（值固定 1）。
        std::vector<std::thread> writers;
        for (int w = 0; w < 6; ++w)
            writers.emplace_back([&] {
                for (int k = 0; k < 50000; ++k) s.add(1);
            });

        // 读线程：在写入进行中不断拍快照，校验恒等式。
        std::thread reader([&] {
            while (!stop.load()) {
                LiveStats::Snap snap = s.snapshot();
                long bsum = 0;
                for (int b = 0; b < LiveStats::NB; ++b) bsum += snap.buckets[b];
                if (bsum != snap.count) { bad.store(true); return; }
                if (snap.sum != snap.count) { bad.store(true); return; }  // 值均为1
            }
        });

        for (auto& t : writers) t.join();
        stop.store(true);
        reader.join();
        if (bad.load()) return 1;

        // 收尾：最终量也必须精确
        LiveStats::Snap snap = s.snapshot();
        if (snap.count != 6L * 50000L) return 1;
    }
    return 0;
}
