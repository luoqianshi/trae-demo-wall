"""功能测试：不带初始商品新建的空车，必须始终为空、且各车相互独立。"""
from solution import CartBuilder


def test_empty_carts_stay_independent():
    b = CartBuilder()

    cart1 = b.new_cart()      # 空车
    cart1.add("apple")
    cart1.add("banana")
    assert cart1.count() == 2

    # 之后新建的空车必须真的为空，不受 cart1 影响
    cart2 = b.new_cart()
    assert cart2.count() == 0, f"新空车应为空，实际 {cart2.items()}"

    cart2.add("milk")
    # 两车相互独立
    assert cart1.items() == ["apple", "banana"]
    assert cart2.items() == ["milk"]


def test_many_empty_carts():
    b = CartBuilder()
    carts = [b.new_cart() for _ in range(5)]
    # 只往第 0 个车加东西
    carts[0].add("x")
    carts[0].add("y")
    # 其余车必须仍为空
    for i in range(1, 5):
        assert carts[i].count() == 0, f"第 {i} 个车被污染：{carts[i].items()}"
    assert carts[0].items() == ["x", "y"]
