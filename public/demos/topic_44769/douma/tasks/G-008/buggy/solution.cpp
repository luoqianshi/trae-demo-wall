// 命名计数器注册表：登记命名指标并返回长期持有的句柄，热路径直接通过句柄累加。
// 对外保证：句柄在对象存活期间始终有效，即便之后又登记了更多计数器。
#include <cstddef>
#include <string>
#include <vector>

class MetricRegistry {
public:
    // 登记或获取命名计数器，返回指向其计数值的句柄。
    long* counter(const std::string& name) {
        for (auto& c : entries_)            // 已存在则返回同一句柄
            if (c.name == name) return &c.value;
        entries_.push_back(Entry{name, 0});
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
    std::vector<Entry> entries_;
};
