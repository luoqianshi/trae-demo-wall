// regression：过期会话互不相邻的基线场景，清理应正确。
#include "solution.cpp"

int main() {
    SessionPool pool;
    pool.add(10, 0);   // 过期（位于开头）
    pool.add(20, 3);
    pool.add(30, 0);   // 过期（被有效会话隔开）
    pool.add(40, 2);

    pool.purge_expired();

    std::vector<int> got = pool.ids();
    std::vector<int> want = {20, 40};
    if (got != want) return 1;
    if (pool.size() != 2) return 1;

    // 再次清理无过期项，应保持不变（幂等）
    pool.purge_expired();
    if (pool.ids() != want) return 1;
    return 0;
}
