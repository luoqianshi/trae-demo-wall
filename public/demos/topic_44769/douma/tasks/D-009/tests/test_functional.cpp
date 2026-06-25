// functional：相邻过期会话必须被全部清除，有效会话按原序保留。
#include "solution.cpp"

int main() {
    SessionPool pool;
    // 构造相邻过期：id=2,3 相邻且都过期；末尾 id=6 也过期
    pool.add(1, 5);
    pool.add(2, 0);
    pool.add(3, 0);
    pool.add(4, 7);
    pool.add(5, 0);
    pool.add(6, 0);

    pool.purge_expired();

    // 仅剩 1 和 4，且顺序不变
    std::vector<int> got = pool.ids();
    std::vector<int> want = {1, 4};
    if (got != want) return 1;
    if (pool.size() != 2) return 1;
    return 0;
}
