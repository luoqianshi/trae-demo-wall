// edge：极端排布放大迭代器失效——连片过期、整池全过期、末尾连续过期。
#include "solution.cpp"

int main() {
    // 用例1：长串连续过期夹在有效会话中间
    {
        SessionPool pool;
        pool.add(1, 1);
        for (int i = 0; i < 8; ++i) pool.add(100 + i, 0); // 连续 8 个过期
        pool.add(2, 1);
        pool.purge_expired();
        std::vector<int> want = {1, 2};
        if (pool.ids() != want) return 1;
    }
    // 用例2：整池全部过期，清理后必须为空
    {
        SessionPool pool;
        for (int i = 0; i < 6; ++i) pool.add(i, 0);
        pool.purge_expired();
        if (pool.size() != 0) return 1;
        if (!pool.ids().empty()) return 1;
    }
    // 用例3：末尾连续多个过期（尾部越界最易暴露）
    {
        SessionPool pool;
        pool.add(7, 9);
        pool.add(8, 0);
        pool.add(9, 0);
        pool.add(10, 0);
        pool.purge_expired();
        std::vector<int> want = {7};
        if (pool.ids() != want) return 1;
    }
    return 0;
}
