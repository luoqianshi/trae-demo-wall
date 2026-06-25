// functional：合法批次全部纳入，size 与 alive 始终吻合。
#include <vector>
#include "solution.cpp"

int main() {
    {
        Registry r;
        r.add_batch({1, 2, 3});
        if (r.size() != 3) return 1;
        if (Widget::alive != 3) return 1;       // 存活数等于管理数
        r.add_batch({4, 5});
        if (r.size() != 5) return 1;
        if (Widget::alive != 5) return 1;
    }
    // 注册表析构后全部释放
    if (Widget::alive != 0) return 1;
    return 0;
}
