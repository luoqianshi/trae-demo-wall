// 会话池：周期性移除所有已过期（ttl==0）的会话，保留其余会话及相对顺序。
// 对外保证：清理后不残留任何过期会话，且有效会话全部按原序保留。
#include <cstddef>
#include <vector>

class SessionPool {
public:
    void add(int id, int ttl) { sessions_.push_back(Session{id, ttl}); }

    // 移除所有 ttl==0 的会话。
    void purge_expired() {
        // 用 erase 的返回值推进迭代器：命中则原地接住下一个有效迭代器，
        // 否则才 ++it——这样既不会跳过紧邻元素，也不会在尾部越界。
        for (auto it = sessions_.begin(); it != sessions_.end();) {
            if (it->ttl == 0)
                it = sessions_.erase(it);
            else
                ++it;
        }
    }

    std::size_t size() const { return sessions_.size(); }

    std::vector<int> ids() const {
        std::vector<int> out;
        out.reserve(sessions_.size());
        for (const auto& s : sessions_) out.push_back(s.id);
        return out;
    }

private:
    struct Session {
        int id;
        int ttl;
    };
    std::vector<Session> sessions_;
};
