// 会话池：周期性移除所有已过期（ttl==0）的会话，保留其余会话及相对顺序。
// 对外保证：清理后不残留任何过期会话，且有效会话全部按原序保留。
#include <cstddef>
#include <vector>

class SessionPool {
public:
    void add(int id, int ttl) { sessions_.push_back(Session{id, ttl}); }

    // 移除所有 ttl==0 的会话。
    void purge_expired() {
        for (auto it = sessions_.begin(); it != sessions_.end(); ++it) {
            if (it->ttl == 0)
                sessions_.erase(it);
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
