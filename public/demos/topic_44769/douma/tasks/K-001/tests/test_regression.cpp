// regression：全为「不存在的目标」与「无重复且唯一存在」的干净基线。
// buggy 把 lowerBound 写成 upperBound：当目标不存在时 lower==upper 仍成立，
// 故本基线在 buggy 上仍应通过。
#include "solution.cpp"
#include <vector>

int main() {
    std::vector<int> a = {10, 20, 30, 40, 50}; // 互不相同

    // 不存在的目标：下界=上界，计数 0，不包含
    int absent[] = {5, 15, 25, 35, 45, 55};
    int expectLower[] = {0, 1, 2, 3, 4, 5};
    for (int i = 0; i < 6; ++i) {
        int t = absent[i];
        if (lowerBound(a, t) != expectLower[i]) return 1;
        if (upperBound(a, t) != expectLower[i]) return 1; // 不存在时 lower==upper
        if (countEqual(a, t) != 0) return 1;
        if (contains(a, t)) return 1;
    }

    // 二分查找有序性：每个存在元素的 upperBound 至少比其 lowerBound 大 1
    // （此处仅校验 upper - 自身位置关系，不依赖 lower 的相等区间起点）
    for (int i = 0; i < (int)a.size(); ++i) {
        if (upperBound(a, a[i]) != i + 1) return 1;
    }
    return 0;
}
