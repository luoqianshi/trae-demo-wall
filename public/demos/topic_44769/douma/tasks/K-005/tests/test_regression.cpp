// regression：干净基线 —— 全合法批次下计数正确、析构归零（不触发异常路径）。
#include <vector>
#include "solution.cpp"

int main() {
    {
        Registry r;
        for (int round = 0; round < 5; ++round) {
            r.add_batch({round * 10, round * 10 + 1});
        }
        if (r.size() != 10) return 1;
        if (Widget::alive != 10) return 1;       // 全程无泄漏
    }
    if (Widget::alive != 0) return 1;            // 析构后归零
    // 空批次：不改变状态
    {
        Registry r;
        r.add_batch({});
        if (r.size() != 0) return 1;
        if (Widget::alive != 0) return 1;
    }
    return 0;
}
