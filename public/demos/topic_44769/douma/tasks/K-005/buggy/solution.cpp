// 批量部件注册表。
#include <cstddef>
#include <stdexcept>
#include <vector>

// 受管理的资源：构造 +1、析构 -1，alive 反映当前存活实例数。
struct Widget {
    static long alive;
    int id;
    explicit Widget(int v) : id(v) { ++alive; }
    ~Widget() { --alive; }
    Widget(const Widget&) = delete;
    Widget& operator=(const Widget&) = delete;
};

long Widget::alive = 0;

class Registry {
public:
    ~Registry() {
        for (Widget* w : items_) delete w;
    }

    // 批量纳入：先把本批 Widget 暂存到本地数组，全部成功后再提交到注册表。
    void add_batch(const std::vector<int>& ids) {
        std::vector<Widget*> staging;
        staging.reserve(ids.size());
        for (int id : ids) {
            if (id < 0) {
                // 非法 id：拒绝整批，抛出异常（注册表未被修改）。
                throw std::invalid_argument("非法 id");
            }
            staging.push_back(new Widget(id));
        }
        // 全部构造成功，提交到注册表。
        items_.reserve(items_.size() + staging.size());
        for (Widget* w : staging) items_.push_back(w);
    }

    std::size_t size() const { return items_.size(); }

private:
    std::vector<Widget*> items_;
};
