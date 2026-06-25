// 有序数组二分查找：精确区分下界 / 上界，并据此统计出现次数。
#include <vector>

// 第一个 >= target 的下标；全部 < target 则返回 size。
int lowerBound(const std::vector<int>& arr, int target) {
    int lo = 0, hi = static_cast<int>(arr.size()); // 搜索区间 [lo, hi)
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] <= target)
            lo = mid + 1;
        else
            hi = mid;
    }
    return lo;
}

// 第一个 > target 的下标；全部 <= target 则返回 size。
int upperBound(const std::vector<int>& arr, int target) {
    int lo = 0, hi = static_cast<int>(arr.size());
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        // <= 才左移，跳过整段相等区间，停在第一个 > target 处。
        if (arr[mid] <= target)
            lo = mid + 1;
        else
            hi = mid;
    }
    return lo;
}

// 出现次数 = 上界 - 下界。
int countEqual(const std::vector<int>& arr, int target) {
    return upperBound(arr, target) - lowerBound(arr, target);
}

// 是否存在：下界处恰为 target 即存在。
bool contains(const std::vector<int>& arr, int target) {
    int i = lowerBound(arr, target);
    return i < static_cast<int>(arr.size()) && arr[i] == target;
}
