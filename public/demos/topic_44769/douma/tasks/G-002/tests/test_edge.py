"""边界测试：单条、零头为 1、超大零头等端点放大 off-by-one。"""
from solution import Paginator


def test_single_item():
    p = Paginator(10)
    # 仅 1 条数据，必须算作 1 页且能取到
    assert p.page_count(1) == 1
    assert p.last_page_size(1) == 1
    assert p.slice([42], 1) == [42]


def test_remainder_of_one():
    p = Paginator(5)
    items = list(range(1, 7))  # 6 条 -> 2 页（5/1），零头恰为 1
    assert p.page_count(6) == 2, "6 条 / 每页 5 应为 2 页"
    assert p.last_page_size(6) == 1
    assert p.slice(items, 2) == [6], "最后一页应仅含第 6 条"


def test_page_size_one():
    p = Paginator(1)
    items = [10, 20, 30]
    assert p.page_count(3) == 3
    for page in range(1, 4):
        assert p.slice(items, page) == [items[page - 1]]


def test_zero_and_negative_total():
    p = Paginator(10)
    assert p.page_count(0) == 0
    assert p.page_count(-5) == 0
    assert p.last_page_size(0) == 0
