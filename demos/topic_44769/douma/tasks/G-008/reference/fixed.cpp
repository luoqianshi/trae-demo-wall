// 命名计数器注册表：登记命名指标并返回长期持有的句柄，热路径直接通过句柄累加。
// 对外保证：句柄在对象存活期间始终有效，即便之后又登记了更多计数器。
#include <cstddef>
#include <deque>
#include <string>

class MetricRegistry {
public:
    // 登记或获取命名计数器，返回指向其计数值的稳定句柄。
    long* counter(const std::string& name) {
        for (auto& c : entries_)            // 已存在则返回同一句柄
            if (c.name == name) return &c.value;
        entries_.push_back(Entry{name, 0}); // deque 在尾部新增不会搬迁已有元素，句柄不失效
        return &entries_.back().value;
    }

    // 读取命名计数器当前值；不存在返回 0。
    long value(const std::string& name) const {
        for (const auto& c : entries_)
            if (c.name == name) return c.value;
        return 0;
    }

    std::size_t size() const { return entries_.size(); }

private:
    struct Entry {
        std::string name;
        long value;
    };
    // 关键：用 deque 而非 vector，保证已发出的句柄不随新增元素而失效。
    std::deque<Entry> entries_;
};
