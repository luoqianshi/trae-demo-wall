# 有序数组二分查找

## 背景

`SortedSearch` 是建立在**非降序**整型数组上的二分查找工具，供区间统计与有序插入使用。
它需要精确区分「第一个不小于 target 的位置」与「第一个大于 target 的位置」，并据此回答某值出现的次数与应插入的位置。

## 对外接口（均作用于非降序数组 `arr`）

- `int lowerBound(const std::vector<int>& arr, int target)`：
  返回第一个 **>= target** 的下标；若全部元素都 `< target`，返回 `arr.size()`。
- `int upperBound(const std::vector<int>& arr, int target)`：
  返回第一个 **> target** 的下标；若全部元素都 `<= target`，返回 `arr.size()`。
- `int countEqual(const std::vector<int>& arr, int target)`：
  返回 `target` 在数组中出现的次数（等于 `upperBound - lowerBound`）。
- `bool contains(const std::vector<int>& arr, int target)`：是否存在等于 `target` 的元素。

## 对外保证（不变量）

1. **下界语义**：`lowerBound` 返回的下标 `i` 满足 `arr[i-1] < target <= arr[i]`（边界处相应放宽）；
   若 `target` 存在，`arr[lowerBound] == target`，即指向相等区间的**第一个**元素。
2. **上界语义**：`upperBound` 返回相等区间之后的第一个位置；二者之差即出现次数，且恒 `>= 0`。
3. **端点正确**：target 小于所有元素时下界为 `0`；大于所有元素时下界与上界都为 `arr.size()`；
   空数组时一切结果为 `0` / `false`。

## 错误现象

- 当查找的值在数组中**不存在**时，定位与计数都正确。
- 但只要查找的值**确实存在**（尤其是有重复时），`lowerBound` 不再指向相等区间的开头，
  导致 `countEqual` 把出现次数算错（常常算成 0），`contains` 也随之出错。

## 你的任务

定位并修复二分边界缺陷，使上述三条不变量对任意非降序数组、任意 target（含重复、端点、不存在、空数组）都严格成立。

## 约束

- **只能修改 `buggy/solution.cpp`**，不得改动测试或调用方式。
- 保持各函数的对外签名与语义不变。
- 仅使用标准库；保持 O(log n) 的二分复杂度，不得改成线性扫描绕过。
