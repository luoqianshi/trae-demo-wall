// edge：放大异常路径泄漏与强异常安全破坏 ——
// 含非法 id 的批次必须抛异常、注册表大小不变，且 alive 不因失败批次而泄漏。
#include <stdexcept>
#include <vector>
#include "solution.cpp"

int main() {
    {
        Registry r;
        r.add_batch({1, 2});                 // 先放入 2 个合法部件
        if (r.size() != 2 || Widget::alive != 2) return 1;

        // 反复提交含非法 id 的批次：每次都应抛异常、状态不变、无泄漏
        for (int i = 0; i < 50; ++i) {
            bool threw = false;
            try {
                // 前几个合法、中途出现非法 id：buggy 会把前面 new 的对象漏掉
                r.add_batch({10, 11, 12, -1, 13});
            } catch (const std::exception&) {
                threw = true;
            }
            if (!threw) return 1;                       // 必须抛出
            if (r.size() != 2) return 1;                // 强异常安全：大小不变
            if (Widget::alive != 2) return 1;           // 无泄漏：仍只有最初 2 个存活
        }

        // 非法 id 在批次最前：同样不得泄漏
        bool threw = false;
        try {
            r.add_batch({-5, 1, 2, 3});
        } catch (const std::exception&) {
            threw = true;
        }
        if (!threw) return 1;
        if (r.size() != 2 || Widget::alive != 2) return 1;

        // 失败后仍能正常接受合法批次
        r.add_batch({100, 200});
        if (r.size() != 4 || Widget::alive != 4) return 1;
    }
    if (Widget::alive != 0) return 1;        // 全部析构归零
    return 0;
}
