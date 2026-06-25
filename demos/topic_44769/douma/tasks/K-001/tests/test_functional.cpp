// functional：存在元素（含重复）的下界、上界、计数、存在性主场景。
#include "solution.cpp"
#include <vector>

int main() {
    std::vector<int> a = {1, 2, 2, 2, 3, 5, 5, 8};
    //                    0  1  2  3  4  5  6  7

    // 重复元素 2 的相等区间为 [1,4)
    if (lowerBound(a, 2) != 1) return 1;
    if (upperBound(a, 2) != 4) return 1;
    if (countEqual(a, 2) != 3) return 1;
    if (!contains(a, 2)) return 1;

    // 单个元素 3
    if (lowerBound(a, 3) != 4) return 1;
    if (upperBound(a, 3) != 5) return 1;
    if (countEqual(a, 3) != 1) return 1;

    // 重复元素 5 的相等区间为 [5,7)
    if (lowerBound(a, 5) != 5) return 1;
    if (upperBound(a, 5) != 7) return 1;
    if (countEqual(a, 5) != 2) return 1;

    // 不存在的值 4（介于 3 与 5 之间）：lower==upper==5（第一个 >=4 即 5），count==0
    if (lowerBound(a, 4) != 5) return 1;
    if (upperBound(a, 4) != 5) return 1;
    if (countEqual(a, 4) != 0) return 1;
    if (contains(a, 4)) return 1;

    return 0;
}
