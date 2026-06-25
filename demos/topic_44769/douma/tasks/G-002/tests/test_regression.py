"""回归测试：整除场景（不触发零头 bug）的干净基线，分页应一切正常。"""
from solution import Paginator


def test_exactly_divisible():
    p = Paginator(10)
    items = list(range(1, 21))  # 20 条，恰好 2 页满页
    assert p.page_count(20) == 2
    assert p.last_page_size(20) == 10
    assert p.slice(items, 1) == list(range(1, 11))
    assert p.slice(items, 2) == list(range(11, 21))


def test_single_full_page():
    p = Paginator(4)
    items = [1, 2, 3, 4]  # 恰好 1 页
    assert p.page_count(4) == 1
    assert p.slice(items, 1) == [1, 2, 3, 4]
    # 越界页返回空
    assert p.slice(items, 2) == []
