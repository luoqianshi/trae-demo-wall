"""边界测试：传入的初始列表与各车之间必须完全隔离，源列表不被回灌。"""
from solution import CartBuilder


def test_source_list_not_aliased():
    b = CartBuilder()
    seed = ["base"]
    cart = b.new_cart(seed)
    cart.add("extra")
    # 向购物车加商品不得回灌到调用方传入的源列表
    assert seed == ["base"], f"源列表被污染：{seed}"
    assert cart.items() == ["base", "extra"]


def test_same_seed_multiple_carts_independent():
    b = CartBuilder()
    seed = ["init"]
    # 用同一份种子连续创建多个车
    c1 = b.new_cart(seed)
    c2 = b.new_cart(seed)
    c1.add("only_c1")
    # c2 不得受 c1 影响，也不得受源列表共享影响
    assert c2.items() == ["init"], f"c2 被污染：{c2.items()}"
    assert c1.items() == ["init", "only_c1"]
    assert seed == ["init"]


def test_interleaved_empty_and_seeded():
    b = CartBuilder()
    e1 = b.new_cart()
    s1 = b.new_cart(["s"])
    e2 = b.new_cart()
    s1.add("more")
    e1.add("z")
    # 交错创建后各车互不影响
    assert e2.count() == 0, f"e2 应为空：{e2.items()}"
    assert e1.items() == ["z"]
    assert s1.items() == ["s", "more"]
