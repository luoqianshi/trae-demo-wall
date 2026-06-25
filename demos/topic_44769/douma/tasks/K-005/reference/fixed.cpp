// 批量部件注册表（修复版）。
// 修复要点：用 RAII（unique_ptr）暂存本批新建的 Widget——
// 一旦遇到非法 id 抛异常，暂存容器析构会自动释放已建对象，alive 不泄漏；
// 且采用「先全部构造成功、再一次性提交到注册表」的提交式写法，
// 保证抛出时注册表状态与调用前完全一致（强异常安全）。
#include <cstddef>
#include <memory>
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

    // 批量纳入：要么整批成功，要么完全不变且无泄漏。
    void add_batch(const std::vector<int>& ids) {
        // RAII 暂存：异常路径上 staging 析构会自动释放已建对象。
        std::vector<std::unique_ptr<Widget>> staging;
        staging.reserve(ids.size());
        for (int id : ids) {
            if (id < 0) {
                // 抛出前不提交；staging 离开作用域时释放已建 Widget，alive 归位。
                throw std::invalid_argument("非法 id");
            }
            staging.emplace_back(std::make_unique<Widget>(id));
        }
        // 全部构造成功，才一次性提交到注册表（commit 阶段不抛异常）。
        items_.reserve(items_.size() + staging.size());
        for (auto& up : staging) items_.push_back(up.release());
    }

    std::size_t size() const { return items_.size(); }

private:
    std::vector<Widget*> items_;
};
