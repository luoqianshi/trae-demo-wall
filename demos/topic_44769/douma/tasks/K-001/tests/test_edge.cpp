// edge：端点、空数组、全相同、首尾重复块——专门放大 lower/upper 边界错误。
#include "solution.cpp"
#include <vector>

int main() {
    // 空数组：一切为 0 / false
    std::vector<int> empty;
    if (lowerBound(empty, 7) != 0) return 1;
    if (upperBound(empty, 7) != 0) return 1;
    if (countEqual(empty, 7) != 0) return 1;
    if (contains(empty, 7)) return 1;

    // 全相同元素：相等区间覆盖整个数组
    std::vector<int> same = {4, 4, 4, 4, 4};
    if (lowerBound(same, 4) != 0) return 1;   // 下界必须是 0（开头）
    if (upperBound(same, 4) != 5) return 1;
    if (countEqual(same, 4) != 5) return 1;    // 全部计入
    if (!contains(same, 4)) return 1;

    // 目标小于所有元素：下界=上界=0
    if (lowerBound(same, 1) != 0) return 1;
    if (upperBound(same, 1) != 0) return 1;
    // 目标大于所有元素：下界=上界=size
    if (lowerBound(same, 9) != 5) return 1;
    if (upperBound(same, 9) != 5) return 1;
    if (contains(same, 9)) return 1;

    // 首部重复块：目标存在于开头，下界必须落在 0
    std::vector<int> head = {2, 2, 2, 7, 9};
    if (lowerBound(head, 2) != 0) return 1;
    if (upperBound(head, 2) != 3) return 1;
    if (countEqual(head, 2) != 3) return 1;

    // 尾部重复块：下界指向相等区间开头而非末尾
    std::vector<int> tail = {1, 3, 6, 6, 6};
    if (lowerBound(tail, 6) != 2) return 1;    // 第一个 6
    if (upperBound(tail, 6) != 5) return 1;
    if (countEqual(tail, 6) != 3) return 1;
    if (!contains(tail, 6)) return 1;

    // 端点单点存在
    std::vector<int> e = {1, 2, 3};
    if (lowerBound(e, 1) != 0) return 1;
    if (lowerBound(e, 3) != 2) return 1;
    if (countEqual(e, 1) != 1) return 1;
    if (countEqual(e, 3) != 1) return 1;
    return 0;
}
