"""功能测试：非整除总量必须把零头算作单独一页，且最后一页可取到正确数据。"""
from solution import Paginator


def test_non_divisible_total_keeps_tail_page():
    p = Paginator(10)
    items = list(range(1, 24))  # 23 条，10 一页 -> 3 页（10/10/3）

    assert p.page_count(23) == 3, "23 条 / 每页 10 应为 3 页"
    assert p.last_page_size(23) == 3, "最后一页应为 3 条"

    # 最后一页必须能取到非空且正确的零头数据
    last = p.slice(items, 3)
    assert last == [21, 22, 23], f"最后一页数据错误：{last}"


def test_full_pages_then_tail():
    p = Paginator(5)
    items = list(range(1, 13))  # 12 条 -> 3 页（5/5/2）
    assert p.page_count(12) == 3
    assert p.slice(items, 1) == [1, 2, 3, 4, 5]
    assert p.slice(items, 2) == [6, 7, 8, 9, 10]
    assert p.slice(items, 3) == [11, 12]
    assert p.last_page_size(12) == 2
