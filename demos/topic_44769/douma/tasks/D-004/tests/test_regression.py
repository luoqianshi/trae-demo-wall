"""回归测试：基线功能 —— 带初始商品新建、add、count、items 行为正确。"""
from solution import CartBuilder


def test_basic_with_initial_items():
    b = CartBuilder()
    cart = b.new_cart(["a", "b"])
    assert cart.count() == 2
    assert cart.items() == ["a", "b"]

    cart.add("c")
    assert cart.count() == 3
    assert cart.items() == ["a", "b", "c"]


def test_items_returns_copy():
    b = CartBuilder()
    cart = b.new_cart(["a"])
    got = cart.items()
    got.append("hacked")  # 改返回值不应影响内部状态
    assert cart.count() == 1, "items() 返回值被改动不应影响购物车内部"
